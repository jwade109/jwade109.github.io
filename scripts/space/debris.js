class Debris
{
    constructor(pos, vel, theta, omega, radius)
    {
        this.pos = pos;
        this.pos_prev = pos;
        this.vel = vel;
        this.theta = theta;
        this.omega = omega;
        this.radius = radius;
        this.box = new Hitbox([[this.radius/2, this.radius/2],
                               [this.radius/2, -this.radius/2],
                               [-this.radius/2, -this.radius/2],
                               [-this.radius/2, this.radius/2]]);
        this.box.object = this;

        this.color = "darkgray";
        if (Math.random() < 0.4)
            this.color = "gray";
        this.world = null;
    }

    step(dt)
    {
        this.pos_prev = this.pos.slice();
        this.pos[0] += this.vel[0]*dt;
        this.pos[1] += this.vel[1]*dt;
        this.theta += this.omega*dt;

        this.box.pos = this.pos.slice();
        this.box.theta = this.theta;
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
        ctx.rotate(-this.theta);
        ctx.strokeStyle = "black";
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 1;
        // ctx.fillRect(-this.radius/2*PIXELS, -this.radius/2*PIXELS,
        //              this.radius*PIXELS, this.radius*PIXELS);
        ctx.strokeRect(-this.radius/2*PIXELS, -this.radius/2*PIXELS,
                     this.radius*PIXELS, this.radius*PIXELS);
        ctx.restore();
        if (DRAW_HITBOX) this.box.draw(ctx);
    }

    explode()
    {
        let num_debris = 4;
        if (this.radius < 4) num_debris = 0;
        for (let i = 0; i < num_debris; ++i)
        {

            let pos = this.pos.slice();
            let vel = this.vel.slice();
            vel[0] += Math.random()*60 - 40;
            vel[1] += Math.random()*80 - 40;
            let size = this.radius/2;
            let deb = new Debris(pos, vel,
                this.theta,
                this.omega + Math.random()*5 - 2.5, size);
            deb.world = this.world;
            deb.color = this.color;
            this.world.push(deb);
        }
        this.remove = true;
    }
}
