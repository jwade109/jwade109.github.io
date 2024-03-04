"use strict";

const NOMINAL_FRAMERATE = 30;
const NOMINAL_DT = 1 / NOMINAL_FRAMERATE;
const MAX_CURVATURE = 6E-3;

let PAUSED = false;
let STEPS = 0;

function MouseState()
{
    this.onclick = false;
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
    this.mouse_down_at = this.last_mouse_pos;
    this.onclick = true;
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
    this.onclick = false;
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

    tb.cursor(-16);
    tb.extend(100, -MAX_CURVATURE);
    tb.extend(30, 0);
    tb.extend(400, 0);
    let h1 = tb.extend(100, 0);
    tb.cursor(-8);
    tb.connect(-h1);

    let hroot = tb.segments.length - 1;
    let ls = tb.segments[hroot];

    let n_yard = 7;

    for (let i = 0; i < n_yard; ++i)
    {
        let [x1, y1] = ls.points[ls.points.length - 1];

        let p1 = [x1 + 20 * i, y1 + 400];
        let p2 = [x1 + 20 * i, y1 + 1100];

        tb.segments.push(linear_spline(p1, p2));
    }

    for (let i = 0; i < n_yard; ++i)
    {
        tb.cursor(hroot);
        tb.connect(-(hroot + i + 2));
    }

    tb.cursor(hroot + 2);
    tb.extend(400, MAX_CURVATURE);
    let h_exit = tb.extend(200, 0);
    tb.extend(900, 0);
    tb.connect(11);

    for (let i = 1; i < n_yard; ++i)
    {
        tb.cursor(-h_exit);
        tb.connect(hroot + i + 2);
    }

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
        linear_spline([-20, 0], [20, 0])
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

function build_unidirectional_track()
{
    let tb = new TrackBuilder();

    let root = tb.add(linear_spline([-400, -100], [-300, -100]));

    for (let i = 0; i < 6; ++i)
    {
        tb.extend(100, 0);
    }

    tb.extend(50, MAX_CURVATURE);
    tb.extend(490, MAX_CURVATURE);
    let h2 = tb.extend(50, 0);

    for (let i = 0; i < 8; ++i)
    {
        tb.extend(100, 0);
    }

    tb.connect(-root, 0.8);

    tb.cursor(root);
    tb.extend(200, -MAX_CURVATURE);
    tb.extend(50, MAX_CURVATURE);
    tb.extend(200, 0);
    tb.extend(200, 0);
    tb.extend(200, MAX_CURVATURE/2);
    tb.extend(200, MAX_CURVATURE);
    tb.extend(200, MAX_CURVATURE);
    tb.extend(150, -MAX_CURVATURE/2);
    tb.connect(-h2);

    tb.cursor(root + 3);
    tb.extend(150, MAX_CURVATURE);
    tb.extend(150, MAX_CURVATURE);
    tb.extend(200, 0);
    tb.extend(150, MAX_CURVATURE);
    tb.extend(200, MAX_CURVATURE);
    tb.extend(150, 0);
    tb.connect(-(root + 17));

    let blocks = {};
    blocks[root + 3]  = UNIQUE_BLOCK_ID;
    blocks[root + 4]  = UNIQUE_BLOCK_ID;
    blocks[root + 5]  = UNIQUE_BLOCK_ID;
    blocks[root + 28] = UNIQUE_BLOCK_ID;
    UNIQUE_BLOCK_ID++;

    blocks[root + 10] = UNIQUE_BLOCK_ID;
    blocks[root + 11] = UNIQUE_BLOCK_ID;
    blocks[root + 30] = UNIQUE_BLOCK_ID;
    blocks[root + 31] = UNIQUE_BLOCK_ID;
    UNIQUE_BLOCK_ID++;

    blocks[root + 0]  = UNIQUE_BLOCK_ID;
    blocks[root + 1]  = UNIQUE_BLOCK_ID;
    blocks[root + 2]  = UNIQUE_BLOCK_ID;
    blocks[root + 19] = UNIQUE_BLOCK_ID;
    UNIQUE_BLOCK_ID++;

    blocks[root + 14] = UNIQUE_BLOCK_ID;
    blocks[root + 15] = UNIQUE_BLOCK_ID;
    blocks[root + 16] = UNIQUE_BLOCK_ID;
    blocks[root + 17] = UNIQUE_BLOCK_ID;
    blocks[root + 34] = UNIQUE_BLOCK_ID;
    UNIQUE_BLOCK_ID++;

    blocks[root + 8]  = UNIQUE_BLOCK_ID;
    blocks[root + 9]  = UNIQUE_BLOCK_ID;
    blocks[root + 26] = UNIQUE_BLOCK_ID;
    blocks[root + 27] = UNIQUE_BLOCK_ID;
    UNIQUE_BLOCK_ID++;

    return new MultiTrack(tb.segments, tb.connections, blocks);
}

function WorldState()
{
    this.atc = new AutomaticTrainControl(
        make_trains(2, 12),
        // build_procedural_track(),
        // build_multi_junction_issue_track(),
        build_unidirectional_track()
    );

    this.zoom_scale = 1;
    this.target_zoom_scale = 1;
    this.viewport_center = [0, 0];
    this.viewport_easing = [0, 0];
    this.follow_train_index = 0;
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

    if (this.follow_train_index > 0 && this.follow_train_index <= this.atc.trains.length)
    {
        let p = this.atc.get_train_pos(this.follow_train_index - 1);
        if (p != null)
        {
            this.viewport_center = p.slice();
        }
    }

    let rctx = get_render_context(vpc, this.zoom_scale);

    // origin gridlines
    rctx.polyline([[-2000, 0], [2000, 0]], 1, "lightgray", -1);
    rctx.polyline([[0, -2000], [0, 2000]], 1, "lightgray", -1);

    this.atc.draw(rctx);

    // if (mouse_state.last_mouse_pos != null)
    // {
    //     let p = rctx.screen_to_world(mouse_state.last_mouse_pos);
    //     rctx.point(p, 3, "#333333");
    // }

    let text_y = 40;
    let dy = 30;

    // rctx.text("Right click toggles mouse following", [40, text_y += dy]);
    // rctx.text("Left click to add a new segment", [40, text_y += dy]);
    rctx.text("Spacebar pauses the simulation", [40, text_y += dy]);
    rctx.text("Scroll wheel and UD arrow keys zoom in and out", [40, text_y += dy]);
    rctx.text("LR arrow keys switch between trains", [40, text_y += dy]);
    rctx.text("Left click and drag to move around", [40, text_y += dy]);
    if (PAUSED)
    {
        rctx.text("PAUSED", [40, text_y += dy]);
    }
    if (this.follow_train_index)
    {
        rctx.text("Following train " + this.follow_train_index, [40, text_y += dy]);
    }

    rctx.draw();
}

function make_trains(number_of_trains, length)
{
    let trains = [];
    for (let i = 0; i < number_of_trains; ++i)
    {
        trains.push(new Train(0, randint(length/2, length)));
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
    if (event.code == "ArrowRight")
    {
        world_state.follow_train_index += 1;
        world_state.follow_train_index %= (world_state.atc.trains.length + 1);

        if (world_state.follow_train_index > 0)
        {
            world_state.target_zoom_scale = 0.6;
        }
    }
    if (event.code == "ArrowLeft")
    {
        if (world_state.follow_train_index > 0)
        {
            world_state.follow_train_index -= 1;
        }

        if (world_state.follow_train_index > 0)
        {
            world_state.target_zoom_scale = 0.6;
        }
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
    world_state.follow_train_index = 0;

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
