// railgun-launcher.js

const RAILGUN_VEL = 50000;
const RAILGUN_COOLDOWN = 2.5;
const RAILGUN_SPREAD = 0;

function RailgunLauncher(pos, theta, object, range)
{
    this.pos = pos.slice();
    this.theta = theta;
    this.object = object;
    this.range = range;

    this.gamma = 0;
    this.omega = 0;
    this.alpha = 0;

    this.cooldown = RAILGUN_COOLDOWN; // RAILGUN_COOLDOWN;
    this.lastFired = -Infinity;
    this.barrelColor = "gray";
    this.baseColor = "gray";
    this.nodraw = false;
}

RailgunLauncher.prototype.globalPos = function()
{
    let pos = this.object.pos.slice();
    let off = rot2d(this.pos, this.object.theta);
    pos[0] += off[0];
    pos[1] += off[1];
    return pos;
}

RailgunLauncher.prototype.seek = function(dt, setpoint)
{
    let gun_orient = this.object.theta + this.theta;
    let pointing = this.object.theta + this.theta + this.gamma;
    let min = gun_orient - this.range[1];
    let max = gun_orient - this.range[0];
    while (setpoint < gun_orient - Math.PI) setpoint += Math.PI*2;
    while (setpoint > gun_orient + Math.PI) setpoint -= Math.PI*2;
    setpoint = Math.max(min, Math.min(setpoint, max));
    while (setpoint < pointing - Math.PI) setpoint += Math.PI*2;
    while (setpoint > pointing + Math.PI) setpoint -= Math.PI*2;

    this.alpha = (setpoint - pointing)*200 - this.omega*40;
    this.omega += this.alpha*dt;
    this.omega = Math.max(-2, Math.min(this.omega, 2));
    this.gamma += this.omega*dt;
}

RailgunLauncher.prototype.canFire = function()
{
    return TIME - this.lastFired >= this.cooldown;
}

RailgunLauncher.prototype.fire = function()
{
    let gun_orient = this.object.theta + this.theta;
    let min = gun_orient - this.range[1];
    let max = gun_orient - this.range[0];
    let theta = gun_orient + this.gamma;

    while (theta < gun_orient - Math.PI) theta += Math.PI*2;
    while (theta > gun_orient + Math.PI) theta -= Math.PI*2;
    if (theta > max || theta < min) return;

    if (TIME - this.lastFired < this.cooldown) return;
    this.lastFired = TIME;

    let angle = this.object.theta + this.theta + this.gamma;
    let vel = rot2d([RAILGUN_VEL, 0], angle);
    vel[0] += this.object.vel[0];
    vel[1] += this.object.vel[1];
    let r = new Railgun(this.globalPos(), vel, angle, 12);
    r.origin = this.object;
    WORLD.push(r);
    WORLD.push(new Explosion(this.globalPos(), this.object.vel.slice(), 0));
}

RailgunLauncher.prototype.draw = function(opacity)
{
    CTX.save();
    let gpos = this.globalPos();
    CTX.translate(gpos[0]*PIXELS, gpos[1]*PIXELS);
    CTX.rotate(-this.object.theta - this.theta);

    if (DRAW_FIRING_ARC)
    {
        CTX.save();
        CTX.fillStyle = "blue";
        CTX.globalAlpha = opacity;
        CTX.moveTo(0, 0);
        CTX.arc(0, 0, 3000*PIXELS, this.range[0], this.range[1], false);
        CTX.lineTo(0, 0);
        CTX.stroke();
        CTX.rotate(-this.gamma);
        CTX.beginPath();
        CTX.moveTo(0, 0);
        CTX.lineTo(3000*PIXELS, 0);
        CTX.stroke();
        CTX.restore();
    }

    if (this.object == PLAYER_SHIP)
    {
        CTX.save();
        CTX.strokeStyle = "red";
        CTX.globalAlpha = 0.2*opacity;
        CTX.rotate(-this.gamma);
        CTX.beginPath();
        CTX.moveTo(0, 0);
        if (TIME - this.lastFired < this.cooldown)
            CTX.setLineDash([10*PIXELS, 20*PIXELS]);
        CTX.lineTo(2000*PIXELS, 0);
        CTX.stroke();
        CTX.restore();
    }

    if (TARGET_OBJECT != null && SLOW_TIME && this.object == PLAYER_SHIP)
    {
        let rvel = sub2d(TARGET_OBJECT.vel, this.object.vel);
        let theta_t = interceptSolution(TARGET_OBJECT.pos,
            rvel, this.globalPos(), RAILGUN_VEL);
        let theta = -theta_t[0];
        let pointing = this.object.theta + this.theta + this.gamma;
        while (theta < this.gamma - Math.PI) theta += Math.PI*2;
        while (theta > this.gamma + Math.PI) theta -= Math.PI*2;
        CTX.save();
        CTX.rotate(-theta + this.theta + this.object.theta);
        CTX.globalAlpha = 0.2*opacity;
        CTX.strokeStyle = "green";
        if (TIME - this.lastFired < this.cooldown)
            CTX.setLineDash([10*PIXELS, 20*PIXELS]);
        CTX.beginPath();
        CTX.moveTo(0, 0);
        CTX.lineTo(2000*PIXELS, 0);
        CTX.stroke();
        CTX.beginPath();
        let arclen = ((theta - pointing) % Math.PI*2);
        while (arclen < -Math.PI) arclen += Math.PI*2;
        while (arclen > Math.PI) arclen -= Math.PI*2;
        arclen = Math.max(-Math.PI, Math.min(Math.PI, arclen*20));
        let bigr = 500;
        let smallr = 400;
        if (arclen > 0)
        {
            CTX.arc(0, 0, bigr*PIXELS, 0, arclen, false);
            CTX.arc(0, 0, smallr*PIXELS, arclen, 0, true);
        }
        else
        {
            CTX.arc(0, 0, bigr*PIXELS, arclen, 0, false);
            CTX.arc(0, 0, smallr*PIXELS, 0, arclen, true);
        }
        CTX.fill();
        CTX.restore();
    }

    if (this.nodraw)
    {
        CTX.restore();
        return;
    }

    CTX.rotate(-this.gamma);
    CTX.globalAlpha = opacity;
    CTX.strokeStyle = "black";

    CTX.fillStyle = this.baseColor;
    CTX.fillRect(-7*PIXELS, -5*PIXELS, 14*PIXELS, 10*PIXELS);
    CTX.strokeRect(-7*PIXELS, -5*PIXELS, 14*PIXELS, 10*PIXELS);

    CTX.lineWidth = 1;
    CTX.beginPath();
    CTX.moveTo(-7*PIXELS, -5*PIXELS);
    CTX.lineTo(-5*PIXELS, -3*PIXELS);
    CTX.moveTo(5*PIXELS, -3*PIXELS);
    CTX.lineTo(7*PIXELS, -5*PIXELS);
    // CTX.moveTo(5*PIXELS, -3*PIXELS);
    CTX.moveTo(5*PIXELS, 3*PIXELS);
    CTX.lineTo(7*PIXELS, 5*PIXELS);
    // CTX.moveTo(5*PIXELS, 3*PIXELS);
    CTX.moveTo(-5*PIXELS, 3*PIXELS);
    CTX.lineTo(-7*PIXELS, 5*PIXELS);
    // CTX.moveTo(-5*PIXELS, 3*PIXELS);
    // CTX.lineTo(-5*PIXELS, -3*PIXELS);
    CTX.stroke();
    CTX.strokeRect(-5*PIXELS, -3*PIXELS, 10*PIXELS, 6*PIXELS);

    CTX.lineWidth = 1;
    CTX.fillStyle = this.barrelColor;
    CTX.fillRect(6*PIXELS, -1*PIXELS, 7*PIXELS, 2*PIXELS);
    CTX.strokeRect(6*PIXELS, -1*PIXELS, 7*PIXELS, 2*PIXELS);

    if (TIME - this.lastFired < this.cooldown) CTX.fillStyle = "red";
    else CTX.fillStyle = "green";
    CTX.fillRect(-4*PIXELS, -2*PIXELS, PIXELS, PIXELS);
    CTX.restore();
}
