// dot product of u and v
function dot2d(u, v)
{
    return u[0]*v[0] + u[1]*v[1];
}

// determinant of u and v
function det2d(u, v)
{
    return u[0]*v[1] - u[1]*v[0];
}

function cross3d(u, v)
{
    return [u[1]*v[2] - u[2]*v[1],
            u[2]*v[0] - u[0]*v[2],
            u[0]*v[1] - u[1]*v[0]];
}

// turns u into a unit vector
function unit2d(u)
{
    return div2d(u, norm2d(u));
}

// gets the counterclockwise angle between two vectors
function angle2d(u, v)
{
    return Math.atan(dot2d(u, v), det2d(u, v));
}

// gets the norm of a vector
function norm2d(u)
{
    return Math.sqrt(dot2d(u, u));
}

// scalar projection of b onto a
function sproj2d(a, b)
{
    return dot2d(unit2d(a), b);
}

// vector projection of b onto a
function vproj2d(a, b)
{
    return mult2d(unit2d(a), sproj2d(a, b));
}

// scalar rejection of b onto a
function srej2d(a, b)
{
    var v = vrej2d(a, b);
    if (det2d(a, b) < 0)
        return -norm2d(v);
    return norm2d(v);
}

// vector rejection of b onto a
function vrej2d(a, b)
{
    return sub2d(b, vproj2d(a, b));
}

// returns u plus v
function add2d(u, v)
{
    return [u[0]+v[0], u[1]+v[1]];
}

// returns u minus v
function sub2d(u, v)
{
    return [u[0]-v[0], u[1]-v[1]];
}

// returns u times k
function mult2d(u, k)
{
    return [u[0]*k, u[1]*k]
}

// returns u divided by k
function div2d(u, k)
{
    return mult2d(u, 1/k);
}

// rotates a vector CCW by theta radians
function rot2d(u, theta)
{
    var x =  u[0]*Math.cos(theta) + u[1]*Math.sin(theta);
    var y =  u[1]*Math.cos(theta) - u[0]*Math.sin(theta);
    return [x, y];
}

function angle2d(u, v)
{
    return Math.atan2(v[0] - u[0], v[1] - u[1]) - Math.PI/2;
}

function anglebtwn(u, v)
{
    let dot = dot2d(unit2d(u), unit2d(v));
    let det = det2d(unit2d(u), unit2d(v));
    return Math.atan2(det, dot);
}

function interceptSolution(tpos, tvel, ipos, ivel)
{
    // tpos: position of target
    // tvel: velocity of target
    // ipos: position of interceptor
    // ivel: magnitude of velocity of interceptor
    // returns: the angle of firing solution; NaN if none

    let offset = [tpos[0] - ipos[0], tpos[1] - ipos[1]];
    let h1 = tvel[0]*tvel[0] + tvel[1]*tvel[1] - ivel*ivel;
    let h2 = offset[0]*tvel[0] + offset[1]*tvel[1];
    let h3 = offset[0]*offset[0] + offset[1]*offset[1];

    let t1 = -h2/h1 + Math.sqrt(Math.pow(h2/h1, 2) - h3/h1);
    let t2 = -h2/h1 - Math.sqrt(Math.pow(h2/h1, 2) - h3/h1);
    if (h1 == 0) t1 = t2 = -h3/(2*h2);

    let tmin = Math.min(t1, t2);
    let tmax = Math.max(t1, t2);

    let t = tmin > 0 ? tmin : tmax;
    if (t < 0) t = NaN;

    let intercept = [0, 0];
    intercept[0] = tpos[0] + t*tvel[0] - ipos[0];
    intercept[1] = tpos[1] + t*tvel[1] - ipos[1];

    return [Math.atan2(intercept[1], intercept[0]), t]
}

function distance(p1, p2)
{
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}

function lerp2d(a, b, t)
{
    return add2d(a, mult2d(sub2d(b, a), t));
}

function render2d(v, ctx, radius=5, fill_style="black")
{
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = fill_style;
    ctx.arc(v[0], v[1], radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
}

function get_bounds(points)
{
    let min = points[0].slice();
    let max = points[0].slice();
    for (const p of points)
    {
        min[0] = Math.min(min[0], p[0]);
        min[1] = Math.min(min[1], p[1]);
        max[0] = Math.max(max[0], p[0]);
        max[1] = Math.max(max[1], p[1]);
    }
    return [min, max];
}

function nearest_point(points, test_point)
{
    let dist = Number.MAX_VALUE;
    let best = -1;
    for (let i = 0; i < points.length; i++)
    {
        let h = points[i];
        let d = distance(h, test_point);
        if (d < dist)
        {
            best = i;
            dist = d;
        }
    }
    return [best, dist];
}
