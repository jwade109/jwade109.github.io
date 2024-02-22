"use strict"

const LINKAGE_OFFSET = 3;
const S_LIMITS_BUFFER = 10;
let DEBUG_DRAW_TRAIN_PROPERTIES = false;
let DEBUG_DRAW_TRAIN_ARCLENGTH_LIMITS = false;
let DEBUG_DRAW_TRAIN_HISTORY = false;
let DEBUG_DRAW_CURRENT_PLANNED_ROUTES = false;
let DEBUG_DRAW_OCCUPIED_SEGMENTS = false;

function SmokeParticle(pos, vel, lifetime)
{
    this.pos = pos;
    this.vel = vel;
    this.lifetime = lifetime;
    this.max_lifetime = lifetime;
    this.growth_rate = rand(2.5, 3.8);
}

SmokeParticle.prototype.step = function(dt)
{
    this.pos = add2d(this.pos, mult2d(this.vel, dt));
    this.vel = mult2d(this.vel, 0.95);
    this.lifetime -= dt;
}

SmokeParticle.prototype.draw = function(rctx)
{
    let r = 4 + this.growth_rate * (this.max_lifetime - this.lifetime);
    let alpha = 0.6 * this.lifetime / this.max_lifetime;

    rctx.point(this.pos, r, "black", null, alpha, 0, 1000);
}

function Railcar(length, width, color, is_loco)
{
    this.length = length;
    this.width = width;
    this.color = color;
    this.is_loco = is_loco;
}

function Train(position, n_cars, width, height)
{
    this.cars = [];
    this.acc = rand(40, 65);
    this.vel = 0;
    this.max_vel = rand(100, 160);
    this.pos = position;
    this.dir = 1; // Math.random() < 0.5 ? 1 : -1;
    this.emits_smoke = Math.random() < 0.2;
    this.has_caboose = Math.random() < 0.15;
    this.tbd = [];
    this.history = [];
    this.particles = [];

    this.acc *= this.dir;

    let n_locos = Math.max(1, Math.ceil(n_cars / 12));

    let color = "peru";

    for (let i = 0; i < n_cars + n_locos; ++i)
    {
        let l = rand(25, 34);
        let w = rand(7, 11);
        if (i < n_locos)
        {
            l = 37;
            w = 10;
        }

        if (rand(0, 1) < 0.5)
        {

        }
        else if (rand(0, 1) < 0.1)
        {
            let rgb = randint(80, 120).toString(16);
            color = "#" + rgb + rgb + rgb;
        }
        else if (rand(0, 1) < 0.1)
        {
            color = "peru";
        }
        else if (rand(0, 1) < 0.1)
        {
            color = "sienna";
        }
        else if (rand(0, 1) < 0.1)
        {
            color = "saddlebrown";
        }
        else if (rand(0, 1) < 0.1)
        {
            color = "tan";
        }
        else if (rand(0, 1) < 0.1)
        {
            color = "#444444";
        }

        let use_color = color;

        if (i < n_locos)
        {
            use_color = "lightblue";
            if (this.emits_smoke)
            {
                use_color = "lightsalmon";
            }
        }

        let c = new Railcar(l, w, use_color, i < n_locos);

        this.cars.push(c);
    }
}

Train.prototype.total_route = function()
{
    return this.history.concat(this.tbd);
}

Train.prototype.enqueue_route = function(new_path)
{
    this.tbd = this.tbd.concat(new_path);
}

Train.prototype.get_track = function(multitrack)
{
    return multitrack.get_track_from_route(this.total_route());
}

Train.prototype.occupied = function(track)
{
    let [max, min] = this.s_limits();
    let s_0 = track.offset;
    let indices = [];
    for (let i = 0; i < track.segments.length; ++i)
    {
        let seg = track.segments[i];
        let s_f = s_0 + seg.length;

        // segment is "occupied" if the extent of train, [min, max],
        // intersects with the extent of the segment, [s_0, s_f]
        //
        //            min ----------------- max
        // YES:                  s_0 ------------------- s_f
        // YES: s_0----------s_f
        // YES:                s_0 -------- s_f
        // NO:                                    s_0 ----------- s_f

        // console.log(i, s_0, s_f, min, max, intersecting);
        let intersecting = s_0 < max && s_f > min;
        if (intersecting)
        {
            indices.push(i);
        }
        s_0 = s_f;
    }
    return indices;
}

Train.prototype.occupied_indices = function(track)
{
    let path = this.total_route();
    let indices = this.occupied(track);
    for (let i = 0; i < indices.length; ++i)
    {
        indices[i] = path[indices[i]];
    }
    return indices;
}

Train.prototype.segment_number = function(track)
{
    if (track == null)
    {
        console.log("Null track!")
        return null;
    }
    let t = track.s_to_t(this.pos);
    if (t == null)
    {
        console.log("Null t value!", this.pos, track.length())
        return null;
    }
    let combined = this.total_route();
    return combined[Math.floor(t)];
}

Train.prototype.s_limits = function()
{
    // front, back
    return [this.pos + S_LIMITS_BUFFER, this.pos - this.length() - S_LIMITS_BUFFER]
}

Train.prototype.length = function()
{
    // TODO this doesn't take the linkage buffer into account
    let sum = 0;
    for (let c of this.cars)
    {
        sum += c.length + LINKAGE_OFFSET;
    }
    return sum - LINKAGE_OFFSET;
}

function draw_animated_route(track, current_time, rctx)
{
    for (let s of linspace(0, track.length(), track.length() / 50))
    {
        let s_start = (100 * current_time + s) % track.length();
        let s_end = s_start + 30;
        let t1 = track.s_to_t(s_start);
        let t2 = track.s_to_t(s_end);
        if (t1 == null || t2 == null)
        {
            continue;
        }
        let p1 = track.evaluate(t1);
        let p2 = track.evaluate(t2);
        rctx.polyline([p1, p2], 3, "red", null, 12000);
    }
}

Train.prototype.draw = function(rctx, multitrack)
{
    let combined = this.total_route();

    let track = this.get_track(multitrack);

    let future_track = multitrack.get_track_from_route(this.tbd);
    let current_time = new Date().getTime() / 1000;
    if (DEBUG_DRAW_CURRENT_PLANNED_ROUTES)
    {
        draw_animated_route(future_track, current_time, rctx);
    }

    for (let s = this.pos; s > 0 && DEBUG_DRAW_TRAIN_HISTORY; s -= 50)
    {
        let t = track.s_to_t(s);
        if (t == null)
        {
            continue;
        }

        let p = track.evaluate(t);
        rctx.point(p, 3, "green", null, 1, 0, 10000);
    }

    let s = this.pos;
    for (let i = 0; i < this.cars.length; ++i)
    {
        let c = this.cars[i];
        s -= ((c.length / 2) * this.dir);
        let t = track.s_to_t(s);
        if (t == null)
        {
            continue;
        }

        let p = track.evaluate(t);
        let tangent = track.tangent(t);
        let normal = rot2d(tangent, Math.PI / 2);

        if (i == 0 && DEBUG_DRAW_TRAIN_PROPERTIES)
        {
            let scr = rctx.world_to_screen(p);
            let k = rctx.scalar();

            let [smax, smin] = this.s_limits();
            let dy = 25;
            let text_y = 0;
            let tarc = track.length();
            rctx.text("t = " + t.toFixed(2),
                add2d(scr, [30 * k, text_y += dy]));
            rctx.text("s = " + s.toFixed(2) + "/" + tarc.toFixed(),
                add2d(scr, [30 * k, text_y += dy]));
            rctx.text("   " + smin.toFixed(2) + ", " + smax.toFixed(2),
                add2d(scr, [30 * k, text_y += dy]));
            rctx.text("v = " + this.vel.toFixed(2),
                add2d(scr, [30 * k, text_y += dy]));
            rctx.text("p = " + p[0].toFixed(1) + ", " + p[1].toFixed(1),
                add2d(scr, [30 * k, text_y += dy]));
            rctx.text("path = " + this.total_route(),
                add2d(scr, [30 * k, text_y += dy]));
            rctx.text("occ = " + this.occupied_indices(track),
                add2d(scr, [30 * k, text_y += dy]));
            rctx.text("his = " + this.history,
                add2d(scr, [30 * k, text_y += dy]));
            rctx.text("tbd = " + this.tbd,
                add2d(scr, [30 * k, text_y += dy]));
        }

        s -= ((c.length / 2 + LINKAGE_OFFSET / 2) * this.dir);

        if (i + 1 < this.cars.length)
        {
            let t_link = track.s_to_t(s);
            if (t == null)
            {
                continue;
            }

            let p_link = track.evaluate(t_link);
            rctx.point(p_link, 3, "black", null, 1, 0, 99);
        }

        s -= LINKAGE_OFFSET / 2;

        function draw_rect(length, width, fill_style)
        {
            let l2 = mult2d(tangent, length / 2);
            let w2 = mult2d(normal,  width  / 2);

            let p1 = add2d(p, add2d(mult2d(l2,  1), mult2d(w2,  1)));
            let p2 = add2d(p, add2d(mult2d(l2,  1), mult2d(w2, -1)));
            let p3 = add2d(p, add2d(mult2d(l2, -1), mult2d(w2, -1)));
            let p4 = add2d(p, add2d(mult2d(l2, -1), mult2d(w2,  1)));

            rctx.ctx.strokeStyle = "black";
            rctx.ctx.lineWidth = 1.3;
            rctx.ctx.fillStyle = fill_style;

            rctx.polyline([p1, p2, p3, p4, p1], 2, "black", fill_style, 100);
        }

        draw_rect(c.length, c.width, c.color);
        if (c.is_loco)
        {
            draw_rect(c.length * 0.7, c.width * 0.3, "black");
        }
    }

    if (DEBUG_DRAW_TRAIN_ARCLENGTH_LIMITS)
    {
        for (let s of this.s_limits())
        {
            let t = track.s_to_t(s);
            if (t == null)
            {
                continue;
            }

            let p = track.evaluate(t);
            rctx.point(p, 7, "blue", null, 1, 0, 12000);
        }
    }

    if (DEBUG_DRAW_OCCUPIED_SEGMENTS)
    {
        for (let i of this.occupied(track))
        {
            let seg = track.segments[i];
            rctx.polyline(seg.rail_left, 2, "blue", null, 1000);
            rctx.polyline(seg.rail_right, 2, "blue", null, 1000);
        }
    }

    for (let part of this.particles)
    {
        part.draw(rctx);
    }

    rctx.ctx.restore();
}

Train.prototype.drop_history = function(multitrack)
{
    while (this.history.length > 30)
    {
        let track = this.get_track(multitrack);
        let segno = this.segment_number(track);
        let h = this.history[0];
        let [idx, sign] = split_signed_index(segno);
        let arclength = multitrack.segments[idx].length;
        let t = track.s_to_t(this.pos);
        if (t == null || t < 1)
        {
            return;
        }
        t -= 1;
        this.history.shift();
        let t2 = this.get_track(multitrack);
        this.pos = t2.t_to_s(t);
    }
}

Train.prototype.step = function(dt, multitrack)
{
    this.drop_history(multitrack);
    let track = this.get_track(multitrack);

    let [smax, smin] = this.s_limits();
    let remaining = Math.max(0, track.length() - smax);

    let hard_stop_distance = Math.abs(this.vel * this.vel / (2 * this.acc));

    let target_vel = this.max_vel;
    if (remaining < hard_stop_distance + 10)
    {
        target_vel = 0;
    }

    if (this.vel < target_vel)
    {
        this.vel += this.acc * dt;
    }
    if (this.vel > target_vel)
    {
        this.vel -= this.acc * dt;
    }
    this.vel = clamp(this.vel, 0, 500);

    this.pos += this.vel * dt;

    this.pos %= track.length();

    let segno = this.segment_number(track);
    if (segno == null)
    {
        console.log("Got null segment number!")
    }
    else if (this.history.length == 0 || this.history[this.history.length - 1] != segno)
    {
        this.history.push(segno);
    }

    if (this.tbd.length > 0 && segno == this.tbd[0])
    {
        let [idx, sign] = split_signed_index(segno);
        // let arclength = multitrack.segments[idx].length;
        // this.pos -= arclength;
        this.tbd.shift();
    }

    for (let part of this.particles)
    {
        part.step(dt);
    }
    this.particles = this.particles.filter(p => p.lifetime > 0);

    let t = track.s_to_t(this.pos - 20);
    if (t == null)
    {
        return;
    }

    let p = track.evaluate(t);
    let u = track.tangent(t);
    if (p == null || u == null)
    {
        console.log("got null with t = ", t);
        return;
    }

    let train_v = mult2d(u, this.vel);
    train_v[0] += rand(-10, 10);
    train_v[1] += rand(-10, 10);

    if (this.emits_smoke)
    {
        let s = new SmokeParticle(p, train_v, rand(4, 6));
        this.particles.push(s);
    }
}
