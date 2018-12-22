// morrigan.js

const MORRIGAN_LENGTH = 31;
const MORRIGAN_WIDTH = 9;
const MORRIGAN_MAX_HEALTH = 350;
const MORRIGAN_MASS = 80000;
const MORRIGAN_MAX_ACCEL = 25*9.81;
const MORRIGAN_MAX_ALPHA = 14;
const MORRIGAN_MOMENT_INERTIA = 4000000;
const MORRIGAN_EXPLOSION_RADIUS = 120;
const MORRIGAN_PDC_RANGE = 350;

function Morrigan(pos, theta)
{
    Collidable.call(this, MORRIGAN_LENGTH, MORRIGAN_WIDTH, MORRIGAN_MAX_HEALTH);
    this.pos = pos;
    this.theta = theta;
    this.mass = MORRIGAN_MASS;
    this.izz = MORRIGAN_MOMENT_INERTIA;
    this.max_acc = MORRIGAN_MAX_ACCEL;
    this.max_alpha = MORRIGAN_MAX_ALPHA;
    this.name = "\"" + NAMES[Math.floor(Math.random()*NAMES.length)] + "\"";
    this.type = "Morrigan Class";
    this.faction = MCRN;
    this.permanent = true;
    this.isShip = true;

    this.thrusters = [
        new Thruster([-this.length/2, 0], Math.PI, 0, this.width*7/9)
    ];

    this.pdcs = [
        new PointDefenseCannon(
            [-this.length/62, -this.width*0.4], 0,
            this, [-Math.PI*0.9, Math.PI/6], MORRIGAN_PDC_RANGE),
        new PointDefenseCannon(
            [-this.length/62, this.width*0.4], 0,
            this, [-Math.PI/6, Math.PI*0.9], MORRIGAN_PDC_RANGE)
    ];

    this.tubes = [
        new TorpedoTube([this.length/2, -1.5], 0, this),
        new TorpedoTube([this.length/2, 1.5], 0, this)
    ];
}

Morrigan.prototype = Object.create(Collidable.prototype);

Morrigan.prototype.launchTorpedo = function(target)
{
    let min = Infinity, oldest;
    for (let tube of this.tubes)
    {
        if (tube.lastFired < min)
        {
            oldest = tube;
            min = tube.lastFired;
        }
    }
    oldest.fire(target);
}

Morrigan.prototype.firePDC = function(target)
{
    for (let pdc of this.pdcs) pdc.intercept(target);
}

Morrigan.prototype.skin = function()
{
    CTX.save(); // save global reference frame
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
    CTX.rotate(-this.theta);
    // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE FRAME

    let firing = norm2d(this.acc);
    for (let thruster of this.thrusters)
    {
        thruster.firing = firing;
        thruster.draw(CTX);
    }

    let unit = this.length/31*PIXELS;

    CTX.strokeStyle = "black";
    CTX.globalAlpha = 1;
    CTX.fillStyle = this.faction.c4;
    CTX.fillRect(-this.length/2*PIXELS, -3.5*unit, 2*unit, 7*unit);
    CTX.strokeRect(-this.length/2*PIXELS, -3.5*unit, 2*unit, 7*unit);
    CTX.fillStyle = this.faction.c2;
    CTX.fillRect(-13.5*unit, -4.5*unit, 11*unit, 4.5*unit);
    CTX.strokeRect(-13.5*unit, -4.5*unit, 11*unit, 4.5*unit);
    CTX.fillRect(-13.5*unit, 0, 11*unit, 4.5*unit);
    CTX.strokeRect(-13.5*unit, 0, 11*unit, 4.5*unit);
    CTX.fillStyle = this.faction.c4;
    CTX.fillRect(-2.5*unit, -4.5*unit, 4*unit, 9*unit);
    CTX.strokeRect(-2.5*unit, -4.5*unit, 4*unit, 9*unit);
    CTX.fillStyle = this.faction.c2;
    CTX.fillRect(1.5*unit, -3.5*unit, 14*unit, 7*unit);
    CTX.strokeRect(1.5*unit, -3.5*unit, 14*unit, 7*unit);
    CTX.fillStyle = this.faction.c4;
    CTX.fillRect(-13.5*unit, -1.5*unit, 18*unit, 3*unit);
    CTX.strokeRect(-13.5*unit, -1.5*unit, 18*unit, 3*unit);

    CTX.beginPath();
    CTX.moveTo(this.length/2*PIXELS, unit);
    CTX.lineTo(this.length/2*PIXELS + 3*unit, unit);
    CTX.stroke();
    CTX.beginPath();
    CTX.moveTo(this.length/2*PIXELS, 2*unit);
    CTX.lineTo(this.length/2*PIXELS + 6*unit, 2*unit);
    CTX.stroke();

    CTX.restore();
    for (let pdc of this.pdcs) pdc.draw(CTX);
    for (let tube of this.tubes) tube.draw();
}

Morrigan.prototype.explode = function()
{
    if (this.remove) return;
    let num_debris = 15 + Math.random()*7;
    for (let i = 0; i < num_debris; ++i)
    {
        let pos = this.box.getRandom();
        let vel = this.vel.slice();
        vel[0] += Math.random()*200 - 100;
        vel[1] += Math.random()*200 - 100;
        let size = Math.random()*this.width/2 + this.width/2;
        let deb = new Debris(pos, vel,
            this.theta, this.omega + Math.random()*5 - 2.5, size);
        deb.name = this.fullName();
        deb.color = this.gray;
        if (Math.random() < 0.4) deb.color = this.orange;
        WORLD.push(deb);
    }
    this.remove = true;
    WORLD.push(new Explosion(this.pos.slice(), this.vel.slice(),
        MORRIGAN_EXPLOSION_RADIUS));
    throwAlert(this.fullName() + " (" + this.type +
        ") was destroyed.", ALERT_DISPLAY_TIME);
}

Morrigan.prototype.damage = function(d)
{
    this.health -= d;
    if (this.health < 1) this.explode();
    else if (Math.random() < 0.05*d)
    {
        let num_debris = 3 + Math.random()*3;
        let pos = this.box.getRandom();
        for (let i = 0; i < num_debris; ++i)
        {
            let vel = this.vel.slice();
            vel[0] += Math.random()*200 - 100;
            vel[1] += Math.random()*200 - 100;
            let size = Math.random()*4;
            let deb = new Debris(pos.slice(), vel,
                this.theta,
                this.omega + Math.random()*5 - 2.5, size);
            deb.name = this.fullName();
            deb.color = this.gray;
            if (Math.random() < 0.4)
                deb.color = this.orange;
            WORLD.push(deb);
        }
    }
}
