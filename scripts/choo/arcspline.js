"use strict"

let DEBUG_DRAW_ARCSPLINE_OSCULATING_CIRCLES = false;

function Arcspline(pos, dir, radii, arclengths)
{
    this.pos = pos;
    this.dir = dir;
    this.radii = radii;
    this.arclengths = arclengths;
    this.arclength = 0;

    for (let al of this.arclengths)
    {
        this.arclength += al;
    }

    this.centers = [];
    this.start_angles = [];
    this.delta_angles = [];

    let p = this.pos.slice();
    let tangent = unit2d(this.dir);
    let total_angle = -anglebtwn(tangent, [0, 1]);

    this.handles = [p];

    for (let i = 0; i < this.radii.length; ++i)
    {
        let r = this.radii[i];
        let al = this.arclengths[i];
        if (r === Infinity)
        {
            // this is just a line
            p = add2d(p, mult2d(tangent, al));
            this.handles.push(p);
            this.centers.push(null);
            this.start_angles.push(null);
            this.delta_angles.push(null);
            continue;
        }

        let normal = rot2d(tangent, -Math.PI / 2);
        let center = add2d(p, mult2d(normal, r));

        this.centers.push(center);

        let angle = al / r;
        total_angle += angle;
        tangent = rot2d(tangent, -angle);
        normal = rot2d(tangent, -Math.PI / 2);

        this.start_angles.push(total_angle - angle);
        this.delta_angles.push(angle);

        p = add2d(center, mult2d(normal, -r));
        this.handles.push(p);
    }
}

Arcspline.prototype.evaluate = function(t)
{
    if (t < 0 || t > this.radii.length)
    {
        return null;
    }

    let i = Math.floor(t);
    if (i == this.radii.length)
    {
        return this.handles[i];
    }

    let tt = t % 1.0;
    let r = this.radii[i];
    if (r === Infinity)
    {
        return lerp2d(this.handles[i], this.handles[i+1], tt);
    }
    let c = this.centers[i];
    let a = this.start_angles[i];
    let b = a + this.delta_angles[i];
    let angle = lerp(a, b, tt);
    return add2d(c, [r * Math.cos(angle), r * Math.sin(angle)]);
}

Arcspline.prototype.s_to_t = function(s)
{
    if (s < 0 || s > this.arclength)
    {
        return null;
    }

    let i = 0;
    for (; i < this.radii.length; ++i)
    {
        let al = this.arclengths[i];
        if (s < al)
        {
            break;
        }
        s -= al;
    }
    return i + s / this.arclengths[i];
}

Arcspline.prototype.draw = function(rctx)
{
    let tangent = unit2d(this.dir);
    let total_angle = -anglebtwn(tangent, [0, 1]);

    for (let i = 0; i < this.radii.length; ++i)
    {
        let r = this.radii[i];
        let center = this.centers[i];
        rctx.point(this.handles[i], 6, "black");

        if (r === Infinity)
        {
            rctx.polyline([this.handles[i], this.handles[i+1]], 4, "black");
            continue;
        }

        let r_abs = Math.abs(r);
        if (DEBUG_DRAW_ARCSPLINE_OSCULATING_CIRCLES)
        {
            rctx.point(center, r_abs, null, "lightgray", 1, 0, -100);
        }
        rctx.arc(center, r_abs, 4, "black", this.start_angles[i], this.delta_angles[i]);
    }
    rctx.point(this.handles[this.handles.length - 1], 6, "black");
}
