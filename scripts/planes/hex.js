"use strict"

// hex formulation from https://www.redblobgames.com/grids/hexagons

function get_hex_center(q, r, radius)
{
    let rt3 = Math.sqrt(3);
    let x = radius * (rt3 * q  +  rt3 / 2 * r)
    let y = radius * (1.5 * r);
    return [x, y]
}

// credit to https://observablehq.com/@jrus/hexround
function axial_round(x, y)
{
    const xgrid = Math.round(x), ygrid = Math.round(y);
    x -= xgrid, y -= ygrid; // remainder
    const dx = Math.round(x + 0.5*y) * (x*x >= y*y);
    const dy = Math.round(y + 0.5*x) * (x*x < y*y);
    return [xgrid + dx, ygrid + dy];
}

function get_hex_index(p, radius)
{
    let q = (Math.sqrt(3)/3 * p[0]  -  1./3 * p[1]) / radius;
    let r = (                          2./3 * p[1]) / radius;
    return axial_round(q, r);
}

function Hex(pos, radius)
{
    this.pos = pos;
    this.radius = radius;

    this.corners = [];
    this.normals = [];

    for (let i = 0; i < 6; ++i)
    {
        let a = Math.PI / 6 + Math.PI * 2 * i / 6;
        let p = [Math.cos(a), Math.sin(a)];
        p = add2d(this.pos, mult2d(p, this.radius));
        this.corners.push(p);

        a += Math.PI / 6;
        let d = [Math.cos(a), Math.sin(a)];
        let b = p.slice();
        this.normals.push([b, d]);
    }
}

Hex.prototype.contains = function(p)
{
    let d = distance(p, this.pos);
    if (d > this.radius)
    {
        return false;
    }

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

Hex.prototype.draw = function(rctx, outline, fill)
{
    // rctx.point(this.pos, this.radius, null, "black", 1, 0, 100);
    rctx.polyline([...this.corners, this.corners[0]], 1, null, fill, -100);
    rctx.polyline([...this.corners, this.corners[0]], 0.2, outline, null, 1);
}
