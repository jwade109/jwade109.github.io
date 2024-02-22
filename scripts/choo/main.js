"use strict";

let NOMINAL_FRAMERATE = 30;
let NOMINAL_DT = 1 / NOMINAL_FRAMERATE;
let PAUSED = false;
let STEPS = 0;
let MAX_CURVATURE = 6E-3;
let NEW_SEGMENT_GENERATION_LENGTH = [300, 1200];
let DRAGGED_OFFSET = [0, 0];

let WORLD_GRID = {};

const GRID_SCALE_FACTOR = 1000;

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
    return generate_clothoid_sweep(p, u, arclength / 10, [arclength],
        [segment.k_0], linspace(-MAX_CURVATURE, MAX_CURVATURE, n));
}

function build_procedural_track()
{
    let c0 = generate_clothoid([0, -400], [0, 1], 300, 50, -MAX_CURVATURE/4, 0);

    let tb = new TrackBuilder(c0);

    for (let c of linspace(-MAX_CURVATURE/2, MAX_CURVATURE/2, 3))
    {
        tb.cursor(1);
        tb.extend(400, c);
    }

    tb.cursor(3);
    tb.extend(400, -MAX_CURVATURE/3);
    tb.extend(200, -MAX_CURVATURE);
    tb.extend(500, -MAX_CURVATURE);
    tb.extend(30, MAX_CURVATURE);

    tb.cursor(4);
    tb.extend(400, 0);
    tb.extend(300, -MAX_CURVATURE);
    tb.extend(300, MAX_CURVATURE);

    tb.cursor(9);
    tb.extend(200, MAX_CURVATURE);
    tb.extend(200, MAX_CURVATURE);
    tb.extend(600, -MAX_CURVATURE/2);

    tb.cursor(-8);
    tb.extend(500, 0);
    tb.extend(300, 0);

    tb.cursor(14);
    let ctr = tb.extend(600, MAX_CURVATURE/2);
    tb.cursor(14);
    tb.extend(300, -MAX_CURVATURE/2);
    tb.cursor(-ctr);
    tb.extend(100, -MAX_CURVATURE);
    tb.extend(300, MAX_CURVATURE);
    tb.cursor(ctr);
    tb.connect(-1);

    tb.cursor(8);
    tb.connect(2);

    for (let c of linspace(-MAX_CURVATURE/2, MAX_CURVATURE/2, 3))
    {
        tb.cursor(-1);
        tb.extend(400, c);
    }

    tb.cursor(15);
    tb.connect(24);
    tb.cursor(16);
    tb.connect(24);

    tb.cursor(6);
    tb.connect(-16);

    tb.cursor(-12);
    tb.connect(-6);

    let root = 16;
    let endpoint = null;
    for (let i = 0; i < 4; ++i)
    {
        tb.cursor(root);
        tb.extend(200, -MAX_CURVATURE);
        tb.extend(50, 0);
        tb.extend(300, 0);
        tb.extend(200, -MAX_CURVATURE);
        tb.extend(30, 0);
        tb.extend(600, 0);

        if (i == 0)
        {
            tb.extend(400, 0);
            endpoint = tb.extend(100, 0);
            tb.connect(23);
        }
        else
        {
            tb.connect(-endpoint);
        }

        tb.cursor(root);
        root = tb.extend(30, 0);
    }

    tb.cursor(18);
    tb.extend(700, 0);
    tb.extend(1000, 0);
    tb.extend(200, -MAX_CURVATURE);
    let end = tb.extend(200, -MAX_CURVATURE);

    tb.cursor(11);
    tb.connect(end)

    tb.cursor(25);
    tb.connect(34);

    tb.cursor(20);
    tb.connect(-11);

    tb.cursor(-14);
    tb.connect(20);

    return [tb.segments, tb.connections];
}

function build_simple_test_track()
{
    let tb = new TrackBuilder(
        generate_clothoid([0, -400], [0, 1], 300, 50, MAX_CURVATURE/5, MAX_CURVATURE/5)
    );
    for (let i = 0; i < 20; ++i)
    {
        tb.extend(300, -MAX_CURVATURE/2.5 + 0.001 * i);
    }
    // tb.connect(-1);
    return [tb.segments, tb.connections];
}

function get_nontrivial_random_route(src, multitrack)
{
    for (let i = 0; i < 100; ++i)
    {
        if (src == null)
        {
            src = randint(-multitrack.segments.length, multitrack.segments.length + 1);
        }
        let dst = randint(-multitrack.segments.length, multitrack.segments.length + 1);
        let rt = multitrack.route_between(src, dst);
        if (rt && rt.length > 5)
        {
            return rt;
        }
    }
    return null;
}

function WorldState()
{
    // let [segments, connections] = build_simple_test_track();
    let [segments, connections] = build_procedural_track();
    this.trains = make_trains();
    this.multitrack = new MultiTrack(segments, connections);
    this.zoom_scale = 1;
    this.target_zoom_scale = 1;

    for (let t of this.trains)
    {
        let route = get_nontrivial_random_route(null, this.multitrack);
        if (route)
        {
            t.enqueue_route(route);
        }
    }
}

WorldState.prototype.step = function(dt)
{
    for (let t of this.trains)
    {
        t.step(dt, this.multitrack);

        if (t.history.length > 0 && t.tbd.length == 0 && t.vel < 10)
        {
            console.log("New route");
            let segno = t.history[t.history.length - 1];
            let route = get_nontrivial_random_route(segno, this.multitrack);
            if (route)
            {
                t.enqueue_route(route);
            }
        }
    }
}

WorldState.prototype.draw = function()
{
    this.zoom_scale += (this.target_zoom_scale - this.zoom_scale) * 0.5;

    // get current camera viewport bounds
    let center = [0, 0];
    if (this.trains.length)
    {
        let tr = this.trains[0];
        let track = tr.get_track(this.multitrack);
        let t = track.s_to_t(tr.pos);
        if (t != null && t !== undefined)
        {
            center = track.evaluate(t);
        }
    }

    let rctx = get_render_context(center, this.zoom_scale);

    // origin gridlines
    rctx.polyline([[-2000, 0], [2000, 0]], 1, "lightgray", -1);
    rctx.polyline([[0, -2000], [0, 2000]], 1, "lightgray", -1);

    for (let t of this.trains)
    {
        t.draw(rctx, this.multitrack);
    }

    if (mouse_state.last_mouse_pos)
    {
        let world = rctx.screen_to_world(mouse_state.last_mouse_pos);
        // let gi = to_grid_index(world, GRID_SCALE_FACTOR);
        // let aabb = grid_aabb(gi, GRID_SCALE_FACTOR);
        // aabb.draw(rctx);

        rctx.screen_point(mouse_state.last_mouse_pos, 3);
        let dragging = mouse_state.dragging();
        if (dragging != null)
        {
            let d = add2d(dragging, mouse_state.mouse_down_at);
            let base = rctx.screen_to_world(mouse_state.mouse_down_at);
            let tip = rctx.screen_to_world(d);
            rctx.arrow(base, tip, 3, "red", 5000);
        }

        if (mouse_state.mouse_down_at)
        {
            world = rctx.screen_to_world(mouse_state.mouse_down_at);
        }
        let u = [0, 1];
        if (dragging && mag2d(dragging) > 0)
        {
            u = unit2d(dragging);
            u[1] *= -1;
        }
    }

    this.multitrack.draw(rctx);

    let text_y = 40;
    let dy = 30;

    // rctx.text("Right click toggles mouse following", [40, text_y += dy]);
    // rctx.text("Left click to add a new segment", [40, text_y += dy]);
    rctx.text("Spacebar pauses the simulation", [40, text_y += dy]);
    rctx.text("Scroll wheel and arrow keys zoom in and out", [40, text_y += dy]);

    rctx.draw();
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

function make_trains(length)
{
    let trains = [];
    for (let i = 0; i < 1; ++i)
    {
        trains.push(new Train(0, rand(7, 22)));
    }
    return trains;
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
    // console.log(event);
    if (event.code == "Space")
    {
        PAUSED = !PAUSED;
    }
    if (event.code == "KeyS")
    {
        STEPS += 1;
    }
});

document.addEventListener('keydown', function(event)
{
    // console.log(event);
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
    // console.log(event);

    if (event.button == 0)
    {
        mouse_state.down();
    }
    else if (event.button == 2)
    {
        // right click
    }
});

document.addEventListener('mouseup', function(event)
{
    // console.log(event);
    if (mouse_state.dragging())
    {
        DRAGGED_OFFSET = mouse_state.dragging();
    }
    mouse_state.up();
});

document.addEventListener('mousewheel', function(event)
{
    // console.log(event);
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
