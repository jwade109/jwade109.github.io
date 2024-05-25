"use strict";

const NOMINAL_FRAMERATE = 30;
const NOMINAL_DT = 1 / NOMINAL_FRAMERATE;

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

function WorldState()
{
    this.zoom_scale = 0.3;
    this.target_zoom_scale = 0.3;
    this.viewport_center = [0, 0];
    this.viewport_easing = [0, 0];
    this.grid_angle = rand(0, Math.PI * 2);

    this.planes = [];

    for (let i = 0; i < 100; ++i)
    {
        let p = new Plane();
        this.planes.push(p);
    }
}

WorldState.prototype.step = function(dt)
{
    for (let p of this.planes)
    {
        p.step(dt);
    }
}

function rgb(r, g, b)
{
    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);

    if (r.length == 1)
    {
        r = "0" + r;
    }
    if (g.length == 1)
    {
        g = "0" + g;
    }
    if (b.length == 1)
    {
        b = "0" + b;
    }

    return "#" + r + g + b;
}

WorldState.prototype.draw = function()
{
    // if (this.follow_train)
    // {
    //     let p = this.atc.get_train_pos(0);
    //     if (p != null)
    //     {
    //         this.viewport_center = p.slice();
    //     }
    // }

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

    for (let i = -20; i <= 20; ++i)
    {
        for (let j = -20; j <= 20; ++j)
        {
            let radius = 20;
            let c = get_hex_center(i, j, radius, this.grid_angle);
            let h = new Hex(c, radius, this.grid_angle);

            let occupancy_count = 0;
            for (let p of this.planes)
            {
                occupancy_count += h.contains(p.pos);
            }

            let grey = Math.max(255 - occupancy_count * 20, 100);
            let blue = grey;
            if (mouse_state.last_mouse_pos != null)
            {
                let mp = rctx.screen_to_world(mouse_state.last_mouse_pos);
                if (h.contains(mp))
                {
                    blue = 255;
                    grey = Math.min(grey, 150);
                }
            }
            let fill = rgb(grey, grey, blue);

            h.draw(rctx, fill);
        }
    }

    for (let i = 0; i < this.planes.length; ++i)
    {
        for (let j = i + 1; j < this.planes.length; ++j)
        {
            let pi = this.planes[i].pos;
            let pj = this.planes[j].pos;
            let period = 1.2;
            if (distance(pi, pj) < 10)
            {
                let thickness = 1;
                let t = new Date().getTime() / 1000 % period;
                if (t < period / 2)
                {
                    thickness = 1.5;
                    rctx.point(pi, 5, rgb(255, 180, 180), null, 1, 1, -3);
                    rctx.point(pj, 5, rgb(255, 180, 180), null, 1, 1, -3);
                }
                rctx.point(pi, 5, null, "red", 1, thickness, 10);
                rctx.point(pj, 5, null, "red", 1, thickness, 10);
            }
        }
    }

    // origin gridlines
    rctx.polyline([[-2000, 0], [2000, 0]], 1, "lightgray", -1);
    rctx.polyline([[0, -2000], [0, 2000]], 1, "lightgray", -1);

    for (let p of this.planes)
    {
        p.draw(rctx);
    }

    if (mouse_state.last_mouse_pos != null)
    {
        let p = rctx.screen_to_world(mouse_state.last_mouse_pos);
        rctx.point(p, 1.3, null, "#333333");
    }

    let text_y = 40;
    let dy = 30;

    rctx.text("Click and drag to move around", [40, text_y += dy]);
    // rctx.text("Left click to add a new segment", [40, text_y += dy]);
    // rctx.text("Spacebar pauses the simulation", [40, text_y += dy]);
    rctx.text("Scroll wheel and UD arrow keys zoom in and out", [40, text_y += dy]);
    // rctx.text("F to toggle train following", [40, text_y += dy]);
    // rctx.text("Left click and drag to move around", [40, text_y += dy]);
    if (PAUSED)
    {
        rctx.text("PAUSED", [40, text_y += dy]);
    }

    rctx.draw();
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
