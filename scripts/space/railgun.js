// railgun.js

const RAILGUN_VEL = 20000;
const RAILGUN_COOLDOWN = 5;
const RAILGUN_DAMAGE = 500;
const RAILGUN_LENGTH = 4;
const RAILGUN_MASS = 1;

class Railgun
{
    constructor(pos, vel, theta)
    {
        this.pos = pos;
        this.pos_prev = pos;
        this.vel = vel;
        this.theta = theta;
        this.length = RAILGUN_LENGTH;
        this.width = this.length/5;
        this.mass = RAILGUN_MASS;

        this.world = null;
    }

    draw(ctx)
    {
        if (DRAW_TRACE)
        {
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.moveTo(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
            ctx.lineTo(this.pos_prev[0]*PIXELS, this.pos_prev[1]*PIXELS);
            ctx.stroke();
        }

        ctx.save();
        ctx.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
        ctx.rotate(-this.theta - Math.PI/2);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "black";
        ctx.fillRect(-this.width/2*PIXELS, -this.length/2*PIXELS,
                      this.width*PIXELS, this.length*PIXELS);
        ctx.restore();
    }

    step(dt)
    {
        this.pos_prev = this.pos.slice();
        this.pos[0] += this.vel[0]*dt;
        this.pos[1] += this.vel[1]*dt;
    }

    explode()
    {
        this.remove = true;
    }

    b2g(v)
    {
        return rot2d(v, this.theta);
    }

    g2b(v)
    {
        return rot2d(v, -this.theta);
    }
}
