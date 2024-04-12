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

function build_turnaround_track()
{
    let tb = new TrackBuilder(linear_spline([-100, 350], [200, 350]));

    let root = tb.signed_index;

    function make_loop()
    {
        let loop_root = tb.signed_index;
        let node_a = null;
        let node_b = null;

        for (let i = 0; i < 3; ++i)
        {
            tb.extend(100, -MAX_CURVATURE/2.1, true);
        }

        for (let i = 0; i < 4; ++i)
        {
            node_a = tb.extend(100, MAX_CURVATURE, true);
        }

        tb.cursor(loop_root);

        for (let i = 0; i < 3; ++i)
        {
            tb.extend(100, MAX_CURVATURE/2.1, true);
        }

        for (let i = 0; i < 4; ++i)
        {
            node_b = tb.extend(100, -MAX_CURVATURE, true);
        }

        tb.cursor(node_a);
        tb.connect(node_b, 0.3, true);

        tb.cursor(-loop_root);
    }

    make_loop();

    tb.cursor(-root);

    make_loop();

    tb.cursor(-root);

    tb.extend(30, MAX_CURVATURE);
    tb.extend(100, MAX_CURVATURE);
    tb.extend(100, MAX_CURVATURE);
    tb.extend(100, MAX_CURVATURE);
    tb.extend(100, 0);
    tb.extend(100, 0);
    tb.extend(100, 0);
    tb.extend(100, MAX_CURVATURE);
    tb.extend(100, MAX_CURVATURE);
    tb.extend(100, MAX_CURVATURE);
    tb.extend(100, 0);
    tb.extend(100, 0);
    tb.extend(100, 0);
    tb.extend(100, 0);
    tb.extend(100, 0);
    tb.connect(-106);

    tb.cursor(root + 35);
    tb.extend(100, -MAX_CURVATURE);
    tb.extend(100, -MAX_CURVATURE);
    tb.extend(100, -MAX_CURVATURE);
    tb.extend(100, 0);
    tb.extend(100, 0);

    make_loop();

    tb.extend(100, -MAX_CURVATURE);
    tb.extend(100, -MAX_CURVATURE);
    tb.extend(100, 0);
    tb.extend(100, 0);
    tb.extend(100, MAX_CURVATURE);
    tb.extend(100, MAX_CURVATURE);
    tb.extend(100, MAX_CURVATURE);
    tb.extend(100, MAX_CURVATURE);
    tb.extend(100, 0);
    tb.extend(100, 0);

    tb.connect(-145);

    tb.cursor(-128);
    tb.extend(100, 0);
    tb.extend(100, 0);
    tb.connect(-136);

    let block_list =[
        [101, 108, 109, 102, 100, 131, 132, 123, 116],
        [127, 178],
        [180, 135],
        [105, 146],
        [143, 144, 177],
        [136, 137, 148, 147],
        [149, 150, 167, 168],
        [152, 159, 153, 160]
    ];

    let blocks = {};

    for (let bl of block_list)
    {
        for (let b of bl)
        {
            blocks[b] = UNIQUE_BLOCK_ID;
        }
        UNIQUE_BLOCK_ID++;
    }

    console.log(blocks);

    return new MultiTrack(tb.segments, tb.connections, blocks);
}

function WorldState()
{
    this.atc = new AutomaticTrainControl(
        1,
        // build_procedural_track(),
        // build_multi_junction_issue_track(),
        // build_unidirectional_track(),
        build_turnaround_track()
    );

    this.zoom_scale = 0.3;
    this.target_zoom_scale = 0.3;
    this.viewport_center = [0, 0];
    this.viewport_easing = [0, 0];
    this.follow_train = true;
    this.trees = [];

    // let colors = [
    //     "#40a55b",
    //     "#328147",
    //     "#245c33",
    //     // "#f47b20",
    //     // "#9c5708",
    //     // "#561818"
    // ]

    for (let pt of generate_trees(this.atc.multitrack))
    {
        // let c = colors[randint(0, colors.length)];

        this.trees.push({
            "pos": pt,
            "radius": rand(4, 12),
            "g": randint(40, 100),
            "alpha": rand(0.4, 1)
        });
    }

    this.overhead = generate_overhead_thingies(this.atc.multitrack);
    console.log(this.overhead);
}

WorldState.prototype.step = function(dt)
{
    this.atc.step(dt);
}

function generate_trees(multitrack)
{
    let points = [];

    for (let segment_id in multitrack.segments)
    {
        for (let t of linspace(0, 1, 20))
        {
            let p = multitrack.segments[segment_id].evaluate(t);
            points.push(p);
        }
    }

    function distance_to(test_point)
    {
        let [best, dist] = nearest_point(points, test_point);
        return dist;
    }

    let trees = [];

    for (let i = 0; i < 6000; ++i)
    {
        let pt = [rand(-2000, 2000), rand(-1200, 1200)];
        if (distance_to(pt) < 30)
        {
            continue;
        }
        trees.push(pt);
    }

    return trees;
}

function generate_overhead_thingies(multitrack)
{
    let things = [];
    let n = randint(7, 16);

    for (let sid in multitrack.segments)
    {
        if (rand(0, 1) > 0.03)
        {
            continue;
        }
        things.push({
            "segment_id": sid,
            "t": rand(0.1, 0.9),
            "rate": rand(0.1, 4),
            "offset": rand(1, 5)
        });
    }
    return things;
}

WorldState.prototype.draw = function()
{
    if (this.follow_train)
    {
        let p = this.atc.get_train_pos(0);
        if (p != null)
        {
            this.viewport_center = p.slice();
        }
    }

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

    if (this.follow_train)
    {
        let p = this.atc.get_train_pos(0);
        if (p != null)
        {
            this.viewport_center = p.slice();
        }
    }

    let rctx = get_render_context(vpc, this.zoom_scale);

    // origin gridlines
    // rctx.polyline([[-2000, 0], [2000, 0]], 1, "lightgray", -1);
    // rctx.polyline([[0, -2000], [0, 2000]], 1, "lightgray", -1);

    this.atc.draw(rctx);

    for (let tree of this.trees)
    {
        let c = rgb(0, tree.g, 0);
        rctx.point(tree.pos, tree.radius, c, null, 1, 0, 0);
    }
    for (let tree of this.trees)
    {
        let c = rgb(0, tree.g + 8, 0);
        rctx.point(tree.pos, tree.radius * 0.7, c, null, 1, 0, 0);
    }

    for (let overhead of this.overhead)
    {
        let color = "#303030";
        let segment = this.atc.multitrack.segments[overhead.segment_id];
        let p = segment.evaluate(overhead.t);
        let t = segment.tangent(overhead.t);
        let u = segment.normal(overhead.t);
        let w = 14;
        let h = 2;
        let right = mult2d(u,  w);
        let left  = mult2d(u, -w);
        let fw    = mult2d(t,  h);
        let back  = mult2d(t, -h);
        let fr = add2d(p, add2d(right, fw));
        let br = add2d(p, add2d(right, back));
        let fl = add2d(p, add2d(left,  fw));
        let bl = add2d(p, add2d(left,  back));
        rctx.polyline([bl, br, fr, fl, bl, br], 2, color, null, 100);
        rctx.polyline([fl, br], 1, color, null, 100);
        rctx.polyline([fr, bl], 1, color, null, 100);

        let left_light = add2d(p, mult2d(left,  0.7));
        let right_light = add2d(p, mult2d(right, 0.7));

        let time = new Date().getTime() / 1000;

        let parameter = time * 3 + overhead.offset;

        let red_opacity = Math.pow(Math.cos(parameter) / 2 + 0.5, 12);
        let green_opacity = Math.pow(Math.sin(parameter) / 2 + 0.5, 12);

        rctx.point(left_light,  2,  "red",   null, 0.8 * red_opacity, 0, 101);
        rctx.point(left_light,  6,  "red",   null, 0.4 * red_opacity, 0, 101);
        rctx.point(left_light,  12, "red",   null, 0.4 * red_opacity, 0, 101);
        rctx.point(right_light, 2,  "green", null, 0.8 * green_opacity, 0, 101);
        rctx.point(right_light, 6,  "green", null, 0.4 * green_opacity, 0, 101);
        rctx.point(right_light, 12, "green", null, 0.2 * green_opacity, 0, 101);
    }

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
    rctx.text("F to toggle train following", [40, text_y += dy]);
    rctx.text("Left click and drag to move around", [40, text_y += dy]);
    if (PAUSED)
    {
        rctx.text("PAUSED", [40, text_y += dy]);
    }
    // if (this.follow_train_index)
    // {
    //     rctx.text("Following train " + this.follow_train_index, [40, text_y += dy]);
    // }

    rctx.draw();
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
        if (dt > NOMINAL_DT * 3)
        {
            world_state.step(NOMINAL_DT);
        }
        else
        {
            world_state.step(dt);
        }
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
    // if (event.code == "ArrowRight")
    // {
    //     world_state.follow_train += 1;
    //     world_state.follow_train %= (Object.keys(world_state.atc.trains).length + 1);

    //     if (world_state.follow_train > 0)
    //     {
    //         world_state.target_zoom_scale = 0.6;
    //     }
    // }
    // if (event.code == "ArrowLeft")
    // {
    //     if (world_state.follow_train > 0)
    //     {
    //         world_state.follow_train -= 1;
    //     }

    //     if (world_state.follow_train > 0)
    //     {
    //         world_state.target_zoom_scale = 0.6;
    //     }
    // }
    if (event.code == "KeyZ")
    {

    }
    if (event.code == "KeyF")
    {
        world_state.follow_train = !world_state.follow_train;
        if (world_state.follow_train)
        {
            world_state.target_zoom_scale = 0.3;
        }
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
    world_state.follow_train = false;

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
