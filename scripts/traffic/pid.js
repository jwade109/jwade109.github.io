
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

function Vector2(x, y)
{
    this.x = x;
    this.y = y;
}

Vector2.prototype.copy = function()
{
    return new Vector2(this.x, this.y)
}

function Particle(pos, vel)
{
    this.pos = pos;
    this.vel = vel;
}

Particle.prototype.step = function(dt, acc)
{
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.vel.x += acc.x * dt;
    this.vel.y += acc.y * dt;
}

Particle.prototype.copy = function()
{
    return new Particle(this.pos, this.vel);
}

Particle.prototype.render = function(ctx)
{
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 10, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y);
    ctx.lineTo(this.pos.x + this.vel.x / 4,
               this.pos.y + this.vel.y / 4);
    ctx.stroke();
}

function Tracker(pos, kp, ki, kd)
{
    this.pid = new Vector2(0, 0);
    this.pid.x = new PID(kp, ki, kd);
    this.pid.y = new PID(kp, ki, kd);
    this.physics = new Particle(pos, new Vector2(0, 0))
}

Tracker.prototype.update = function(physics, dt)
{
    let error = new Vector2(0, 0);
    let error_rate = new Vector2(0, 0);
    error.x = physics.pos.x - this.physics.pos.x;
    error.y = physics.pos.y - this.physics.pos.y;
    error_rate.x = physics.vel.x - this.physics.vel.x;
    error_rate.y = physics.vel.y - this.physics.vel.y;

    let acc = new Vector2(0, 0);
    acc.x = this.pid.x.update(error.x, error_rate.x, dt);
    acc.y = this.pid.y.update(error.y, error_rate.y, dt);
    this.physics.step(dt, acc)
}

Tracker.prototype.render = function(ctx)
{
    ctx.beginPath();
    ctx.arc(this.physics.pos.x, this.physics.pos.y, 10, 0, 2 * Math.PI);
    ctx.stroke();
}