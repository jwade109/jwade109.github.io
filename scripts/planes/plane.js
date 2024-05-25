"use strict"

function Plane()
{
    this.pos = [rand(-50, 50), rand(-50, 50)];
    this.turn_rate = rand(-0.1, 0.1);
    this.heading = rand(0, 2 * Math.PI);
    this.vel = rand(2, 8);

    this.history = [];
}

Plane.prototype.step = function(dt)
{
    this.history.push(this.pos.slice());
    if (this.history.length > 200)
    {
        this.history = this.history.slice(-200);
    }

    this.heading += this.turn_rate * dt;
    this.turn_rate += rand(-0.06, 0.06) * dt;
    this.turn_rate = clamp(this.turn_rate, -0.4, 0.4);
    let delta = rot2d([this.vel, 0], this.heading);
    this.pos = add2d(this.pos, mult2d(delta, dt));
}

Plane.prototype.draw = function(rctx)
{
    rctx.polyline(this.history);
    rctx.point(this.pos);
}
