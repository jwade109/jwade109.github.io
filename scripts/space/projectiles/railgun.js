// railgun.js

const RAILGUN_VEL = 20000;
const RAILGUN_COOLDOWN = 5;
const RAILGUN_DAMAGE = 500;
const RAILGUN_LENGTH = 1;
const RAILGUN_WIDTH = 0.2;
const RAILGUN_MASS = 1;
const RAILGUN_MAX_HEALTH = Infinity;

function Railgun(pos, vel, theta)
{
    Collidable.call(this, RAILGUN_LENGTH, RAILGUN_WIDTH, RAILGUN_MAX_HEALTH);
    this.pos = pos.slice();
    this.vel = vel.slice();
    this.theta = theta;
    this.mass = RAILGUN_MASS;
    this.trackable = false;
}

Railgun.prototype = Object.create(Collidable.prototype);

Railgun.prototype.handleCollision = function(other)
{
    if (other === this.origin) return;
    if (other instanceof Debris && other.radius < SMALL_DEBRIS) return;
    // conserveMomentum(this, other);
    other.damage(RAILGUN_DAMAGE);
}

Railgun.prototype.skin = function()
{
    CTX.save();
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
    CTX.rotate(-this.theta - Math.PI/2);
    CTX.globalAlpha = 1;
    CTX.fillStyle = "black";
    CTX.fillRect(-this.width/2*PIXELS, -this.length/2*PIXELS,
                  this.width*PIXELS, this.length*PIXELS);
    CTX.restore();
}
