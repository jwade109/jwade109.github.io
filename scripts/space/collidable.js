// collidable.js

function Collidable(length, width, max_health)
{
    this.pos = [0, 0];
    this.pos_prev = [];
    this.vel = [0, 0];
    this.acc = [0, 0];
    this.theta = 0;
    this.omega = 0;
    this.alpha = 0;

    this.forces = [0, 0];
    this.moments = 0;
    this.max_acc = Infinity;
    this.max_alpha = Infinity;

    this.length = length;
    this.width = width;
    this.max_health = max_health;
    this.health = max_health;
    this.time = 0;
    this.mass = 1;
    this.izz = 1;

    this.trackable = true;
    this.permanent = false;
    this.isShip = false;

    this.name = "Todd";
    this.type = "Platonic Solid";
    this.faction = NEUTRAL;

    this.box = new Hitbox([[length/2, width/2],
                           [-length/2, width/2],
                           [-length/2, -width/2],
                           [length/2, -width/2]]);
    this.box.object = this;
}

Collidable.prototype.fullName = function()
{
    if (this.faction.name == "Neutral" ||
        this.faction.name == "") return this.name;
    return this.faction.name + " " + this.name;
}

Collidable.prototype.control = function(dt)
{
    // no default control action
}

Collidable.prototype.physics = function(dt)
{
    this.time += dt;
    this.pos_prev = this.pos.slice();

    this.acc = div2d(this.forces, this.mass);
    if (norm2d(this.acc) > this.max_acc)
        this.acc = mult2d(unit2d(this.acc), this.max_acc);

    this.alpha = this.moments/this.izz;
    this.alpha = Math.max(-this.max_alpha,
        Math.min(this.alpha, this.max_alpha));

    this.vel[0] += this.acc[0]*dt;
    this.vel[1] += this.acc[1]*dt;
    this.pos[0] += this.vel[0]*dt;
    this.pos[1] += this.vel[1]*dt;
    this.omega += this.alpha*dt;
    this.theta += this.omega*dt;
    this.forces = [0, 0];
    this.moments = 0;

    if (this.hasOwnProperty("box"))
    {
        this.box.pos = this.pos.slice();
        this.box.theta = this.theta;
    }
}

Collidable.prototype.step = function(dt)
{
    this.control(dt);
    this.physics(dt);
}

Collidable.prototype.applyMoment = function(moment)
{
    this.moments += moment;
}

Collidable.prototype.applyForce = function(force)
{
    this.forces = add2d(this.forces, force);
}

Collidable.prototype.draw = function()
{
    if (!DRAW_HITBOX) this.skin();

    if (DRAW_TRACE)
    {
        CTX.globalAlpha = 0.6;
        CTX.strokeStyle = "red";
        CTX.beginPath();
        CTX.moveTo(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
        CTX.lineTo(this.pos_prev[0]*PIXELS, this.pos_prev[1]*PIXELS);
        CTX.stroke();
    }

    if (DRAW_ACCEL)
    {
        CTX.save();
        CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
        CTX.globalAlpha = 0.3;
        CTX.strokeStyle = "blue";
        CTX.beginPath();
        CTX.arc(0, 0, 10*9.81*PIXELS, 0, Math.PI*2);
        CTX.moveTo(0, 0);
        CTX.lineTo(this.acc[0]*PIXELS, this.acc[1]*PIXELS);
        CTX.stroke();
        CTX.restore();
    }

    if (DRAW_HITBOX && this.hasOwnProperty("box"))
        this.box.draw(CTX);
}

Collidable.prototype.skin = function()
{
    CTX.save();
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
    CTX.rotate(-this.theta);
    CTX.fillStyle = "black";
    CTX.strokeStyle = "black";
    CTX.beginPath();
    CTX.arc(0, 0, 3*PIXELS, 0, Math.PI*2);
    CTX.globalAlpha = 0.3;
    CTX.fill();
    CTX.globalAlpha = 1;
    CTX.stroke();
    CTX.beginPath();
    CTX.moveTo(0, 0);
    CTX.lineTo(3*PIXELS, 0);
    CTX.stroke();
    CTX.strokeRect(-this.length/2*PIXELS, -this.width/2*PIXELS,
        this.length*PIXELS, this.width*PIXELS);
    CTX.restore();
}

Collidable.prototype.repair = function(health)
{
    this.health += health;
    if (this.health > this.max_health)
        this.health = this.max_health;
}

Collidable.prototype.damage = function(health)
{
    this.health -= health;
    this.decay(health);
    if (this.health <= 0)
    {
        this.explode();
        this.remove = true;
        return;
    }
}

Collidable.prototype.handleCollision = function(other)
{
    // no default collision behavior
}

Collidable.prototype.decay = function(health)
{
    // no default decay behavior
}

Collidable.prototype.explode = function()
{
    // no default explode behavior
}

Collidable.prototype.align = function(theta, w1, w2)
{
    let error = (theta - this.theta) % (Math.PI*2);
    if (error > Math.PI) error -= Math.PI*2;
    this.applyMoment(error*w1 - this.omega*w2);
}

Collidable.prototype.seek = function(pos, weight)
{
    let desired = sub2d(pos, this.pos);
    let steering = sub2d(desired, this.vel);
    this.applyForce(mult2d(steering, weight));
}

Collidable.prototype.separate = function(pos, radius, weight)
{
    let dist = distance(this.pos, pos);
    if (dist > radius) return;
    let desired = mult2d(sub2d(this.pos, pos), radius - dist);
    let steering = sub2d(desired, this.vel);
    this.applyForce(mult2d(steering, weight));
}

Collidable.prototype.brachArrive = function(pos, radius)
{
    let w1 = 100, w2 = 70;
    let dist = distance(this.pos, pos);
    if (dist < radius)
    {
        this.seek(pos, this.mass);
        this.align(angle2d([1,0], this.acc), this.izz*w1, this.izz*w2);
        return;
    }

    let midtime = 0;
    let a = this.max_acc;
    let b = midtime*this.max_acc;
    let c = -dist;

    let t0 = (-b + Math.sqrt(b*b - 4*a*c))/(2*a);
    let vmax = this.max_acc*t0;
    let goodvel = dot2d(this.vel, unit2d(sub2d(pos, this.pos)));

    let angle = angle2d([1, 0], sub2d(pos, this.pos));
    if (goodvel < vmax)
    {
        this.align(angle, this.izz*w1, this.izz*w2);
        if (Math.abs(this.omega) < 0.05)
        {
            this.applyForce(rot2d([this.max_acc*this.mass, 0], this.theta));
        }
    }
    else
    {
        this.align(angle + Math.PI, this.izz*w1, this.izz*w2);
        if (Math.abs(this.omega) < 0.05)
        {
            this.applyForce(rot2d([this.max_acc*this.mass, 0], this.theta));
        }
    }
}

function conserveMomentum(obj1, obj2)
{
    if (obj1.mass >= obj2.mass)
    {
        obj2.vel = obj1.vel.slice();
        return;
    }
    if (obj2.mass >= obj1.mass)
    {
        obj1.vel = obj2.vel.slice();
        return;
    }
    // let momentum = add2d(mult2d(obj1.vel, obj1.mass),
    //     mult2d(obj2.vel, obj2.mass));
    // let vel = div2d(momentum, obj1.mass + obj2.mass);
    // obj1.vel = vel;
    // obj2.vel = vel;
}
