// explosion.js

// const EXPLOSION_DURATION = 0.6;

class Explosion
{
    constructor(pos, vel, max_radius)
    {
        this.pos = pos;
        this.pos_prev = pos;
        this.theta = 0;
        this.vel = vel;
        this.max_radius = max_radius;
        this.time = 0;
        this.duration = max_radius/100;

        this.nocollide = true;
    }

    step(dt)
    {
        this.pos_prev = this.pos.slice();
        this.time += dt;
        this.pos[0] += this.vel[0]*dt;
        this.pos[1] += this.vel[1]*dt;
        if (this.time > this.duration) this.remove = true;
    }

    draw(ctx)
    {
        let radius = Math.max(this.max_radius*(
            Math.sin(this.time/this.duration*Math.PI) +
            Math.sin(this.time/this.duration*Math.PI*12)*0.05), 0);

        ctx.save();
        ctx.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
        ctx.globalAlpha = 0.35;

        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(0, 0, radius*PIXELS, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(0, 0, radius*PIXELS*0.7, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(0, 0, radius*PIXELS*0.5, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }
}
