// ship.js

const BASILISK_LENGTH = 300;
const BASILISK_WIDTH = 135;
const BASILISK_HEALTH = 1000;
const BASILISK_MASS = 500000;
const BASILISK_IZZ = 50000000;
const BASILISK_EXPLOSION_RADIUS = 600;
const BASILISK_PDC_RANGE = 700;
const BASILISK_MAX_ACCEL = 3*9.81;
const BASILISK_MAX_ALPHA = 0.2;
const BASILISK_REPAIR_RADIUS = 2000;
const BASILISK_REGEN_RATE = 50; // hp per sec

function Basilisk(pos, theta)
{
    Collidable.call(this, BASILISK_LENGTH,
        BASILISK_WIDTH, BASILISK_HEALTH);
    this.pos = pos.slice();
    this.theta = theta;
    this.mass = BASILISK_MASS;
    this.izz = BASILISK_IZZ;
    this.max_acc = BASILISK_MAX_ACCEL;
    this.max_alpha = BASILISK_MAX_ALPHA;
    this.name = "\"" + NAMES[Math.floor(Math.random()*NAMES.length)] + "\"";
    this.type = "Basilisk Class";
    this.faction = MCRN;
    this.isShip = true;

    this.box = new Hitbox([[-this.length/2, -this.width*3.5/9],
                           [this.length*8/20, -this.width*3.5/9],
                           [this.length/2, 0],
                           [this.length*8/20, this.width*3.5/9],
                           [-this.length/2, this.width*3.5/9]]);
    this.box.object = this;

    this.thrusters = [
        new Thruster([-this.length/2, -this.width*2/9],
            Math.PI, 0, this.width*1/3),
        new Thruster([-this.length/2, this.width*2/9],
            Math.PI, 0, this.width*1/3)
    ];
    this.pdcs = [
        new PointDefenseCannon([this.length/10, this.width*3.5/9],
            -Math.PI/2, this, [-Math.PI/3, Math.PI/3], BASILISK_PDC_RANGE),
        new PointDefenseCannon([this.length/10, -this.width*3.5/9],
            Math.PI/2, this, [-Math.PI/3, Math.PI/3], BASILISK_PDC_RANGE),
        new PointDefenseCannon([this.length*6.5/20, this.width*3/9],
            -Math.PI/4, this, [-Math.PI/3, Math.PI/3], BASILISK_PDC_RANGE),
        new PointDefenseCannon([this.length*6.5/20, -this.width*3/9],
            Math.PI/4, this, [-Math.PI/3, Math.PI/3], BASILISK_PDC_RANGE),
        new PointDefenseCannon([-this.length/10, this.width*3.5/9],
            -Math.PI/2, this, [-Math.PI/3, Math.PI/3], BASILISK_PDC_RANGE),
        new PointDefenseCannon([-this.length/10, -this.width*3.5/9],
            Math.PI/2, this, [-Math.PI/3, Math.PI/3], BASILISK_PDC_RANGE)
    ];
}

Basilisk.prototype = Object.create(Collidable.prototype);

Basilisk.prototype.handleCollision = function(other)
{
    if (other instanceof Debris && other.radius > LARGE_DEBRIS)
    {
        other.vel = this.vel.slice();
        other.damage(other.health);
    }
}

Basilisk.prototype.firePDC = function(target)
{
    for (let pdc of this.pdcs) pdc.intercept(target);
}

Basilisk.prototype.skin = function()
{
    CTX.save();
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
    CTX.rotate(-this.theta);

    for (let thruster of this.thrusters)
    {
        if (norm2d(this.acc) > 0) thruster.firing = true;
        else thruster.firing = false;
        thruster.draw(CTX);
    }

    CTX.globalAlpha = 0.2;
    CTX.strokeStyle = CTX.fillStyle = this.faction.c1;
    CTX.beginPath();
    CTX.arc(0, 0, BASILISK_REPAIR_RADIUS*PIXELS, 0, Math.PI*2);
    CTX.stroke();
    CTX.globalAlpha = 0.04;
    CTX.fill();

    let unit = this.length/20*PIXELS;
    let pod_radius = unit*2;
    CTX.globalAlpha = 1;
    CTX.fillStyle = "gray";
    CTX.strokeStyle = "black";
    CTX.fillRect(0, 0, 3, 3);
    CTX.fillRect(-8*unit, -1.5*unit, 14*unit, 3*unit);
    CTX.strokeRect(-8*unit, -1.5*unit, 14*unit, 3*unit);
    CTX.fillRect(-10*unit, -3.5*unit, 5*unit, 3*unit);
    CTX.strokeRect(-10*unit, -3.5*unit, 5*unit, 3*unit);
    CTX.fillRect(-10*unit, 0.5*unit, 5*unit, 3*unit);
    CTX.strokeRect(-10*unit, 0.5*unit, 5*unit, 3*unit);

    // front pod
    CTX.fillStyle = "lightgray";
    CTX.beginPath();
    CTX.arc(8*unit, 0, pod_radius, 0, Math.PI*2);
    CTX.fill();
    CTX.stroke();

    // upper pods
    CTX.fillStyle = this.faction.c2;
    CTX.beginPath();
    CTX.arc(-2*unit, -2.5*unit, pod_radius, 0, Math.PI*2);
    CTX.fill();
    CTX.stroke();
    CTX.beginPath();
    CTX.arc(2*unit, -2.5*unit, pod_radius, 0, Math.PI*2);
    CTX.fill();
    CTX.stroke();
    CTX.beginPath();
    CTX.arc(6*unit, -2.5*unit, pod_radius, 0, Math.PI*2);
    CTX.fill();
    CTX.stroke();

    // lower pods
    CTX.fillStyle = this.faction.c2;
    CTX.beginPath();
    CTX.arc(-2*unit, 2.5*unit, pod_radius, 0, Math.PI*2);
    CTX.fill();
    CTX.stroke();
    CTX.beginPath();
    CTX.arc(2*unit, 2.5*unit, pod_radius, 0, Math.PI*2);
    CTX.fill();
    CTX.stroke();
    CTX.beginPath();
    CTX.arc(6*unit, 2.5*unit, pod_radius, 0, Math.PI*2);
    CTX.fill();
    CTX.stroke();

    // midship pods
    CTX.fillStyle = "lightgray";
    CTX.beginPath();
    CTX.arc(0*unit, 0, pod_radius, 0, Math.PI*2);
    CTX.fill();
    CTX.stroke();
    CTX.beginPath();
    CTX.arc(4*unit, 0, pod_radius, 0, Math.PI*2);
    CTX.fill();
    CTX.stroke();

    CTX.restore();

    for (let pdc of this.pdcs) pdc.draw(CTX);
}

Basilisk.prototype.radarIcon = function(opacity)
{
    CTX.save();
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
    CTX.rotate(-this.theta);
    CTX.fillStyle = CTX.strokeStyle = this.faction.radar;
    CTX.globalAlpha = opacity*0.7;
    CTX.lineWidth = 2;
    CTX.globalAlpha = opacity;
    CTX.beginPath();
    CTX.arc(0, 0, 8, 0, Math.PI*2);
    CTX.stroke();
    CTX.lineWidth = 4;
    CTX.beginPath();
    CTX.moveTo(5, 0);
    CTX.lineTo(-5, 0);
    CTX.moveTo(0, 5);
    CTX.lineTo(0, -5);
    CTX.stroke();
    CTX.restore();
}

Basilisk.prototype.explode = function()
{
    if (this.remove) return;
    let num_debris = 24 + Math.random()*7;
    for (let i = 0; i < num_debris; ++i)
    {
        let pos = this.box.getRandom();
        let vel = this.vel.slice();
        vel[0] += Math.random()*200 - 100;
        vel[1] += Math.random()*200 - 100;
        let size = Math.random()*this.width/6 + this.width/8;
        let deb = new Debris(pos, vel,
            this.theta, this.omega + Math.random()*5 - 2.5, size);
        deb.name = this.fullName();
        deb.color = this.faction.c3;
        if (Math.random() < 0.5) deb.color = this.faction.c2;
        WORLD.push(deb);
    }
    this.remove = true;
    WORLD.push(new Explosion(this.pos.slice(), this.vel.slice(),
        BASILISK_EXPLOSION_RADIUS));
    throwAlert(this.fullName() + " (" + this.type +
        ") was destroyed.", ALERT_DISPLAY_TIME);
}

Basilisk.prototype.damage = generic_ship_damage;
