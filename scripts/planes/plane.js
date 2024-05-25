"use strict"

function Plane()
{
    this.pos = [rand(-200, 200), rand(-200, 200)];
    this.turn_rate = rand(-0.1, 0.1);
    this.heading = rand(0, 2 * Math.PI);
    this.vel = rand(14, 20);

    this.history = [];
}

Plane.prototype.step = function(dt)
{
    if (rand() < 0.01)
    {
        this.turn_rate = rand(-0.4, 0.4);
    }

    this.history.push(this.pos.slice());
    if (this.history.length > 200)
    {
        this.history = this.history.slice(-200);
    }

    this.heading += this.turn_rate * dt;
    let delta = rot2d([this.vel, 0], this.heading);
    this.pos = add2d(this.pos, mult2d(delta, dt));
}

Plane.prototype.draw = function(rctx)
{
    rctx.polyline(this.history, 0.3);
    rctx.point(this.pos);
}
