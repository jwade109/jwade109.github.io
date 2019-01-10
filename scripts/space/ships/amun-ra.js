// amun-ra.js

const AMUN_RA_MAX_HEALTH = 700;
const AMUN_RA_MASS = 210000;
const AMUN_RA_IZZ = 3000000;
const AMUN_RA_MOMENT_INERTIA = 700;
const AMUN_RA_EXPLOSION_RADIUS = 240;
const AMUN_RA_LENGTH = 61.5;
const AMUN_RA_WIDTH = 24.2;
const AMUN_RA_PDC_RANGE = 600;
const AMUN_RA_MAX_ACCEL = 16*9.81;
const AMUN_RA_MAX_ALPHA = 8;

function Amun_Ra(pos, theta)
{
    Collidable.call(this, AMUN_RA_LENGTH, AMUN_RA_WIDTH, AMUN_RA_MAX_HEALTH);
    this.pos = pos.slice();
    this.theta = theta;
    this.mass = AMUN_RA_MASS;
    this.izz = AMUN_RA_IZZ;
    this.torpedo_reload = 0;
    this.name = "\"" + NAMES[Math.floor(Math.random()*NAMES.length)] + "\"";
    this.type = "Amun-Ra Class";
    this.faction = MCRN;
    this.max_acc = AMUN_RA_MAX_ACCEL;
    this.max_alpha = AMUN_RA_MAX_ALPHA;
    this.box = new Hitbox([[this.length/2, 0],
                           [-this.length/8, this.width/2],
                           [-this.length/2, 0],
                           [-this.length/4, -this.width/2]]);
    this.box.object = this;

    this.pdcs = [
        new PointDefenseCannon(
            [-this.length*0.45, -0],
            Math.PI, this, [-2, 2], AMUN_RA_PDC_RANGE),
        new PointDefenseCannon(
            [this.length/6, this.width/6],
            -Math.PI/2, this, [-2, 2], AMUN_RA_PDC_RANGE),
        new PointDefenseCannon(
            [-this.length/6, -this.width/3],
            Math.PI/2, this, [-Math.PI/2, Math.PI/2], AMUN_RA_PDC_RANGE)
    ];
    for (let pdc of this.pdcs) pdc.nodraw = true;

    this.tubes = [
        new TorpedoTube([this.length/3, 0], 0, this),
        new TorpedoTube([this.length/4, -this.width/6], 0, this),
        new TorpedoTube([this.length/4, this.width/6], 0, this),
        new TorpedoTube([-this.length/6, -this.width/3], 0, this)
    ];

    this.thrusters = [
        new Thruster([-this.length/3.1, 0], Math.PI, 0, this.width/2)
    ];

    this.railguns = [
        new RailgunLauncher([this.length/2, 0], 0, this, [0, 0])
    ];

    this.permanent = true;
    this.isShip = true;
    this.trackable = true;
}

Amun_Ra.prototype = Object.create(Collidable.prototype);

Amun_Ra.prototype.launchTorpedo = function(target)
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

Amun_Ra.prototype.firePDC = function(target)
{
    for (let pdc of this.pdcs) pdc.intercept(target);
}

Amun_Ra.prototype.fireRailgun = function()
{
    for (let rg of this.railguns) rg.fire();
}

Amun_Ra.prototype.skin = function(opacity)
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

    if (!PLAYER_WEAPON_SELECT && this === PLAYER_SHIP)
    {
        CTX.save();
        CTX.globalAlpha = 0.2;
        CTX.strokeStyle = "red";
        if (!this.railguns[0].canFire())
            CTX.setLineDash([10*PIXELS, 20*PIXELS]);
        CTX.beginPath();
        CTX.moveTo(0, 0);
        CTX.lineTo(1000*PIXELS, 0);
        CTX.stroke();
        CTX.restore();
    }

    CTX.globalAlpha = opacity;
    CTX.fillStyle = this.faction.c4;
    CTX.strokeStyle = "black";
    CTX.beginPath();
    CTX.moveTo(this.length*PIXELS/2, 0);
    CTX.lineTo(-this.length/4*PIXELS, -this.width*PIXELS/2);
    CTX.lineTo(-this.length*PIXELS/2, 0);
    CTX.lineTo(-this.length/8*PIXELS, this.width*PIXELS/2);
    CTX.lineTo(this.length*PIXELS/2, 0);
    CTX.fill();
    CTX.globalAlpha = Math.max(opacity, 0.3);
    CTX.stroke();

    CTX.globalAlpha = opacity;
    CTX.fillStyle = this.faction.c2;
    CTX.fillRect(-this.length/4*PIXELS, -this.width/6*PIXELS,
                 this.length/3*PIXELS, this.width/3*PIXELS);

    CTX.rotate(-Math.PI/2);
    CTX.restore();
    for (let pdc of this.pdcs) pdc.draw(opacity);
    for (let tube of this.tubes) tube.draw();
}

// Amun_Ra.prototype.control = Controller.amunRaEnemy;

Amun_Ra.prototype.explode = function()
{
    if (this.remove) return;
    let num_debris = 15 + Math.random()*7;
    for (let i = 0; i < num_debris; ++i)
    {
        let pos = this.box.getRandom();
        let vel = this.vel.slice();
        vel[0] += Math.random()*200 - 100;
        vel[1] += Math.random()*200 - 100;
        let size = Math.random()*this.width/2;
        let deb = new Debris(pos, vel,
            this.theta, this.omega + Math.random()*5 - 2.5, size);
        deb.name = this.fullName();
        deb.color = this.faction.c4;
        WORLD.push(deb);
    }
    this.remove = true;
    WORLD.push(new Explosion(this.pos.slice(), this.vel.slice(),
        AMUN_RA_EXPLOSION_RADIUS));
    throwAlert(this.name + " (" + this.type +
        ") was destroyed.", ALERT_DISPLAY_TIME);
}

Amun_Ra.prototype.damage = function(d)
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
