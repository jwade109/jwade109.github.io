// amun-ra.js

const AMUN_RA_MAX_HEALTH = 700;
const AMUN_RA_MASS = 210000;
const AMUN_RA_MOMENT_INERTIA = 700;
const AMUN_RA_EXPLOSION_RADIUS = 240;
const AMUN_RA_LENGTH = 61.5;
const AMUN_RA_WIDTH = 24.2;
const AMUN_RA_PDC_RANGE = 250;
const AMUN_RA_MAX_ACCEL = 18*9.81;
const AMUN_RA_MAX_ALPHA = 14;

function Amun_Ra(pos, theta)
{
    Collidable.call(this, AMUN_RA_LENGTH, AMUN_RA_WIDTH, AMUN_RA_MAX_HEALTH);
    this.pos = pos.slice();
    this.theta = theta;
    this.mass = AMUN_RA_MASS;
    this.torpedo_reload = 0;
    this.name = "\"" + NAMES[Math.floor(Math.random()*NAMES.length)] + "\"";
    this.type = "Amun-Ra Class";
    this.faction = "MCRN";
    this.max_acc = AMUN_RA_MAX_ACCEL;
    this.max_alpha = AMUN_RA_MAX_ALPHA;
    this.box = new Hitbox([[this.length/2, 0],
                           [-this.length/4, this.width/2],
                           [-this.length/2, 0],
                           [-this.length/4, -this.width/2]]);
    this.box.object = this;

    this.pdcs =
        [new PointDefenseCannon(
            [-this.length*0.45, -0],
            Math.PI, this, [-2, 2], AMUN_RA_PDC_RANGE),
         new PointDefenseCannon(
            [this.length/6, this.width/6],
            -Math.PI/2, this, [-2, 2], AMUN_RA_PDC_RANGE),
         new PointDefenseCannon(
            [-this.length/6, -this.width/3],
            Math.PI/2, this, [-Math.PI/2, Math.PI/2], AMUN_RA_PDC_RANGE)];
    for (let pdc of this.pdcs) pdc.nodraw = true;

    this.permanent = true;
    this.is_enemy = true;
    this.trackable = true;
}

Amun_Ra.prototype = Object.create(Collidable.prototype);

Amun_Ra.prototype.launchTorpedo = function()
{
    let poff = rot2d([0, this.length/2], this.theta + Math.PI/2);
    let voff = rot2d([0, 100], this.theta + Math.PI/2);
    let tpos = this.pos.slice();
    let tvel = this.vel.slice();
    tpos[0] += poff[0];
    tpos[1] += poff[1];
    tvel[0] += voff[0];
    tvel[1] += voff[1];
    let torp = new Torpedo(tpos, tvel, this.theta, TORPEDO_THRUST);
    torp.origin = this;
    torp.target = PLAYER_SHIP;
    torp.name = this.name;
    torp.faction = this.faction;
    WORLD.push(torp);
}

Amun_Ra.prototype.firePDC = function(target)
{
    for (let pdc of this.pdcs) pdc.intercept(target);
}

Amun_Ra.prototype.skin = function()
{
    CTX.save(); // save global reference frame
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);

    CTX.rotate(-this.theta);
    // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE FRAME
    let dist = distance(this.pos, PLAYER_SHIP.pos);
    let opacity = Math.max(0, Math.min(1 - (dist - 750)/100, 1));
    CTX.globalAlpha = opacity;
    CTX.fillStyle = "black";
    CTX.strokeStyle = "lightgray";
    CTX.beginPath();
    CTX.moveTo(this.length*PIXELS/2, 0);
    CTX.lineTo(-this.length/4*PIXELS, -this.width*PIXELS/2);
    CTX.lineTo(-this.length*PIXELS/2, 0);
    CTX.lineTo(-this.length/4*PIXELS, this.width*PIXELS/2);
    CTX.lineTo(this.length*PIXELS/2, 0);
    CTX.fill();
    CTX.globalAlpha = 0.3;
    CTX.stroke();

    CTX.rotate(-Math.PI/2);
    CTX.restore();
    for (let pdc of this.pdcs) pdc.draw(CTX);
}

Amun_Ra.prototype.control = Controller.amunRaEnemy;

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
        deb.color = "black";
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
