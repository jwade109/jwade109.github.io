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
        this.detonator = 0.7;

        this.exploded = false;
        this.debris = [];

        this.world = null;

        this.thruster = new Thruster(
            [0, -this.length/2], -Math.PI/2, thrust, this.width);
        this.thruster.firing = false;
        this.thruster.drawbell = false;
    }

    draw(ctx)
    {
        if (this.exploded)
        {
            for (let d of this.debris) d.draw(ctx);
            return;
        }
        ctx.save();
        ctx.translate(this.pos[0], this.pos[1]);
        ctx.rotate(-this.theta - Math.PI/2);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "black";
        ctx.fillRect(-this.width/2, -this.length/2, this.width, this.length);
        this.thruster.draw(ctx);
        ctx.restore();
    }

    step(dt)
    {
        this.detonator -= dt;
        if (this.detonator <= 0) this.explode();
        if (this.exploded)
        {
            for (let d of this.debris) d.step(dt);
            return;
        }

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
        // if (this.drifttimer > 0) alpha = 0;
        alpha = 0;

        this.vel[0] += acc[0]*dt;
        this.vel[1] += acc[1]*dt;
        this.pos[0] += this.vel[0]*dt;
        this.pos[1] += this.vel[1]*dt;
        this.omega += alpha*dt;
        this.theta += this.omega*dt;
        // if (Math.sqrt(tg[0]*tg[0] + tg[1]*tg[1]) < 50)
        // {
        //     this.drifttimer = Infinity;
        //     this.thruster.firing = false;
        // }
    }

    explode()
    {
        if (this.exploded) return;
        this.exploded = true;
        let num_debris = Math.round(Math.random()*12 + 4);
        for (let i = 0; i < num_debris; ++i)
        {
            let pos = this.pos.slice();
            let vel = this.vel.slice();
            vel[0] += Math.random()*300 - 150;
            vel[1] += Math.random()*300 - 150;
            this.debris.push(new Debris(pos, vel,
                Math.random()*Math.PI*2,
                Math.random()*40 - 20, Math.random()*4 + 2));
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
