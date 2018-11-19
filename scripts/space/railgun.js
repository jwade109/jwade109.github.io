class Railgun
{
    constructor(pos, vel, theta, length)
    {
        this.pos = pos;
        this.vel = vel;
        this.theta = theta;
        this.width = width;
        this.length = length;
        this.width = this.length/5;
        this.mass = 1;
        this.radius = length/2;

        this.world = null;
    }

    draw(ctx)
    {
        ctx.save();
        ctx.translate(this.pos[0], this.pos[1]);
        ctx.rotate(-this.theta - Math.PI/2);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "black";
        ctx.fillRect(-this.width/2, -this.length/2, this.width, this.length);
        ctx.restore();
    }

    step(dt)
    {
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
