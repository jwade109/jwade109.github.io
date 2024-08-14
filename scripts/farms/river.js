"use strict";

function River(start, dir, n_segments, seglength, width, is_tributary=false)
{
    this.start = start.slice();
    this.width = width;
    this.tributaries = [];
    this.dir = dir;
    this.n_segments = n_segments;
    this.seglength = seglength;
    this.is_tributary = is_tributary;

    this.regen();
}

River.prototype.regen = function()
{
    this.points = [this.start];
    this.tributaries = [];
    let curve_rate = 0;

    let delta = mult2d(this.dir, this.seglength);

    let width = this.width;

    for (let i = 0; i < this.n_segments; ++i)
    {
        let p = this.points[this.points.length - 1];
        p = add2d(p, delta);
        this.points.push(p);
        delta = rot2d(delta, curve_rate);
        curve_rate += rand(-0.004, 0.004);
        curve_rate = clamp(curve_rate, -0.03, 0.03);

        if (width > 10 && rand() < 0.05 && !this.is_tributary)
        {
            let w = randint(12, 20);
            let d = rot2d(unit2d(delta), rand(-0.3, 0.3));
            let base = new River(p, unit2d(delta), this.width,       this.seglength, width - 3, false);
            let tr   = new River(p, d,             randint(60, 120), this.seglength, w,         true);
            this.tributaries.push(base);
            this.tributaries.push(tr);
            break;
        }
    }
}

River.prototype.draw = function(rctx)
{
    rctx.polyline(this.points, 100, "#e5d3b3",  null, -1);
    rctx.polyline(this.points, this.width, "lightblue",  null, 1);
    rctx.polyline(this.points, this.width * 0.85, "blue", null, 2);
    rctx.polyline(this.points, this.width * 0.7,  "darkblue", null, 3);
    for (let tr of this.tributaries)
    {
        tr.draw(rctx);
    }
}
