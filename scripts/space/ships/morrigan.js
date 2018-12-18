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
    this.name = "MCRN \"" +
        NAMES[Math.floor(Math.random()*NAMES.length)] + "\"";
    this.type = "Morrigan Class";
    this.permanent = true;
    this.is_enemy = true;

    this.engine = new Thruster([0, -this.length/2], -Math.PI/2,
        this.mass, this.width);
    this.engine.drawbell = false;

    let range = [-Math.PI/2.2, Math.PI/2.2];
    this.pdcs =
        [new PointDefenseCannon(
            [-this.length/6, -this.width*0.5], Math.PI/2.5,
             this, range, MORRIGAN_PDC_RANGE),
         new PointDefenseCannon(
            [-this.length/6, this.width*0.5], -Math.PI/2.5,
             this, range, MORRIGAN_PDC_RANGE)];

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

    let x0 = -0.50*this.length*PIXELS;
    let x1 = -0.40*this.length*PIXELS;
    let x2 = -0.37*this.length*PIXELS;
    let x3 = -0.32*this.length*PIXELS;
    let x4 = -0.25*this.length*PIXELS;
    let x5 = -0.10*this.length*PIXELS;
    let x6 =  0.10*this.length*PIXELS;
    let x7 =  0.20*this.length*PIXELS;
    let x8 =  0.25*this.length*PIXELS;
    let x9 =  0.3*this.length*PIXELS;
    let x10 = 0.50*this.length*PIXELS;
    let x11 = 0.65*this.length*PIXELS;

    let y0 = 0.05*this.width*PIXELS;
    let y1 = 0.15*this.width*PIXELS;
    let y2 = 0.25*this.width*PIXELS;
    let y3 = 0.35*this.width*PIXELS;
    let y4 = 0.50*this.width*PIXELS;

    CTX.globalAlpha = 1;
    CTX.strokeStyle = "black";
    CTX.fillStyle = this.gray;
    CTX.beginPath();
    CTX.moveTo(x0, y3);
    CTX.lineTo(x1, y1);
    CTX.lineTo(x1, y3);
    CTX.lineTo(x3, y4);
    CTX.lineTo(x5, y4);
    CTX.lineTo(x6, y3);
    CTX.lineTo(x7, y4);
    CTX.lineTo(x10, y3);
    CTX.lineTo(x10, -y3);
    CTX.lineTo(x7, -y4);
    CTX.lineTo(x6, -y3);
    CTX.lineTo(x5, -y4);
    CTX.lineTo(x3, -y4);
    CTX.lineTo(x1, -y3);
    CTX.lineTo(x1, -y1);
    CTX.lineTo(x0, -y3);
    CTX.lineTo(x0, y3);
    CTX.fill();
    CTX.stroke();

    CTX.fillStyle = this.orange;
    CTX.beginPath();
    // CTX.rect(x5, y2, x4 - x2, y4 - y2);
    // CTX.rect(x5, -y2 - (y4 - y2), x4 - x2, y4 - y2);
    CTX.rect(-0.3*this.length*PIXELS, -0.15*this.width*PIXELS,
                    0.6*this.length*PIXELS, 0.3*this.width*PIXELS);
    CTX.rect(-0.3*this.length*PIXELS, -0.15*this.width*PIXELS,
                    0.6*this.length*PIXELS, 0.3*this.width*PIXELS);
    CTX.fill();
    CTX.stroke();

    CTX.moveTo(x10, y1);
    CTX.lineTo(x11, y1);
    CTX.stroke();


    CTX.rotate(-Math.PI/2);
    this.engine.draw(CTX);
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
