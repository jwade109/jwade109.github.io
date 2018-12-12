// bullet.js

const BULLET_MAX_HEALTH = 1;
const BULLET_LENGTH = 2;
const BULLET_DAMAGE = 1;
const BULLET_MASS = 0.05;

function Bullet(pos, vel, theta)
{
    Collidable.call(this, BULLET_LENGTH, 0, BULLET_MAX_HEALTH);
    this.pos = pos.slice();
    this.vel = vel.slice();
    this.theta = theta;
    this.mass = BULLET_MASS;
    this.trackable = false;
    delete this.box;
}

Bullet.prototype = Object.create(Collidable.prototype);

Bullet.prototype.handleCollision = function(other)
{
    if (other === this.origin) return;
    if (other instanceof Bullet) return;
    if (other instanceof Torpedo) return;
    other.damage(BULLET_DAMAGE);
    this.remove = true;
}

Bullet.prototype.skin = function()
{
    CTX.save();
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
    CTX.rotate(-this.theta);
    CTX.globalAlpha = 1;
    CTX.strokeStyle = "black";
    CTX.beginPath();
    CTX.moveTo(-this.length/2*PIXELS, 0);
    CTX.lineTo(this.length/2*PIXELS, 0);
    CTX.stroke();
    CTX.restore();
}

// class Bullet
// {
//     draw(ctx)
//     {
//         if (DRAW_TRACE)
//         {
//             ctx.globalAlpha = 0.6;
//             ctx.strokeStyle = "red";
//             ctx.beginPath();
//             ctx.moveTo(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
//             ctx.lineTo(this.pos_prev[0]*PIXELS, this.pos_prev[1]*PIXELS);
//             ctx.stroke();
//         }
//
//     }
//
//     step(dt)
//     {
//         this.pos_prev = this.pos.slice();
//         this.pos[0] += this.vel[0]*dt;
//         this.pos[1] += this.vel[1]*dt;
//     }
//
//     explode()
//     {
//         this.remove = true;
//     }
//
//     b2g(v)
//     {
//         return rot2d(v, this.theta);
//     }
//
//     g2b(v)
//     {
//         return rot2d(v, -this.theta);
//     }
// }
