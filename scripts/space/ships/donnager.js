// donnager.js

const DONNAGER_LENGTH = 475.5;
const DONNAGER_WIDTH = 150;
const DONNAGER_MAX_HEALTH = 10000;
const DONNAGER_EXPLOSION_RADIUS = 600;
const DONNAGER_MASS = 150000000;
const DONNAGER_PDC_RANGE = 900;

function Donnager(pos, theta)
{
    Collidable.call(this, DONNAGER_LENGTH, DONNAGER_WIDTH, DONNAGER_MAX_HEALTH);
    this.pos = pos.slice();
    this.theta = theta;
    this.vel = [50*Math.cos(theta), -50*Math.sin(theta)];
    this.mass = DONNAGER_MASS;
    this.name = "MCRN \"" +
        NAMES[Math.floor(Math.random()*NAMES.length)] + "\"";
    this.type = "Donnager Class";
    this.trackable = true;
    this.permanent = true;

    this.box = new Hitbox([[this.length/2, this.width/6, ],
                           [this.length/2, -this.width/6, ],
                           [0, -this.width/6],
                           [-this.length/2, -this.width/2],
                           [-this.length/2, this.width/2],
                           [0, this.width/6]]);
    this.box.object = this;

    let range = [-Math.PI/2.2, Math.PI/2.2];
    this.pdcs =
        [new PointDefenseCannon(
            [this.length/4, this.width*0.25], -Math.PI/2.4,
             this, range, DONNAGER_PDC_RANGE),
         new PointDefenseCannon(
            [this.length/4, -this.width*0.25], Math.PI/2.4,
             this, range, DONNAGER_PDC_RANGE),
         new PointDefenseCannon(
            [-this.length/6, -this.width*0.25], Math.PI/2,
             this, range, DONNAGER_PDC_RANGE),
         new PointDefenseCannon(
            [-this.length/6, this.width*0.25], -Math.PI/2,
             this, range, DONNAGER_PDC_RANGE),
         new PointDefenseCannon(
            [-0, -this.width*0.25], Math.PI/2,
             this, range, DONNAGER_PDC_RANGE),
         new PointDefenseCannon(
            [-0, this.width*0.25], -Math.PI/2,
             this, range, DONNAGER_PDC_RANGE),
         new PointDefenseCannon(
            [this.length/2, 0], 0,
             this, range, DONNAGER_PDC_RANGE),
         new PointDefenseCannon(
            [-this.length/2, 0], Math.PI,
             this, range, DONNAGER_PDC_RANGE)];
}

Donnager.prototype = Object.create(Collidable.prototype);

Donnager.prototype.control = function(dt)
{
    let candidates = [PLAYER_SHIP];
    for (let obj of WORLD)
    {
        if (!(obj instanceof Torpedo)) continue;
        let dist = distance(this.pos, obj.pos);
        if (dist < 3000) candidates.push(obj);
    }

    for (let pdc of this.pdcs)
    {
        let best = null, min = Infinity;
        for (let obj of candidates)
        {
            let dist = distance(obj.pos, pdc.globalPos());
            if (dist < min)
            {
                best = obj;
                min = dist;
            }
        }
        if (best != null) pdc.intercept(best);
        else pdc.intercept(PLAYER_SHIP);
    }
}

Donnager.prototype.skin = function()
{
    if (DRAW_TRACE)
    {
        CTX.globalAlpha = 0.6;
        CTX.strokeStyle = "red";
        CTX.beginPath();
        CTX.moveTo(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
        CTX.lineTo(this.pos_prev[0]*PIXELS, this.pos_prev[1]*PIXELS);
        CTX.stroke();
    }
    CTX.save();
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
    CTX.rotate(-this.theta);

    CTX.globalAlpha = 1;
    CTX.fillStyle = "brown";
    CTX.strokeStyle = "black";
    CTX.beginPath();
    CTX.moveTo(this.length/2*PIXELS, this.width/6*PIXELS);
    CTX.lineTo(this.length/2*PIXELS, -this.width/6*PIXELS);
    CTX.lineTo(0, -this.width/6*PIXELS);
    CTX.lineTo(-this.length/2*PIXELS, -this.width/2*PIXELS);
    CTX.lineTo(-this.length/2*PIXELS, this.width/2*PIXELS);
    CTX.lineTo(0, this.width/6*PIXELS);
    CTX.closePath();
    CTX.fill();
    CTX.stroke();

    CTX.restore();
    if (DRAW_HITBOX) this.box.draw(CTX);
    for (let pdc of this.pdcs) pdc.draw(CTX);
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
        deb.name = this.name;
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
            deb.name = this.name;
            deb.color = "#909090";
            if (Math.random() < 0.2)
                deb.color = "#CCCCCC";
            WORLD.push(deb);
        }
    }
}
