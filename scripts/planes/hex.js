"use strict"

function get_hex_center(i, j, radius, angle)
{
    let x = [radius * i * 2, 0];
    let oblique = rot2d([radius * 2, 0], Math.PI / 3);
    return rot2d(add2d(x, mult2d(oblique, j)), -angle);
}

function Hex(pos, radius, angle)
{
    this.pos = pos;
    this.radius = radius;
    this.angle = angle;

    this.corners = [];
    this.normals = [];

    for (let i = 0; i < 6; ++i)
    {
        let a = this.angle + Math.PI / 6 + Math.PI * 2 * i / 6;
        let p = [Math.cos(a), Math.sin(a)];
        p = add2d(this.pos, mult2d(p, this.radius / Math.sin(Math.PI / 3)));
        this.corners.push(p);

        a += Math.PI / 6;
        let d = [Math.cos(a), Math.sin(a)];
        let b = p.slice();
        this.normals.push([b, d]);
    }
}

Hex.prototype.contains = function(p)
{
    for (let [base, udir] of this.normals)
    {
        let diff = sub2d(base, p);
        let dot = dot2d(diff, udir);
        if (dot < 0)
        {
            return false;
        }
    }

    return true;
}

Hex.prototype.draw = function(rctx, fill)
{
    // rctx.point(this.pos, this.radius, null, "black", 1, 0, 100);
    rctx.polyline([...this.corners, this.corners[0]], 1, null, fill, -100);
    rctx.polyline([...this.corners, this.corners[0]], 0.2, "black", null, 1);
}
