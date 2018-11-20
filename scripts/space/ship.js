class Ship
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
        this.maxfuel = 800000;
        this.fuel = this.maxfuel;
        this.side = true;
        this.torpedo_reload = 0;
        this.railgun_reload = 1;
        this.pdc_reload = 0.03;
        this.health = 1000;

        this.width = 11*METERS; // 40/1.5;
        this.length = 42*METERS; // 144/1.5;
        this.radius = this.width/2;
        this.box = new Hitbox([[this.width/2, this.length/2],
                               [this.width/2, -this.length/2],
                               [-this.width/2, -this.length/2],
                               [-this.width/2, this.length/2]]);

        let tx = this.width*0.5;
        let ty = this.width*0.7;

        let thr = 20;
        this.thrusters = [new Thruster([tx, ty], 0, thr, 6),
                          new Thruster([tx, ty], Math.PI/2, thr, 6),
                          new Thruster([-tx, ty], Math.PI/2, thr, 6),
                          new Thruster([-tx, ty], Math.PI, thr, 6),
                          new Thruster([-tx, -ty], Math.PI, thr, 6),
                          new Thruster([-tx, -ty], 3*Math.PI/2, thr, 6),
                          new Thruster([tx, -ty], 3*Math.PI/2, thr, 6),
                          new Thruster([tx, -ty], 0, thr, 6),
                          new Thruster([0, -this.length/2],
                                       -Math.PI/2, 9*thr, this.width)];
        for (let t of this.thrusters)
        {
            t.drawbell = false;
            t.world = this.world;
        }

        this.world = null;
    }

    launchTorpedo()
    {
        if (this.torpedo_reload > 0) return;
        this.torpedo_reload = 0.12;
        this.side = !this.side;
        let poff = rot2d([this.width/3, 0], this.theta + Math.PI/2);
        if (!this.side)
            poff = rot2d([-this.width/3, 0], this.theta + Math.PI/2);
        let voff = rot2d([80, 0], this.theta + Math.PI/2);
        if (!this.side)
            voff = rot2d([80, 0], this.theta - Math.PI/2);
        let tpos = this.pos.slice();
        let tvel = this.vel.slice();
        tpos[0] += poff[0];
        tpos[1] += poff[1];
        tvel[0] += voff[0];
        tvel[1] += voff[1];
        let torp = new Torpedo(tpos, tvel, this.theta, 5500, 13);
        torp.origin = this;
        torp.world = this.world;
        torp.target = mousepos;
        torp.launch_vel = this.vel.slice();
        this.world.push(torp);
    }

    fireRailgun()
    {
        if (this.railgun_reload > 0) return;
        this.railgun_reload = 1;
        let vel = rot2d([5000, 0], this.theta);
        let dv = rot2d([-60, 0], this.theta);
        vel[0] += this.vel[0];
        vel[1] += this.vel[1];
        let r = new Railgun(this.pos.slice(), vel, this.theta, 12);
        r.world = this.world;
        r.origin = this;
        world.push(r);
        this.vel[0] += dv[0];
        this.vel[1] += dv[1];
    }

    firePDC()
    {
        if (this.pdc_reload > 0) return;
        this.pdc_reload = 0.03;
        let theta = Math.atan2(mx - this.pos[0], my - this.pos[1]) - Math.PI/2;
        let vel = rot2d([(500 + Math.random()*10 - 5)*METERS,
                         (Math.random()*70 - 35)*METERS], theta);
        vel[0] += this.vel[0];
        vel[1] += this.vel[1];
        let b = new Bullet(this.pos.slice(), vel, theta, 7);
        b.world = this.world;
        b.origin = this;
        world.push(b);
    }

    draw(ctx)
    {
        ctx.save(); // save global reference frame
        ctx.translate(this.pos[0], this.pos[1]);

        ctx.rotate(-this.theta - Math.PI/2)
        // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE FRAME

        ctx.save();
        ctx.rotate(Math.PI/2);

        let off = this.width/2;
        ctx.strokeStyle = "black";
        ctx.fillStyle = "#909090";
        ctx.globalAlpha = 1;
        ctx.beginPath();

        let y0 =  0.50*this.width;
        let y1 =  0.44*this.width;
        let y2 =  0.36*this.width;
        let y3 =  0.20*this.width;

        let x0 = -0.50*this.length;
        let x1 = -0.40*this.length;
        let x2 = -0.25*this.length;
        let x3 = -0.07*this.length;
        let x4 =  0.00;
        let x5 =  0.20*this.length;
        let x6 =  0.30*this.length;
        let x7 =  0.50*this.length;

        ctx.moveTo(x0, y2);
        ctx.lineTo(x1, y3);
        ctx.lineTo(x1, y0);
        ctx.lineTo(x2, y0);
        ctx.lineTo(x2, y1);
        ctx.lineTo(x3, y1);
        ctx.lineTo(x3, y2);
        ctx.lineTo(x4, y0);
        ctx.lineTo(x5, y0);
        ctx.lineTo(x5, y2);
        ctx.lineTo(x6, y2);
        ctx.lineTo(x7, y3);
        ctx.lineTo(x7, -y3);
        ctx.lineTo(x6, -y2);
        ctx.lineTo(x5, -y2);
        ctx.lineTo(x5, -y0);
        ctx.lineTo(x4, -y0);
        ctx.lineTo(x3, -y2);
        ctx.lineTo(x3, -y1);
        ctx.lineTo(x2, -y1);
        ctx.lineTo(x2, -y0);
        ctx.lineTo(x1, -y0);
        ctx.lineTo(x1, -y3);
        ctx.lineTo(x0, -y2);
        ctx.lineTo(x0, y2);

        ctx.moveTo(x1, y3);
        ctx.lineTo(x1, -y3);
        ctx.moveTo(x2, y3);
        ctx.lineTo(x2, -y3);
        ctx.moveTo(x3, y3);
        ctx.lineTo(x3, -y3);
        ctx.moveTo(x5, y3);
        ctx.lineTo(x5, -y3);

        ctx.moveTo(x7, y3);
        ctx.lineTo(x7 + this.width*0.3, y3);
        ctx.moveTo(x7, -y3);
        ctx.lineTo(x7 + this.width*0.4, -y3);
        ctx.moveTo(x7, -y3 + this.width*0.1);
        ctx.lineTo(x7 + this.width*0.2, -y3 + this.width*0.1);

        ctx.fill();
        ctx.stroke();
        ctx.restore();

        for (let t of this.thrusters)
        {
            if (this.fuel <= t.thrust) t.firing = false;
            t.world = this.world;
            t.draw(ctx);
        }

        if (DRAW_HITBOX) this.box.draw(ctx);

        ctx.restore();
    }

    step(dt)
    {
        if (this.torpedo_reload > 0) this.torpedo_reload -= dt;
        if (this.railgun_reload > 0) this.railgun_reload -= dt;
        if (this.pdc_reload > 0) this.pdc_reload -= dt;
        let bodyacc = [0, 0];
        let moment = 0;
        let dfuel = 0;
        for (let t of this.thrusters)
        {
            if (t.firing && this.fuel >= t.thrust)
            {
                this.fuel -= t.thrust;
                let thrustv = [-t.thrust*Math.sin(t.theta),
                               -t.thrust*Math.cos(t.theta)];
                bodyacc[0] += thrustv[0]/this.mass;
                bodyacc[1] += thrustv[1]/this.mass;

                moment += thrustv[0]*t.pos[0] - thrustv[1]*t.pos[1];
            }

            t.firing = false;
        }

        this.acc = this.b2g(bodyacc);
        this.alpha = moment/this.j;

        this.vel[0] += this.acc[0]*dt;
        this.vel[1] += this.acc[1]*dt;
        this.pos[0] += this.vel[0]*dt;
        this.pos[1] += this.vel[1]*dt;
        this.omega += this.alpha*dt;
        this.theta += this.omega*dt;

        this.acc = [0, 0];
        this.alpha = 0;
    }

    damage(d)
    {
        this.health -= d;
        if (this.health < 1) this.explode();
    }

    explode()
    {
        let num_debris = 15 + Math.random()*7;
        for (let i = 0; i < num_debris; ++i)
        {
            let pos = this.pos.slice();
            let vel = this.vel.slice();
            vel[0] += Math.random()*200 - 100;
            vel[1] += Math.random()*200 - 100;
            let size = Math.random()*this.width/2 + this.width/2;
            let deb = new Debris(pos, vel,
                this.theta,
                this.omega + Math.random()*5 - 2.5, size);
            deb.world = this.world;
            deb.color = "#909090";
            this.world.push(deb);
        }
        this.acc = [0, 0];
        this.alpha = 0;
        this.omega = 0;
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
