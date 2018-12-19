// torpedo.js

const TORPEDO_MASS = 200;
const TORPEDO_THRUST = 100*9.81*TORPEDO_MASS;
const TORPEDO_DAMAGE = 200;
const TORPEDO_LENGTH = 6;
const TORPEDO_WIDTH = 1;
const TORPEDO_MAX_HEALTH = 1;
const TORPEDO_EXPLOSION_RADIUS = 30;
const TORPEDO_DRIFT_TIME = 0.4;
const TORPEDO_FUEL_TIME = 5;
const DRAW_TORPEDO_PATH = true;

function Torpedo(pos, vel, theta)
{
    Collidable.call(this, TORPEDO_LENGTH, TORPEDO_WIDTH, TORPEDO_MAX_HEALTH);
    this.pos = pos.slice();
    this.pos_history = [];
    this.vel = vel.slice();
    this.theta = theta;
    this.mass = TORPEDO_MASS;
    this.drifttimer = TORPEDO_DRIFT_TIME;
    this.fueltimer = TORPEDO_FUEL_TIME;
    this.tracking = true;
    this.target = null;
    this.name = "";
    this.type = "Torpedo";
    this.thrusters = [new Thruster(
        [-this.length/2, 0], Math.PI, 0, this.width)];
}

Torpedo.prototype = Object.create(Collidable.prototype);

Torpedo.prototype.control = function(dt)
{
    this.pos_history.push(this.pos.slice());
    if (this.target != null && this.target.remove) this.tracking = false;
    this.time += dt;

    let theta = this.theta;
    if (this.target != null)
        theta = -torpedoGuidance(this.pos.slice(),
                         this.vel.slice(),
                         this.target.pos.slice(),
                         this.target.vel.slice());

    while (theta < this.theta - Math.PI) theta += Math.PI*2;
    while (theta > this.theta + Math.PI) theta -= Math.PI*2;
    if (this.tracking && this.time > this.drifttimer)
        this.theta = theta;
    else if (this.tracking)
        this.theta += (theta - this.theta)*0.1;

    if (this.time > TORPEDO_DRIFT_TIME &&
        this.time < TORPEDO_DRIFT_TIME + TORPEDO_FUEL_TIME)
    {
        this.thrusters[0].firing = true;
        this.applyForce(rot2d([TORPEDO_THRUST, 0], this.theta));
    }
    else if (this.time > TORPEDO_DRIFT_TIME + TORPEDO_FUEL_TIME)
    {
        this.thrusters[0].firing = false;
        this.tracking = false;
    }
}

Torpedo.prototype.explode = function()
{
    let num_debris = Math.round(Math.random()*3 + 5);
    if (this.pdc) num_debris = 0;
    for (let i = 0; i < num_debris; ++i)
    {
        let pos = this.pos.slice();
        let vel = this.vel.slice();
        vel[0] += Math.random()*200 - 100;
        vel[1] += Math.random()*200 - 100;
        let deb = new Debris(pos, vel,
            Math.random()*Math.PI*2,
            Math.random()*40 - 20,
            Math.random()*3 + 2);
        deb.name = "Exploded Torpedo";
        WORLD.push(deb);
    }
    WORLD.push(new Explosion(this.pos.slice(), this.vel.slice(),
        TORPEDO_EXPLOSION_RADIUS));
    this.remove = true;
}

Torpedo.prototype.skin = function()
{
    if (DRAW_TORPEDO_PATH && this.tracking)
    {
        CTX.save();
        CTX.globalAlpha = 0.3;
        CTX.strokeStyle = "black";
        CTX.setLineDash([40*PIXELS, 15*PIXELS]);
        CTX.beginPath();
        for (let i = 1; i < this.pos_history.length; ++i)
        {
            CTX.lineTo(this.pos_history[i][0]*PIXELS,
                       this.pos_history[i][1]*PIXELS);
        }
        CTX.stroke();
        CTX.restore();
    }

    if (this.target === PLAYER_SHIP && this.tracking)
    {
        CTX.save();
        let radius = 0.7*Math.max(PLAYER_SHIP.length, PLAYER_SHIP.width);
        CTX.strokeStyle = "red";
        CTX.globalAlpha = 0.5;
        CTX.beginPath();
        CTX.lineWidth = 4*PIXELS;
        let theta = Math.PI - angle2d(this.pos, this.target.pos);
        CTX.arc(this.target.pos[0]*PIXELS, this.target.pos[1]*PIXELS,
            radius*PIXELS, theta - 0.2, theta + 0.2, false);
        CTX.stroke();
        CTX.restore();
    }

    CTX.save();
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);

    CTX.save();
    CTX.rotate(Math.PI/4);
    CTX.strokeStyle = "blue";
    CTX.globalAlpha = 0.4;
    CTX.strokeRect(-5*PIXELS, -5*PIXELS, 10*PIXELS, 10*PIXELS);
    CTX.restore();

    CTX.rotate(-this.theta);
    CTX.strokeStyle = "black";
    CTX.fillStyle = "black";
    CTX.globalAlpha = 1;
    CTX.fillRect(-this.length/2*PIXELS, -this.width/2*PIXELS,
                 this.length*PIXELS, this.width*PIXELS);
    this.thrusters[0].draw(CTX);
    CTX.restore();
}

Torpedo.prototype.handleCollision = function(other)
{
    if (other === this.origin) return;
    if (other.origin === this.origin) return;
    if (other instanceof Debris && other.radius < SMALL_DEBRIS) return;
    conserveMomentum(this, other);
    this.explode();
    other.damage(TORPEDO_DAMAGE);
}

function torpedoGuidance(pos, vel, tpos, tvel)
{
    let rvel = [vel[0] - tvel[0], vel[1] - tvel[1]];
    let disp = [tpos[0] - pos[0], tpos[1] - pos[1]];
    let dot = Math.max(0, dot2d(disp, rvel));
    let goodvel = vproj2d(disp, rvel);
    if (dot < 0) goodvel = [0, 0];
    let badvel = [rvel[0] - goodvel[0], rvel[1] - goodvel[1]];
    let pointing = [disp[0] - badvel[0],
                    disp[1] - badvel[1]];
    return anglebtwn([1, 0], pointing);
}
