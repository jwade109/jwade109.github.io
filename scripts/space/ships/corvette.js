// corvette.js

const PLAYER_INVINCIBLE = false;
const CORVETTE_MAX_HEALTH = 2000;
const PASSIVE_REGEN = 2*CORVETTE_MAX_HEALTH/100;
const INFINITE_FUEL = true;
const INFINITE_AMMO = false;

const CORVETTE_MOMENT_INERTIA = 5000000;
const CORVETTE_EXPLOSION_RADIUS = 180;
const CORVETTE_LENGTH = 42;
const CORVETTE_WIDTH = 11;
const CORVETTE_MASS = 120000;
const CORVETTE_MAIN_THRUST = 20*9.81*CORVETTE_MASS;
const CORVETTE_RCS_THRUST = 9.81*CORVETTE_MASS;
const CORVETTE_PDC_RANGE = Infinity; // 500;

function Corvette(pos, theta)
{
    Collidable.call(this, CORVETTE_LENGTH, CORVETTE_WIDTH, CORVETTE_MAX_HEALTH);
    this.pos = pos.slice();
    this.theta = theta;
    this.mass = CORVETTE_MASS;
    this.izz = CORVETTE_MOMENT_INERTIA;
    this.name = "\"Rocinante\"";
    this.type = "Corvette Class";
    this.gray = "#909090";
    this.box = new Hitbox([[this.length/2, this.width/3],
                           [-this.length/2, this.width/2],
                           [-this.length/2, -this.width/2],
                           [this.length/2, -this.width/3]]);
    this.box.object = this;

    let tx = this.width*0.45;
    let ty = this.width*0.7;
    let sw = 3;

    this.thrusters = [
        new Thruster([tx, ty], 0, CORVETTE_RCS_THRUST, sw),
        new Thruster([tx, ty], Math.PI/2, CORVETTE_RCS_THRUST, sw),
        new Thruster([-tx, ty], Math.PI/2, CORVETTE_RCS_THRUST, sw),
        new Thruster([-tx, ty], Math.PI, CORVETTE_RCS_THRUST, sw),
        new Thruster([-tx, -ty], Math.PI, CORVETTE_RCS_THRUST, sw),
        new Thruster([-tx, -ty], 3*Math.PI/2, CORVETTE_RCS_THRUST, sw),
        new Thruster([tx, -ty], 3*Math.PI/2, CORVETTE_RCS_THRUST, sw),
        new Thruster([tx, -ty], 0, CORVETTE_RCS_THRUST, sw),
        new Thruster([-this.length/2, 0],
            Math.PI, CORVETTE_MAIN_THRUST, this.width*0.7)];
    for (let t of this.thrusters) t.drawbell = false;

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

    this.railguns = [
        new RailgunLauncher([this.length/2, 0], 0, this, [0, 0])
    ]
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

Corvette.prototype.fireRailgun = function()
{
    for (let rg of this.railguns) rg.fire();
}

Corvette.prototype.firePDC = function(target)
{
    for (let pdc of this.pdcs)
    {
        if (target == null)
            pdc.fireAt([MOUSEX, MOUSEY]);
        else if (isNaN(pdc.intercept(target)))
            pdc.fireAt([MOUSEX, MOUSEY]);
    }
}

Corvette.prototype.control = Controller.player;

Corvette.prototype.matchVelocity = function(target)
{
    // let norm = 0;
    // let desired_angle = this.theta;
    // if (target != null)
    // {
    //     let rvel = sub2d(target.vel, PLAYER_SHIP.vel);
    //     norm = norm2d(rvel);
    //     desired_angle = anglebtwn([1, 0], rvel);
    //     if (norm < 2) desired_angle = this.theta;
    // }
    // let error = desired_angle - this.theta;
    // while (error > Math.PI) error -= Math.PI*2;
    // while (error < -Math.PI) error += Math.PI*2;
    // let alpha = 10*error - 5*this.omega;
    // if (alpha > 0.05)
    // {
    //     PLAYER_SHIP.thrusters[2].firing = true;
    //     PLAYER_SHIP.thrusters[6].firing = true;
    //     PLAYER_SHIP.thrusters[0].firing = true;
    //     PLAYER_SHIP.thrusters[4].firing = true;
    // }
    // else if (alpha < -0.05)
    // {
    //     PLAYER_SHIP.thrusters[1].firing = true;
    //     PLAYER_SHIP.thrusters[5].firing = true;
    //     PLAYER_SHIP.thrusters[3].firing = true;
    //     PLAYER_SHIP.thrusters[7].firing = true;
    // }
    // if (Math.abs(error) < 5/180*Math.PI &&
    //     Math.abs(this.omega) < 5/180*Math.PI)
    // {
    //     if (norm > 50) this.thrusters[8].firing = true;
    //     else if (norm > 5)
    //     {
    //         this.thrusters[5].firing = true;
    //         this.thrusters[6].firing = true;
    //     }
    // }
}

Corvette.prototype.skin = function()
{
    CTX.save(); // save global reference frame
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);

    CTX.rotate(-this.theta)
    // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE FRAME

    if (norm2d(this.acc) > 0)
    {
        this.thrusters[8].firing = true;
        this.thrusters[8].draw(CTX);
    }

    CTX.save();

    if (!PLAYER_WEAPON_SELECT)
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

    let off = this.width/2;
    CTX.strokeStyle = "black";
    CTX.fillStyle = this.gray;

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
    CTX.fillStyle = "black";
    CTX.fillRect(-this.length*0.4*PIXELS, -this.width*0.15*PIXELS,
                  this.length*0.9*PIXELS, this.width*0.3*PIXELS);
    CTX.fillStyle = "#CCCCCC";
    CTX.fillRect(-this.length*0.4*PIXELS, -this.width*0.1*PIXELS,
                  this.length*0.9*PIXELS, this.width*0.2*PIXELS);
    CTX.stroke();

    CTX.restore();
    CTX.restore();

    for (let pdc of this.pdcs) pdc.draw(CTX);
    // for (let railgun of this.railguns) railgun.draw(CTX);
    for (let tube of this.tubes) tube.draw();
}

Corvette.prototype.damage = function(d)
{
    if (PLAYER_INVINCIBLE) return;
    this.health -= d;

    function transition(x, health)
    {
        return health/CORVETTE_MAX_HEALTH <= x &&
            (health + d)/CORVETTE_MAX_HEALTH > x && health > 0;
    }

    if (transition(0.3, this.health) || transition(0.1, this.health))
        throwAlert("Warning: hull integrity at " +
            Math.round(100*this.health/CORVETTE_MAX_HEALTH) + "%",
            ALERT_DISPLAY_TIME);
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
        deb.color = "#909090";
        if (Math.random() < 0.2)
            deb.color = "#CCCCCC";
        WORLD.push(deb);
    }
    WORLD.push(new Explosion(this.pos.slice(), this.vel.slice(),
        CORVETTE_EXPLOSION_RADIUS));
    // this.acc = [0, 0];
    // this.alpha = 0;
    // this.omega = 0;
    // this.health = -Infinity;
    this.remove = true;
    // for (let t of this.thrusters) t.firing = false;
    GAME_OVER = true;
    // TARGET_OBJECT = null;
    throwAlert(this.name + " was lost with all hands.", Infinity);
}
