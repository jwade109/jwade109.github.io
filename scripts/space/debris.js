class Debris
{
    constructor(pos, vel, theta, omega, radius)
    {
        this.pos = pos;
        this.vel = vel;
        this.theta = theta;
        this.omega = omega;
        this.radius = radius;

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
        ctx.fillStyle = "black";
        ctx.globalAlpha = 0.4;
        ctx.fillRect(-this.radius/2,
                     -this.radius/2,
                     this.radius, this.radius);
        ctx.globalAlpha = 1;
        ctx.strokeRect(-this.radius/2,
                       -this.radius/2,
                       this.radius, this.radius);
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
            vel[0] += Math.random()*80 - 40;
            vel[1] += Math.random()*80 - 40;
            let size = this.radius/2;
            let deb = new Debris(pos, vel,
                this.theta,
                this.omega + Math.random()*5 - 2.5, size);
            deb.world = this.world;
            this.world.push(deb);
        }
        this.remove = true;
    }
}
