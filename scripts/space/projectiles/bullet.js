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
