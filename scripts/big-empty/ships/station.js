class Station
{
    constructor(pos, theta)
    {
        this.pos = pos;
        this.pos_prev = pos;
        this.theta = theta;
        this.vel = [0, 0];
        this.size = 500;
        this.permanent = true;

        this.box = new Hitbox([[this.size/4, this.size/4],
                               [this.size/4, -this.size/4],
                               [-this.size/4, -this.size/4],
                               [-this.size/4, this.size/4]]);
        this.box.object = this;

        this.pdcs = [];
        for (let theta = 0; theta < Math.PI*2; theta += Math.PI/3)
        {
            let pos = [Math.cos(theta)*this.size, -Math.sin(theta)*this.size];
            this.pdcs.push(new PointDefenseCannon(
                pos, theta, this, [-Math.PI, Math.PI], 1000));
        }
    }

    step(dt)
    {
        let candidates = [];
        for (let obj of WORLD)
        {
            if (!(obj instanceof Debris)) continue;
            if (obj.radius < SMALL_DEBRIS) continue;
            let dist = distance(this.pos, obj.pos);
            if (dist < 2500) candidates.push(obj);
        }

        for (let pdc of this.pdcs)
        {
            let best = null, min = Infinity;
            for (let obj of candidates)
            {
                let dist = distance(obj.pos, pdc.globalPos());
                if (dist < min)
                {
                    best = obj;
                    min = dist;
                }
            }
            if (best != null) pdc.intercept(best);
        }

        this.pos_prev = this.pos.slice();
        this.pos[0] += this.vel[0]*dt;
        this.pos[1] += this.vel[1]*dt;
    }

    draw(ctx)
    {
        let PIX_SIZE = this.size*PIXELS;

        ctx.save();
        ctx.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
        ctx.rotate(this.theta);

        ctx.globalAlpha = 1;
        ctx.strokeStyle = "black";
        ctx.fillStyle = "lightgray";
        ctx.beginPath();
        ctx.arc(0, 0, PIX_SIZE, 0, Math.PI*2, false);
        ctx.arc(0, 0, PIX_SIZE*0.7, 0, Math.PI*2, true);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "blue";
        ctx.globalAlpha = 0.3;
        ctx.arc(0, 0, PIX_SIZE*0.92, 0, Math.PI*2, false);
        ctx.arc(0, 0, PIX_SIZE*0.90, 0, Math.PI*2, true);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "white";
        ctx.globalAlpha = 1;
        ctx.arc(0, 0, PIX_SIZE*0.98, 0, Math.PI*2, false);
        ctx.arc(0, 0, PIX_SIZE*0.95, 0, Math.PI*2, true);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.globalAlpha = 0.6;
        let segments = 60, dtheta = Math.PI*2/segments, prop = 0.2;
        for (let i = 0; i < Math.PI*2; i += dtheta)
        {
            ctx.beginPath();
            ctx.arc(0, 0, PIX_SIZE*0.83, i, i + dtheta*prop, false);
            ctx.arc(0, 0, PIX_SIZE*0.75, i + dtheta*prop, i, true);
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(0, 0, PIX_SIZE, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, PIX_SIZE*0.7, 0, Math.PI*2);
        ctx.stroke();

        ctx.save();
        ctx.strokeStyle = "black";
        ctx.fillStyle = "darkgray";
        ctx.globalAlpha = 1;
        for (let i = 0; i < 3; ++i)
        {
            ctx.fillRect(-20*PIXELS, -PIX_SIZE*0.77,
                          40*PIXELS, PIX_SIZE*0.77);
            ctx.strokeRect(-20*PIXELS, -PIX_SIZE*0.77,
                            40*PIXELS, PIX_SIZE*0.77);
            ctx.rotate(2*Math.PI/3);
        }
        ctx.restore();

        ctx.strokeStyle = "black";
        ctx.fillStyle = "darkgray";
        ctx.globalAlpha = 1;
        ctx.fillRect(-PIX_SIZE/4, -PIX_SIZE/4,
                      PIX_SIZE/2, PIX_SIZE/2);
        ctx.strokeRect(-PIX_SIZE/4, -PIX_SIZE/4,
                        PIX_SIZE/2, PIX_SIZE/2);
        ctx.fillStyle = "white";
        ctx.globalAlpha = 1;
        ctx.fillRect(-PIX_SIZE/4.4, -PIX_SIZE/4.4,
                      2*PIX_SIZE/4.4, 2*PIX_SIZE/4.4);
        ctx.fillStyle = "darkgray";
        ctx.globalAlpha = 1;
        ctx.fillRect(-PIX_SIZE/4.6, -PIX_SIZE/4.6,
                      2*PIX_SIZE/4.6, 2*PIX_SIZE/4.6);
        // ctx.fillStyle = "red";
        // ctx.globalAlpha = 0.3;
        // ctx.fillRect(-PIX_SIZE/5, -PIX_SIZE/5,
        //               2*PIX_SIZE/5, 2*PIX_SIZE/5);
        // ctx.fillStyle = "darkgray";
        // ctx.globalAlpha = 1;
        // ctx.fillRect(-PIX_SIZE/6, -PIX_SIZE/6,
        //               2*PIX_SIZE/6, 2*PIX_SIZE/6);

        ctx.restore();
        if (DRAW_HITBOX) this.box.draw(ctx);
        for (let pdc of this.pdcs) pdc.draw(ctx);
    }
}
