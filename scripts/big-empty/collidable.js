// collidable.js

const MAX_LATERAL_ACCEL = 2*9.81;

function Collidable(length, width, max_health)
{
    this.pos = [0, 0];
    this.pos_prev = [];
    this.pos_history = [];
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
    this.behaviors = [];

    this.name = "Todd";
    this.type = "Platonic Solid";
    this.faction = NEUTRAL;
    this.basePoints = 50;

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

Collidable.prototype.physics = function(dt)
{
    this.time += dt;
    this.pos_history.push(this.pos.slice());
    while (this.pos_history.length > 100)
    {
        this.pos_history.shift();
    }
    this.pos_prev = this.pos.slice();

    let bacc = rot2d(div2d(this.forces, this.mass), -this.theta);
    if (bacc[0] > this.max_acc) bacc[0] = this.max_acc;
    else if (bacc[0] < -2*9.81) bacc[0] = -2*9.81;
    if (bacc[1] > 2*9.81) bacc[1] = 2*9.81;
    else if (bacc[1] < -2*9.81) bacc[1] = -2*9.81;
    this.acc = rot2d(bacc, this.theta);

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
    for (let b of this.behaviors) b(this, dt);
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
    if (DRAW_TRACE)
    {
        CTX.globalAlpha = 0.6;
        CTX.strokeStyle = "black";
        CTX.beginPath();
        CTX.moveTo(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
        CTX.lineTo(this.pos_prev[0]*PIXELS, this.pos_prev[1]*PIXELS);
        CTX.stroke();
    }

    if (!DRAW_HITBOX)
    {
        let opacity = radarOpacity(2*VIEW_RADIUS/(this.length + this.width));
        this.skin(1);
        if (opacity > 0) this.radarIcon(opacity);
    }

    if (DRAW_ACCEL)
    {
        CTX.save();
        CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
        CTX.globalAlpha = 0.3;
        CTX.strokeStyle = "blue";
        if (this.max_acc < Infinity)
        {
            CTX.rotate(-this.theta);
            CTX.strokeRect(-MAX_LATERAL_ACCEL*PIXELS,
                -MAX_LATERAL_ACCEL*PIXELS,
                (MAX_LATERAL_ACCEL + this.max_acc)*PIXELS,
                2*MAX_LATERAL_ACCEL*PIXELS);
            CTX.strokeRect(-MAX_LATERAL_ACCEL*PIXELS,
                -MAX_LATERAL_ACCEL*PIXELS,
                2*MAX_LATERAL_ACCEL*PIXELS, 2*MAX_LATERAL_ACCEL*PIXELS);
            CTX.rotate(this.theta);
        }
        CTX.beginPath();
        CTX.moveTo(0, 0);
        CTX.lineTo(this.acc[0]*PIXELS, this.acc[1]*PIXELS);

        CTX.fillStyle = "purple";
        CTX.rotate(-this.theta);
        CTX.fillRect(-MAX_LATERAL_ACCEL*PIXELS,
            -this.alpha*PIXELS*10, MAX_LATERAL_ACCEL*PIXELS*2,
            this.alpha*PIXELS*10);
        CTX.strokeRect(-MAX_LATERAL_ACCEL*PIXELS,
            -this.max_alpha*PIXELS*10, MAX_LATERAL_ACCEL*PIXELS*2,
            this.max_alpha*PIXELS*20);
        CTX.stroke();
        CTX.rotate(this.theta);
        CTX.restore();
    }

    if (DRAW_HITBOX && this.hasOwnProperty("box"))
        this.box.draw(CTX);

    if (DRAW_TORPEDO_TUBES && this.hasOwnProperty("tubes"))
        for (let tube of this.tubes) tube.draw();
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

Collidable.prototype.radarIcon = function(opacity)
{
    // no default radar icon
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

Collidable.prototype.launchTorpedo = function()
{
    throwAlert("Torpedoes not equipped on this vessel.",
        ALERT_DISPLAY_TIME);
}

Collidable.prototype.fireRailgun = function()
{
    throwAlert("Railgun not equipped on this vessel.",
        ALERT_DISPLAY_TIME);
}

Collidable.prototype.align = function(theta, w1, w2)
{
    let error = (theta - this.theta) % (Math.PI*2);
    while (error > Math.PI) error -= Math.PI*2;
    while (error < -Math.PI) error += Math.PI*2;
    this.applyMoment(error*w1 - this.omega*w2);
}

Collidable.prototype.seek = function(pos, weight)
{
    let desired = sub2d(pos, this.pos);
    let steering = sub2d(desired, this.vel);
    this.applyForce(mult2d(steering, weight));
}

Collidable.prototype.separate = function(pos, weight)
{
    let dist = distance(this.pos, pos);
    if (dist == 0) return;
    let desired = mult2d(unit2d(sub2d(this.pos, pos)), 1/dist);
    let steering = sub2d(desired, this.vel);
    this.applyForce(mult2d(steering, weight));
}

Collidable.prototype.seekVelocity = function(desired)
{
    let steering = sub2d(desired, this.vel);
    let angle = angle2d([1, 0], steering);
    if (norm2d(steering) < MAX_LATERAL_ACCEL) angle = this.theta;
    this.align(angle, this.izz*100, this.izz*30);
    this.applyForce(mult2d(steering, this.mass));
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
}

function radarOpacity(x)
{
    let begin = 0, interval = 50;
    return Math.max(0, Math.min(1, (x - begin)/interval));
}
