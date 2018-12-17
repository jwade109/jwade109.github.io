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
    this.length = length;
    this.width = width;
    this.max_health = max_health;
    this.health = max_health;
    this.time = 0;
    this.mass = 1;
    this.izz = 1;

    this.trackable = true;
    this.permanent = false;
    this.is_enemy = false;

    this.name = "Todd";
    this.type = "Platonic Solid";
    this.faction = "Neutral";

    this.box = new Hitbox([[length/2, width/2],
                           [-length/2, width/2],
                           [-length/2, -width/2],
                           [length/2, -width/2]]);
    this.box.object = this;
}

Collidable.prototype.control = function(dt)
{
    // no default control action
}

Collidable.prototype.physics = function(dt)
{
    this.time += dt;
    this.pos_prev = this.pos.slice();
    this.vel[0] += this.acc[0]*dt;
    this.vel[1] += this.acc[1]*dt;
    this.pos[0] += this.vel[0]*dt;
    this.pos[1] += this.vel[1]*dt;
    this.omega += this.alpha*dt;
    this.theta += this.omega*dt;
    this.acc = [0, 0];
    this.alpha = 0;

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
    this.alpha += moment/this.izz;
}

Collidable.prototype.applyForce = function(force)
{
    this.acc = add2d(this.acc, div2d(force, this.mass));
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
