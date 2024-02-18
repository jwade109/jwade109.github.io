"use strict"

function TrackSegment(points, k_0, k_f)
{
    this.points = points;
    this.k_0 = k_0;
    this.k_f = k_f;
    this.lengths = [0];
    this.length = 0;
    for (let i = 0; i + 1 < this.points.length; ++i)
    {
        let d = distance(this.points[i], this.points[i+1]);
        this.length += d;
        this.lengths.push(this.length);
    }

    this.aabb = aabb_from_points(this.points);
}

TrackSegment.prototype.evaluate = function(t)
{
    if (t < 0 || t > 1)
    {
        return null;
    }

    let n = this.points.length - 1;
    let i = Math.floor(n * t);
    let j = i + 1;
    let ti = i / n;
    let tj = j / n;
    let tt = (t - ti) / (tj - ti);
    return lerp2d(this.points[i], this.points[i+1], tt);
}

TrackSegment.prototype.tangent = function(t)
{
    while (t < 0) // TODO shouldn't be a while loop
    {
        t += 1;
    }
    t = t % 1.0;
    let n = this.points.length - 1;
    let i = Math.floor(n * t);
    let j = i + 1;
    return unit2d(sub2d(this.points[j], this.points[i]));
}

TrackSegment.prototype.normal = function(t)
{
    return rot2d(this.tangent(t), Math.PI / 2);
}

TrackSegment.prototype.s_to_t = function(s)
{
    if (s < 0 || s > this.length)
    {
        return null;
    }

    let n = this.points.length - 1;

    let left = 0;
    let right = n;
    while (left + 1 < right)
    {
        let i = Math.floor((left + right) / 2);
        let s_test = this.lengths[i];
        if (s >= s_test)
        {
            left = i;
        }
        else if (s <= s_test)
        {
            right = i;
        }
        else
        {
            break;
        }
    }

    let ls = this.lengths[left];
    let rs = this.lengths[right];
    let tt = (s - ls) / (rs - ls);
    let ti = left / n;
    if (isNaN(tt))
    {
        console.log(this.lengths, left, right);
    }
    return tt / n + ti;
}

TrackSegment.prototype.draw = function(ctx)
{
    ctx.save();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;

    let left = [];
    let right = [];

    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
    for (let s = 0; s <= this.length; s += 5)
    {
        let t = this.s_to_t(s);
        if (t == null)
        {
            continue;
        }

        let p = this.evaluate(t);
        let normal = this.normal(t);

        let offset_sleepers = mult2d(normal, 4);

        let u = add2d(p, offset_sleepers);
        let v = sub2d(p, offset_sleepers);

        ctx.beginPath();
        ctx.moveTo(u[0], u[1]);
        ctx.lineTo(v[0], v[1]);
        ctx.stroke();

        let offset_rails = mult2d(normal, 2.3);

        u = add2d(p, offset_rails);
        v = sub2d(p, offset_rails);

        left.push(u);
        right.push(v);
    }

    render_line(left,  ctx, 1, "#333333")
    render_line(right, ctx, 1, "#333333")

    function draw_curvature(track, t, k)
    {
        let p0 = track.evaluate(t);
        let t0 = track.normal(t);
        let r0 = 1 / k;
        p0 = add2d(p0, mult2d(t0, -r0));
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(p0[0], p0[1], Math.abs(r0), 0, 2 * Math.PI);
        ctx.stroke();
    }

    // if (Math.abs(this.k_0) > 1E-5)
    // {
    //     draw_curvature(this, 0, this.k_0);
    // }
    // if (Math.abs(this.k_f) > 1E-5)
    // {
    //     draw_curvature(this, 0.999, this.k_f);
    // }

    ctx.restore();
}

function curvature_angle(phi_0, k_0, k_p, s_n)
{
    return phi_0 + k_0 * s_n + 0.5 * k_p * s_n * s_n;
}

function generate_clothoid(start, direction, s_max, n_segments, k_0, k_f)
{
    let pts = [start];

    let k_p = (k_f - k_0) / s_max;
    let phi_0 = -anglebtwn(direction, [1, 0]);
    let ds = s_max / n_segments;

    for (let i = 1; i < n_segments; ++i)
    {
        let s_n   = ds * i;
        let s_n_1 = ds * (i - 1);

        let x_s_n_1 = pts[i-1][0];
        let y_s_n_1 = pts[i-1][1];
        let phi_s_n_1 = curvature_angle(phi_0, k_0, k_p, s_n_1);
        let phi_s_n   = curvature_angle(phi_0, k_0, k_p, s_n);

        let x_s_n = x_s_n_1 + (ds / 2) * (Math.cos(phi_s_n_1) + Math.cos(phi_s_n));
        let y_s_n = y_s_n_1 + (ds / 2) * (Math.sin(phi_s_n_1) + Math.sin(phi_s_n));

        pts.push([x_s_n, y_s_n]);
    }
    return new TrackSegment(pts, k_0, k_f);
}

function Track(segments)
{
    this.segments = segments;
    this.offset = 0;
}

Track.prototype.length = function()
{
    let sum = 0;
    for (let s of this.segments)
    {
        sum += s.length;
    }
    return sum;
}

Track.prototype.draw = function(ctx)
{
    ctx.save();
    for (let s of this.segments)
    {
        s.draw(ctx);
    }

    // ctx.strokeStyle = "red";
    // ctx.lineWidth = 1;
    // ctx.globalAlpha = 0.1;

    // for (let i = 0; i < this.segments.length; ++i)
    // {
    //     let u = this.segments[i].evaluate(0.999);
    //     let v = this.segments[(i+1) % this.segments.length].evaluate(0);
    //     ctx.beginPath();
    //     ctx.moveTo(u[0], u[1]);
    //     ctx.lineTo(v[0], v[1]);
    //     ctx.stroke();
    //     ctx.beginPath();
    //     ctx.arc(u[0], u[1], 5, 0, Math.PI * 2);
    //     ctx.stroke();
    // }
    // ctx.restore();
}

Track.prototype.evaluate = function(t)
{
    if (t < 0 || t > this.segments.length)
    {
        return null;
    }

    let n = Math.floor(t);
    let s = this.segments[n];
    let tt = t % 1.0;
    return s.evaluate(tt);
}

Track.prototype.tangent = function(t)
{
    if (t < 0 || t > this.segments.length)
    {
        return null;
    }

    let n = Math.floor(t);
    let s = this.segments[n];
    let tt = t % 1.0;
    return s.tangent(tt);
}

Track.prototype.normal = function(t)
{
    return rot2d(this.tangent(t), Math.PI / 2);
}

Track.prototype.s_to_t = function(s)
{
    if (s < this.offset || s > this.offset + this.length())
    {
        return null;
    }

    s -= this.offset;

    let s_lower = 0;
    let s_upper = 0;
    for (let i = 0; i < this.segments.length; ++i)
    {
        let seg = this.segments[i];
        s_upper += seg.length;
        if (s >= s_lower && s < s_upper)
        {
            let ds = s - s_lower;
            return i + seg.s_to_t(ds);
        }
        s_lower = s_upper;
    }

    return 0;
}

Track.prototype.extend = function(s, arclength)
{
    while (this.offset + this.length() < s)
    {
        let end_segment = this.segments[this.segments.length - 1];

        let p = end_segment.evaluate(0.999);
        let u = end_segment.tangent(0.999);
        let k_0 = end_segment.k_f;
        let k_f = rand(-MAX_CURVATURE, MAX_CURVATURE);
        // console.log(k_f);

        let new_segment = generate_clothoid(p, u, arclength, arclength / 10, k_0, k_f);
        this.segments.push(new_segment);
    }
}

Track.prototype.prune = function(s_prune)
{
    if (s_prune < this.offset)
    {
        return;
    }

    while (this.segments.length > 0 && (this.segments[0].length + this.offset < s_prune))
    {
        this.offset += this.segments[0].length;
        this.segments = this.segments.slice(1);
    }
}
