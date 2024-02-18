
function TrackSegment(points, spacing)
{
    this.points = points;
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
    while (t < 0) // TODO shouldn't be a while loop
    {
        t += 1;
    }
    t = t % 1.0;
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

TrackSegment.prototype.s_to_t = function(s)
{
    while (s < this.length) // TODO shouldn't be a while loop
    {
        s += this.length;
    }
    s = s % this.length;
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
    return tt / n + ti;
}

TrackSegment.prototype.nearestHandle = function(pos)
{
    return nearest_point(this.points, pos);
}

TrackSegment.prototype.nearestPoint = function(pos)
{
    let nh = this.nearestHandle(pos);
    let index = nh[0];
    let handle = this.points[index];
    let n = 500;
    let dist = Number.MAX_VALUE;
    let best = pos;
    let best_t = 0;
    for (let t = 0; t <= n; t++)
    {
        let p = this.evaluate(t/n);
        let d = distance(p, pos);
        if (d < dist)
        {
            dist = d;
            best = p;
            best_t = t/n;
        }
    }
    return [best, best_t];
}

TrackSegment.prototype.draw = function(ctx)
{
    ctx.save();
    // this.aabb.draw(ctx);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    for (let i = 0; i < this.points.length; i++)
    {
        let pos = this.points[i];
        if (i == 0)
        {
            ctx.moveTo(pos[0], pos[1]);
        }
        else
        {
            ctx.lineTo(pos[0], pos[1]);
        }
    }
    ctx.stroke();

    ctx.lineWidth = 2;
    for (let s = 0; s <= this.length; s += 8)
    {
        let t = this.s_to_t(s);
        let p = this.evaluate(t);
        let normal = mult2d(rot2d(this.tangent(t), Math.PI / 2), 4);

        let u = add2d(p, normal);
        let v = sub2d(p, normal);

        ctx.beginPath();
        ctx.moveTo(u[0], u[1]);
        ctx.lineTo(v[0], v[1]);
        ctx.stroke();
    }

    ctx.restore();
}

function curvature_angle(phi_0, k_0, k_p, s_n)
{
    return phi_0 + k_0 * s_n + 0.5 * k_p * s_n * s_n;
}

function generate_clothoid(start, direction, s_max, k_0, k_f)
{
    let pts = [start];

    n = s_max / 10;

    let k_p = (k_f - k_0) / s_max;
    let phi_0 = -anglebtwn(direction, [1, 0]);
    let ds = s_max / n;

    for (let i = 1; i < n; ++i)
    {
        let s_n   = ds * i;
        let s_n_1 = ds * (i - 1);

        x_s_n_1 = pts[i-1][0];
        y_s_n_1 = pts[i-1][1];
        phi_s_n_1 = curvature_angle(phi_0, k_0, k_p, s_n_1);
        phi_s_n   = curvature_angle(phi_0, k_0, k_p, s_n);

        x_s_n = x_s_n_1 + (ds / 2) * (Math.cos(phi_s_n_1) + Math.cos(phi_s_n));
        y_s_n = y_s_n_1 + (ds / 2) * (Math.sin(phi_s_n_1) + Math.sin(phi_s_n));

        pts.push([x_s_n, y_s_n]);
    }
    return new TrackSegment(pts);
}

function bezier_to_track_segment(bezier, n)
{
    let pts = [];
    for (let i = 0; i < n; ++i)
    {
        let t = i / (n - 1);
        let p = bezier.evaluate(t);
        pts.push(p);
    }
    return new TrackSegment(pts);
}

function Track(segments)
{
    this.segments = segments;
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
    while (t < 0) // TODO while loop
    {
        t += this.segments.length;
    }
    t = t % this.segments.length;
    let n = Math.floor(t);
    let s = this.segments[n];
    let tt = t % 1.0;
    return s.evaluate(tt);
}

Track.prototype.tangent = function(t)
{
    while (t < 0) // TODO while loop
    {
        t += this.segments.length;
    }
    t = t % this.segments.length;
    let n = Math.floor(t);
    let s = this.segments[n];
    let tt = t % 1.0;
    return s.tangent(tt);
}

Track.prototype.s_to_t = function(s)
{
    while (s < this.length()) // TODO while loop
    {
        s += this.length();
    }
    s = s % this.length();
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
    return 0; // rand(0, this.segments.length);
}
