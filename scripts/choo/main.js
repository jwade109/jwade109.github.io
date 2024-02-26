"use strict";

const NOMINAL_FRAMERATE = 30;
const NOMINAL_DT = 1 / NOMINAL_FRAMERATE;
const MAX_CURVATURE = 6E-3;

let PAUSED = false;
let STEPS = 0;

function MouseState()
{
    this.last_mouse_pos = null;
    this.mouse_down_at = null;
    this.dragged_bias = [0, 0];
}

MouseState.prototype.dragging = function()
{
    if (this.last_mouse_pos == null || this.mouse_down_at == null)
    {
        return null;
    }
    let d = sub2d(this.last_mouse_pos, this.mouse_down_at);
    return [-d[0], d[1]];
}

MouseState.prototype.down = function()
{
    this.last_mouse_pos =
    this.mouse_down_at = this.last_mouse_pos;
}

MouseState.prototype.dragged = function()
{
    let ret = this.dragged_bias.slice();
    let d = this.dragging();
    if (d != null)
    {
        ret = add2d(ret, d);
    }
    return ret;
}

MouseState.prototype.up = function()
{
    let d = this.dragging();
    if (d != null)
    {
        this.dragged_bias = add2d(this.dragged_bias, d);
    }
    this.mouse_down_at = null;
}

let mouse_state = new MouseState();

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

    tb.cursor(63);
    tb.extend(700, -MAX_CURVATURE/2);
    tb.extend(200, 0);
    tb.extend(300, 0);
    tb.connect(-38);

    return new MultiTrack(tb.segments, tb.connections);
}

function build_simple_test_track()
{
    let tb = new TrackBuilder(
        generate_clothoid([500, 0], [0, 1], 300, 50, MAX_CURVATURE/3, MAX_CURVATURE/3)
    );
    for (let i = 0; i < 95; ++i)
    {
        tb.extend(100, MAX_CURVATURE/3 + i * 0.00001);
    }
    tb.connect(-1);
    return new MultiTrack(tb.segments, tb.connections);
}

function build_multi_junction_issue_track()
{
    let tb = new TrackBuilder(
        line_clothoid([-20, 0], [20, 0])
    );

    let right_endpoints = [];
    let left_endpoints = [];

    let n = 14;

    for (let c of linspace(-MAX_CURVATURE, MAX_CURVATURE, n))
    {
        tb.cursor(1);
        let h = tb.extend(500, c);
        right_endpoints.push(h);
    }

    for (let c of linspace(-MAX_CURVATURE, MAX_CURVATURE, n))
    {
        tb.cursor(-1);
        let h = tb.extend(500, c);
        left_endpoints.push(h);
    }

    // for (let i = 0; i < n; ++i)
    // {
    //     tb.cursor(right_endpoints[i]);
    //     tb.connect(left_endpoints[n-i-1]);
    // }

    function turnaround(tb, root_node)
    {
        tb.cursor(root_node);
        tb.extend(50, -MAX_CURVATURE);
        tb.extend(200, -MAX_CURVATURE);
        tb.extend(50, MAX_CURVATURE);
        tb.extend(600, MAX_CURVATURE);
        tb.connect(root_node);
    }

    for (let i = 0; i < n; ++i)
    {
        turnaround(tb, right_endpoints[i]);
        turnaround(tb, left_endpoints[i]);
    }

    return new MultiTrack(tb.segments, tb.connections);
}

function WorldState()
{
    this.atc = new AutomaticTrainControl(
        make_trains(3),
        build_procedural_track(),
        // build_multi_junction_issue_track()
    );

    this.zoom_scale = 1;
    this.target_zoom_scale = 1;
    this.viewport_center = [0, 0];
}

WorldState.prototype.step = function(dt)
{
    this.atc.step(dt);
}

WorldState.prototype.draw = function()
{
    this.zoom_scale += (this.target_zoom_scale - this.zoom_scale) * 0.5;

    let rctx_test = get_render_context([0, 0], this.zoom_scale);
    let vpc = this.viewport_center.slice();
    if (mouse_state.dragged())
    {
        vpc = add2d(vpc, mult2d(mouse_state.dragged(), 1 / rctx_test.scalar()));
    }
    if (mouse_state.mouse_down_at == null)
    {
        let rctx_test = get_render_context([0, 0], this.zoom_scale);
        this.viewport_center = add2d(this.viewport_center,
            mult2d(mouse_state.dragged_bias, 1 / rctx_test.scalar()));
        mouse_state.dragged_bias = [0, 0];
    }

    let rctx = get_render_context(vpc, this.zoom_scale);

    // origin gridlines
    rctx.polyline([[-2000, 0], [2000, 0]], 1, "lightgray", -1);
    rctx.polyline([[0, -2000], [0, 2000]], 1, "lightgray", -1);

    this.atc.draw(rctx);

    let text_y = 40;
    let dy = 30;

    // rctx.text("Right click toggles mouse following", [40, text_y += dy]);
    // rctx.text("Left click to add a new segment", [40, text_y += dy]);
    rctx.text("Spacebar pauses the simulation", [40, text_y += dy]);
    rctx.text("Scroll wheel and arrow keys zoom in and out", [40, text_y += dy]);
    rctx.text("Left click and drag to move around", [40, text_y += dy]);
    if (PAUSED)
    {
        rctx.text("PAUSED", [40, text_y += dy]);
    }

    rctx.draw();
}

function make_trains(number_of_trains)
{
    let trains = [];
    for (let i = 0; i < number_of_trains; ++i)
    {
        trains.push(new Train(0, 12));
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
    console.log(event);
    if (event.code == "ArrowUp")
    {
        world_state.target_zoom_scale /= 1.7;
    }
    if (event.code == "ArrowDown")
    {
        world_state.target_zoom_scale *= 1.7;
    }
    if (event.code == "KeyZ")
    {

    }
});

document.addEventListener('mousemove', function(event)
{
    mouse_state.last_mouse_pos = [event.clientX, event.clientY];
});

document.addEventListener('mousedown', function(event)
{
    // console.log(event);
    mouse_state.last_mouse_pos = [event.clientX, event.clientY];

    if (event.button == 0)
    {
        mouse_state.down();
    }
    else if (event.button == 2)
    {
        // right click
    }
});

let NEXT_VIEWPORT_CENTER = null;

document.addEventListener('mouseup', function(event)
{
    // console.log(event);
    if (mouse_state.dragging())
    {
        // let test_viewport = get_render_context([0, 0], world_state.zoom_scale);
        // NEXT_VIEWPORT_CENTER = add2d(world_state.viewport_center,
        //     mult2d(mouse_state.dragging(), 1 / test_viewport.scalar()));
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
