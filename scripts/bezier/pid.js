
function PID(kp, ki, kd)
{
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;

    this.error = 0;
    this.error_rate = 0;
    this.integrator = 0;
}

PID.prototype.evaluate = function()
{
    return this.kp * this.error +
           this.ki * this.integrator +
           this.kd * this.error_rate;
}

PID.prototype.update = function(error, error_rate, dt)
{
    this.error = error;
    this.error_rate = error_rate;
    this.integrator += error * dt;
    return this.evaluate()
}

function Particle(pos, vel)
{
    this.pos = pos;
    this.vel = vel;
}

Particle.prototype.step = function(dt, acc)
{
    this.pos[0] += this.vel[0] * dt;
    this.pos[1] += this.vel[1] * dt;
    this.vel[0] += acc[0] * dt;
    this.vel[1] += acc[1] * dt;
}

Particle.prototype.copy = function()
{
    return new Particle(this.pos, this.vel);
}

Particle.prototype.render = function(ctx)
{
    ctx.beginPath();
    ctx.arc(this.pos[0], this.pos[1], 10, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.pos[0], this.pos[1]);
    ctx.lineTo(this.pos[0] + this.vel[0] / 4,
               this.pos[1] + this.vel[1] / 4);
    ctx.stroke();
}

function Tracker(pos, kp, ki, kd)
{
    this.pid = [0, 0];
    this.pid[0] = new PID(kp, ki, kd);
    this.pid[1] = new PID(kp, ki, kd);
    this.physics = new Particle(pos, [0, 0])
}

Tracker.prototype.update = function(physics, dt)
{
    let error = [0, 0];
    let error_rate = [0, 0];
    error[0] = physics.pos[0] - this.physics.pos[0];
    error[1] = physics.pos[1] - this.physics.pos[1];
    error_rate[0] = physics.vel[0] - this.physics.vel[0];
    error_rate[1] = physics.vel[1] - this.physics.vel[1];

    let acc = [0, 0];
    acc[0] = this.pid[0].update(error[0], error_rate[0], dt);
    acc[1] = this.pid[1].update(error[1], error_rate[1], dt);
    this.physics.step(dt, acc)
}

Tracker.prototype.render = function(ctx)
{
    ctx.beginPath();
    ctx.arc(this.physics.pos[0], this.physics.pos[1], 10, 0, 2 * Math.PI);
    ctx.stroke();
}
