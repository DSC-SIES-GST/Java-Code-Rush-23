const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
var gameOn = true;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const scoreEl = document.querySelector('#score-element');
const scoreModel = document.querySelector('#score-model');
const bigScore = document.querySelector('#big-score');
const startGameBtn = document.querySelector('#startGameBtn');

//CLASSES
class Player {
    constructor (x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius; 
        this.color = color;
    }

    draw() {
        c.beginPath() // to specify where we want to begin drawing on the screen.
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
}

class Projectile {
    constructor (x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius; 
        this.color = color;
        this.velocity = velocity;
    }
    draw() {
        c.beginPath() // to specify where we want to begin drawing on the screen.
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
    update () {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

class Enemy {
    constructor (x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius; 
        this.color = color;
        this.velocity = velocity;
    }
    draw() {
        c.beginPath() // to specify where we want to begin drawing on the screen.
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
    update () {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

const friction = 0.99;
class Particle {
    constructor (x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius; 
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }
    draw() {
        c.save()
        c.globalAlpha = this.alpha;
        c.beginPath() // to specify where we want to begin drawing on the screen.
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill()
        c.restore()
    }
    update () {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= 0.01;
    }
}

const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 20, 'white');
let projectiles = [];
let enemies = [];
let particles = [];

function init() {
    player = new Player(x, y, 20, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreEl.innerHTML = score;
}


//FUNCTIONS
function spawnEnemies() {
    if(gameOn == false ) {
        clearInterval(start);
        return;
    } else {
        var start = setInterval(startSpawnEnemies, 1000);
        function startSpawnEnemies () {
            const radius  = Math.random() * (35-10) + 10;
            let x;
            let y;
            if(Math.random() < 0.5) {
                x = Math.random() < 0.5? 0 - radius : canvas.width + radius;
                y = Math.random() * canvas.height;
            } else {
                x = Math.random() * canvas.width;
                y = Math.random() < 0.5? 0 - radius : canvas.height + radius;
            }
            const color = `hsl(${Math.random() * 360}, 50%, 50%)`; // or just use 'hsl('+Math.random() * 360 +', 50%, 50%)';
            const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);  //whenever getting distance between two points, subtract from your destination
            const velocity = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            }
            enemies.push(new Enemy(x, y, radius, color, velocity));
        }
    }
}

let animationId;
let score = 0;
function animate () {
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0, 0, 0, 0.1)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    // c.clearRect(0, 0, canvas.width, canvas.height); // clear the canvas sets default background i.e white
    player.draw();

    particles.forEach((particle, index) => {
        if(particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });

    projectiles.forEach((projectile, index) => {
        projectile.update();

        //remove from edges of the screen
        if(projectile.x + projectile.radius < 0 || projectile.x - projectile.radius > canvas.width || 
            projectile.y + projectile.radius < 0 || projectile.y - projectile.radius > canvas.height) {
            setTimeout(() => {
                projectiles.splice(index, 1);
            }, 0)
        }
    })

    enemies.forEach((enemy, index) => {
        enemy.update();

        //end game
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if(dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId);
            gameOn = false;
            spawnEnemies();
            scoreModel.style.display = 'block';
            bigScore.innerHTML = score;
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);    //Math.hypot() is used to measure the distance between two points. Hypot means hypotenuse

            //when projectile touch enemy
            if(dist - enemy.radius - projectile.radius < 1) {

                //create explosions
                for(let i = 0; i < enemy.radius; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 3, enemy.color, {
                        x: (Math.random() - 0.5) * (Math.random() * 8), 
                        y: (Math.random() - 0.5) * (Math.random() * 8)
                    }));
                }

                if(enemy.radius - 10 > 15) {
                    //Increase score for hit
                    score += 100;
                    scoreEl.innerHTML = score;

                    enemy.radius -= 15;
                    
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                } else {
                    //Increase score for distroy
                    score += 250;
                    scoreEl.innerHTML = score;
                    setTimeout(() => {
                        enemies.splice(index, 1);
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                    }
            }
        })
    });
}

//CLICK EVENT
window.addEventListener('click', (event) => {
    const angle = Math.atan2(event.clientY - canvas.height / 2, event.clientX - canvas.width / 2);  //take y as the first cordinate and x as second
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    }
    projectiles.push(new Projectile(x, y, 5, 'white', velocity));
});

startGameBtn.addEventListener('click', () => {
    // gameOn = true;
    init();
    animate();
    spawnEnemies();
    scoreModel.style.display = 'none';
})
// //CALLING FUNCTIONS
// animate();
// spawnEnemies();
