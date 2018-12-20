// railgun.js

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
    this.kills = 0;
}

Railgun.prototype = Object.create(Collidable.prototype);

Railgun.prototype.handleCollision = function(other)
{
    if (other === this.origin) return;
    if (other instanceof Railgun) return;
    if (other instanceof Debris && other.radius < SMALL_DEBRIS) return;
    other.damage(RAILGUN_DAMAGE);
    let num_debris = Math.random()*4 + 8;
    let spread = Math.PI/12;
    for (let i = 0; i < num_debris; ++i)
    {
        let off = (Math.random()*2 - 1)*spread;
        let voff = rot2d([900 + Math.random()*2000, 0], this.theta + off);
        WORLD.push(new Debris(other.pos.slice(), add2d(other.vel, voff),
            0, 0, SMALL_DEBRIS/4));
    }
    if (other.remove && other.is_enemy) ++this.kills;
    if (this.kills == 2)
        throwAlert("S'mores! (Railgun double kill)", ALERT_DISPLAY_TIME*3);
    if (this.kills == 3)
        throwAlert("Shish kebab! (Railgun triple kill)", ALERT_DISPLAY_TIME*3);
    if (this.kills > 3)
        throwAlert("Shank-tacular! (" + this.kills + " railgun kills)",
            ALERT_DISPLAY_TIME*3);
}

Railgun.prototype.skin = function()
{
    CTX.globalAlpha = 0.6;
    CTX.strokeStyle = "black";
    CTX.beginPath();
    CTX.moveTo(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
    CTX.lineTo(this.pos_prev[0]*PIXELS, this.pos_prev[1]*PIXELS);
    CTX.stroke();

    CTX.save();
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
    CTX.rotate(-this.theta);
    CTX.globalAlpha = 1;
    CTX.fillStyle = "black";
    CTX.strokeStyle = "gray";
    CTX.fillRect(-this.length/2*PIXELS, -this.width/2*PIXELS,
                  this.length*PIXELS, this.width*PIXELS);
    CTX.restore();
}
