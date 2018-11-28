class PointDefenseCannon
{
    constructor(pos, theta, object, range)
    {
        this.pos = pos.slice();
        this.theta = theta;
        this.object = object;
        this.cooldown = PDC_COOLDOWN;
        this.last_fired = -Infinity;
        this.range = range;
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
        let gpos = this.globalPos();
        let theta = -interceptSolution(target.pos,
            target.vel, gpos, PDC_VELOCITY);
        if (isNaN(theta)) return;
        this.fireBullet(theta);
    }

    fireBullet(theta)
    {
        if (TIME - this.last_fired < PDC_COOLDOWN) return;
        this.last_fired = TIME;

        // let max = this.object.theta + this.theta + this.range[1];
        // let min = this.object.theta + this.theta - this.range[1];
        //
        // console.log(theta, min, max);
        //
        // while (theta < -Math.PI) theta += Math.PI*2;
        // while (theta > Math.PI) theta -= Math.PI*2;
        // while (max < -Math.PI) max += Math.PI*2;
        // while (max > Math.PI) max -= Math.PI*2;
        // while (min < -Math.PI) min += Math.PI*2;
        // while (min > Math.PI) min -= Math.PI*2;
        //
        // if (theta > max || theta < min) return;

        let gpos = this.globalPos();

        theta += (Math.random()*2 - 1)*PDC_SPREAD;
        let vel = rot2d([PDC_VELOCITY + Math.random()*10 - 5, 0], theta);
        vel[0] += this.object.vel[0];
        vel[1] += this.object.vel[1];
        let b = new Bullet(gpos, vel, theta, PDC_LENGTH);
        b.world = this.world;
        b.origin = this.object;
        world.push(b);
    }

    draw(ctx)
    {
        ctx.save();
        let gpos = this.globalPos();
        ctx.translate(gpos[0]*PIXELS, gpos[1]*PIXELS);
        ctx.rotate(-this.object.theta - this.theta);

        ctx.strokeStyle = "black";
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 0.5*PIXELS, 0, Math.PI*2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(1*PIXELS, 0);
        ctx.stroke();

        // ctx.save();
        // ctx.rotate(this.range[0]);
        // ctx.beginPath();
        // ctx.moveTo(0, 0);
        // ctx.lineTo(100*PIXELS, 0);
        // ctx.stroke();
        // ctx.restore();
        // ctx.save();
        // ctx.rotate(this.range[1]);
        // ctx.beginPath();
        // ctx.moveTo(0, 0);
        // ctx.lineTo(100*PIXELS, 0);
        // ctx.stroke();
        // ctx.restore();

        ctx.restore();
    }
}
