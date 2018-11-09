class Thruster
{
    constructor(pos, theta, thrust, width)
    {
        this.pos = pos;
        this.theta = theta;
        this.width = width;
        this.thrust = thrust;
        this.firing = false;
    }

    draw(ctx)
    {
        ctx.save();
        ctx.translate(-this.pos[0], this.pos[1]);
        ctx.rotate(-this.theta + Math.PI/2)
        ctx.fillStyle = "black";
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(-this.width/2, this.width);
        ctx.lineTo(0, 0);
        ctx.lineTo(this.width/2, this.width);
        ctx.fill();

        if (this.firing)
        {
            ctx.fillStyle = "red";
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(-this.width/3, this.width);
            ctx.lineTo(0, 3*this.width);
            ctx.lineTo(this.width/3, this.width);
            ctx.fill();
        }

        ctx.restore();
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
        this.j = 1200;

        this.w = 40;
        this.l = 90;

        let tx = this.w*0.7;
        let ty = this.w*0.7;

        let thr = 20;
        this.thrusters = [new Thruster([tx, ty], 0, thr, 6),
                          new Thruster([tx, ty], Math.PI/2, thr, 6),
                          new Thruster([-tx, ty], Math.PI/2, thr, 6),
                          new Thruster([-tx, ty], Math.PI, thr, 6),
                          new Thruster([-tx, -ty], Math.PI, thr, 6),
                          new Thruster([-tx, -ty], 3*Math.PI/2, thr, 6),
                          new Thruster([tx, -ty], 3*Math.PI/2, thr, 6),
                          new Thruster([tx, -ty], 0, thr, 6)];
    }

    draw(ctx)
    {
        ctx.save(); // save global reference frame
        ctx.translate(this.pos[0], this.pos[1]);
        ctx.rotate(-this.theta - Math.PI/2)
        // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE FRAME

        let off = this.w/2;
        ctx.strokeStyle = "black";
        ctx.globalAlpha = 1;
        ctx.strokeRect(-this.w/2, -this.w/2 - off, this.w, this.w*2)
        ctx.beginPath();
        ctx.moveTo(-this.w/2, this.w*1.5 - off);
        ctx.lineTo(-this.w/4, this.w*2.5 - off);
        ctx.lineTo(this.w/4, this.w*2.5 - off);
        ctx.lineTo(this.w/2, this.w*1.5 - off);
        ctx.moveTo(-this.w/3, -this.w/2 - off);
        ctx.lineTo(-this.w/2, -this.w*1.2 - off);
        ctx.lineTo(this.w/2, -this.w*1.2 - off);
        ctx.lineTo(this.w/3, -this.w/2 - off);
        ctx.stroke();
        ctx.strokeRect(-this.w*0.7, -this.w*0.7, this.w*1.4, this.w*1.4)

        // ctx.beginPath();
        // ctx.fillStyle = "blue";
        // ctx.globalAlpha = 0.4;
        // ctx.moveTo(0, 0);
        // if (this.omega > 0)
        //     ctx.arc(0, 0, this.w, Math.PI/2 - this.omega, Math.PI/2);
        // else
        //     ctx.arc(0, 0, this.w, Math.PI/2, Math.PI/2 - this.omega);
        // ctx.lineTo(0, 0);
        // ctx.fill();

        for (let t of this.thrusters) t.draw(ctx);

        ctx.restore();
        //
        // ctx.beginPath();
        // ctx.strokeStyle = "red";
        // ctx.globalAlpha = 0.4;
        // ctx.moveTo(this.pos[0], this.pos[1]);
        // ctx.lineTo(this.pos[0] + this.vel[0],
        //            this.pos[1] + this.vel[1]);
        // ctx.stroke();
    }

    step(dt)
    {
        let bodyacc = [0, 0];
        let moment = 0;
        for (let t of this.thrusters)
        {
            if (t.firing)
            {
                let thrustv = [-t.thrust*Math.sin(t.theta),
                               -t.thrust*Math.cos(t.theta)];
                bodyacc[0] += thrustv[0]/this.mass;
                bodyacc[1] += thrustv[1]/this.mass;

                moment += thrustv[0]*t.pos[0] - thrustv[1]*t.pos[1];
                console.log(thrustv[1], t.pos[1], moment);
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

    // applyThrust(thrust)
    // {
    //     this.acc[0] += thrust[0]/this.mass;
    //     this.acc[1] += thrust[1]/this.mass;
    // }
    //
    // applyMoment(moment)
    // {
    //     this.alpha += moment/this.j;
    // }
    //
    // pointAt(target)
    // {
    //     let dx = this.pos[0] - target[0];
    //     let dy = this.pos[1] - target[1];
    //     let angle = Math.atan2(dx, dy) + Math.PI/2;
    //     if (angle < 0) angle += Math.PI*2;
    //     let ta = this.theta;
    //     while (ta < angle - Math.PI*2) ta += Math.PI*2;
    //     while (ta > angle + Math.PI*2) ta -= Math.PI*2;
    //     let tb;
    //     if (ta < angle) tb = ta + Math.PI*2;
    //     else tb = ta - Math.PI*2;
    //     if (Math.abs(ta - angle) > Math.abs(tb - angle)) ta = tb;
    //     this.applyMoment((angle - ta)*20 - 10*this.omega);
    //     return angle - ta;
    // }
    //
    // intercept(target)
    // {
    //     this.pointAt(target);
    //     this.applyThrust([3*(target[0] - this.pos[0]),
    //                       3*(target[1] - this.pos[1])]);
    // }
    //
    // rendezvous(target)
    // {
    //     this.pointAt(target);
    //     this.applyThrust([3*(target[0] - this.pos[0]) - 6*this.vel[0],
    //                       3*(target[1] - this.pos[1]) - 6*this.vel[1]]);
    // }
    //
    // stop()
    // {
    //     this.applyThrust([-this.vel[0], -this.vel[1]]);
    //     this.applyMoment(-this.omega);
    // }

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
