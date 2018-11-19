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
        this.railgun = false;
        this.pdc = false;
        this.radius = length/2;

        this.world = null;
        this.target = mousepos;

        this.thruster = new Thruster(
            [0, -this.length/2], -Math.PI/2, thrust, this.width);
        this.thruster.firing = false;
        this.thruster.drawbell = false;
    }

    draw(ctx)
    {
        ctx.save();
        ctx.translate(this.pos[0], this.pos[1]);
        // ctx.beginPath();
        // ctx.moveTo(0, 0);
        // ctx.lineTo(this.vel[0], this.vel[1]);
        // ctx.stroke();
        ctx.rotate(-this.theta - Math.PI/2);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "black";
        ctx.fillRect(-this.width/2, -this.length/2, this.width, this.length);
        this.thruster.draw(ctx);
        ctx.restore();
    }

    step(dt)
    {
        let theta = Math.atan2(this.target[0] - this.pos[0],
            this.target[1] - this.pos[1]) - Math.PI/2 - this.theta;

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
        let acc = this.b2g(bodyacc);

        while (theta > Math.PI) theta -= Math.PI*2;
        while (theta < -Math.PI) theta += Math.PI*2;
        let alpha = 600*theta - 40*this.omega;
        if (this.drifttimer <= 0) alpha = this.omega = 0;
        this.vel[0] += acc[0]*dt;
        this.vel[1] += acc[1]*dt;
        this.pos[0] += this.vel[0]*dt;
        this.pos[1] += this.vel[1]*dt;
        this.theta += this.omega*dt;
        this.omega += alpha*dt;
    }

    explode()
    {
        let num_debris = Math.round(Math.random()*6 + 8);
        if (this.pdc) num_debris = 0;
        for (let i = 0; i < num_debris; ++i)
        {
            let pos = this.pos.slice();
            let vel = this.vel.slice();
            vel[0] += Math.random()*200 - 100;
            vel[1] += Math.random()*200 - 100;
            let deb = new Debris(pos, vel,
                Math.random()*Math.PI*2,
                Math.random()*40 - 20, Math.random()*6 + 3);
            deb.world = this.world;
            this.world.push(deb);
        }
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
