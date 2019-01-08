// corvette.js

const PLAYER_INVINCIBLE = false;
const CORVETTE_MAX_HEALTH = 600;
const INFINITE_FUEL = true;
const INFINITE_AMMO = false;

const CORVETTE_MOMENT_INERTIA = 5000000;
const CORVETTE_EXPLOSION_RADIUS = 180;
const CORVETTE_LENGTH = 42;
const CORVETTE_WIDTH = 11;
const CORVETTE_MASS = 120000;
const CORVETTE_MAX_ACCEL = 20*9.81;
const CORVETTE_MAX_ALPHA = 12;
const CORVETTE_RCS_THRUST = 9.81*CORVETTE_MASS;
const CORVETTE_PDC_RANGE = 500;

function Corvette(pos, theta)
{
    Collidable.call(this, CORVETTE_LENGTH, CORVETTE_WIDTH, CORVETTE_MAX_HEALTH);
    this.pos = pos.slice();
    this.theta = theta;
    this.mass = CORVETTE_MASS;
    this.izz = CORVETTE_MOMENT_INERTIA;
    this.max_acc = CORVETTE_MAX_ACCEL;
    this.max_alpha = CORVETTE_MAX_ALPHA;
    this.name = "\"" + NAMES[Math.floor(Math.random()*NAMES.length)] + "\"";
    this.type = "Corvette Class";
    this.faction = MCRN;
    this.permanent = true;
    this.isShip = true;
    this.basePoints = 100;

    this.box = new Hitbox([[this.length/2, this.width/3],
                           [-this.length/2, this.width/2],
                           [-this.length/2, -this.width/2],
                           [this.length/2, -this.width/3]]);
    this.box.object = this;

    this.thrusters = [
        new Thruster([-this.length/2, 0], Math.PI, 0, this.width*0.7)
    ];

    this.pdcs =
        [new PointDefenseCannon(
            [this.length/4, this.width*0.36], -Math.PI/2.4, this,
            [-Math.PI/2.2, Math.PI/2.2], CORVETTE_PDC_RANGE),
         new PointDefenseCannon(
            [this.length/4, -this.width*0.36], Math.PI/2.4, this,
            [-Math.PI/2.2, Math.PI/2.2], CORVETTE_PDC_RANGE),
         new PointDefenseCannon(
            [-this.length/6, -this.width*0.44], Math.PI/2, this,
            [-Math.PI/2.2, Math.PI/1.8], CORVETTE_PDC_RANGE),
         new PointDefenseCannon(
            [-this.length/6, this.width*0.44], -Math.PI/2, this,
            [-Math.PI/1.8, Math.PI/2.2], CORVETTE_PDC_RANGE)];

    this.tubes = [
        new TorpedoTube([this.length/2, 3], 0, this),
        new TorpedoTube([this.length/2, 0], 0, this),
        new TorpedoTube([this.length/2, -3], 0, this)
    ];
}

Corvette.prototype = Object.create(Collidable.prototype);

Corvette.prototype.launchTorpedo = function(target)
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

Corvette.prototype.firePDC = function(target)
{
    for (let pdc of this.pdcs) pdc.intercept(target);
}

// Corvette.prototype.control = Controller.player;

Corvette.prototype.skin = function(opacity)
{
    CTX.save(); // save global reference frame
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);

    CTX.rotate(-this.theta)
    // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE FRAME

    let firing = norm2d(this.acc) > MAX_LATERAL_ACCEL;
    for (let thruster of this.thrusters)
    {
        thruster.firing = firing;
        thruster.draw(CTX);
    }

    CTX.save();

    let off = this.width/2;
    CTX.strokeStyle = "black";
    CTX.fillStyle = this.faction.c4;

    CTX.globalAlpha = 1;
    CTX.beginPath();

    let y0 =  0.50*this.width*PIXELS;
    let y1 =  0.44*this.width*PIXELS;
    let y2 =  0.36*this.width*PIXELS;
    let y3 =  0.20*this.width*PIXELS;

    let x0 = -0.50*this.length*PIXELS;
    let x1 = -0.40*this.length*PIXELS;
    let x2 = -0.25*this.length*PIXELS;
    let x3 = -0.07*this.length*PIXELS;
    let x4 =  0.00;
    let x5 =  0.20*this.length*PIXELS;
    let x6 =  0.30*this.length*PIXELS;
    let x7 =  0.50*this.length*PIXELS;

    CTX.moveTo(x0, y2);
    CTX.lineTo(x1, y3);
    CTX.lineTo(x1, y0);
    CTX.lineTo(x2, y0);
    CTX.lineTo(x2, y1);
    CTX.lineTo(x3, y1);
    CTX.lineTo(x3, y2);
    CTX.lineTo(x4, y0);
    CTX.lineTo(x5, y0);
    CTX.lineTo(x5, y2);
    CTX.lineTo(x6, y2);
    CTX.lineTo(x7, y3);
    CTX.lineTo(x7, -y3);
    CTX.lineTo(x6, -y2);
    CTX.lineTo(x5, -y2);
    CTX.lineTo(x5, -y0);
    CTX.lineTo(x4, -y0);
    CTX.lineTo(x3, -y2);
    CTX.lineTo(x3, -y1);
    CTX.lineTo(x2, -y1);
    CTX.lineTo(x2, -y0);
    CTX.lineTo(x1, -y0);
    CTX.lineTo(x1, -y3);
    CTX.lineTo(x0, -y2);
    CTX.lineTo(x0, y2);

    CTX.moveTo(x1, y3);
    CTX.lineTo(x1, -y3);
    CTX.moveTo(x2, y3);
    CTX.lineTo(x2, -y3);
    CTX.moveTo(x3, y3);
    CTX.lineTo(x3, -y3);
    CTX.moveTo(x5, y3);
    CTX.lineTo(x5, -y3);

    CTX.moveTo(x7, y3);
    CTX.lineTo(x7 + this.width*0.3*PIXELS, y3);
    CTX.moveTo(x7, -y3);
    CTX.lineTo(x7 + this.width*0.4*PIXELS, -y3);
    CTX.moveTo(x7, -y3 + this.width*0.1*PIXELS);
    CTX.lineTo(x7 + this.width*0.2*PIXELS, -y3 + this.width*0.1*PIXELS);

    CTX.fill();
    // CTX.fillStyle = this.faction.c1;
    // CTX.fillRect(-this.length*0.4*PIXELS, -this.width*0.15*PIXELS,
    //               this.length*0.9*PIXELS, this.width*0.3*PIXELS);
    CTX.fillStyle = this.faction.c2;
    CTX.fillRect(-this.length*0.4*PIXELS, -this.width*0.1*PIXELS,
                  this.length*0.9*PIXELS, this.width*0.2*PIXELS);
    CTX.stroke();

    CTX.restore();
    CTX.restore();

    for (let pdc of this.pdcs) pdc.draw(opacity);
}

Corvette.prototype.radarIcon = function(opacity)
{
    CTX.save();
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
    CTX.fillStyle = CTX.strokeStyle = this.faction.radar;
    CTX.globalAlpha = opacity*0.7;
    CTX.lineWidth = 2;
    for (let i = 0; i < 4; ++i)
    {
        CTX.beginPath();
        CTX.arc(0, 0, 7, -Math.PI/5, Math.PI/5);
        CTX.stroke();
        CTX.rotate(Math.PI/2);
    }
    CTX.beginPath();
    CTX.arc(0, 0, 3, 0, Math.PI*2);
    CTX.fill();
    CTX.restore();
}

Corvette.prototype.explode = function()
{
    let num_debris = 15 + Math.random()*7;
    for (let i = 0; i < num_debris; ++i)
    {
        let pos = this.box.getRandom();
        let vel = this.vel.slice();
        vel[0] += Math.random()*200 - 100;
        vel[1] += Math.random()*200 - 100;
        let size = Math.random()*this.width/2 + this.width/2;
        let deb = new Debris(pos, vel,
            this.theta,
            this.omega + Math.random()*5 - 2.5, size);
        deb.name = this.fullName();
        deb.color = this.faction.c4;
        if (Math.random() < 0.2)
            deb.color = this.faction.c1
        WORLD.push(deb);
    }
    WORLD.push(new Explosion(this.pos.slice(), this.vel.slice(),
        CORVETTE_EXPLOSION_RADIUS));
    throwAlert(this.fullName() + " (" + this.type +
        ") was destroyed.", ALERT_DISPLAY_TIME);
    this.remove = true;
}
