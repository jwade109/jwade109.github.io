class Torpedo
{
    constructor(pos, vel, theta, thrust, length)
    {
        this.pos = pos;
        this.pos_prev = pos;
        this.vel = vel;
        this.theta = theta;
        this.omega = 0;
        this.thrust = thrust;
        this.length = length;
        this.width = this.length/5;
        this.mass = 1;
        this.time = 0;
        this.drifttimer = 0.5;
        this.tracking = true;
        this.box = new Hitbox([[this.width/2, this.length/2],
                               [this.width/2, -this.length/2],
                               [-this.width/2, -this.length/2],
                               [-this.width/2, this.length/2]]);
        this.box.object = this;

        this.world = null;
        this.target = null;

        this.thruster = new Thruster(
            [0, -this.length/2], -Math.PI/2, thrust, this.width);
        this.thruster.firing = false;
        this.thruster.drawbell = false;
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
        if (this.target === PLAYER_SHIP.pos && this.tracking)
        {
            ctx.strokeStyle = "red";
            ctx.fillStyle = "red";
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            let theta = Math.PI - angle2d(this.pos, this.target);
            ctx.arc(this.target[0]*PIXELS, this.target[1]*PIXELS,
                47*PIXELS, theta - 0.2, theta + 0.2, false);
            ctx.arc(this.target[0]*PIXELS, this.target[1]*PIXELS,
                50*PIXELS, theta + 0.2, theta - 0.2, true);
            ctx.fill();
        }
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";
        ctx.globalAlpha = 1;
        ctx.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
        ctx.rotate(-this.theta - Math.PI/2);
        ctx.fillRect(-this.width/2*PIXELS, -this.length/2*PIXELS,
                     this.width*PIXELS, this.length*PIXELS);
        this.thruster.draw(ctx);
        ctx.restore();
        if (DRAW_HITBOX) this.box.draw(ctx);
    }

    step(dt)
    {
        this.time += dt;
        // let theta = angle2d(this.pos, this.target) - this.theta;

        this.theta = -torpedoGuidance(this.pos.slice(),
                                      this.vel.slice(),
                                      this.target.pos.slice(),
                                      this.target.vel.slice());

        let bodyacc = [0, 0];
        if (this.time > this.drifttimer)
        {
            this.thruster.firing = true;
            let thrustv =
                [-this.thruster.thrust*Math.sin(this.thruster.theta),
                 -this.thruster.thrust*Math.cos(this.thruster.theta)];
            bodyacc[0] = thrustv[0]/this.mass;
            bodyacc[1] = thrustv[1]/this.mass;
        }
        let acc = this.b2g(bodyacc);

        // while (theta > Math.PI) theta -= Math.PI*2;
        // while (theta < -Math.PI) theta += Math.PI*2;
        //
        // if (Math.abs(theta) > Math.PI/3 && this.time > this.drifttimer)
        //     this.tracking = false;
        //
        // let alpha = 600*theta - 40*this.omega;
        // if (this.time > this.drifttimer) alpha = 50*theta - 20*this.omega;
        // if (!this.tracking) alpha = this.omega = 0;

        this.pos_prev = this.pos.slice();
        this.vel[0] += acc[0]*dt;
        this.vel[1] += acc[1]*dt;
        this.pos[0] += this.vel[0]*dt;
        this.pos[1] += this.vel[1]*dt;
        // this.theta += this.omega*dt;
        // this.omega += alpha*dt;
    }

    explode()
    {
        let num_debris = Math.round(Math.random()*3 + 5);
        if (this.pdc) num_debris = 0;
        for (let i = 0; i < num_debris; ++i)
        {
            let pos = this.pos.slice();
            let vel = this.vel.slice();
            vel[0] += Math.random()*200 - 100;
            vel[1] += Math.random()*200 - 100;
            let deb = new Debris(pos, vel,
                Math.random()*Math.PI*2,
                Math.random()*40 - 20,
                Math.random()*3 + 2);
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

function torpedoGuidance(pos, vel, tpos, tvel)
{
    let rvel = [vel[0] - tvel[0], vel[1] - tvel[1]];
    let disp = [tpos[0] - pos[0], tpos[1] - pos[1]];
    let dot = Math.max(0, dot2d(disp, rvel));
    let goodvel = vproj2d(disp, rvel);
    if (dot < 0) goodvel = [0, 0];
    let badvel = [rvel[0] - goodvel[0], rvel[1] - goodvel[1]];
    let pointing = [disp[0] - badvel[0],
                    disp[1] - badvel[1]];
    return anglebtwn([1, 0], pointing);
}
