"use strict"

function TrackSegment(points, k_0, k_f)
{
    this.points = points;
    this.k_0 = k_0;
    this.k_f = k_f;
    this.length = 0;
    for (let i = 0; i + 1 < this.points.length; ++i)
    {
        let d = distance(this.points[i], this.points[i+1]);
        this.length += d;
    }

    this.aabb = aabb_from_points(this.points);

    this.rail_left = [];
    this.rail_right = [];
    this.sleeper_left = [];
    this.sleeper_right = [];

    if (this.length == 0)
    {
        return;
    }

    let seg_length = 3;
    let i_max = Math.ceil(this.length / seg_length);
    seg_length = this.length / i_max;

    function get_offset_points(path, s, offset)
    {
        let t = path.s_to_t(s);
        if (t == null)
        {
            return [null, null];
        }

        let p = path.evaluate(t);
        let normal = path.normal(t);

        let offv = mult2d(normal, offset);

        let u = sub2d(p, offv);
        let v = add2d(p, offv);
        return [u, v];
    }

    function eval_offset_with_segment_length(path, seg_length, offset)
    {
        let i_max = Math.ceil(path.length / seg_length);

        let left = [];
        let right = [];

        for (let i = 0; i <= i_max; ++i)
        {
            let s = lerp(0, path.length, i / i_max);
            let [u, v] = get_offset_points(path, s, offset);
            if (u)
            {
                left.push(u);
                right.push(v);
            }
        }

        return [left, right];
    }

    let sleeper_segment_length = 3;
    let rail_segment_length = 10;
    let bed_segment_length = 20;

    let sleeper_offset = 4.5;
    let rail_offset = 2.9;
    let bed_offset = 13;

    [this.sleeper_left, this.sleeper_right] = eval_offset_with_segment_length(
        this, sleeper_segment_length, sleeper_offset);
    [this.rail_left, this.rail_right] = eval_offset_with_segment_length(
        this, rail_segment_length, rail_offset);
    let [bed_left, bed_right] = eval_offset_with_segment_length(
        this, bed_segment_length, bed_offset);

    this.bed = [].concat(bed_left, bed_right.reverse());
}

TrackSegment.prototype.reversed = function()
{
    return new TrackSegment(this.points.toReversed(), this.k_0, this.k_f);
}

TrackSegment.prototype.evaluate = function(t)
{
    if (t < 0 || t > 1)
    {
        return null;
    }

    let n = this.points.length - 1;
    let i = Math.floor(n * t);
    if (i == n)
    {
        return this.points[n];
    }
    let j = i + 1;
    let ti = i / n;
    let tj = j / n;
    let tt = (t - ti) / (tj - ti);
    if (this.points[i] === undefined || this.points[j] === undefined)
    {
        console.log(t);
        console.log(i, j, n);
        console.log(this.points[i]);
        console.log(this.points[j]);
    }
    return lerp2d(this.points[i], this.points[i+1], tt);
}

TrackSegment.prototype.tangent = function(t)
{
    if (t < 0 || t > 1)
    {
        return null;
    }

    let n = this.points.length - 1;
    let i = Math.floor(n * t);
    if (i == n)
    {
        i -= 1;
    }
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

    // generated segments are linearly spaced;
    // need to bring back the binary search if that assumption
    // stops holding true
    return s / this.length;
}

TrackSegment.prototype.draw = function(rctx)
{
    if (this.length == 0)
    {
        return;
    }

    rctx.ctx.save();

    for (let i = 0; i < this.sleeper_left.length; ++i)
    {
        let line = [this.sleeper_left[i], this.sleeper_right[i]];
        rctx.polyline(line, 1.5, "#888888", null, 0);
    }

    rctx.polyline(this.rail_left,  1, "#333333", null,      10);
    rctx.polyline(this.rail_right, 1, "#333333", null,      10);

    rctx.polyline(this.bed,        4, "#DDDDDD", "#DDDDDD", -3);

    function draw_curvature(track, t, k)
    {
        let p0 = track.evaluate(t);
        let t0 = track.normal(t);
        let r0 = 1 / k;
        p0 = add2d(p0, mult2d(t0, -r0));
        // render2d(p0, rctx.ctx, -Math.abs(r0), "purple", 0.3);
    }

    if (Math.abs(this.k_0) > 1E-5)
    {
        draw_curvature(this, 0, this.k_0);
    }
    if (Math.abs(this.k_f) > 1E-5)
    {
        draw_curvature(this, 1, this.k_f);
    }

    rctx.ctx.restore();
}

function curvature_angle(phi_0, k_0, k_p, s_n)
{
    return phi_0 + k_0 * s_n + 0.5 * k_p * s_n * s_n;
}

function generate_clothoid(start, direction, s_max, n_segments, k_0, k_f)
{
    if (n_segments < 5)
    {
        return null;
    }

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

function line_clothoid(beg, end)
{
    let d = distance(beg, end);
    let pts = [];
    let n = Math.max(Math.ceil(d / 25), 3);
    for (let t of linspace(0, 1, n))
    {
        let p = lerp2d(beg, end, t);
        pts.push(p);
    }
    return new TrackSegment(pts, 0, 0);
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

Track.prototype.draw = function(rctx)
{
    rctx.ctx.save();
    for (let s of this.segments)
    {
        s.draw(rctx);
    }
    rctx.ctx.restore();
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

Track.prototype.extend = function(s, arclength, candidate)
{
    let changed = false;
    while (this.offset + this.length() < s)
    {
        if (candidate)
        {
            this.segments.push(candidate);
            candidate = null;
            changed = true;
            continue;
        }

        let end_segment = this.segments[this.segments.length - 1];

        let p = end_segment.evaluate(1);
        let u = end_segment.tangent(1);
        let k_0 = end_segment.k_f;
        let k_f = rand(-MAX_CURVATURE, MAX_CURVATURE);

        let new_segment = generate_clothoid(p, u, arclength, arclength / 10, k_0, k_f);
        this.segments.push(new_segment);
        changed = true;
    }
    return changed;
}

Track.prototype.prune = function(s_prune)
{
    let changed = false;
    if (s_prune < this.offset)
    {
        return changed;
    }

    while (this.segments.length > 0 && (this.segments[0].length + this.offset < s_prune))
    {
        this.offset += this.segments[0].length;
        this.segments = this.segments.slice(1);
        changed = true;
    }

    return changed;
}

function push_set(set, element)
{
    if (!set.includes(element))
    {
        set.push(element);
    }
}

function get_nodes(edges)
{
    let nodes = [];
    for (let [d, s] of edges)
    {
        push_set(nodes, d);
        push_set(nodes, s);
    }

    return nodes;
}

function get_adjecent_nodes(node, edges)
{
    let upstream = [];
    let downstream = [];
    for (let [s, d] of edges)
    {
        if (s == node)
        {
            push_set(downstream, d);
        }
        if (d == node)
        {
            push_set(upstream, s);
        }
    }
    return {"upstream": upstream, "downstream": downstream};
}

function get_leaves(edges)
{
    let sources = [];
    let sinks = [];
    for (let node of get_nodes(edges))
    {
        let adjacent = get_adjecent_nodes(node, edges);
        if (adjacent.upstream.length == 0)
        {
            // this node has no upstream neighbors; it's a source
            push_set(sources, node);
        }
        if (adjacent.downstream.length == 0)
        {
            // this node has no destinations; it's an exit
            push_set(sinks, node);
        }
    }
    return {"sources": sources, "sinks": sinks};
}

function get_routes_from(node, edges, sinks)
{
    // base case: current node is a sink
    if (sinks.includes(node))
    {
        return [[node]];
    }
    let adj = get_adjecent_nodes(node, edges);
    let routes = [];
    for (let ds of adj.downstream)
    {
        let rts = get_routes_from(ds, edges, sinks);
        for (let i = 0; i < rts.length; ++i)
        {
            rts[i] = [node].concat(rts[i]);
        }
        routes = routes.concat(rts);
    }
    return routes;
}

function get_routes(edges)
{
    let routes = [];
    let leaves = get_leaves(edges);

    for (let node of leaves.sources)
    {
        let rts = get_routes_from(node, edges, leaves.sinks);
        routes = routes.concat(rts);
    }

    return routes;
}

function MultiTrack(segments, connections)
{
    this.segments = segments;
    this.connections = connections;

    let n = this.connections.length;

    // TODO implicit connections
    for (let i = 0; i < n; ++i)
    {
        let [src, dst] = this.connections[i];
        this.connections.push([-dst, -src]);
    }

    this.routes = get_routes(this.connections);
    this.routes.sort();
}

let ROUTE_INDEX = 0;

MultiTrack.prototype.draw = function(rctx)
{
    let tmin = 0.1;
    let tmax = 0.9;

    let current_time = new Date().getTime() / 1000;

    ROUTE_INDEX %= this.routes.length;
    let current_route = this.routes[ROUTE_INDEX];
    rctx.text("Route index: " + ROUTE_INDEX, [600, 100]);
    rctx.text("Route: " + current_route, [600, 150]);
    let segments = [];
    for (let signed_id of current_route)
    {
        let dir = Math.sign(signed_id);
        let segment_id = Math.abs(signed_id) - 1;
        let seg = this.segments[segment_id];
        if (dir == 1)
        {
            segments.push(seg);
        }
        else
        {
            segments.push(seg.reversed());
        }
    }

    let track = new Track(segments);
    let t = track.s_to_t((200 * current_time) % track.length());
    let p = track.evaluate(t);
    track.draw(rctx);
    rctx.point(p, 10);

    for (let conn of this.connections)
    {
        let src = conn[0];
        let dst = conn[1];

        let src_i = Math.abs(src) - 1;
        let dst_i = Math.abs(dst) - 1;

        let src_seg = this.segments[src_i];
        let dst_seg = this.segments[dst_i];

        let p = null;
        let q = null;

        if (Math.sign(src) > 0 && Math.sign(dst) > 0)
        {
            // right rail to right rail
            p = src_seg.rail_right[src_seg.rail_right.length - 1];
            q = dst_seg.rail_right[0];
        }
        else if (Math.sign(src) < 0 && Math.sign(dst) > 0)
        {
            // left rail to right rail
            p = src_seg.rail_left[0];
            q = dst_seg.rail_right[0];
        }
        else if (Math.sign(src) > 0 && Math.sign(dst) < 0)
        {
            // right rail to left rail
            p = src_seg.rail_right[src_seg.rail_right.length - 1];
            q = dst_seg.rail_left[dst_seg.rail_left.length - 1];
        }
        else if (Math.sign(src) < 0 && Math.sign(dst) < 0)
        {
            // left rail to left rail
            p = src_seg.rail_left[0];
            q = dst_seg.rail_left[dst_seg.rail_left.length - 1];
        }
        else
        {
            console.log("Unhandled:", src, dst);
        }

        if (p)
        {
            rctx.arrow(p, q);
        }
    }

    for (let i = 0; i < this.segments.length; ++i)
    {
        let seg = this.segments[i];

        rctx.polyline(seg.rail_left, 1, "red", null, 5000);
        rctx.polyline(seg.rail_right, 2, "green", null, 5000);
        let p_center = seg.evaluate(0.5);
        rctx.text(i + 1, rctx.world_to_screen(p_center));
    }
}

