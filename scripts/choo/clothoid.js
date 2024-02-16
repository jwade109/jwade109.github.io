"use strict"

function Clothoid(start_point, end_point, start_curvature, end_curvature)
{
    this.start_point     = start_point;
    this.end_point       = end_point;
    this.start_curvature = start_curvature;
    this.end_curvature   = end_curvature;
    this.pointing        = unit2d(sub2d(end_point, start_point));
}

Clothoid.prototype.line = function(t)
{
    return lerp2d(this.start_point, this.end_point, t);
}

Clothoid.prototype.line = function(t)
{
    return lerp2d(this.start_point, this.end_point, t);
}

Clothoid.prototype.curvature = function(t)
{
    return lerp(this.start_curvature, this.end_curvature, t);
}

Clothoid.prototype.radius = function(t)
{
    let p = this.curvature(t);
    if (p == 0)
    {
        return 0;
    }
    return 1 / p;
}

Clothoid.prototype.draw = function(ctx)
{
    ctx.save();
    ctx.strokeStyle = "black";
    ctx.fillStyle = "black";

    let r1 = Math.abs(this.radius(0));
    let r2 = Math.abs(this.radius(1));

    ctx.beginPath();
    ctx.arc(this.start_point[0], this.start_point[1], r1, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.end_point[0], this.end_point[1], r2, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.start_point[0], this.start_point[1]);
    ctx.lineTo(this.end_point[0],   this.end_point[1]);
    ctx.stroke();

    ctx.restore();

    for (let t = 0; t <= 1; t += 0.05)
    {
        let p = this.line(t);
        let r = Math.abs(this.radius(t));
        ctx.beginPath();
        ctx.arc(p[0], p[1], r, 0, 2 * Math.PI);
        ctx.stroke();
    }

    // ctx.beginPath();
    // ctx.globalAlpha = 0.3;
    // for (let i = 0; i < this.handles.length; i++)
    // {
    //     let pos = this.handles[i];
    //     if (i == 0)
    //     {
    //         ctx.moveTo(pos[0], pos[1]);
    //     }
    //     else
    //     {
    //         ctx.lineTo(pos[0], pos[1]);
    //     }
    // }
    // ctx.stroke();
    // ctx.beginPath();
    // ctx.globalAlpha = 1;
    // ctx.lineWidth = 3;
    // let n = 500;
    // for (let t = 0; t <= n; t++)
    // {
    //     let pos = this.evaluate(t/n);
    //     if (t == 0)
    //     {
    //         ctx.moveTo(pos[0], pos[1]);
    //     }
    //     else
    //     {
    //         ctx.lineTo(pos[0], pos[1]);
    //     }
    // }
    // ctx.stroke();
    // ctx.strokeStyle = "red";
    // for (let i = 0; i < this.handles.length; i++)
    // {
    //     let pos = this.handles[i];
    //     ctx.beginPath();
    //     ctx.arc(pos[0], pos[1], 3, 0, 2 * Math.PI);
    //     ctx.stroke();
    // }
}