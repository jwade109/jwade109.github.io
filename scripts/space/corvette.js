class Corvette
{
    constructor(pos, theta)
    {
        this.pos = pos;
        this.vel = [0, 0];
        this.acc = [0, 0];

        this.theta = theta;
        this.omega = 0;
        this.alpha = 0;

        this.mass = 1;
        this.j = 500;
        this.torpedo_reload = 0;
        this.pdc_reload = 0;

        this.width = 30
        this.length = 70;
        this.radius = this.length - 10;
        this.health = 1000;

        this.world = null;
    }

    launchTorpedo()
    {
        let poff = rot2d([0, this.length/2], this.theta + Math.PI/2);
        let voff = rot2d([0, 80], this.theta + Math.PI/2);
        let tpos = this.pos.slice();
        let tvel = this.vel.slice();
        tpos[0] += poff[0];
        tpos[1] += poff[1];
        tvel[0] += voff[0];
        tvel[1] += voff[1];
        let torp = new Torpedo(tpos, tvel, this.theta, 5500, 13);
        torp.origin = this;
        torp.target = ship.pos;
        torp.world = this.world;
        this.world.push(torp);
    }


    // firePDC()
    // {
    //     if (this.pdc_reload > 0) return;
    //     this.pdc_reload = 0.03;
    //     let theta = Math.atan2(ship.pos[0] - this.pos[0],
    //         ship.pos[0] - this.pos[1]) - Math.PI/2;
    //     let vel = rot2d([800 + Math.random()*10 - 5,
    //                      Math.random()*40 - 20], theta);
    //     vel[0] += this.vel[0];
    //     vel[1] += this.vel[1];
    //     let b = new Bullet(this.pos.slice(), vel, theta, 7);
    //     b.world = this.world;
    //     b.origin = this;
    //     world.push(b);
    //     console.log("pdc");
    // }

    draw(ctx)
    {
        ctx.save(); // save global reference frame
        ctx.translate(this.pos[0], this.pos[1]);
        ctx.rotate(-this.theta - Math.PI/2)
        // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE FRAME

        ctx.fillStyle = "#FFAAAA";
        ctx.strokeStyle = "black";
        ctx.globalAlpha = 1;
        ctx.fillRect(-this.width/2, -this.length/2,
                     this.width, this.length);
        ctx.strokeRect(-this.width/2, -this.length/2,
                       this.width, this.length);

        ctx.restore();
    }

    step(dt)
    {
        if (this.torpedo_reload > 0) this.torpedo_reload -= dt;
        else
        {
            this.launchTorpedo();
            this.torpedo_reload = Math.random()*7;
        }
        // if (this.pdc_reload > 0) this.pdc_reload -= dt;
        // if (Math.random() < 0.7) this.firePDC();

        let bodyacc = [Math.random()*50 - 20, (Math.random() - 0.5)*20];
        this.acc = this.b2g(bodyacc);
        this.alpha = Math.random() - 0.5;

        this.vel[0] += this.acc[0]*dt;
        this.vel[1] += this.acc[1]*dt;
        this.pos[0] += this.vel[0]*dt;
        this.pos[1] += this.vel[1]*dt;
        this.omega += this.alpha*dt;
        this.theta += this.omega*dt;

        this.acc = [0, 0];
        this.alpha = 0;
    }

    explode()
    {
        let num_debris = 10 + Math.random()*7;
        for (let i = 0; i < num_debris; ++i)
        {
            let pos = this.pos.slice();
            let vel = this.vel.slice();
            vel[0] += Math.random()*200 - 100;
            vel[1] += Math.random()*200 - 100;
            let size = Math.random()*this.length/2;
            let deb = new Debris(pos, vel,
                this.theta,
                this.omega + Math.random()*5 - 2.5, size);
            deb.world = this.world;
            deb.color = "red";
            this.world.push(deb);
        }
        this.remove = true;
    }

    damage(d)
    {
        this.health -= d;
        if (this.health < 1) this.explode();
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
