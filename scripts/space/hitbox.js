// hitbox.js

var DRAW_HITBOX = false;

class Hitbox
{
    constructor(points)
    {
        this.points = points.slice();
        this.object = null;
    }

    contains(point)
    {
        return isInside(this.get_global(), point);
    }

    intersects(hitbox)
    {
        for (let op of hitbox.get_global())
        {
            if (this.contains(op)) return true;
        }
        for (let p of this.get_global())
        {
            if (hitbox.contains(p)) return true;
        }
        return false;
    }

    trace_intersect(p1, q1)
    {
        let glob = this.get_global();
        for (let i = 0; i < glob.length - 1; ++i)
        {
            let x = glob[i], y = glob[i+1];
            if (doIntersect(p1, q1, x, y)) return true;
        }
        return doIntersect(p1, q1, glob[0], glob[glob.length - 1]);
    }

    draw(ctx)
    {
        ctx.save();
        ctx.strokeStyle = "green";
        ctx.globalAlpha = 1;
        ctx.beginPath();
        let pts = this.get_global();
        ctx.moveTo(pts[pts.length - 1][0]*PIXELS,
                   pts[pts.length - 1][1]*PIXELS);
        for (let p of pts)
        {
            ctx.lineTo(p[0]*PIXELS, p[1]*PIXELS);
        }
        ctx.stroke();
        ctx.restore();
    }

    get_global()
    {
        let global_points = [];
        for (let p of this.points)
        {
            let rp = rot2d(p, this.object.theta + Math.PI/2);
            let gp = this.object.pos.slice();
            global_points.push([gp[0] + rp[0], gp[1] + rp[1]]);
        }

        return global_points;
    }
}

// Given three colinear points p, q, r, the function checks if
// point q lies on line segment 'pr'
function onSegment(p, q, r)
{
    return (q[0] <= Math.max(p[0], r[0]) && q[0] >= Math.min(p[0], r[0]) &&
            q[1] <= Math.max(p[1], r[1]) && q[1] >= Math.min(p[1], r[1]));
}

// To find orientation of ordered triplet (p, q, r).
// The function returns following values
// 0 --> p, q and r are colinear
// 1 --> Clockwise
// 2 --> Counterclockwise
function orientation(p, q, r)
{
    let val = (q[1] - p[1]) * (r[0] - q[0]) -
              (q[0] - p[0]) * (r[1] - q[1]);

    if (val == 0) return 0;  // colinear
    return (val > 0) ? 1 : 2; // clock or counterclock wise
}

// The function that returns true if line segment 'p1q1'
// and 'p2q2' intersect.
function doIntersect(p1, q1, p2, q2)
{
    // Find the four orientations needed for general and
    // special cases
    let o1 = orientation(p1, q1, p2);
    let o2 = orientation(p1, q1, q2);
    let o3 = orientation(p2, q2, p1);
    let o4 = orientation(p2, q2, q1);

    // General case
    if (o1 != o2 && o3 != o4)
        return true;

    // Special Cases
    // p1, q1 and p2 are colinear and p2 lies on segment p1q1
    if (o1 == 0 && onSegment(p1, p2, q1)) return true;

    // p1, q1 and p2 are colinear and q2 lies on segment p1q1
    if (o2 == 0 && onSegment(p1, q2, q1)) return true;

    // p2, q2 and p1 are colinear and p1 lies on segment p2q2
    if (o3 == 0 && onSegment(p2, p1, q2)) return true;

     // p2, q2 and q1 are colinear and q1 lies on segment p2q2
    if (o4 == 0 && onSegment(p2, q1, q2)) return true;

    return false; // Doesn't fall in any of the above cases
}

// Returns true if the point p lies inside the polygon[] with n vertices
function isInside(polygon, p)
{
    // There must be at least 3 vertices in polygon[]
    if (polygon.length < 3)  return false;

    // Create a point for line segment from p to infinite
    let extreme = [Number.MAX_SAFE_INTEGER, p[1]];

    // Count intersections of the above line with sides of polygon
    let count = 0, i = 0;
    do
    {
        let next = (i + 1) % polygon.length;

        // Check if the line segment from 'p' to 'extreme' intersects
        // with the line segment from 'polygon[i]' to 'polygon[next]'
        if (doIntersect(polygon[i], polygon[next], p, extreme))
        {
            // If the point 'p' is colinear with line segment 'i-next',
            // then check if it lies on segment. If it lies, return true,
            // otherwise false
            if (orientation(polygon[i], p, polygon[next]) == 0)
               return onSegment(polygon[i], p, polygon[next]);

            count++;
        }
        i = next;
    } while (i != 0);

    // Return true if count is odd, false otherwise
    return count % 2 == 1;
}
