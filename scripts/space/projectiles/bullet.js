// bullet.js

const BULLET_MAX_HEALTH = 1;
const BULLET_LENGTH = 5;
const BULLET_WIDTH = 2;
const BULLET_DAMAGE = 2;
const BULLET_MASS = 0.05;

function Bullet(pos, vel, theta)
{
    Collidable.call(this, BULLET_LENGTH, BULLET_WIDTH, BULLET_MAX_HEALTH);
    this.pos = pos.slice();
    this.vel = vel.slice();
    this.theta = theta;
    this.mass = BULLET_MASS;
    this.trackable = false;
    delete this.box;

    this.behaviors = [function(self, dt)
    {
        if (self.time > 1) self.remove = true;
    }];
}

Bullet.prototype = Object.create(Collidable.prototype);

Bullet.prototype.handleCollision = function(other)
{
    if (other === this.origin) return;
    if (other instanceof Bullet) return;
    other.damage(BULLET_DAMAGE);
    this.remove = true;

    if (other.isShip && Math.random() < 0.05)
        WORLD.push(new Explosion(this.pos.slice(), other.vel.slice(),
            Math.random()*20 + 20));

    if (!other.remove || Math.random() < 0.8) return true;
    let num_debris = Math.round(Math.random()*3 + 2);
    for (let i = 0; i < num_debris; ++i)
    {
        let pos = this.pos.slice();
        let vel = other.vel.slice();
        let rvel = sub2d(other.vel, this.vel);
        vel[0] -= rvel[0]*Math.random()*0.4;
        vel[1] -= rvel[1]*Math.random()*0.4;
        let deb = new Debris(pos, vel,
            Math.random()*Math.PI*2,
            Math.random()*40 - 20,
            Math.random()*3 + 2);
        deb.name = other.name;
        deb.faction = other.faction;
        WORLD.push(deb);
    }
}

Bullet.prototype.skin = function(opacity)
{
    CTX.save();
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
    CTX.rotate(-this.theta);
    CTX.globalAlpha = opacity;
    CTX.fillStyle = "brown";
    CTX.strokeStyle = "black";
    CTX.fillRect(-this.length/2*PIXELS, -this.width/2*PIXELS,
        this.length*PIXELS, this.width*PIXELS)
    // CTX.strokeRect(-this.length/2*PIXELS, -this.width/2*PIXELS,
    //     this.length*PIXELS, this.width*PIXELS)
    CTX.restore();
}

Bullet.prototype.radarIcon = Bullet.prototype.skin;
