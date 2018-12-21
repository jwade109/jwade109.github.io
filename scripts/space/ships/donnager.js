// donnager.js

const DONNAGER_LENGTH = 475.5;
const DONNAGER_WIDTH = 150;
const DONNAGER_MAX_HEALTH = 10000;
const DONNAGER_EXPLOSION_RADIUS = 600;
const DONNAGER_MASS = 1500000;
const DONNAGER_IZZ = 90000000;
const DONNAGER_PDC_RANGE = 900;

function Donnager(pos, theta)
{
    Collidable.call(this, DONNAGER_LENGTH, DONNAGER_WIDTH, DONNAGER_MAX_HEALTH);
    this.pos = pos.slice();
    this.theta = theta;
    this.vel = [50*Math.cos(theta), -50*Math.sin(theta)];
    this.mass = DONNAGER_MASS;
    this.izz = DONNAGER_IZZ;
    this.name = "\"" + NAMES[Math.floor(Math.random()*NAMES.length)] + "\"";
    this.type = "Donnager Class";
    this.faction = "MCRN";
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
             this, range, DONNAGER_PDC_RANGE)
    ];

    this.thrusters = [
        new Thruster([-this.length/2, -4*this.length/36],
            Math.PI, 0, 4*this.length/36),
        new Thruster([-this.length/2, 4*this.length/36],
            Math.PI, 0, 4*this.length/36)
    ];
}

Donnager.prototype = Object.create(Collidable.prototype);

Donnager.prototype.control = function(dt)
{
    let candidates = [];
    for (let obj of WORLD)
    {
        if (obj instanceof Debris) continue;
        if (!obj.trackable) continue;
        if (obj.faction == this.faction) continue;
        candidates.push(obj);
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
    }

    this.applyForce(rot2d([9.81*this.mass, 0], this.theta));
}

Donnager.prototype.skin = function()
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

    let unit = this.length/36*PIXELS;

    CTX.globalAlpha = 1;
    CTX.strokeStyle = "black";

    CTX.fillStyle = "#444444";
    CTX.fillRect(8*unit, -3*unit, 5*unit, 6*unit);
    CTX.strokeRect(8*unit, -3*unit, 5*unit, 6*unit);

    CTX.fillStyle = "#8D3F32";
    CTX.fillRect(-16*unit, -2*unit, 34*unit, 4*unit);
    CTX.strokeRect(-16*unit, -2*unit, 34*unit, 4*unit);

    CTX.fillStyle = "#444444";
    CTX.beginPath();
    CTX.moveTo(-this.length/2*PIXELS, -2*unit);
    CTX.lineTo(-this.length/2*PIXELS, -5*unit);
    CTX.lineTo(-8*unit, -5*unit);
    CTX.lineTo(4*unit, -2*unit);
    CTX.closePath();
    CTX.fill();
    CTX.stroke();

    CTX.fillStyle = "#8D3F32";
    CTX.fillRect(-this.length/2*PIXELS, -6*unit, 10*unit, unit);
    CTX.strokeRect(-this.length/2*PIXELS, -6*unit, 10*unit, unit);

    CTX.fillStyle = "#444444";
    CTX.beginPath();
    CTX.moveTo(-this.length/2*PIXELS, 2*unit);
    CTX.lineTo(-this.length/2*PIXELS, 5*unit);
    CTX.lineTo(-8*unit, 5*unit);
    CTX.lineTo(4*unit, 2*unit);
    CTX.closePath();
    CTX.fill();
    CTX.stroke();

    CTX.fillStyle = "#8D3F32";
    CTX.fillRect(-this.length/2*PIXELS, 5*unit, 10*unit, unit);
    CTX.strokeRect(-this.length/2*PIXELS, 5*unit, 10*unit, unit);

    CTX.restore();
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
