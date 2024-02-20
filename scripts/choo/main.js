"use strict";

var WIDTH = document.body.clientWidth;
var HEIGHT = document.body.scrollHeight;

let NOMINAL_FRAMERATE = 30;
let NOMINAL_DT = 1 / NOMINAL_FRAMERATE;
let PAUSED = false;
let STEPS = 0;
let MAX_CURVATURE = 6E-3;
let NEW_SEGMENT_GENERATION_LENGTH = [300, 1200];
let CURRENT_NEXT_SEGMENT = null;
let DRAGGED_OFFSET = [0, 0];

function MouseState()
{
    this.last_mouse_pos = null;
    this.mouse_down_at = null;
}

MouseState.prototype.dragging = function()
{
    if (this.last_mouse_pos == null || this.mouse_down_at == null)
    {
        return null;
    }
    return sub2d(this.last_mouse_pos, this.mouse_down_at);
}

MouseState.prototype.down = function()
{
    this.mouse_down_at = this.last_mouse_pos;
}

MouseState.prototype.up = function()
{
    this.mouse_down_at = null;
}

let mouse_state = new MouseState();

function sweep_from_segment(segment, n, arclength)
{
    let p = segment.evaluate(1);
    let u = segment.tangent(1);
    return generate_clothoid_sweep(p, u, arclength, arclength / 10,
        [segment.k_0], linspace(-MAX_CURVATURE, MAX_CURVATURE, n));
}

function generate_sample_multitrack()
{
    let segments = [
        line_clothoid([-300, -100], [-100,    0]),
        line_clothoid([ 150,  100], [ -50,   20]),
        line_clothoid([ -50,    0], [  50, -100]),
        line_clothoid([  60, -100], [ 150,   80]),
        line_clothoid([  50, -120], [  50, -200]),
        line_clothoid([ 170,  100], [ 280,  110]),
        line_clothoid([ 170,   90], [ 260,   70]),

        // line_clothoid([ -50,   40], [ 30,  250]),
        // line_clothoid([ -50,   40], [ 30,  250]),
        // line_clothoid([ 170,   90], [ 260,   70]),
        // line_clothoid([ 170,   90], [ 260,   70]),
    ];

    let connections = [
        [ 1,  3],
        [ 1, -2],
        [ 3,  5],
        [-5,  4],
        [-2,  6],
        [-2,  7],
        [ 4,  6],
        [ 4,  7]
    ];

    return [segments, connections]
}

function WorldState()
{
    let [segments, connections] = generate_sample_multitrack();
    this.track = new Track(segments);
    this.trains = make_trains(this.track.length());
    this.multitrack = new MultiTrack(segments, connections);
    this.zoom_scale = 1;
    this.target_zoom_scale = 1;
}

WorldState.prototype.step = function(dt)
{
    // let track_changed = false;

    for (let t of this.trains)
    {
        t.step(dt, this.track);

        // let [max_s, min_s] = t.s_limits();
        // if (max_s > this.track.length())
        // {
        //     let arclength = rand(NEW_SEGMENT_GENERATION_LENGTH[0], NEW_SEGMENT_GENERATION_LENGTH[1]);
        //     track_changed |= this.track.extend(max_s, arclength, CURRENT_NEXT_SEGMENT);
        // }
        // track_changed |= this.track.prune(min_s);
    }
    normalize_path_coords(this.track, this.trains);
}

WorldState.prototype.draw = function()
{
    this.zoom_scale += (this.target_zoom_scale - this.zoom_scale) * 0.5;

    // get current camera viewport bounds
    let center = [0, 0];
    if (this.trains.length)
    {
        let t = this.track.s_to_t(this.trains[0].pos);
        if (t != null)
        {
            center = this.track.evaluate(t);
        }
    }

    let rctx = get_render_context(center, this.zoom_scale);

    rctx.ctx.save();

    rctx.polyline([[-2000, 0], [2000, 0]], 1, "lightgray", -1);
    rctx.polyline([[0, -2000], [0, 2000]], 1, "lightgray", -1);

    // this.track.draw(rctx);

    for (let t of this.trains)
    {
        t.draw(rctx, this.track);
    }

    let end_segment = this.track.segments[this.track.segments.length - 1];
    let p = end_segment.evaluate(1);
    let u = end_segment.tangent(1);
    let k_0 = end_segment.k_f;

    if (mouse_state.last_mouse_pos)
    {
        rctx.screen_point(mouse_state.last_mouse_pos, 3);
        let dragging = mouse_state.dragging();
        if (dragging != null)
        {
            let d = add2d(dragging, mouse_state.mouse_down_at);
            let base = rctx.screen_to_world(mouse_state.mouse_down_at);
            let tip = rctx.screen_to_world(d);
            rctx.arrow(base, tip, 3, "red", 5000);
            console.log(base, tip);
        }

        // let world = rctx.screen_to_world(mouse_state.last_mouse_pos);
        // CURRENT_NEXT_SEGMENT = targeted_clothoid(p, u, k_0, world);
        // CURRENT_NEXT_SEGMENT.draw(rctx);
    }

    this.multitrack.draw(rctx);

    let text_y = 40;
    let dy = 30;

    // rctx.text("Right click toggles mouse following", [40, text_y += dy]);
    // rctx.text("Left click to add a new segment", [40, text_y += dy]);
    rctx.text("Spacebar increments route index", [40, text_y += dy]);
    rctx.text("Scroll wheel and arrow keys zoom in and out", [40, text_y += dy]);

    rctx.draw();

    rctx.ctx.restore();
}

function generate_clothoid_sweep(start, dir, arclength, n, k_0_n, k_f_n)
{
    let segments = [];
    for (let k_0 of k_0_n)
    {
        for (let k_f of k_f_n)
        {
            let t = generate_clothoid(start, dir, arclength, n, k_0, k_f);
            segments.push(t);
        }
    }
    return segments;
}

function make_trains(length)
{
    let trains = [];
    for (let i = 0; i < 0; ++i)
    {
        trains.push(new Train(rand(0, length), rand(30, 60)));
    }
    return trains;
}

function linspace(min, max, n)
{
    let ret = [];
    n = Math.floor(n);
    for (let i = 0; i < n; ++i)
    {
        ret.push(lerp(min, max, i / (n - 1)));
    }
    return ret;
}

function targeted_clothoid(start, dir, k_0, end)
{
    let arclength = 500;
    let sweep = generate_clothoid_sweep(start, dir, arclength, arclength / 10,
        linspace(-MAX_CURVATURE, MAX_CURVATURE, 10),
        linspace(-MAX_CURVATURE, MAX_CURVATURE, 10));

    let best_curve = sweep[0];
    let d_min = distance(best_curve.points[0], end);
    for (let i = 0; i < sweep.length; ++i)
    {
        let curve = sweep[i];
        for (let p of curve.points)
        {
            let d = distance(p, end);
            if (d < d_min)
            {
                d_min = d;
                best_curve = curve;
            }
        }
    }

    return best_curve;
}

function get_render_context(center_world, zoom_scale)
{
    let du = [zoom_scale * document.body.clientWidth / 2,
              zoom_scale * document.body.clientHeight / 2];
    let min = sub2d(center_world, du);
    let max = add2d(center_world, du);
    let bounds = new AABB(min, max);

    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");
    ctx.canvas.width = document.body.clientWidth;
    ctx.canvas.height = document.body.clientHeight;
    return new RenderContext(ctx, ctx.canvas.width, ctx.canvas.height, bounds);
}

function normalize_path_coords(track, trains)
{
    for (let t of trains)
    {
        t.pos -= track.offset;
    }
    track.offset = 0;
}

let world_state = new WorldState();

function update(previous, now)
{
    const dt = now - previous;

    if (!PAUSED)
    {
        STEPS = 0;
        world_state.step(NOMINAL_DT);
    }
    else if (STEPS > 0)
    {
        world_state.step(NOMINAL_DT / 10);
        STEPS -= 1;
    }
}

const START_TIME = new Date().getTime() / 1000;
let previous = null;

var gameloop = setInterval(function()
{
    let now = new Date().getTime() / 1000 - START_TIME;
    if (previous != null)
    {
        update(previous, now)
        world_state.draw();
    }
    previous = now;

}, NOMINAL_DT * 1000);

// ===========================================================================
// EVENT HANDLERS

document.addEventListener('keypress', function(event)
{
    console.log(event);
    if (event.code == "Space")
    {
        PAUSED = !PAUSED;
        ROUTE_INDEX += 1;
    }
    if (event.code == "KeyS")
    {
        STEPS += 1;
    }
});

document.addEventListener('keydown', function(event)
{
    console.log(event);
    if (event.code == "ArrowUp")
    {
        world_state.target_zoom_scale /= 1.7;
    }
    if (event.code == "ArrowDown")
    {
        world_state.target_zoom_scale *= 1.7;
    }
});

document.addEventListener('mousemove', function(event)
{
    var box = canvas.getBoundingClientRect();
    mouse_state.last_mouse_pos = [event.clientX - box.left, event.clientY - box.top];
});

document.addEventListener('mousedown', function(event)
{
    console.log(event);

    if (event.button == 0)
    {
        mouse_state.down();
        // if (CURRENT_NEXT_SEGMENT)
        // {
        //     world_state.track.segments.push(CURRENT_NEXT_SEGMENT);
        //     CURRENT_NEXT_SEGMENT = null;
        // }
    }
    else if (event.button == 2)
    {
        // right click
    }
});

document.addEventListener('mouseup', function(event)
{
    console.log(event);
    if (mouse_state.dragging())
    {
        DRAGGED_OFFSET = mouse_state.dragging();
    }
    mouse_state.up();
});

document.addEventListener('mousewheel', function(event)
{
    console.log(event);
    if (window.scrollY == 0)
    {
        event.preventDefault();
        if (event.deltaY > 0) world_state.target_zoom_scale *= 1.3;
        if (event.deltaY < 0) world_state.target_zoom_scale /= 1.3;
    }
},
{ capture: true, passive: false});

canvas.oncontextmenu = function(e)
{
    e.preventDefault();
};

// ===========================================================================
