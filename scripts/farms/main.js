"use strict";

const NOMINAL_FRAMERATE = 30;
const NOMINAL_DT = 1 / NOMINAL_FRAMERATE;

let PAUSED = false;
let STEPS = 0;
let UPDATES_PER_RENDER_FRAME = 1;

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

    this.tiles = new Grid();
    this.river = new River([-500, 0], [1, 0], 500, 20, 40);
}

WorldState.prototype.step = function(dt)
{
    this.tiles.step(dt);
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
    rctx.polyline([[-2000, 0], [2000, 0]], 1, "lightgray", -1000);
    rctx.polyline([[0, -2000], [0, 2000]], 1, "lightgray", -1000);

    this.tiles.draw(rctx);
    this.river.draw(rctx);

    // let text_y = 40;
    // let dy = 30;

    // if (mouse_state.last_mouse_pos != null)
    // {
    //     let p = rctx.screen_to_world(mouse_state.last_mouse_pos);
    //     rctx.point(p, 1.3, null, "#333333");

    //     let [q, r] = get_hex_index(p, HEX_RADIUS);
    //     let c = get_hex_center(q, r, HEX_RADIUS);
    //     new Hex(c, HEX_RADIUS).draw(rctx, "black", null);
    // }

    // rctx.text("Click and drag to move around", [40, text_y += dy]);
    // rctx.text("Spacebar pauses the simulation", [40, text_y += dy]);
    // rctx.text("Scroll wheel and UD arrow keys zoom in and out", [40, text_y += dy]);
    // if (PAUSED)
    // {
    //     rctx.text("PAUSED", [40, text_y += dy]);
    // }
    // if (this.follow_index > 0)
    // {
    //     rctx.text("Following plane " + this.follow_index, [40, text_y += dy]);
    // }

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
            for (let i = 0; i < UPDATES_PER_RENDER_FRAME; ++i)
            {
                world_state.step(dt);
            }
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
    if (event.code == "KeyZ")
    {

    }
    if (event.code == "KeyF")
    {

    }
    if (event.code == "KeyR")
    {
        world_state.tiles.regen();
        world_state.river.regen();
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
