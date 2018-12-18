// amun-ra.js

const AMUN_RA_MAX_HEALTH = 700;
const AMUN_RA_MASS = 210000;
const AMUN_RA_MOMENT_INERTIA = 700;
const AMUN_RA_EXPLOSION_RADIUS = 240;
const AMUN_RA_LENGTH = 61.5;
const AMUN_RA_WIDTH = 24.2;
const AMUN_RA_PDC_RANGE = 250;

function Amun_Ra(pos, theta)
{
    Collidable.call(this, AMUN_RA_LENGTH, AMUN_RA_WIDTH, AMUN_RA_MAX_HEALTH);
    this.pos = pos.slice();
    this.theta = theta;
    this.mass = AMUN_RA_MASS;
    this.torpedo_reload = 0;
    this.name = "\"" + NAMES[Math.floor(Math.random()*NAMES.length)] + "\"";
    this.type = "Amun-Ra Class";
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

Amun_Ra.prototype.step = function(dt)
{
    if (PLAYER_SHIP.remove)
    {
        this.alpha = -this.omega;
        this.acc = rot2d([10, 0], this.theta);

        this.pos_prev = this.pos.slice();
        this.vel[0] += this.acc[0]*dt;
        this.vel[1] += this.acc[1]*dt;
        this.pos[0] += this.vel[0]*dt;
        this.pos[1] += this.vel[1]*dt;
        this.omega += this.alpha*dt;
        this.theta += this.omega*dt;

        this.acc = [0, 0];
        this.alpha = 0;

        return;
    }

    let closest = null, min = Infinity;
    for (let obj of WORLD)
    {
        if (obj instanceof Torpedo && obj.target == this)
        {
            let dist = distance(this.pos, obj.pos);
            if (dist < min)
            {
                min = dist;
                closest = obj;
            }
        }
    }

    let dist = distance(PLAYER_SHIP.pos, this.pos);
    if (this.torpedo_reload > 0) this.torpedo_reload -= dt;
    else if (dist > AMUN_RA_PDC_RANGE && dist < WORLD_RENDER_DISTANCE)
    {
        this.launchTorpedo();
        this.torpedo_reload = Math.random()*1.2;
        if (Math.random() < 0.4)
            this.torpedo_reload = Math.random()*4 + 8;
    }

    if (this.pdc_reload > 0) this.pdc_reload -= dt;
    else if (closest != null)
        this.firePDC(closest);
    else if (Math.random() < 0.5)
        this.firePDC(PLAYER_SHIP);

    let dx = PLAYER_SHIP.pos[0] - this.pos[0];
    let dy = PLAYER_SHIP.pos[1] - this.pos[1];
    let bodyacc =
        [-(1800 - dist)/10, 0];
    this.acc = rot2d(bodyacc, this.theta);
    this.acc[0] += (PLAYER_SHIP.vel[0] - this.vel[0])/3;
    this.acc[1] += (PLAYER_SHIP.vel[1] - this.vel[1])/3;
    let theta = angle2d(this.pos, PLAYER_SHIP.pos) - this.theta;
    while (theta > Math.PI) theta -= Math.PI*2;
    while (theta < -Math.PI) theta += Math.PI*2;
    this.alpha = theta - this.omega;

    this.pos_prev = this.pos.slice();
    this.vel[0] += this.acc[0]*dt;
    this.vel[1] += this.acc[1]*dt;
    this.pos[0] += this.vel[0]*dt;
    this.pos[1] += this.vel[1]*dt;
    this.omega += this.alpha*dt;
    this.theta += this.omega*dt;

    this.acc = [0, 0];
    this.alpha = 0;

    this.box.pos = this.pos.slice();
    this.box.theta = this.theta;

    dist = distance(this.pos, PLAYER_SHIP.pos);
    let opacity = Math.max(0, Math.min(1 - (dist - 750)/100, 1));
    if (this === TARGET_OBJECT && opacity == 0 && Math.random() < dt)
    {
        TARGET_OBJECT = null;
        throwAlert("Cannot maintain lock on cloaked vessel.",
            ALERT_DISPLAY_TIME);
    }
}

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
        deb.name = this.name;
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
            deb.name = this.name;
            deb.color = this.gray;
            if (Math.random() < 0.4)
                deb.color = this.orange;
            WORLD.push(deb);
        }
    }
}
