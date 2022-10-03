// scirocco.js

const SCIROCCO_LENGTH = 200;
const SCIROCCO_WIDTH = 72;
const SCIROCCO_HEALTH = 5000;
const SCIROCCO_MASS = 200000;
const SCIROCCO_MAX_ACCEL = 12*9.81;
const SCIROCCO_MAX_ALPHA = 3.5;
const SCIROCCO_IZZ = 50000000;
const SCIROCCO_EXPLOSION_RADIUS = 500;
const SCIROCCO_PDC_RANGE = 800;

function Scirocco(pos, theta)
{
    Collidable.call(this, SCIROCCO_LENGTH, SCIROCCO_WIDTH, SCIROCCO_HEALTH);
    this.pos = pos.slice();
    this.theta = theta;
    this.mass = SCIROCCO_MASS;
    this.izz = SCIROCCO_IZZ;
    this.max_acc = SCIROCCO_MAX_ACCEL;
    this.max_alpha = SCIROCCO_MAX_ALPHA;
    this.name = "\"" + NAMES[Math.floor(Math.random()*NAMES.length)] + "\"";
    this.type = "Scirocco Class";
    this.faction = MCRN;
    this.permanent = true;
    this.isShip = true;

    this.gamma = 0;
    this.epsilon = 0;
    this.nu = 0;

    this.box = new Hitbox([[-this.length/2, -this.width*8/18],
                           [-this.length*11/50, -this.width*8/18],
                           [-this.length*11/50, -this.width/2],
                           [this.length*20/50, -this.width/2],
                           [this.length/2, -this.width*1/18],
                           [this.length/2, this.width*1/18],
                           [this.length*20/50, this.width/2],
                           [-this.length*11/50, this.width/2],
                           [-this.length*11/50, this.width*8/18],
                           [-this.length/2, this.width*8/18]
                         ]);
    this.box.object = this;

    this.thrusters = [
        new Thruster([-this.length/2, 0], Math.PI, 0, this.width*4/18),
        new Thruster([-this.length/2, this.width*6/18],
            Math.PI, 0, this.width*4/18),
        new Thruster([-this.length/2, -this.width*6/18],
            Math.PI, 0, this.width*4/18)
    ];

    let range = [-Math.PI/2, Math.PI/2];
    this.pdcs = [
        new PointDefenseCannon([this.length*21/50, -this.width*5/18],
            Math.PI/4, this, range, SCIROCCO_PDC_RANGE),
        new PointDefenseCannon([this.length*21/50, this.width*5/18],
            -Math.PI/4, this, range, SCIROCCO_PDC_RANGE),
        new PointDefenseCannon([this.length*16/50, -this.width*7/18],
            Math.PI/2, this, range, SCIROCCO_PDC_RANGE),
        new PointDefenseCannon([this.length*16/50, this.width*7/18],
            -Math.PI/2, this, range, SCIROCCO_PDC_RANGE),
        new PointDefenseCannon([0, -this.width*2/18],
            Math.PI/2, this, [-2, 2], SCIROCCO_PDC_RANGE),
        new PointDefenseCannon([0, this.width*2/18],
            -Math.PI/2, this, [-2, 2], SCIROCCO_PDC_RANGE),
        new PointDefenseCannon([-this.length*18/50, -this.width*6/18],
            5*Math.PI/6, this, range, SCIROCCO_PDC_RANGE),
        new PointDefenseCannon([-this.length*18/50, this.width*6/18],
            -5*Math.PI/6, this, range, SCIROCCO_PDC_RANGE),
    ];

    this.railguns = [
        new RailgunLauncher([20, 0], 0, this, [-2, 2])
    ];

    this.tubes = [
        new TorpedoTube([this.length/2, -7.5], 0, this),
        new TorpedoTube([this.length/2, -4.5], 0, this),
        new TorpedoTube([this.length/2, -1.5], 0, this),
        new TorpedoTube([this.length/2, 1.5], 0, this),
        new TorpedoTube([this.length/2, 4.5], 0, this),
        new TorpedoTube([this.length/2, 7.5], 0, this),
    ]

    this.gray = "#555555";
    this.orange = "#CC5500";
}

Scirocco.prototype = Object.create(Collidable.prototype);

Scirocco.prototype.firePDC = function(target)
{
    for (let pdc of this.pdcs) pdc.intercept(target);
}

Scirocco.prototype.launchTorpedo = function(target)
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

Scirocco.prototype.skin = function(opacity)
{
    CTX.save();
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
    CTX.rotate(-this.theta);

    let unit = this.length/50*PIXELS;

    CTX.globalAlpha = opacity;
    CTX.strokeStyle = "black";

    // antenna
    CTX.fillStyle = "black";
    CTX.fillRect(20*unit, -6*unit, 6*unit, unit/10);
    CTX.strokeRect(20*unit, -6*unit, 6*unit, unit/10);

    // bow cowling
    CTX.fillStyle = this.faction.c4;
    CTX.beginPath();
    CTX.moveTo(19*unit, -9*unit);
    CTX.lineTo(20*unit, -9*unit);
    CTX.lineTo(23*unit, -4*unit);
    CTX.lineTo(25*unit, -2*unit);
    CTX.lineTo(25*unit, 2*unit);
    CTX.lineTo(23*unit, 4*unit);
    CTX.lineTo(20*unit, 9*unit);
    CTX.lineTo(19*unit, 9*unit);
    CTX.closePath();
    CTX.fill();
    CTX.stroke();

    // engine base
    CTX.fillStyle = this.faction.c4;
    CTX.fillRect(-23*unit, -4*unit, 10*unit, 8*unit);
    CTX.strokeRect(-23*unit, -4*unit, 10*unit, 8*unit);

    // main body midline
    CTX.fillStyle = this.faction.c4;
    CTX.fillRect(-13*unit, -4*unit, 36*unit, 8*unit);
    CTX.fillStyle = this.faction.c1;
    CTX.fillRect(21*unit, -4*unit, unit, 8*unit);
    CTX.strokeRect(-13*unit, -4*unit, 36*unit, 8*unit);

    // port engine
    CTX.fillStyle = this.faction.c4;
    CTX.fillRect(-this.length/2*PIXELS, -8*unit, 11*unit, 4*unit);
    CTX.fillStyle = this.faction.c1;
    CTX.fillRect(-17*unit, -8*unit, unit, 4*unit);
    CTX.strokeRect(-this.length/2*PIXELS, -8*unit, 11*unit, 4*unit);

    // midboard engine
    CTX.fillStyle = this.faction.c4;
    CTX.fillRect(-this.length/2*PIXELS, -2*unit, 11*unit, 4*unit);
    CTX.fillStyle = this.faction.c1;
    CTX.fillRect(-17*unit, -2*unit, unit, 4*unit);
    CTX.strokeRect(-this.length/2*PIXELS, -2*unit, 11*unit, 4*unit);

    // starboard engine
    CTX.fillStyle = this.faction.c4;
    CTX.fillRect(-this.length/2*PIXELS, 4*unit, 11*unit, 4*unit);
    CTX.fillStyle = this.faction.c1;
    CTX.fillRect(-17*unit, 4*unit, unit, 4*unit);
    CTX.strokeRect(-this.length/2*PIXELS, 4*unit, 11*unit, 4*unit);

    // port main body
    CTX.fillStyle = this.faction.c4;
    CTX.fillRect(-3*unit, -9*unit, 23*unit, 5*unit);
    CTX.fillStyle = this.faction.c1;
    CTX.fillRect(-3*unit, -5*unit, 23*unit, unit);
    CTX.strokeRect(-3*unit, -9*unit, 23*unit, 5*unit);

    // starboard main body
    CTX.fillStyle = this.faction.c4;
    CTX.fillRect(-3*unit, 4*unit, 23*unit, 5*unit);
    CTX.fillStyle = this.faction.c1;
    CTX.fillRect(-3*unit, 4*unit, 23*unit, unit);
    CTX.strokeRect(-3*unit, 4*unit, 23*unit, 5*unit);

    // port turret mount
    CTX.beginPath();
    CTX.moveTo(-3*unit, -4*unit);
    CTX.lineTo(-5*unit, -9*unit);
    CTX.lineTo(-11*unit, -9*unit);
    CTX.lineTo(-13*unit, -4*unit);
    CTX.closePath();
    CTX.fillStyle = this.faction.c4;
    CTX.fill();
    CTX.fillStyle = this.faction.c1;
    CTX.fillRect(-11*unit, -8*unit, 6*unit, 2*unit);
    CTX.stroke();
    CTX.strokeRect(-11*unit, -9*unit, 6*unit, 5*unit);

    // port turret mount
    CTX.beginPath();
    CTX.moveTo(-3*unit, 4*unit);
    CTX.lineTo(-5*unit, 9*unit);
    CTX.lineTo(-11*unit, 9*unit);
    CTX.lineTo(-13*unit, 4*unit);
    CTX.closePath();
    CTX.fillStyle = this.faction.c4;
    CTX.fill();
    CTX.fillStyle = this.faction.c1;
    CTX.fillRect(-11*unit, 6*unit, 6*unit, 2*unit);
    CTX.stroke();
    CTX.strokeRect(-11*unit, 4*unit, 6*unit, 5*unit);

    // frills
    CTX.strokeRect(-8*unit, -2*unit, 6*unit, 1*unit);
    CTX.strokeRect(15*unit, -2*unit, 1*unit, 4*unit);
    CTX.strokeRect(18*unit, -2*unit, 1*unit, 4*unit);

    let spacing = 2.5*unit;
    let startx = -1.5*unit;
    for (let i = 0; i < 6; ++i)
    {
        CTX.beginPath();
        CTX.arc(startx + spacing*i, -7.5*unit, unit, 0, Math.PI*2);
        CTX.closePath();
        CTX.stroke();
        CTX.beginPath();
        CTX.arc(startx + spacing*i, 7.5*unit, unit, 0, Math.PI*2);
        CTX.closePath();
        CTX.stroke();
    }

    let firing = norm2d(this.acc) > 0;
    for (let thruster of this.thrusters)
    {
        thruster.firing = firing;
        thruster.draw(CTX);
    }

    CTX.restore();
    for (let pdc of this.pdcs) pdc.draw(opacity);
    for (let railgun of this.railguns) railgun.draw(opacity);
}

Scirocco.prototype.radarIcon = function(opacity)
{
    CTX.save();
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
    CTX.rotate(-this.theta);
    CTX.fillStyle = CTX.strokeStyle = this.faction.radar;
    CTX.globalAlpha = opacity*0.7;
    CTX.lineWidth = 2;
    CTX.globalAlpha = opacity;
    CTX.strokeRect(-9, -5, 18, 10);
    CTX.fillRect(-6, -2, 12, 4);
    CTX.restore();
}

Scirocco.prototype.explode = function()
{
    if (this.remove) return;
    let num_debris = 24 + Math.random()*7;
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
        if (Math.random() < 0.2) deb.color = this.orange;
        WORLD.push(deb);
    }
    this.remove = true;
    WORLD.push(new Explosion(this.pos.slice(), this.vel.slice(),
        SCIROCCO_EXPLOSION_RADIUS));
    throwAlert(this.fullName() + " (" + this.type +
        ") was destroyed.", ALERT_DISPLAY_TIME);
}

Scirocco.prototype.damage = generic_ship_damage;
