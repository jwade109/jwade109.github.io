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
        this.side = true;

        this.width = 9*METERS;
        this.length = 31*METERS;
        this.radius = this.width/2;
        this.box = new Hitbox([[this.width/2, this.length/2],
                               [this.width/2, -this.length/2],
                               [-this.width/2, -this.length/2],
                               [-this.width/2, this.length/2]]);
        this.health = 350;

        this.world = null;

        this.gray = "#606060";
        this.orange = "#8D3F32";
    }

    launchTorpedo()
    {
        let poff = rot2d([this.width/2, 0], this.theta + Math.PI/2);
        let voff = rot2d([80, 0], this.theta + Math.PI/2);
        let tpos = this.pos.slice();
        let tvel = this.vel.slice();
        tpos[0] += poff[0];
        tpos[1] += poff[1];
        tvel[0] += voff[0];
        tvel[1] += voff[1];
        let torp = new Torpedo(tpos, tvel, this.theta, 5500, 13);
        torp.origin = this;
        torp.target = ship.pos.slice();
        torp.world = this.world;
        torp.launch_vel = this.vel.slice();
        this.world.push(torp);
    }

    firePDC()
    {
        if (this.pdc_reload > 0) return;
        this.pdc_reload = 0.03;
        let theta = Math.atan2(ship.pos[0] - this.pos[0],
            ship.pos[1] - this.pos[1]) - Math.PI/2;
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
        ctx.rotate(-this.theta);
        // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE FRAME

        let x0 = -0.50*this.length;
        let x1 = -0.47*this.length;
        let x2 = -0.39*this.length;
        let x3 = -0.36*this.length;
        let x4 = -0.25*this.length;
        let x5 = -0.10*this.length;
        let x6 =  0.10*this.length;
        let x7 =  0.20*this.length;
        let x8 =  0.25*this.length;
        let x9 =  0.3*this.length;
        let x10 = 0.50*this.length;
        let x11 = 0.65*this.length;

        let y0 = 0.05*this.width;
        let y1 = 0.15*this.width;
        let y2 = 0.25*this.width;
        let y3 = 0.35*this.width;
        let y4 = 0.50*this.width;

        ctx.globalAlpha = 1;
        ctx.strokeStyle = "black";
        ctx.fillStyle = this.gray;
        ctx.beginPath();
        ctx.moveTo(x0, y2);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x1, y3);
        ctx.lineTo(x3, y4);
        ctx.lineTo(x5, y4);
        ctx.lineTo(x6, y3);
        ctx.lineTo(x7, y4);
        ctx.lineTo(x10, y3);
        ctx.lineTo(x10, -y3);
        ctx.lineTo(x7, -y4);
        ctx.lineTo(x6, -y3);
        ctx.lineTo(x5, -y4);
        ctx.lineTo(x3, -y4);
        ctx.lineTo(x1, -y3);
        ctx.lineTo(x1, -y1);
        ctx.lineTo(x0, -y2);
        ctx.lineTo(x0, y2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.orange;
        ctx.beginPath();
        // ctx.rect(x5, y2, x4 - x2, y4 - y2);
        // ctx.rect(x5, -y2 - (y4 - y2), x4 - x2, y4 - y2);
        ctx.rect(-0.3*this.length, -0.15*this.width,
                        0.6*this.length, 0.3*this.width);
        ctx.rect(-0.3*this.length, -0.15*this.width,
                        0.6*this.length, 0.3*this.width);
        ctx.fill();
        ctx.stroke();

        ctx.moveTo(x10, y1);
        ctx.lineTo(x11, y1);
        ctx.stroke();

        ctx.rotate(-Math.PI/2);
        if (DRAW_HITBOX) this.box.draw(ctx);
        ctx.restore();
    }

    step(dt)
    {
        let dist = distance(ship.pos, this.pos);
        if (this.torpedo_reload > 0) this.torpedo_reload -= dt;
        else if (200*METERS < dist && dist < 700*METERS)
        {
            this.launchTorpedo();
            this.torpedo_reload = Math.random()*7;
        }

        if (this.pdc_reload > 0) this.pdc_reload -= dt;
        else if (Math.random() < 0.5 && dist < 200*METERS)
            this.firePDC();

        let dx = ship.pos[0] - this.pos[0];
        let dy = ship.pos[1] - this.pos[1];
        let bodyacc = [-(300*METERS - dist)/10, 0];
        this.acc = this.b2g(bodyacc);
        this.acc[0] += (ship.vel[0] - this.vel[0])/3;
        this.acc[1] += (ship.vel[1] - this.vel[1])/3;
        let theta = angle2d(this.pos, ship.pos) - this.theta;
        while (theta > Math.PI) theta -= Math.PI*2;
        while (theta < -Math.PI) theta += Math.PI*2;
        this.alpha = theta - this.omega;

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
            deb.color = this.gray;
            if (Math.random() < 0.4) deb.color = this.orange;
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

function distance(p1, p2)
{
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}
