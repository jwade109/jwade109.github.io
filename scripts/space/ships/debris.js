// debris.js

const DEBRIS_DAMAGE = 50;
const LARGE_DEBRIS = 25;
const SMALL_DEBRIS = 6

function Debris(pos, vel, theta, omega, radius)
{
    Collidable.call(this, radius, radius, radius);
    this.pos = pos;
    this.vel = vel;
    this.theta = theta;
    this.omega = omega;
    this.radius = radius;
    this.mass = radius*radius*radius;
    this.name = Math.floor(Math.random()*10000000) + "-" +
        DEBRIS_NAMES[Math.floor(Math.random()*DEBRIS_NAMES.length)]
    this.type = "Debris";
    this.trackable = radius >= SMALL_DEBRIS;
    if (radius < SMALL_DEBRIS)
        delete this.box;

    this.color = "darkgray";
    if (Math.random() < 0.4)
        this.color = "gray";
    this.opacity = 1;
}

Debris.prototype = Object.create(Collidable.prototype);

Debris.prototype.control = function(dt)
{
    if (this.radius < SMALL_DEBRIS) this.opacity -= dt*Math.random();
    if (this.opacity <= 0) this.remove = true;
}

Debris.prototype.skin = function(opacity)
{
    CTX.save();
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
    CTX.rotate(-this.theta);
    CTX.strokeStyle = "black";
    CTX.fillStyle = this.color;
    CTX.globalAlpha = Math.max(this.opacity, 0)*opacity;
    CTX.fillRect(-this.radius/2*PIXELS, -this.radius/2*PIXELS,
                 this.radius*PIXELS, this.radius*PIXELS);
    CTX.strokeRect(-this.radius/2*PIXELS, -this.radius/2*PIXELS,
                 this.radius*PIXELS, this.radius*PIXELS);

    CTX.restore();
}

Debris.prototype.damage = function(d)
{
    this.health -= d;
    if (this.health <= 0) this.explode();
    else if (Math.random() < 0.05*d)
    {
        let num_debris = 3 + Math.random()*3;
        for (let i = 0; i < num_debris; ++i)
        {
            let pos = this.pos.slice();
            let vel = this.vel.slice();
            vel[0] += Math.random()*200 - 100;
            vel[1] += Math.random()*200 - 100;
            let size = Math.random()*4;
            let deb = new Debris(pos, vel,
                this.theta,
                this.omega + Math.random()*5 - 2.5, size);
            deb.name = this.name;
            deb.color = "#909090";
            if (Math.random() < 0.2)
                deb.color = "#CCCCCC";
            WORLD.push(deb);
        }
    }
}

Debris.prototype.explode = function()
{
    if (this.remove) return;
    if (this.radius < SMALL_DEBRIS) return;
    let num_debris = 4;
    if (this.radius < 4) num_debris = 0;
    for (let i = 0; i < num_debris; ++i)
    {
        let pos = this.box.getRandom();
        let vel = this.vel.slice();
        vel[0] += Math.random()*60 - 40;
        vel[1] += Math.random()*80 - 40;
        let size = this.radius/2;
        let deb = new Debris(pos, vel,
            this.theta,
            this.omega + Math.random()*5 - 2.5, size);
        deb.color = this.color;
        deb.name = this.name;
        WORLD.push(deb);
    }
    this.remove = true;
}
