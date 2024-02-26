"use strict"

let DEBUG_DRAW_TRACK_IDS = false;
let DEBUG_DRAW_JUNCTIONS = true;
let DEBUG_DRAW_RAIL_ORIENTATION_COLORS = false;
let DEBUG_DRAW_CURVATURE = false;
let DEBUG_DRAW_REAL_TRACKS = true;

function TrackSegment(points, k_0, k_f)
{
    this.points = points;
    this.k_0 = k_0;
    this.k_f = k_f;
    this.arclength = 0;
    for (let i = 0; i + 1 < this.points.length; ++i)
    {
        let d = distance(this.points[i], this.points[i+1]);
        this.arclength += d;
    }

    this.aabb = aabb_from_points(this.points);

    this.rail_left = [];
    this.rail_right = [];
    this.sleeper_left = [];
    this.sleeper_right = [];

    if (this.arclength == 0)
    {
        return;
    }

    let seg_length = 3;
    let i_max = Math.ceil(this.arclength / seg_length);
    seg_length = this.arclength / i_max;

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
        let i_max = Math.ceil(path.arclength / seg_length);

        let left = [];
        let right = [];

        for (let i = 0; i <= i_max; ++i)
        {
            let s = lerp(0, path.arclength, i / i_max);
            let [u, v] = get_offset_points(path, s, offset);
            if (u)
            {
                left.push(u);
                right.push(v);
            }
        }

        return [left, right];
    }

    let sleeper_segment_length = 4.5;
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

TrackSegment.prototype.junction_at = function(t)
{
    let p = this.evaluate(t);
    let u = this.tangent(t);
    return new Junction(p, u);
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
    if (s < 0 || s > this.arclength)
    {
        return null;
    }

    // generated segments are linearly spaced;
    // need to bring back the binary search if that assumption
    // stops holding true
    return s / this.arclength;
}

TrackSegment.prototype.draw = function(rctx)
{
    if (this.arclength == 0)
    {
        return;
    }

    for (let i = 0; i < this.sleeper_left.length && DEBUG_DRAW_REAL_TRACKS; ++i)
    {
        let line = [this.sleeper_left[i], this.sleeper_right[i]];
        rctx.polyline(line, 1.5, "#888888", null, 0);
    }

    if (DEBUG_DRAW_REAL_TRACKS)
    {
        rctx.polyline(this.rail_left,  1, "#333333", null,      10);
        rctx.polyline(this.rail_right, 1, "#333333", null,      10);
        // rctx.polyline(this.bed,        4, "#DDDDDD", "#DDDDDD", -3);
    }

    if (DEBUG_DRAW_CURVATURE)
    {
        function draw_curvature(track, t, k)
        {
            let p0 = track.evaluate(t);
            let t0 = track.normal(t);
            let r0 = 1 / k;
            p0 = add2d(p0, mult2d(t0, -r0));
            rctx.point(p0, Math.abs(r0), null, "purple", 0.3);
        }

        if (Math.abs(this.k_0) > 1E-5)
        {
            draw_curvature(this, 0, this.k_0);
        }
        if (Math.abs(this.k_f) > 1E-5)
        {
            draw_curvature(this, 1, this.k_f);
        }
    }
}

TrackSegment.prototype.extend_clothoid = function(arclength, curvature, backwards)
{
    let t = 1;
    let k_f = this.k_f;
    if (backwards)
    {
        t = 0;
        k_f = this.k_0;
    }
    let p = this.evaluate(t);
    let u = this.tangent(t);
    if (backwards)
    {
        u = mult2d(u, -1);
    }
    return generate_clothoid(p, u, arclength, arclength / 3, k_f, curvature);
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

Track.prototype.arclength = function()
{
    let sum = 0;
    for (let s of this.segments)
    {
        sum += s.arclength;
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
    if (this.segments.length == 0)
    {
        return null;
    }
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
    if (this.segments.length == 0)
    {
        return null;
    }
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

Track.prototype.t_to_s = function(t)
{
    if (this.segments.length == 0)
    {
        return null;
    }
    if (t < 0 || t > this.segments.length)
    {
        return null;
    }
    if (t == 0)
    {
        return 0;
    }
    if (t == this.segments.length)
    {
        return this.arclength();
    }
    let sum = 0;
    let max_i = Math.floor(t);
    let tt = t - max_i;
    for (let i = 0; i < max_i; ++i)
    {
        sum += this.segments[i].arclength;
    }
    sum += this.segments[max_i].arclength * tt;
    return sum;
}

Track.prototype.s_to_t = function(s)
{
    if (s < this.offset || s > this.offset + this.arclength())
    {
        return null;
    }

    s -= this.offset;

    let s_lower = 0;
    let s_upper = 0;
    for (let i = 0; i < this.segments.length; ++i)
    {
        let seg = this.segments[i];
        s_upper += seg.arclength;
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
    while (this.offset + this.arclength() < s)
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

    while (this.segments.length > 0 &&
          (this.segments[0].arclength + this.offset < s_prune))
    {
        this.offset += this.segments[0].arclength;
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

// function get_routes_to(node, edges, sinks, visited)
// {
//     if (visited.includes(node))
//     {
//         return [[node]];
//     }
//     visited.push(node);
//     // base case: current node is a sink
//     if (sinks.includes(node))
//     {
//         return [[node]];
//     }
//     let adj = get_adjecent_nodes(node, edges);
//     let routes = [];
//     for (let ds of adj.downstream)
//     {
//         let rts = get_routes_to(ds, edges, sinks, visited);
//         for (let i = 0; i < rts.length; ++i)
//         {
//             rts[i] = [node].concat(rts[i]);
//         }
//         routes = routes.concat(rts);
//     }
//     routes = routes.filter(r => sinks.includes(r[r.length - 1]));
//     return routes;
// }

function get_route_between(src, target, edges, weights)
{
    let dist = {};
    let prev = {};
    let open_set = get_nodes(edges);
    for (let node of open_set)
    {
        dist[node] = Infinity;
    }
    dist[src] = 0;

    function compare_dist(a, b)
    {
        return dist[a] - dist[b];
    }

    while (open_set.length > 0)
    {
        open_set.sort(compare_dist);
        let u = open_set.shift();
        if (u == target)
        {
            break;
        }
        let adj = get_adjecent_nodes(u, edges);
        for (let v of adj.downstream)
        {
            if (!open_set.includes(v))
            {
                continue;
            }
            let alt = dist[u] + weights[u];
            if (alt < dist[v])
            {
                dist[v] = alt;
                prev[v] = u;
            }
        }
    }

    // construct path via reverse iteration
    let route = [];
    if (prev[target] !== undefined || target == src)
    {
        while (target !== undefined)
        {
            route.push(target);
            target = prev[target];
        }
    }

    return route.reverse();
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
}

MultiTrack.prototype.get_track_from_route = function(route)
{
    let segments = [];
    for (let signed_id of route)
    {
        let [sidx, dir] = split_signed_index(signed_id);
        if (sidx >= this.segments.length || sidx < 0)
        {
            console.log("tried to get segment", sidx, route);
            return null;
        }
        let seg = this.segments[sidx];
        if (seg === undefined)
        {
            console.log("tried to get segment", sidx, route);
            return null;
        }
        if (dir == 1)
        {
            segments.push(seg);
        }
        else
        {
            segments.push(seg.reversed());
        }
    }
    return new Track(segments);
}

MultiTrack.prototype.draw = function(rctx)
{
    for (let seg of this.segments)
    {
        seg.draw(rctx);
    }

    function get_segment_label_position(seg)
    {
        return seg.evaluate(0.8);
    }

    let r = 25;

    if (DEBUG_DRAW_TRACK_IDS)
    {
        for (let [si, di] of this.connections)
        {
            let [src_idx, ignore1] = split_signed_index(si);
            let [dst_idx, ignore2] = split_signed_index(di);
            let src = this.segments[src_idx];
            let dst = this.segments[dst_idx];
            let p1 = get_segment_label_position(src);
            let p2 = get_segment_label_position(dst);
            let d = distance(p1, p2) - r / rctx.scalar();
            let t = unit2d(sub2d(p2, p1));
            let u = rot2d(t, Math.PI / 2);
            p2 = add2d(p1, mult2d(t, d));
            p1 = add2d(p1, mult2d(u, 6 / rctx.scalar()));
            p2 = add2d(p2, mult2d(u, 6 / rctx.scalar()));
            rctx.arrow(p1, p2, 3, "blue", 16999);
        }
    }

    for (let i = 0; i < this.segments.length && DEBUG_DRAW_TRACK_IDS; ++i)
    {
        let z = 17000 + i;
        let seg = this.segments[i];
        let p_center = get_segment_label_position(seg);
        let off = mult2d([0, r], 0.3 / rctx.scalar());
        let p_text = sub2d(p_center, off);
        rctx.point(p_center, r / rctx.scalar(), "lightblue", "black", 1, 2 / rctx.scalar(), z);
        rctx.text(i + 1, rctx.world_to_screen(p_text), "center", z);
    }

    for (let i = 0; i < this.segments.length && DEBUG_DRAW_JUNCTIONS; ++i)
    {
        let seg = this.segments[i];
        let j1 = seg.junction_at(0);
        j1.draw(rctx);
        let j2 = seg.junction_at(1);
        j2.draw(rctx);
    }

    for (let i = 0; i < this.segments.length && DEBUG_DRAW_RAIL_ORIENTATION_COLORS; ++i)
    {
        let seg = this.segments[i];
        rctx.polyline(seg.rail_left, 1, "red", null, 5000);
        rctx.polyline(seg.rail_right, 2, "green", null, 5000);
    }
}

MultiTrack.prototype.route_between = function(src, dst)
{
    let weights = {}
    for (let i = 1; i <= this.segments.length; ++i)
    {
        weights[i]  = this.segments[i-1].arclength;
        weights[-i] = this.segments[i-1].arclength;
    }
    let route = get_route_between(src, dst, this.connections, weights);
    route.shift(); // TODO remove first element
    return route;
}

function Junction(pos, dir, side_a, side_b)
{
    this.pos = pos;
    this.tangent = unit2d(dir);
    this.normal = rot2d(this.tangent, Math.PI / 2);
    this.side_a = side_a;
    this.side_b = side_b;
}

Junction.prototype.draw = function(rctx)
{
    let length = 4;
    let width = 12;

    let l2 = mult2d(this.tangent, length / 2);
    let w2 = mult2d(this.normal,  width  / 2);

    let p1 = add2d(this.pos, add2d(mult2d(l2,  1), mult2d(w2,  1)));
    let p2 = add2d(this.pos, add2d(mult2d(l2,  1), mult2d(w2, -1)));
    let p3 = add2d(this.pos, add2d(mult2d(l2, -1), mult2d(w2, -1)));
    let p4 = add2d(this.pos, add2d(mult2d(l2, -1), mult2d(w2,  1)));
    let p5 = add2d(this.pos, mult2d(l2,  1));

    rctx.polyline([p1, p2, p3, p4, p1], 2, "black", "#222222");
    rctx.polyline([this.pos, p5], 2, "black", "#222222");
}

function sweep_from_segment(segment, n, arclength)
{
    let p = segment.evaluate(1);
    let u = segment.tangent(1);
    return generate_clothoid_sweep(p, u, arclength / 10, [arclength],
        [segment.k_0], linspace(-MAX_CURVATURE, MAX_CURVATURE, n));
}

function generate_clothoid_sweep(start, dir, n, arclengths, k_0_n, k_f_n)
{
    let segments = [];
    for (let a of arclengths)
    {
        for (let k_0 of k_0_n)
        {
            for (let k_f of k_f_n)
            {
                let t = generate_clothoid(start, dir, a, n, k_0, k_f);
                segments.push(t);
            }
        }
    }
    return segments;
}
