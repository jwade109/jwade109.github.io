"use strict"

const LINKAGE_SPACING = 4;
const S_LIMITS_BUFFER = 2;
let PROBABILITY_OF_SMOKE = 1;

let DEBUG_DRAW_TRAIN_PROPERTIES = false;
let DEBUG_DRAW_TRAIN_ARCLENGTH_LIMITS = false;
let DEBUG_DRAW_TRAIN_HISTORY = false;
let DEBUG_DRAW_CURRENT_PLANNED_ROUTES = false;
let DEBUG_DRAW_OCCUPIED_SEGMENTS = false;
let DEBUG_DRAW_TRAIN_AS_SNAKE = false;
let DEBUG_DRAW_REAL_TRAIN = true;
let DEBUG_DRAW_CURRENT_TRACK = false;

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
    let r = 2.5 + this.growth_rate * (this.max_lifetime - this.lifetime);
    let alpha = 0.9 * Math.pow(this.lifetime / this.max_lifetime, 4);

    rctx.point(this.pos, r, "black", null, alpha, 0, 1000);
}

let UNIQUE_TRAIN_ID = 0;

function Train(position, n_cars)
{
    this.id = UNIQUE_TRAIN_ID;
    ++UNIQUE_TRAIN_ID;

    this.cars = [];
    this.acc = rand(50, 70);
    this.vel = 0;
    this.max_vel = rand(90, 130);
    this.pos = position;
    this.emits_smoke = Math.random() < PROBABILITY_OF_SMOKE;
    this.has_caboose = Math.random() < 0.15;
    this.tbd = [];
    this.history = [];
    this.particles = [];
    this.state = {desc: "uninitialized", time: 0};
    this.target_segment = null;

    let n_locos = Math.max(1, Math.ceil(n_cars / 12));

    let color = "peru";

    for (let i = 0; i < n_cars + n_locos; ++i)
    {
        let l = rand(35, 44);
        let w = rand(9, 11);
        if (i < n_locos)
        {
            l = 41;
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
            // if (this.emits_smoke)
            // {
            //     use_color = "lightsalmon";
            // }
        }
    
        let c = new Railcar(l, w, use_color);
        if (i < n_locos)
        {
            c = new Locomotive(l, w, use_color);
        }

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

Train.prototype.set_route = function(new_path)
{
    this.tbd = new_path.slice();
}

Train.prototype.get_track = function(multitrack)
{
    return multitrack.get_track_from_route(this.total_route());
}

Train.prototype.occupied = function(track)
{
    let [max, min] = this.s_limits();
    let s_0 = 0;
    let indices = [];
    for (let i = 0; i < track.segments.length; ++i)
    {
        let seg = track.segments[i];
        let s_f = s_0 + seg.arclength;

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

    if (new Set(indices).size < indices.length)
    {
        PAUSED = true;
        console.log("BAD");
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
        console.log("Null t value!", this.pos, track.arclength())
        return null;
    }
    let combined = this.total_route();
    return combined[Math.floor(t)];
}

Train.prototype.s_limits = function()
{
    // front, back
    return [this.pos + S_LIMITS_BUFFER, this.pos - this.arclength() - S_LIMITS_BUFFER]
}

Train.prototype.arclength = function()
{
    // TODO this doesn't take the linkage buffer into account
    let sum = 0;
    for (let c of this.cars)
    {
        sum += c.length + LINKAGE_SPACING;
    }
    return sum - LINKAGE_SPACING;
}

function draw_animated_route(track, current_time, rctx)
{
    for (let s of linspace(0, track.arclength(), track.arclength() / 50))
    {
        let s_start = (100 * current_time + s) % track.arclength();
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

    if (DEBUG_DRAW_CURRENT_PLANNED_ROUTES)
    {
        let future_track = multitrack.get_track_from_route(this.tbd);
        let current_time = new Date().getTime() / 1000;
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


    if (DEBUG_DRAW_TRAIN_PROPERTIES)
    {
        let center = track.evaluate(track.s_to_t(this.pos));
        if (center != null)
        {
            let scr = rctx.world_to_screen(center);
            let k = rctx.scalar();

            let [smax, smin] = this.s_limits();
            let dy = 19;
            let text_y = 0;
            let tarc = track.arclength();

            function write_text(str)
            {
                rctx.text(str, add2d(scr, [30 * k, text_y += dy]), "17px Arial");
            }

            write_text("id = " + this.id);
            write_text("t = " + track.s_to_t(this.pos).toFixed(2));
            write_text("s = " + this.pos.toFixed(0) + "/" + tarc.toFixed());
            write_text("v = " + this.vel.toFixed(1));
            write_text(this.state.desc + " " + this.state.time.toFixed(1));
            write_text("path = " + this.total_route());
            write_text("occ = " + this.occupied_indices(track));
            write_text("his = " + this.history);
            write_text("tbd = " + this.tbd);
            write_text("target = " + this.target_segment);
        }
    }


    if (DEBUG_DRAW_REAL_TRAIN)
    {
        let s = this.pos;
        for (let i = 0; i < this.cars.length; ++i)
        {
            let c = this.cars[i];

            s -= c.length / 2

            let front = track.evaluate(track.s_to_t(s + c.length * 0.4));
            let back = track.evaluate(track.s_to_t(s - c.length * 0.4));
            if (front == null || back == null)
            {
                continue;
            }

            let tangent = unit2d(sub2d(front, back));
            let center = mult2d(add2d(front, back), 0.5);

            s -= c.length / 2;

            if (s < LINKAGE_SPACING)
            {
                continue;
            }

            if (i + 1 < this.cars.length)
            {
                let t_link_1 = track.s_to_t(s);
                let t_link_2 = track.s_to_t(s - LINKAGE_SPACING);
                if (t_link_1 == null || t_link_2 == null)
                {
                    continue;
                }

                let p_link_1 = track.evaluate(t_link_1);
                let p_link_2 = track.evaluate(t_link_2);
                rctx.polyline([p_link_1, p_link_2], 3, "black", null, 99);
            }

            s -= LINKAGE_SPACING;

            c.draw(rctx, center, tangent)
        }
    }

    if (DEBUG_DRAW_CURRENT_TRACK)
    {
        for (let segment of track.segments)
        {
            segment.draw(rctx);
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
            rctx.point(p, 2, "blue", null, 1, 0, 12000);
        }
    }

    if (DEBUG_DRAW_TRAIN_AS_SNAKE)
    {
        let points = [];
        for (let s of linspace(Math.max(0, this.pos - this.arclength()), this.pos, 100))
        {
            let t = track.s_to_t(s);
            if (t == null)
            {
                continue;
            }
            let p = track.evaluate(t);
            points.push(p);
        }
        rctx.polyline(points, 7, "darkblue");
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
    while (this.history.length > 0)
    {
        let track = this.get_track(multitrack);
        let occupied = this.occupied_indices(track);
        let h = this.history[0];
        if (occupied.includes(h))
        {
            break;
        }
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

    if (track.segments.length == 0)
    {
        return;
    }

    let [smax, smin] = this.s_limits();
    let remaining = Math.max(0, track.arclength() - smax);

    let hard_stop_distance = Math.abs(this.vel * this.vel / (2 * this.acc));

    let target_vel = this.max_vel;
    if (remaining < hard_stop_distance + 30)
    {
        target_vel = 0;
    }
    if (remaining < 10 && this.vel > 0)
    {
        console.log("train " + this.id + " very hard stop");
        this.vel = 0;
    }
    if (this.pos > track.arclength())
    {
        this.pos = track.arclength() - 1;
    }

    if (this.tbd.length == 0 && this.vel == 0 &&
        this.history.length > 0 &&
        this.history[this.history.length - 1] == this.target_segment)
    {
        this.target_segment = null;
    }

    let new_state = "en route";
    if (this.vel == 0 && this.tbd.length == 0 && this.target_segment != null)
    {
        new_state = "no path";
    }
    else if (this.vel == 0 && target_vel == 0 && this.target_segment != null)
    {
        new_state = "blocked";
    }
    else if (this.target_segment == null)
    {
        new_state = "idle";
    }
    // else
    // {
    //     new_state = "en route";
    // }

    if (this.state.desc == new_state)
    {
        this.state.time += dt;
    }
    else
    {
        this.state.time = 0;
    }

    this.state.desc = new_state;

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

    this.pos %= track.arclength();

    let segno = this.segment_number(track);
    if (segno == null)
    {
        console.log("Got null segment number!")
        throw "whatever";
    }
    else if (this.history.length == 0 || this.history[this.history.length - 1] != segno)
    {
        this.history.push(segno);
    }

    if (this.tbd.length > 0 && segno == this.tbd[0])
    {
        let [idx, sign] = split_signed_index(segno);
        this.tbd.shift();
    }

    for (let part of this.particles)
    {
        part.step(dt);
    }
    this.particles = this.particles.filter(p => p.lifetime > 0);

    let t = track.s_to_t(this.pos - 10);
    if (t == null)
    {
        return;
    }

    let p = track.evaluate(t);
    let u = track.tangent(t);
    if (p == null || u == null)
    {
        console.log("got null with t =", t);
        return;
    }

    let train_v = mult2d(u, this.vel);
    train_v[0] += rand(-10, 10);
    train_v[1] += rand(-10, 10);

    // if (this.emits_smoke)
    // {
    //     let s = new SmokeParticle(p, train_v, rand(4, 6));
    //     if (this.vel > 40 || (this.vel > 20 && rand() < 0.2))
    //     {
    //         this.particles.push(s);
    //     }
    // }
}
