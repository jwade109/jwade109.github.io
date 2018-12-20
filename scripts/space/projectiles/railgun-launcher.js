// railgun-launcher.js

const RAILGUN_VEL = 20000;
const RAILGUN_COOLDOWN = 5;
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

RailgunLauncher.prototype.draw = function(ctx)
{
    if (this.nodraw) return;
    ctx.save();
    let gpos = this.globalPos();
    ctx.translate(gpos[0]*PIXELS, gpos[1]*PIXELS);
    ctx.rotate(-this.object.theta - this.theta);

    if (DRAW_FIRING_ARC)
    {
        ctx.save();
        ctx.fillStyle = "blue";
        ctx.strokeStyle = "black";
        ctx.globalAlpha = 0.2;
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 3000*PIXELS, this.range[0], this.range[1], false);
        ctx.lineTo(0, 0);
        ctx.fill();
        ctx.rotate(-this.gamma);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(3000*PIXELS, 0);
        ctx.stroke();
        ctx.restore();
    }

    if (!PLAYER_WEAPON_SELECT)
    {
        ctx.save();
        ctx.strokeStyle = "red";
        ctx.globalAlpha = 0.2;
        ctx.rotate(-this.gamma);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        if (TIME - this.lastFired < this.cooldown)
            CTX.setLineDash([10*PIXELS, 20*PIXELS]);
        ctx.lineTo(2000*PIXELS, 0);
        ctx.stroke();
        ctx.restore();

        if (TARGET_OBJECT != null && SLOW_TIME)
        {
            let rvel = sub2d(TARGET_OBJECT.vel, this.object.vel);
            let theta = -interceptSolution(TARGET_OBJECT.pos,
                rvel, this.globalPos(), RAILGUN_VEL);
            let pointing = this.object.theta + this.theta + this.gamma;
            while (theta < this.gamma - Math.PI) theta += Math.PI*2;
            while (theta > this.gamma + Math.PI) theta -= Math.PI*2;
            CTX.save();
            CTX.rotate(-theta + this.object.theta);
            CTX.globalAlpha = 0.2;
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
    }

    ctx.rotate(-this.gamma);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "black";

    ctx.fillStyle = this.baseColor;
    ctx.fillRect(-7*PIXELS, -5*PIXELS, 14*PIXELS, 10*PIXELS);
    ctx.strokeRect(-7*PIXELS, -5*PIXELS, 14*PIXELS, 10*PIXELS);

    ctx.beginPath();
    ctx.moveTo(-7*PIXELS, -5*PIXELS);
    ctx.lineTo(-5*PIXELS, -3*PIXELS);
    ctx.lineTo(5*PIXELS, -3*PIXELS);
    ctx.lineTo(7*PIXELS, -5*PIXELS);
    ctx.moveTo(5*PIXELS, -3*PIXELS);
    ctx.lineTo(5*PIXELS, 3*PIXELS);
    ctx.lineTo(7*PIXELS, 5*PIXELS);
    ctx.moveTo(5*PIXELS, 3*PIXELS);
    ctx.lineTo(-5*PIXELS, 3*PIXELS);
    ctx.lineTo(-7*PIXELS, 5*PIXELS);
    ctx.moveTo(-5*PIXELS, 3*PIXELS);
    ctx.lineTo(-5*PIXELS, -3*PIXELS);
    ctx.stroke();

    ctx.fillStyle = this.barrelColor;
    ctx.fillRect(6*PIXELS, -1*PIXELS, 7*PIXELS, 2*PIXELS);
    ctx.strokeRect(6*PIXELS, -1*PIXELS, 7*PIXELS, 2*PIXELS);

    if (TIME - this.lastFired < this.cooldown) ctx.fillStyle = "red";
    else ctx.fillStyle = "green";
    ctx.fillRect(-4*PIXELS, -2*PIXELS, PIXELS, PIXELS);
    ctx.restore();
}
