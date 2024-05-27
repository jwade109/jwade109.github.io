"use strict"

function Plane()
{
    this.pos = [rand(-200, 200), rand(-200, 200)];
    this.turn_rate = 0;
    this.target_turn_rate = rand(-0.1, 0.1);
    this.heading = rand(0, 2 * Math.PI);
    this.vel = rand(14, 20);

    this.returning = false;

    this.history = [];
    this.history_downsample = 0;

    this.color = rgb(randint(100, 200), randint(100, 200), randint(100, 200));
    console.log(this.color);
}

Plane.prototype.step = function(dt)
{
    if (!this.returning && rand() < 0.01)
    {
        this.target_turn_rate = rand(-0.4, 0.4);
    }

    let delta = rot2d([this.vel, 0], this.heading);
    if (norm2d(this.pos) > 100 && dot2d(delta, this.pos) > 0)
    {
        if (!this.returning)
        {
            let sign = rand() < 0.5 ? 1 : -1;
            this.target_turn_rate = sign * rand(0.2, 0.4);
            this.returning = true;
        }
    }
    else
    {
        this.returning = false;
    }

    this.turn_rate += (this.target_turn_rate - this.turn_rate) * 0.1;

    this.heading += this.turn_rate * dt;
    this.pos = add2d(this.pos, mult2d(delta, dt));

    this.history_downsample += 1;
    if (this.history_downsample % 6 == 0)
    {
        this.history.push(this.pos.slice());
        if (this.history.length > 40)
        {
            this.history = this.history.slice(-40);
        }
    }
}

Plane.prototype.draw = function(rctx)
{
    let forward = rot2d([1, 0], this.heading);
    let left = rot2d([0, 1], this.heading);

    function local(self, fmul, lmul, scale=false)
    {
        if (scale)
        {
            lmul *= lerp(1, 0.6, Math.abs(self.turn_rate) / 0.4);
        }
        return add2d(add2d(self.pos, mult2d(forward, fmul)), mult2d(left, lmul));
    }

    rctx.polyline([
        local(this,  0.6,  0, true),
        local(this, -0.4,  2, true),
        local(this, -0.1,  0, true),
        local(this, -0.4, -2, true),
    ], 0, null, "black", 100);

    rctx.polyline([
        local(this, -1,      0, true),
        local(this, -1.5,  0.9, true),
        local(this, -1.5, -0.9, true)
    ], 0, null, "black", 100);

    rctx.polyline([
        local(this,   2,    0.2),
        local(this,   2.2,    0),
        local(this,   2,   -0.2),
        local(this,  -1.3, -0.2),
        local(this,  -1.3,  0.2),
    ], 0, null, "black", 100);

    rctx.polyline([...this.history, this.pos], 1, this.color, null, 90);
}
