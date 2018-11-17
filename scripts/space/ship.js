class Thruster
{
    constructor(pos, theta, thrust, width)
    {
        this.pos = pos;
        this.theta = theta;
        this.width = width;
        this.thrust = thrust;
        this.firing = false;
        this.drawbell = true;
    }

    draw(ctx)
    {
        ctx.save();
        ctx.translate(-this.pos[0], this.pos[1]);
        ctx.rotate(-this.theta + Math.PI/2)

        if (this.drawbell)
        {
            ctx.fillStyle = "black";
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.moveTo(-this.width/2, this.width);
            ctx.lineTo(0, 0);
            ctx.lineTo(this.width/2, this.width);
            ctx.fill();
            ctx.translate(0, this.width);
        }

        if (this.firing)
        {
            ctx.fillStyle = "red";
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(-this.width/3, 0);
            ctx.lineTo(0, 2*this.width);
            ctx.lineTo(this.width/3, 0);
            ctx.fill();
        }

        ctx.restore();
    }
}

class Torpedo
{
    constructor(pos, vel, theta, thrust, length)
    {
        this.pos = pos;
        this.vel = vel;
        this.theta = theta;
        this.omega = 0;
        this.width = width;
        this.thrust = thrust;
        this.length = length;
        this.width = this.length/5;
        this.mass = 1;
        this.drifttimer = 0.5;

        this.thruster = new Thruster(
            [0, -this.length/2], -Math.PI/2, thrust, this.width);
        this.thruster.firing = false;
        this.thruster.drawbell = false;
    }

    draw(ctx)
    {
        ctx.save();
        ctx.translate(this.pos[0], this.pos[1]);
        ctx.save();
        ctx.rotate(-this.theta - Math.PI/2);

        ctx.globalAlpha = 1;
        ctx.fillStyle = "black";
        ctx.fillRect(-this.width/2, -this.length/2, this.width, this.length);

        this.thruster.draw(ctx);
        ctx.restore();

        ctx.restore();
    }

    step(dt)
    {
        let tx = mx;
        let ty = my;

        let bodyacc = [0, 0];
        if (this.drifttimer > 0) this.drifttimer -= dt;
        else
        {
            this.thruster.firing = true;
            let thrustv =
                [-this.thruster.thrust*Math.sin(this.thruster.theta),
                 -this.thruster.thrust*Math.cos(this.thruster.theta)];
            bodyacc[0] = thrustv[0]/this.mass;
            bodyacc[1] = thrustv[1]/this.mass;
        }

        let pointing = rot2d([1, 0], this.theta);
        let tg = [tx - this.pos[0], ty - this.pos[1]];
        let angle = Math.acos(dot2d(pointing, tg)/
            Math.sqrt(tg[0]*tg[0] + tg[1]*tg[1]));
        if (det2d(pointing, tg) > 0) angle *= -1;

        let vel = this.vel.slice();
        let corr = Math.acos(dot2d(pointing, this.vel)/
            Math.sqrt(vel[0]*vel[0] + vel[1]*vel[1]));
        if (det2d(pointing, vel) < 0) corr *= -1;
        if (Math.sqrt(vel[0]*vel[0] + vel[1]*vel[1]) < 5) corr = 0;

        let acc = this.b2g(bodyacc);
        let alpha = 150*angle + 130*corr - 30*this.omega
        if (this.drifttimer > 0) alpha = 0;

        this.vel[0] += acc[0]*dt;
        this.vel[1] += acc[1]*dt;
        this.pos[0] += this.vel[0]*dt;
        this.pos[1] += this.vel[1]*dt;
        this.omega += alpha*dt;
        this.theta += this.omega*dt;
        if (Math.sqrt(tg[0]*tg[0] + tg[1]*tg[1]) < 50)
        {
            this.drifttimer = Infinity;
            this.thruster.firing = false;
        }
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
        this.maxfuel = 600000;
        this.fuel = this.maxfuel;
        this.side = true;

        this.w = 40;
        this.l = 144;

        let tx = this.w*0.5;
        let ty = this.w*0.7;

        let thr = 20;
        this.thrusters = [new Thruster([tx, ty], 0, thr, 6),
                          new Thruster([tx, ty], Math.PI/2, thr, 6),
                          new Thruster([-tx, ty], Math.PI/2, thr, 6),
                          new Thruster([-tx, ty], Math.PI, thr, 6),
                          new Thruster([-tx, -ty], Math.PI, thr, 6),
                          new Thruster([-tx, -ty], 3*Math.PI/2, thr, 6),
                          new Thruster([tx, -ty], 3*Math.PI/2, thr, 6),
                          new Thruster([tx, -ty], 0, thr, 6),
                          new Thruster([0, -this.l/2], -Math.PI/2, 9*thr, this.w)];
        this.thrusters[8].drawbell = false;

        this.torpedoes = [];
    }

    spawnTorpedo()
    {
        this.side = !this.side;
        let poff = rot2d([this.w/3, 0], this.theta + Math.PI/2);
        if (!this.side)
            poff = rot2d([this.w/3, 0], this.theta - Math.PI/2);
        let voff = rot2d([80, 0], this.theta + Math.PI/2);
        if (!this.side)
            voff = rot2d([80, 0], this.theta - Math.PI/2);
        let tpos = this.pos.slice();
        let tvel = this.vel.slice();
        tpos[0] += poff[0];
        tpos[1] += poff[1];
        tvel[0] += voff[0];
        tvel[1] += voff[1];
        this.torpedoes.push(new Torpedo(tpos, tvel, this.theta, 700, 20));
    }

    draw(ctx)
    {
        for (let t of this.torpedoes) t.draw(ctx);

        ctx.save(); // save global reference frame
        ctx.translate(this.pos[0], this.pos[1]);
        ctx.rotate(-this.theta - Math.PI/2)
        // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE FRAME

        ctx.save();
        ctx.rotate(Math.PI/2);

        let off = this.w/2;
        ctx.strokeStyle = "black";
        ctx.fillStyle = "lightgray";
        ctx.globalAlpha = 1;
        ctx.beginPath();

        let y0 =  0.50*this.w;
        let y1 =  0.44*this.w;
        let y2 =  0.36*this.w;
        let y3 =  0.20*this.w;

        let x0 = -0.50*this.l;
        let x1 = -0.40*this.l;
        let x2 = -0.25*this.l;
        let x3 = -0.07*this.l;
        let x4 =  0.00;
        let x5 =  0.20*this.l;
        let x6 =  0.30*this.l;
        let x7 =  0.50*this.l;

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
        ctx.lineTo(x7 + this.w*0.3, y3);
        ctx.moveTo(x7, -y3);
        ctx.lineTo(x7 + this.w*0.4, -y3);
        ctx.moveTo(x7, -y3 + this.w*0.1);
        ctx.lineTo(x7 + this.w*0.2, -y3 + this.w*0.1);

        ctx.fill();
        ctx.stroke();
        ctx.restore();

        for (let t of this.thrusters)
            if (t.thrust <= this.fuel) t.draw(ctx);

        ctx.restore();

    }

    step(dt)
    {
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

        for (let t of this.torpedoes) t.step(dt);
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

// rotates a vector CCW by theta radians
function rot2d(u, theta)
{
    let x =  u[0]*Math.cos(theta) + u[1]*Math.sin(theta);
    let y =  u[1]*Math.cos(theta) - u[0]*Math.sin(theta);
    return [x, y];
}

// dot product of u and v
function dot2d(u, v)
{
    return u[0]*v[0] + u[1]*v[1];
}

// determinant of u and v
function det2d(u, v)
{
    return u[0]*v[1] - u[1]*v[0];
}
