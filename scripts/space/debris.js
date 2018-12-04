// debris.js

const DEBRIS_DAMAGE = 50;
const LARGE_DEBRIS = 25;
const SMALL_DEBRIS = 6

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
        this.health = radius;
        this.box = new Hitbox([[this.radius/2, this.radius/2],
                               [this.radius/2, -this.radius/2],
                               [-this.radius/2, -this.radius/2],
                               [-this.radius/2, this.radius/2]]);
        this.box.object = this;

        this.name = Math.floor(Math.random()*10000000) + "-" +
            DEBRIS_NAMES[Math.floor(Math.random()*DEBRIS_NAMES.length)]

        this.color = "darkgray";
        if (Math.random() < 0.4)
            this.color = "gray";
        this.opacity = 1;
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

        if (this.radius < SMALL_DEBRIS) this.opacity -= dt*Math.random();
        if (this.opacity <= 0) this.remove = true;
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
        ctx.globalAlpha = Math.max(this.opacity, 0);
        ctx.fillRect(-this.radius/2*PIXELS, -this.radius/2*PIXELS,
                     this.radius*PIXELS, this.radius*PIXELS);
        ctx.strokeRect(-this.radius/2*PIXELS, -this.radius/2*PIXELS,
                     this.radius*PIXELS, this.radius*PIXELS);

        ctx.restore();
        if (DRAW_HITBOX) this.box.draw(ctx);
    }

    damage(d)
    {
        this.health -= d;
        if (this.health <= 0) this.explode();
        else if (Math.random() < 0.05*d)
        {
            let num_debris = 3 + Math.random()*3;
            for (let i = 0; i < num_debris; ++i)
            {
                let pos = this.pos.slice();
                let vel = this.vel.slice();
                vel[0] += Math.random()*200 - 100;
                vel[1] += Math.random()*200 - 100;
                let size = Math.random()*4;
                let deb = new Debris(pos, vel,
                    this.theta,
                    this.omega + Math.random()*5 - 2.5, size);
                deb.world = this.world;
                deb.name = this.name;
                deb.color = "#909090";
                if (Math.random() < 0.2)
                    deb.color = "#CCCCCC";
                this.world.push(deb);
            }
        }
    }

    explode()
    {
        if (this.remove) return;
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
            deb.name = this.name;
            this.world.push(deb);
        }
        this.remove = true;
    }
}
