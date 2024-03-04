"use strict"

function Arcspline(pos, dir, radii, arclengths)
{
    this.pos = pos;
    this.dir = dir;
    this.radii = radii;
    this.arclengths = arclengths;
}

Arcspline.prototype.draw = function(rctx)
{
    let p = this.pos.slice();
    let tangent = unit2d(this.dir);
    let total_angle = -anglebtwn(tangent, [0, 1]);

    for (let i = 0; i < this.radii.length; ++i)
    {
        let r = this.radii[i];
        let al = this.arclengths[i];
        rctx.point(p, 6, "black");
        if (r === Infinity)
        {
            // this is just a line
            let p_old = p.slice();
            p = add2d(p, mult2d(tangent, al));
            rctx.polyline([p_old, p], 4, "black");
            continue;
        }

        let r_abs = Math.abs(r);
        let normal = rot2d(tangent, -Math.PI / 2);
        let center = add2d(p, mult2d(normal, r));
        rctx.point(center, r_abs, null, "lightgray", 1, 0, -100);
        let angle = al / r;
        total_angle += angle;
        tangent = rot2d(tangent, -angle);
        normal = rot2d(tangent, -Math.PI / 2);

        rctx.arc(center, r_abs, 4, "black", total_angle - angle, angle);

        p = add2d(center, mult2d(normal, -r));
    }

    rctx.point(p, 6, "black");

    // for (let r of linspace(100, 1000, 6))
    // {
    //     for (let al of linspace(0, 400, 100))
    //     {
    //         let p = point_along_circle(r, al, 10 / 180 * Math.PI);
    //         rctx.point(p, 3);
    //     }
    // }

    // let p = this.start.slice();
    // for (let arc of this.arcs)
    // {
    //     let r = 1 / arc.curvature;
    //     console.log(r);
    //     rctx.point(p, r, "black");
    // }
}
