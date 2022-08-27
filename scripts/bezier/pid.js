
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

Vector2.prototype.dist = function(v)
{
    let dx = v.x - this.x;
    let dy = v.y - this.y;
    return Math.sqrt(dx*dx + dy*dy);
}

Vector2.prototype.render = function(ctx)
{
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
    ctx.fill();
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

function Spline(handles)
{
    this.handles = handles;
}

function lerp(a, b, t)
{
    let ret = new Vector2(0, 0);
    ret.x = a.x + (b.x - a.x) * t;
    ret.y = a.y + (b.y - a.y) * t;
    return ret;
}

function collapse_once(elements, s)
{
    if (elements.length < 2)
    {
        return elements;
    }

    let results = []
    for (let i = 0; i + 1 < elements.length; i++)
    {
        let first = elements[i];
        let second = elements[i+1];
        let middle = lerp(first, second, s);
        results.push(middle)
    }
    return results;
}

Spline.prototype.evaluate = function(s)
{
    let results = collapse_once(this.handles, s);
    while (results.length > 1)
    {
        results = collapse_once(results, s);
    }
    return results[0]
}

Spline.prototype.nearestHandle = function(pos)
{
    let dist = Number.MAX_VALUE;
    let best = -1;
    for (let i = 0; i < this.handles.length; i++)
    {
        let h = this.handles[i];
        let d = h.dist(pos);
        if (d < dist)
        {
            best = i;
            dist = d;
        }
    }
    return [best, dist]
}

Spline.prototype.nearestPoint = function(pos)
{
    let nh = this.nearestHandle(pos);
    let index = nh[0];
    let handle = this.handles[index];
    let n = 500;
    let dist = Number.MAX_VALUE;
    let best = pos;
    let best_t = 0;
    for (let t = 0; t <= n; t++)
    {
        let p = this.evaluate(t/n);
        let d = p.dist(pos);
        if (d < dist)
        {
            dist = d;
            best = p;
            best_t = t/n;
        }
    }
    return [best, best_t];
}

Spline.prototype.render = function(ctx)
{
    ctx.save();
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < this.handles.length; i++)
    {
        let pos = this.handles[i];
        if (i == 0)
        {
            ctx.moveTo(pos.x, pos.y);
        }
        else
        {
            ctx.lineTo(pos.x, pos.y);
        }
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    let n = 500;
    for (let t = 0; t <= n; t++)
    {
        let pos = this.evaluate(t/n);
        if (t == 0)
        {
            ctx.moveTo(pos.x, pos.y);
        }
        else
        {
            ctx.lineTo(pos.x, pos.y);
        }
    }
    ctx.stroke();
    ctx.strokeStyle = "red";
    for (let i = 0; i < this.handles.length; i++)
    {
        let pos = this.handles[i];
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    }
    ctx.restore();
}