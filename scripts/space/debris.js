class Debris
{
    constructor(pos, vel, theta, omega, radius)
    {
        this.pos = pos;
        this.vel = vel;
        this.theta = theta;
        this.omega = omega;
        this.radius = radius;
        this.box = new Hitbox([[this.radius/2, this.radius/2],
                               [this.radius/2, -this.radius/2],
                               [-this.radius/2, -this.radius/2],
                               [-this.radius/2, this.radius/2]]);

        this.color = "darkgray";
        if (Math.random() < 0.4)
            this.color = "gray";
        this.world = null;
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
        ctx.strokeStyle = "black";
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 1;
        ctx.fillRect(-this.radius/2,
                     -this.radius/2,
                     this.radius, this.radius);
        ctx.strokeRect(-this.radius/2,
                       -this.radius/2,
                       this.radius, this.radius);
        if (DRAW_HITBOX) this.box.draw(ctx);
        ctx.restore();
    }

    explode()
    {
        let num_debris = 4;
        if (this.radius < 4) num_debris = 0;
        for (let i = 0; i < num_debris; ++i)
        {

            let pos = this.pos.slice();
            let vel = this.vel.slice();
            vel[0] += (Math.random()*60 - 40)*METERS;
            vel[1] += (Math.random()*80 - 40)*METERS;
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
