// pdc.js

const PDC_LENGTH = 1.2;
const PDC_SPREAD = 1.5*Math.PI/180;
const PDC_VELOCITY = 800;
const PDC_COOLDOWN = 1/50;
const PDC_DAMAGE = 1;
const PDC_MAX_RANGE = 500;
var DRAW_FIRING_ARC = false;

class PointDefenseCannon
{
    constructor(pos, theta, object, range, radius)
    {
        this.pos = pos.slice();
        this.theta = theta;
        this.gamma = 0;
        this.object = object;
        this.cooldown = PDC_COOLDOWN;
        this.last_fired = -Infinity;
        this.range = range;
        this.radius = Math.min(radius, PDC_MAX_RANGE);
        this.barrelColor = "gray";
        this.magColor = "gray";
        this.baseColor = "gray";
        this.nodraw = false;
    }

    globalPos()
    {
        let pos = this.object.pos.slice();
        let off = rot2d(this.pos, this.object.theta);
        pos[0] += off[0];
        pos[1] += off[1];
        return pos;
    }

    fireAt(target)
    {
        let gpos = this.globalPos();
        let theta = Math.atan2(target[0] - gpos[0],
                               target[1] - gpos[1]) - Math.PI/2;
        this.fireBullet(theta);
    }

    intercept(target)
    {
        if (distance(target.pos, this.globalPos()) > this.radius)
        {
            if (this.object === PLAYER_SHIP)
            throwAlert("Cannot fire PDC -- target exceeds tracking range.",
                ALERT_DISPLAY_TIME);
            return NaN;
        }

        let gpos = this.globalPos();
        let rvel = sub2d(target.vel, this.object.vel);
        let theta = -interceptSolution(target.pos,
            rvel, gpos, PDC_VELOCITY);
        if (isNaN(theta))
        {
            throwAlert("Cannot fire PDC -- intercept solution not found.",
                ALERT_DISPLAY_TIME);
            return NaN;
        }
        this.fireBullet(theta);
    }

    fireBullet(theta)
    {
        let gun_orient = this.object.theta + this.theta;
        let min = gun_orient - this.range[1];
        let max = gun_orient - this.range[0];

        while (theta < gun_orient - Math.PI) theta += Math.PI*2;
        while (theta > gun_orient + Math.PI) theta -= Math.PI*2;
        if (theta > max || theta < min) return;

        if (TIME - this.last_fired < PDC_COOLDOWN) return;
        this.last_fired = TIME;

        let gpos = this.globalPos();
        let noisy = theta + (Math.random()*2 - 1)*PDC_SPREAD;
        let vel = rot2d([PDC_VELOCITY + Math.random()*10 - 5, 0], noisy);
        vel[0] += this.object.vel[0];
        vel[1] += this.object.vel[1];
        let b = new Bullet(gpos.slice(), vel, noisy, PDC_LENGTH);
        b.origin = this.object;
        WORLD.push(b);
        WORLD.push(new Explosion(gpos,
            this.object.vel.slice(), Math.random()*2 + 5));

        this.gamma = theta - this.theta - this.object.theta;
    }

    draw(ctx)
    {
        ctx.save();
        let gpos = this.globalPos();
        ctx.translate(gpos[0]*PIXELS, gpos[1]*PIXELS);
        ctx.rotate(-this.object.theta - this.theta);

        if (DRAW_FIRING_ARC)
        {
            ctx.save();
            ctx.rotate(-this.gamma);
            ctx.fillStyle = "orange";
            ctx.strokeStyle = "black";
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.radius*PIXELS, 0);
            ctx.stroke();
            ctx.rotate(this.gamma);
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.radius*PIXELS,
                this.range[0], this.range[1], false);
            ctx.lineTo(0, 0);
            ctx.fill();
            ctx.restore();
        }

        if (!this.nodraw)
        {
            ctx.rotate(-this.gamma);

            ctx.strokeStyle = "black";
            ctx.fillStyle = this.baseColor;
            ctx.globalAlpha = 1;
            ctx.fillRect(-0.2*PIXELS, -0.6*PIXELS, 0.4*PIXELS, 1.2*PIXELS);
            ctx.strokeRect(-0.2*PIXELS, -0.6*PIXELS, 0.4*PIXELS, 1.2*PIXELS);

            ctx.fillStyle = this.barrelColor;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.rect(-0.1*PIXELS, -0.1*PIXELS, 1.2*PIXELS, 0.2*PIXELS);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = this.magColor;
            ctx.fillRect(-0.5*PIXELS, -0.9*PIXELS, 1*PIXELS, 0.6*PIXELS);
            ctx.strokeRect(-0.5*PIXELS, -0.9*PIXELS, 1*PIXELS, 0.6*PIXELS);
            ctx.fillRect(-0.5*PIXELS, 0.3*PIXELS, 1*PIXELS, 0.6*PIXELS);
            ctx.strokeRect(-0.5*PIXELS, 0.3*PIXELS, 1*PIXELS, 0.6*PIXELS);
        }
        ctx.restore();
    }
}
