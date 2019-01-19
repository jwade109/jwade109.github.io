// donnager.js

const DONNAGER_LENGTH = 475;
const DONNAGER_WIDTH = 150;
const DONNAGER_MAX_HEALTH = 10000;
const DONNAGER_EXPLOSION_RADIUS = 600;
const DONNAGER_MASS = 1500000;
const DONNAGER_IZZ = 90000000;
const DONNAGER_PDC_RANGE = 1500;
const DONNAGER_MAX_ACCEL = 8*9.81;
const DONNAGER_MAX_ALPHA = 0.5;

function Donnager(pos, theta)
{
    Collidable.call(this, DONNAGER_LENGTH, DONNAGER_WIDTH, DONNAGER_MAX_HEALTH);
    this.pos = pos.slice();
    this.theta = theta;
    this.mass = DONNAGER_MASS;
    this.izz = DONNAGER_IZZ;
    this.max_acc = DONNAGER_MAX_ACCEL;
    this.max_alpha = DONNAGER_MAX_ALPHA;
    this.name = "\"" + NAMES[Math.floor(Math.random()*NAMES.length)] + "\"";
    this.type = "Donnager Class";
    this.faction = MCRN;
    this.trackable = true;
    this.permanent = true;
    this.isShip = true;

    this.box = new Hitbox([[this.length/2, this.width*4/24],
                           [this.length*22/76, this.width*4/24],
                           [this.length*20/76, this.width*7/24],
                           [this.length*10/76, this.width*7/24],
                           [this.length*8/76, this.width*4/24],
                           [this.length*2/76, this.width*4/24],
                           [-this.length*17/76, this.width*7/24],
                           [-this.length*17/76, this.width*10/24],
                           [-this.length*26/76, this.width*10/24],
                           [-this.length*26/76, this.width*12/24],
                           [-this.length*36/76, this.width*12/24],
                           [-this.length*36/76, this.width*10/24],
                           [-this.length*37/76, this.width*10/24],
                           [-this.length*37/76, this.width*9/24],
                           [-this.length*38/76, this.width*9/24],
                           [-this.length*38/76, this.width*4/24],
                           [-this.length*34/76, this.width*4/24],
                           [-this.length*34/76, -this.width*4/24],
                           [-this.length*38/76, -this.width*4/24],
                           [-this.length*38/76, -this.width*9/24],
                           [-this.length*37/76, -this.width*9/24],
                           [-this.length*37/76, -this.width*10/24],
                           [-this.length*36/76, -this.width*10/24],
                           [-this.length*36/76, -this.width*12/24],
                           [-this.length*26/76, -this.width*12/24],
                           [-this.length*26/76, -this.width*10/24],
                           [-this.length*17/76, -this.width*10/24],
                           [-this.length*17/76, -this.width*7/24],
                           [this.length*2/76, -this.width*4/24],
                           [this.length*8/76, -this.width*4/24],
                           [this.length*10/76, -this.width*7/24],
                           [this.length*20/76, -this.width*7/24],
                           [this.length*22/76, -this.width*4/24],
                           [this.length/2, -this.width*4/24]]);
    this.box.object = this;

    this.thrusters = [
        new Thruster([-this.length/2, this.width*6.5/24],
            Math.PI, 0, this.width*5/24),
        new Thruster([-this.length/2, -this.width*6.5/24],
            Math.PI, 0, this.width*5/24)
    ];

    let range = [-Math.PI/3, Math.PI/3];
    this.pdcs = [
        new PointDefenseCannon([this.length*37/76, -this.width*3/24],
            Math.PI/4, this, range, DONNAGER_PDC_RANGE),
        new PointDefenseCannon([this.length*37/76, this.width*3/24],
            -Math.PI/4, this, range, DONNAGER_PDC_RANGE),
        new PointDefenseCannon([this.length*30/76, -this.width*3/24],
            Math.PI/2, this, range, DONNAGER_PDC_RANGE),
        new PointDefenseCannon([this.length*30/76, this.width*3/24],
            -Math.PI/2, this, range, DONNAGER_PDC_RANGE),
        new PointDefenseCannon([this.length*20/76, -this.width*6/24],
            Math.PI/2, this, range, DONNAGER_PDC_RANGE),
        new PointDefenseCannon([this.length*20/76, this.width*6/24],
            -Math.PI/2, this, range, DONNAGER_PDC_RANGE),
        new PointDefenseCannon([this.length*10/76, -this.width*6/24],
            Math.PI/2, this, range, DONNAGER_PDC_RANGE),
        new PointDefenseCannon([this.length*10/76, this.width*6/24],
            -Math.PI/2, this, range, DONNAGER_PDC_RANGE),
        new PointDefenseCannon([0, -this.width*3/24],
            Math.PI/2, this, range, DONNAGER_PDC_RANGE),
        new PointDefenseCannon([0, this.width*3/24],
            -Math.PI/2, this, range, DONNAGER_PDC_RANGE),
    ];

    this.railguns = [
        new RailgunLauncher([15*this.length/76, -5*this.width/24],
            Math.PI/2, this, [-Math.PI/1.5, Math.PI/1.5]),
        new RailgunLauncher([15*this.length/76, 5*this.width/24],
            -Math.PI/2, this, [-Math.PI/1.5, Math.PI/1.5]),
    ];

    this.tubes = [
        new TorpedoTube([this.length/2, -16.5], 0, this),
        new TorpedoTube([this.length/2, -13.5], 0, this),
        new TorpedoTube([this.length/2, -10.5], 0, this),
        new TorpedoTube([this.length/2, -7.5], 0, this),
        new TorpedoTube([this.length/2, -4.5], 0, this),
        new TorpedoTube([this.length/2, -1.5], 0, this),
        new TorpedoTube([this.length/2, 1.5], 0, this),
        new TorpedoTube([this.length/2, 4.5], 0, this),
        new TorpedoTube([this.length/2, 7.5], 0, this),
        new TorpedoTube([this.length/2, 10.5], 0, this),
        new TorpedoTube([this.length/2, 13.5], 0, this),
        new TorpedoTube([this.length/2, 16.5], 0, this),
    ];
}

Donnager.prototype = Object.create(Collidable.prototype);

Donnager.prototype.firePDC = function(target)
{
    for (let pdc of this.pdcs) pdc.intercept(target);
}

Donnager.prototype.launchTorpedo = function(target)
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

Donnager.prototype.fireRailgun = function()
{
    if (this === PLAYER_SHIP)
    {
        let mouseAngle = angle2d([1, 0],
            sub2d([MOUSEX, MOUSEY], this.pos));
        let min = Infinity, best = null;
        for (let gun of this.railguns)
        {
            let gunAngle = this.theta + gun.theta + gun.gamma;
            let error = gunAngle - mouseAngle;
            while (error > Math.PI) error -= Math.PI*2;
            while (error < -Math.PI) error += Math.PI*2;
            if (Math.abs(error) < min && gun.canFire())
            {
                min = Math.abs(error);
                best = gun;
            }
        }
        if (best != null) best.fire();
    }
    else for (let gun of this.railguns) gun.fire();
}

Donnager.prototype.skin = function(opacity)
{
    CTX.save();
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
    CTX.rotate(-this.theta);

    let firing = norm2d(this.acc) > 0;
    for (let thruster of this.thrusters)
    {
        thruster.firing = firing;
        thruster.draw(CTX);
    }

    let unit = this.length/76*PIXELS; // 6.25 meters

    CTX.globalAlpha = 1;
    CTX.strokeStyle = "black";

    // main body
    CTX.fillStyle = this.faction.c4;
    CTX.fillRect(-this.length/2*PIXELS + 4*unit, -4*unit, 72*unit, 8*unit);
    CTX.fillStyle = this.faction.c2;
    CTX.fillRect(2*unit, -4*unit, 18*unit, 1*unit);
    CTX.fillRect(2*unit, 3*unit, 18*unit, 1*unit);
    CTX.fillRect(29*unit, -4*unit, 2*unit, 8*unit);
    CTX.strokeRect(-this.length/2*PIXELS + 4*unit, -4*unit, 72*unit, 8*unit);

    // port winglet
    CTX.fillStyle = this.faction.c4;
    CTX.beginPath();
    CTX.moveTo(8*unit, -4*unit);
    CTX.lineTo(10*unit, -7*unit);
    CTX.lineTo(20*unit, -7*unit);
    CTX.lineTo(22*unit, -4*unit);
    CTX.closePath();
    CTX.fill();
    CTX.fillStyle = this.faction.c2;
    CTX.fillRect(10*unit, -7*unit, 10*unit, unit);
    CTX.stroke();

    // starboard winglet
    CTX.fillStyle = this.faction.c4;
    CTX.beginPath();
    CTX.moveTo(8*unit, 4*unit);
    CTX.lineTo(10*unit, 7*unit);
    CTX.lineTo(20*unit, 7*unit);
    CTX.lineTo(22*unit, 4*unit);
    CTX.closePath();
    CTX.fill();
    CTX.fillStyle = this.faction.c2;
    CTX.fillRect(10*unit, 6*unit, 10*unit, unit);
    CTX.stroke();

    // box accents
    CTX.fillStyle = this.faction.c2;
    CTX.fillRect(-12*unit, -2*unit, 12*unit, 4*unit);
    CTX.fillStyle = this.faction.c4;
    CTX.fillRect(-11*unit, -unit, 10*unit, 2*unit);
    CTX.fillStyle = this.faction.c2;
    CTX.fillRect(-26*unit, -3*unit, 10*unit, 2*unit);
    CTX.fillRect(-26*unit, 1*unit, 10*unit, 2*unit);
    CTX.fillRect(-33*unit, -3*unit, 6*unit, 2*unit);
    CTX.fillRect(-33*unit, 1*unit, 6*unit, 2*unit);

    // port triangle
    CTX.beginPath();
    CTX.moveTo(2*unit, -4*unit);
    CTX.lineTo(-17*unit, -4*unit);
    CTX.lineTo(-17*unit, -7*unit);
    CTX.closePath();
    CTX.fillStyle = this.faction.c3;
    CTX.fill();
    CTX.stroke();

    // starboard triangle
    CTX.beginPath();
    CTX.moveTo(2*unit, 4*unit);
    CTX.lineTo(-17*unit, 4*unit);
    CTX.lineTo(-17*unit, 7*unit);
    CTX.closePath();
    CTX.fillStyle = this.faction.c3;
    CTX.fill();
    CTX.stroke();

    // port engine
    CTX.fillStyle = this.faction.c4;
    CTX.fillRect(-37*unit, -7*unit, 20*unit, 3*unit);
    CTX.fillStyle = this.faction.c2;
    CTX.fillRect(-37*unit, -10*unit, 20*unit, 2*unit);
    CTX.fillStyle = this.faction.c3;
    CTX.fillRect(-37*unit, -8*unit, 20*unit, unit);
    CTX.fillStyle = this.faction.c4;
    CTX.fillRect(-36*unit, -12*unit, 10*unit, 2*unit);
    CTX.strokeRect(-36*unit, -12*unit, 10*unit, 2*unit);
    CTX.strokeRect(-37*unit, -10*unit, 20*unit, 6*unit);
    CTX.fillRect(-38*unit, -9*unit, unit, 5*unit);
    CTX.strokeRect(-38*unit, -9*unit, unit, 5*unit);

    // starboard engine cowling
    CTX.fillStyle = this.faction.c4;
    CTX.fillRect(-37*unit, 4*unit, 20*unit, 3*unit);
    CTX.fillStyle = this.faction.c2;
    CTX.fillRect(-37*unit, 8*unit, 20*unit, 2*unit);
    CTX.fillStyle = this.faction.c3;
    CTX.fillRect(-37*unit, 7*unit, 20*unit, unit);
    CTX.fillStyle = this.faction.c4;
    CTX.fillRect(-36*unit, 10*unit, 10*unit, 2*unit);
    CTX.strokeRect(-36*unit, 10*unit, 10*unit, 2*unit);
    CTX.strokeRect(-37*unit, 4*unit, 20*unit, 6*unit);
    CTX.fillRect(-38*unit, 4*unit, unit, 5*unit);
    CTX.strokeRect(-38*unit, 4*unit, unit, 5*unit);

    CTX.restore();
    for (let pdc of this.pdcs) pdc.draw(opacity);
    for (let railgun of this.railguns) railgun.draw(opacity);
    for (let tube of this.tubes) tube.draw();
}

Donnager.prototype.radarIcon = function(opacity)
{
    CTX.save();
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
    CTX.rotate(-this.theta);
    CTX.fillStyle = CTX.strokeStyle = this.faction.radar;
    CTX.globalAlpha = opacity*0.7;
    CTX.lineWidth = 2;
    CTX.globalAlpha = opacity;
    CTX.beginPath();
    CTX.moveTo(15, -2);
    CTX.lineTo(15, 2);
    CTX.lineTo(-15, 7);
    CTX.lineTo(-15, -7);
    CTX.closePath();
    CTX.stroke();
    CTX.beginPath();
    CTX.moveTo(12, 0);
    CTX.lineTo(12, 0);
    CTX.lineTo(-12, 4);
    CTX.lineTo(-12, -4);
    CTX.closePath();
    CTX.fill();
    CTX.restore();
}

Donnager.prototype.explode = function()
{
    let num_debris = 25 + Math.random()*9;
    for (let i = 0; i < num_debris; ++i)
    {
        let pos = this.pos.slice();
        let roff = [this.length*Math.random() - this.length/2,
                    this.width*Math.random() - this.width/2];
        roff = rot2d(roff, this.theta);
        pos[0] += roff[0];
        pos[1] += roff[1];
        let vel = this.vel.slice();
        vel[0] += Math.random()*200 - 100;
        vel[1] += Math.random()*200 - 100;
        let size = Math.random()*this.width/8 + this.width/8;
        let deb = new Debris(pos, vel,
            this.theta,
            this.omega + Math.random()*5 - 2.5, size);
        deb.color = "brown";
        deb.name = this.fullName();
        WORLD.push(deb);

        if (Math.random() < 0.1)
            WORLD.push(new Explosion(pos.slice(), this.vel.slice(),
            DONNAGER_EXPLOSION_RADIUS*(Math.random()*0.5 + 0.5)));
    }
    this.remove = true;
    throwAlert(this.name + " (" + this.type +
        ") was destroyed.", ALERT_DISPLAY_TIME);
}

Donnager.prototype.damage = function(d)
{
    this.health -= d;
    if (this.health <= 0) this.explode();
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
            deb.color = "#909090";
            if (Math.random() < 0.2)
                deb.color = "#CCCCCC";
            WORLD.push(deb);
        }
    }
}
