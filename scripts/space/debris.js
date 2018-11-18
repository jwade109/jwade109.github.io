class Debris
{
    constructor(pos, vel, theta, omega, size)
    {
        this.pos = pos;
        this.vel = vel;
        this.theta = theta;
        this.omega = omega;
        this.size = size;
    }

    step(dt)
    {
        this.pos[0] += this.vel[0]*dt;
        this.pos[1] += this.vel[1]*dt;
        this.theta += this.omega*dt;
    }

    draw(ctx)
    {
        ctx.save();
        ctx.translate(this.pos[0], this.pos[1]);
        ctx.rotate(-this.theta);
        ctx.fillRect(-this.size/2,
                     -this.size/2,
                     this.size, this.size);
        ctx.restore();
    }
}
