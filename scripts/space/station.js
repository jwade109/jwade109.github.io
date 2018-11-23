class Station
{
    constructor(pos, theta)
    {
        this.pos = pos;
        this.pos_prev = pos;
        this.theta = theta;
        this.vel = [0, 0];
        this.size = 500;

        this.box = new Hitbox([[this.size/2, this.size/2],
                               [this.size/2, -this.size/2],
                               [-this.size/2, -this.size/2],
                               [-this.size/2, this.size/2]]);
        this.box.object = this;

        this.permanent = true;
    }

    step(dt)
    {
        this.pos_prev = this.pos.slice();
        this.pos[0] += this.vel[0]*dt;
        this.pos[1] += this.vel[1]*dt;
    }

    draw(ctx)
    {
        ctx.save();
        ctx.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
        ctx.rotate(this.theta);

        ctx.globalAlpha = 1;
        ctx.strokeStyle = "black";
        ctx.fillStyle = "lightgray";
        ctx.beginPath();
        ctx.arc(0, 0, this.size*PIXELS, 0, Math.PI*2, false);
        ctx.arc(0, 0, this.size*PIXELS*0.7, 0, Math.PI*2, true);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.globalAlpha = 0.3;
        ctx.arc(0, 0, this.size*PIXELS*0.92, 0, Math.PI*2, false);
        ctx.arc(0, 0, this.size*PIXELS*0.90, 0, Math.PI*2, true);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "white";
        ctx.globalAlpha = 1;
        ctx.arc(0, 0, this.size*PIXELS*0.98, 0, Math.PI*2, false);
        ctx.arc(0, 0, this.size*PIXELS*0.95, 0, Math.PI*2, true);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.globalAlpha = 0.6;
        let segments = 60, dtheta = Math.PI*2/segments, prop = 0.2;
        for (let i = 0; i < Math.PI*2; i += dtheta)
        {
            ctx.beginPath();
            ctx.arc(0, 0, this.size*PIXELS*0.83, i, i + dtheta*prop, false);
            ctx.arc(0, 0, this.size*PIXELS*0.75, i + dtheta*prop, i, true);
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(0, 0, this.size*PIXELS, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.size*PIXELS*0.7, 0, Math.PI*2);
        ctx.stroke();

        ctx.restore();
        if (DRAW_HITBOX) this.box.draw(ctx);
    }
}
