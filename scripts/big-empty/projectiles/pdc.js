// pdc.js

const PDC_SPREAD = 1*Math.PI/180;
const PDC_VELOCITY = 2000;
const PDC_COOLDOWN = 1/30;
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
        this.radius = radius;
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
        if (target == null) return NaN;
        if (distance(target.pos, this.globalPos()) > this.radius)
        {
            // if (this.object === PLAYER_SHIP)
            // throwAlert("Cannot fire PDC -- target exceeds tracking range.",
            //     ALERT_DISPLAY_TIME);
            return NaN;
        }

        let gpos = this.globalPos();
        let rvel = sub2d(target.vel, this.object.vel);
        let theta = -interceptSolution(target.pos,
            rvel, gpos, PDC_VELOCITY);
        if (isNaN(theta))
        {
            // throwAlert("Cannot fire PDC -- intercept solution not found.",
            //     ALERT_DISPLAY_TIME);
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

        if (TIME - this.last_fired < PDC_COOLDOWN && Math.random() < 0.99)
            return;
        this.last_fired = TIME;

        let gpos = this.globalPos();
        let noisy = theta + (Math.random()*2 - 1)*PDC_SPREAD;
        let vel = rot2d([PDC_VELOCITY + Math.random()*10 - 5, 0], noisy);
        vel[0] += this.object.vel[0];
        vel[1] += this.object.vel[1];
        let b = new Bullet(gpos.slice(), vel, noisy);
        b.origin = this.object;
        b.faction = this.object.faction;
        WORLD.push(b);
        this.gamma = theta - this.theta - this.object.theta;
    }

    draw(opacity)
    {
        CTX.save();
        let gpos = this.globalPos();
        CTX.translate(gpos[0]*PIXELS, gpos[1]*PIXELS);
        CTX.rotate(-this.object.theta - this.theta);

        if (DRAW_FIRING_ARC)
        {
            CTX.save();
            CTX.moveTo(0, 0);
            CTX.lineTo(this.radius*PIXELS, 0);
            CTX.strokeStyle = "red";
            CTX.globalAlpha = 0.2*opacity;
            // CTX.stroke();
            CTX.fillStyle = "orange";
            CTX.beginPath()
            CTX.moveTo(0, 0);
            CTX.arc(0, 0, this.radius*PIXELS,
                this.range[0], this.range[1], false);
            CTX.lineTo(0, 0);
            CTX.fill();
            CTX.restore();
        }

        if (!this.nodraw)
        {
            CTX.rotate(-this.gamma);

            CTX.strokeStyle = "black";
            CTX.fillStyle = this.baseColor;
            CTX.globalAlpha = opacity;
            CTX.fillRect(-0.3*PIXELS, -0.8*PIXELS, 0.6*PIXELS, 1.4*PIXELS);
            CTX.strokeRect(-0.3*PIXELS, -0.8*PIXELS, 0.6*PIXELS, 1.4*PIXELS);

            CTX.fillStyle = this.barrelColor;
            CTX.beginPath();
            CTX.moveTo(0, 0);
            CTX.rect(-0.15*PIXELS, -0.15*PIXELS, 1.3*PIXELS, 0.3*PIXELS);
            CTX.fill();
            CTX.stroke();

            CTX.fillStyle = this.magColor;
            CTX.fillRect(-0.5*PIXELS, -0.9*PIXELS, 1*PIXELS, 0.6*PIXELS);
            CTX.strokeRect(-0.5*PIXELS, -0.9*PIXELS, 1*PIXELS, 0.6*PIXELS);
            CTX.fillRect(-0.5*PIXELS, 0.3*PIXELS, 1*PIXELS, 0.6*PIXELS);
            CTX.strokeRect(-0.5*PIXELS, 0.3*PIXELS, 1*PIXELS, 0.6*PIXELS);
        }
        CTX.restore();
    }
}
