// morrigan.js

const MORRIGAN_LENGTH = 31;
const MORRIGAN_WIDTH = 9;
const MORRIGAN_MAX_HEALTH = 350;
const MORRIGAN_MASS = 80000;
const MORRIGAN_MOMENT_INERTIA = 4000000;
const MORRIGAN_EXPLOSION_RADIUS = 120;
const MORRIGAN_PDC_RANGE = 350;

function Morrigan(pos, theta)
{
    Collidable.call(this, MORRIGAN_LENGTH, MORRIGAN_WIDTH, MORRIGAN_MAX_HEALTH);
    this.pos = pos;
    this.mass = MORRIGAN_MASS;
    this.izz = MORRIGAN_MOMENT_INERTIA;
    this.torpedo_reload = 0;
    this.name = "\"" + NAMES[Math.floor(Math.random()*NAMES.length)] + "\"";
    this.type = "Morrigan Class";
    this.faction = "MCRN";
    this.permanent = true;
    this.is_enemy = true;

    this.thrusters = [new Thruster([-this.length/2, 0], Math.PI,
        0, this.width*7/9)
    ];

    this.pdcs =
        [new PointDefenseCannon(
            [-this.length/62, -this.width*0.4], Math.PI/2.5,
             this, [-Math.PI/2.2, Math.PI/2.2], MORRIGAN_PDC_RANGE),
         new PointDefenseCannon(
            [-this.length/62, this.width*0.4], -Math.PI/2.5,
             this, [-Math.PI/2.2, Math.PI/2.2], MORRIGAN_PDC_RANGE)];

    this.gray = "#606060";
    this.orange = "#8D3F32";
}

Morrigan.prototype = Object.create(Collidable.prototype);

Morrigan.prototype.handleCollision = function(other)
{
    if (other === PLAYER_SHIP) this.damage(MORRIGAN_MAX_HEALTH);
}

Morrigan.prototype.launchTorpedo = function(target)
{
    let poff = rot2d([0, this.length/2], this.theta + Math.PI/2);
    let voff = rot2d([0, 100], this.theta + Math.PI/2);
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
    WORLD.push(torp);
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

    if (norm2d(this.acc) > 0)
        for (let thruster of this.thrusters)
        {
            thruster.firing = true;
            thruster.draw(CTX);
        }

    let unit = this.length/31*PIXELS;

    CTX.strokeStyle = "black";
    CTX.globalAlpha = 1;
    CTX.fillStyle = this.gray;
    CTX.fillRect(-this.length/2*PIXELS, -3.5*unit, 2*unit, 7*unit);
    CTX.strokeRect(-this.length/2*PIXELS, -3.5*unit, 2*unit, 7*unit);
    CTX.fillStyle = this.orange;
    CTX.fillRect(-13.5*unit, -4.5*unit, 11*unit, 4.5*unit);
    CTX.strokeRect(-13.5*unit, -4.5*unit, 11*unit, 4.5*unit);
    CTX.fillRect(-13.5*unit, 0, 11*unit, 4.5*unit);
    CTX.strokeRect(-13.5*unit, 0, 11*unit, 4.5*unit);
    CTX.fillStyle = this.gray;
    CTX.fillRect(-2.5*unit, -4.5*unit, 4*unit, 9*unit);
    CTX.strokeRect(-2.5*unit, -4.5*unit, 4*unit, 9*unit);
    CTX.fillStyle = this.orange;
    CTX.fillRect(1.5*unit, -3.5*unit, 14*unit, 7*unit);
    CTX.strokeRect(1.5*unit, -3.5*unit, 14*unit, 7*unit);
    CTX.fillStyle = this.gray;
    CTX.fillRect(-10.5*unit, -1.5*unit, 21*unit, 3*unit);
    CTX.strokeRect(-10.5*unit, -1.5*unit, 21*unit, 3*unit);

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
}

Morrigan.prototype.control = Controller.morrigan;

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
        deb.name = this.name;
        deb.color = this.gray;
        if (Math.random() < 0.4) deb.color = this.orange;
        WORLD.push(deb);
    }
    this.remove = true;
    WORLD.push(new Explosion(this.pos.slice(), this.vel.slice(),
        MORRIGAN_EXPLOSION_RADIUS));
    throwAlert(this.name + " (" + this.type +
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
            deb.name = this.name;
            deb.color = this.gray;
            if (Math.random() < 0.4)
                deb.color = this.orange;
            WORLD.push(deb);
        }
    }
}
