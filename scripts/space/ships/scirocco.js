// scirocco.js

const SCIROCCO_LENGTH = 200;
const SCIROCCO_WIDTH = 72;
const SCIROCCO_HEALTH = 5000;
const SCIROCCO_MASS = 200000;
const SCIROCCO_IZZ = 50000000;
const SCIROCCO_EXPLOSION_RADIUS = 500;
const SCIROCCO_PDC_RANGE = 1200;

function Scirocco(pos, theta)
{
    Collidable.call(this, SCIROCCO_LENGTH, SCIROCCO_WIDTH, SCIROCCO_HEALTH);
    this.pos = pos.slice();
    this.theta = theta;
    this.mass = SCIROCCO_MASS;
    this.izz = SCIROCCO_IZZ;
    this.name = "\"" + NAMES[Math.floor(Math.random()*NAMES.length)] + "\"";
    this.type = "Scirocco Class";
    this.faction = "MCRN";
    this.railgun_reload = 0;

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

    this.gray = "#555555";
    this.orange = "#CC5500";
}

Scirocco.prototype = Object.create(Collidable.prototype);

Scirocco.prototype.firePDC = function(target)
{
    for (let pdc of this.pdcs)
    {
        if (target == null)
            pdc.fireAt([MOUSEX, MOUSEY]);
        else if (isNaN(pdc.intercept(target)))
            pdc.fireAt([MOUSEX, MOUSEY]);
    }
}

Scirocco.prototype.launchTorpedo = function(target)
{
    let poff = rot2d([0, this.length/2], this.theta + Math.PI/2);
    let voff = rot2d([0, 150], this.theta + Math.PI/2);
    let tpos = this.pos.slice();
    let tvel = this.vel.slice();
    tpos[0] += poff[0];
    tpos[1] += poff[1];
    tvel[0] += voff[0];
    tvel[1] += voff[1];
    let torp = new Torpedo(tpos, tvel, this.theta,
        TORPEDO_THRUST, TORPEDO_LENGTH);
    torp.origin = this;
    torp.target = target;
    torp.name = this.name;
    torp.faction = this.faction;
    WORLD.push(torp);
}

Scirocco.prototype.fireRailgun = function()
{
    for (let rg of this.railguns) rg.fire();
    // if (this.railgun_reload > 0)
    // {
    //     throwAlert("Cannot fire railgun -- still charging.",
    //         ALERT_DISPLAY_TIME);
    //     return;
    // }
    // this.railgun_reload = RAILGUN_COOLDOWN/4;
    // let angle = angle2d([1, 0], sub2d([MOUSEX, MOUSEY], this.pos));
    // let vel = rot2d([RAILGUN_VEL, 0], this.gamma);
    // vel[0] += this.vel[0];
    // vel[1] += this.vel[1];
    // let r = new Railgun(this.pos.slice(), vel, angle, 12);
    // r.origin = this;
    // WORLD.push(r);
    // WORLD.push(new Explosion(this.pos.slice(),
    //     this.vel.slice(), TORPEDO_EXPLOSION_RADIUS));
}

Scirocco.prototype.control = function(dt)
{
    // while (angle < this.gamma - Math.PI) angle += Math.PI*2;
    // while (angle > this.gamma + Math.PI) angle -= Math.PI*2;
    //
    // this.nu = (angle - this.gamma)*100 - this.epsilon*20;
    //
    // this.epsilon += this.nu*dt;
    // this.epsilon = Math.max(-2, Math.min(this.epsilon, 2));
    // this.gamma += this.epsilon*dt;
    //
    // this.railgun_reload -= dt;
    for (let rg of this.railguns)
    {
        let angle = angle2d([1, 0], sub2d([MOUSEX, MOUSEY], rg.globalPos()));
        if (!PLAYER_WEAPON_SELECT) rg.seek(dt, angle);
        else rg.seek(dt, this.theta + rg.theta);
    }
}

Scirocco.prototype.skin = function()
{
    CTX.save();
    CTX.translate(-this.pos[0]*PIXELS, -this.pos[1]*PIXELS);
    CTX.rotate(-this.theta);

    let unit = this.length/50*PIXELS;

    CTX.globalAlpha = 1;
    CTX.strokeStyle = "black";

    // antenna
    CTX.fillStyle = "black";
    CTX.fillRect(20*unit, -6*unit, 6*unit, unit/10);
    CTX.strokeRect(20*unit, -6*unit, 6*unit, unit/10);

    // bow cowling
    CTX.fillStyle = this.gray;
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
    CTX.fillStyle = this.gray;
    CTX.fillRect(-23*unit, -4*unit, 10*unit, 8*unit);
    CTX.strokeRect(-23*unit, -4*unit, 10*unit, 8*unit);

    // main body midline
    CTX.fillStyle = this.gray;
    CTX.fillRect(-13*unit, -4*unit, 36*unit, 8*unit);
    CTX.fillStyle = this.orange;
    CTX.fillRect(21*unit, -4*unit, unit, 8*unit);
    CTX.strokeRect(-13*unit, -4*unit, 36*unit, 8*unit);

    // port engine
    CTX.fillStyle = this.gray;
    CTX.fillRect(-this.length/2*PIXELS, -8*unit, 11*unit, 4*unit);
    CTX.fillStyle = this.orange;
    CTX.fillRect(-17*unit, -8*unit, unit, 4*unit);
    CTX.strokeRect(-this.length/2*PIXELS, -8*unit, 11*unit, 4*unit);

    // midboard engine
    CTX.fillStyle = this.gray;
    CTX.fillRect(-this.length/2*PIXELS, -2*unit, 11*unit, 4*unit);
    CTX.fillStyle = this.orange;
    CTX.fillRect(-17*unit, -2*unit, unit, 4*unit);
    CTX.strokeRect(-this.length/2*PIXELS, -2*unit, 11*unit, 4*unit);

    // starboard engine
    CTX.fillStyle = this.gray;
    CTX.fillRect(-this.length/2*PIXELS, 4*unit, 11*unit, 4*unit);
    CTX.fillStyle = this.orange;
    CTX.fillRect(-17*unit, 4*unit, unit, 4*unit);
    CTX.strokeRect(-this.length/2*PIXELS, 4*unit, 11*unit, 4*unit);

    // port main body
    CTX.fillStyle = this.gray;
    CTX.fillRect(-3*unit, -9*unit, 23*unit, 5*unit);
    CTX.fillStyle = this.orange;
    CTX.fillRect(-3*unit, -5*unit, 23*unit, unit);
    CTX.strokeRect(-3*unit, -9*unit, 23*unit, 5*unit);

    // starboard main body
    CTX.fillStyle = this.gray;
    CTX.fillRect(-3*unit, 4*unit, 23*unit, 5*unit);
    CTX.fillStyle = this.orange;
    CTX.fillRect(-3*unit, 4*unit, 23*unit, unit);
    CTX.strokeRect(-3*unit, 4*unit, 23*unit, 5*unit);

    // port turret mount
    CTX.beginPath();
    CTX.moveTo(-3*unit, -4*unit);
    CTX.lineTo(-5*unit, -9*unit);
    CTX.lineTo(-11*unit, -9*unit);
    CTX.lineTo(-13*unit, -4*unit);
    CTX.closePath();
    CTX.fillStyle = this.gray;
    CTX.fill();
    CTX.fillStyle = this.orange;
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
    CTX.fillStyle = this.gray;
    CTX.fill();
    CTX.fillStyle = this.orange;
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
    for (let pdc of this.pdcs) pdc.draw(CTX);
    for (let railgun of this.railguns) railgun.draw(CTX);
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

Scirocco.prototype.damage = function(d)
{
    this.health -= d;
    if (this.health < 1) this.explode();
    else if (Math.random() < 0.01*d)
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
