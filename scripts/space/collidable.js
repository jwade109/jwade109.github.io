// collidable-base.js

function Collidable(length, width, max_health)
{
    this.pos = [0, 0];
    this.pos_prev = [0, 0];
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

    this.name = "Todd";
    this.type = "Platonic Solid";

    this.box = new Hitbox([[length/2, width/2],
                           [-length/2, width/2],
                           [-length/2, -width/2],
                           [length/2, -width/2]]);
    this.box.object = this;
}

Vessel.prototype.step = function(dt)
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

    this.box.pos = this.pos.slice();
    this.box.theta = this.theta;
}

Vessel.prototype.draw = function()
{
    this.skin();

    if (DRAW_TRACE)
    {
        CTX.globalAlpha = 0.6;
        CTX.strokeStyle = "red";
        CTX.beginPath();
        CTX.moveTo(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
        CTX.lineTo(this.pos_prev[0]*PIXELS, this.pos_prev[1]*PIXELS);
        CTX.stroke();
    }

    if (DRAW_HITBOX) this.box.draw(CTX);
}

Vessel.prototype.skin = function()
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
    CTX.restore();
}

Vessel.prototype.repair = function(health)
{
    this.health += health;
    if (this.health > this.max_health)
        this.health = this.max_health;
}

Vessel.prototype.damage = function(health)
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

Vessel.prototype.decay = function(health)
{
    // no default decay behavior
}

Vessel.prototype.explode = function()
{
    // no default explode behavior
}
