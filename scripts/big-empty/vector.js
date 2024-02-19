

function clamp(x, min, max)
{
    if (x > max) return max;
    if (x < min) return min;
    return x;
}

function clamp2d(x, min, max)
{
    let ret = x.slice();
    ret[0] = clamp(x[0], min[0], max[0]);
    ret[1] = clamp(x[1], min[1], max[1]);
    return ret;
}

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

function cross2d(u, v)
{
    let res = cross3d([u[0], u[1], 0], [v[0], v[1], 0]);
    return res[2];
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

// gets the norm squared of a vector
function normsq2d(u)
{
    return dot2d(u, u);
}

// gets the norm of a vector
function norm2d(u)
{
    return Math.sqrt(normsq2d(u));
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
    if (k == 0)
    {
        // console.log("Divide by zero:", u);
        return [0, 0];
    }
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

function mag2d(v)
{
    return distance(v, [0, 0]);
}

function magsq2d(v)
{
    return v[0]*v[0] + v[1]*v[1];
}

function lerp(a, b, t)
{
    return a + (b - a) * t;
}

function lerp2d(a, b, t)
{
    return add2d(a, mult2d(sub2d(b, a), t));
}

function render2d(v, ctx, radius=5, fill_style="black", alpha=1)
{
    if (radius < 0)
    {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = fill_style;
        ctx.beginPath();
        ctx.arc(v[0], v[1], -radius, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
        return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = fill_style;
    ctx.arc(v[0], v[1], radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
}

function renderv2d(c, v, ctx, width=2, style="black")
{
    const d = mag2d(v);
    if (d <= 0)
    {
        return;
    }

    const t = add2d(v, c);
    const u = mult2d(unit2d(v), Math.min(13, d/10));
    const m = sub2d(t, mult2d(u, 0.5));
    const b = sub2d(t, u);
    const l = add2d(sub2d(t, u), rot2d(u,  Math.PI/1.4));
    const r = add2d(sub2d(t, u), rot2d(u, -Math.PI/1.4));

    ctx.save();
    ctx.strokeStyle = style;
    ctx.fillStyle = style;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(c[0], c[1]);
    ctx.lineTo(m[0], m[1]);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r[0], r[1]);
    ctx.lineTo(l[0], l[1]);
    ctx.lineTo(t[0], t[1]);
    ctx.fill();
    ctx.restore();
}

function render_line(vs, ctx, width=2, stroke_style="black")
{
    if (vs.length == 0)
    {
        return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = stroke_style;
    ctx.lineWidth = width;
    ctx.moveTo(vs[0][0], vs[0][1]);
    for (let i = 1; i < vs.length; ++i)
    {
        ctx.lineTo(vs[i][0], vs[i][1]);
    }
    ctx.stroke();
    ctx.restore();
}

function render_lines(ls, ctx, width=2, stroke_style="black")
{
    for (const vs of ls)
    {
        render_line(vs, ctx, width, stroke_style);
    }
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

function get_centroid(points)
{
    let sum = [0, 0];
    for (const p of points)
    {
        sum = add2d(sum, p);
    }
    return div2d(sum, points.length);
}

function center_on(points, center)
{
    const centroid = get_centroid(points);
    const offset = sub2d(center, centroid);
    let ret = []
    for (const p of points)
    {
        ret.push(add2d(p, offset));
    }
    return ret;
}

function flatten_lines_to_points(lines)
{
    let ret = []
    for (const line of lines)
    {
        for (const p of line)
        {
            ret.push(p);
        }
    }
    return ret;
}

function center_bounds_on(lines, center)
{
    const points = flatten_lines_to_points(lines);
    const [min, max] = get_bounds(points);
    const centroid = div2d(add2d(max, min), 2);
    const offset = sub2d(center, centroid);
    let ret = []
    for (const line of lines)
    {
        ret.push([]);
        for (const p of line)
        {
            ret[ret.length - 1].push(add2d(p, offset));
        }
    }
    return ret;
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

function shrink_to_within_wh(lines, width, height)
{
    const points = flatten_lines_to_points(lines);
    const [min, max] = get_bounds(points);
    const [w, h] = sub2d(max, min);
    const centroid = div2d(add2d(min, max), 2);

    const wr = width / w;
    const hr = height / h;
    const scale = Math.min(wr, hr);

    if (scale >= 1)
    {
        return lines;
    }

    let ret = []
    for (const line of lines)
    {
        ret.push([]);
        for (const p of line)
        {
            let offset = sub2d(p, centroid);
            offset = mult2d(offset, scale);
            ret[ret.length - 1].push(add2d(centroid, offset));
        }
    }
    return ret;
}

function rotate_about(lines, center, angle)
{
    let ret = []
    for (const line of lines)
    {
        ret.push([]);
        for (const p of line)
        {
            let offset = sub2d(p, center);
            offset = rot2d(offset, angle);
            ret[ret.length - 1].push(add2d(center, offset));
        }
    }
    return ret;
}

function draw_line_list(ctx, points, alphas=[])
{
    if (points.length < 2)
    {
        return;
    }

    ctx.save();
    if (alphas)
    {
        for (let i = 0; i < points.length - 1; ++i)
        {
            let p = points[i];
            let q = points[i+1];
            let a = alphas[i];
            ctx.globalAlpha = a;
            ctx.beginPath();
            ctx.moveTo(p[0], p[1]);
            ctx.lineTo(q[0], q[1]);
            ctx.stroke();
        }
    }
    else
    {
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; ++i)
        {
            ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.stroke();
    }
    ctx.restore();
}

function rand(min, max)
{
    return Math.random() * (max - min) + min;
}
