class PointDefenseCannon
{
    constructor(pos, theta, object, range)
    {
        this.pos = pos.slice();
        this.theta = theta;
        this.gamma = 0;
        this.object = object;
        this.cooldown = PDC_COOLDOWN;
        this.last_fired = -Infinity;
        this.range = range;
        this.color = "gray";
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
        let gun_orient = this.object.theta + this.theta;
        let min = gun_orient + this.range[0];
        let max = gun_orient + this.range[1];

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
        let b = new Bullet(gpos, vel, noisy, PDC_LENGTH);
        b.world = this.world;
        b.origin = this.object;
        world.push(b);

        this.gamma = theta - this.theta - this.object.theta;
    }

    draw(ctx)
    {
        ctx.save();
        let gpos = this.globalPos();
        ctx.translate(gpos[0]*PIXELS, gpos[1]*PIXELS);
        ctx.rotate(-this.object.theta - this.theta);

        if (DRAW_PDC_FIRING_ARC)
        {
            let radius = 100;
            ctx.fillStyle = "orange";
            ctx.globalAlpha = 0.2;
            ctx.save();
            ctx.rotate(this.range[0]);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(radius*PIXELS, 0);

            ctx.arc(0, 0, radius*PIXELS, 0, this.range[1] - this.range[0]);
            ctx.lineTo(0, 0);
            ctx.fill();
            ctx.restore();
        }

        ctx.rotate(-this.gamma);

        ctx.strokeStyle = "black";
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 0.9*PIXELS, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        // ctx.lineTo(1*PIXELS, 0);
        ctx.rect(0.5*PIXELS, -0.1*PIXELS, 1.2*PIXELS, 0.2*PIXELS);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}
