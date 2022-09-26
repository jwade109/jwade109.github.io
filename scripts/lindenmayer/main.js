"use strict";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.canvas.width = document.body.clientWidth;
ctx.canvas.height = document.body.clientHeight;

let NOMINAL_FRAMERATE = 30
let NOMINAL_DT = 1 / NOMINAL_FRAMERATE
let LAST_MOUSE_POSITION = null;

canvas.oncontextmenu = function(e)
{
    // e.preventDefault();
};

document.addEventListener('mousemove', function(event)
{
    var box = canvas.getBoundingClientRect();
    LAST_MOUSE_POSITION = [event.clientX - box.left, event.clientY - box.top];
});

document.addEventListener('mousedown', function(event)
{

});

document.addEventListener('keypress', function(event)
{
    console.log(event);
    if (event.code == "KeyS")
    {

    }
});

function on_left_click()
{

}

function on_right_click()
{

}

function on_middle_click()
{

}

function get_user_axiom()
{
    const text_input = document.getElementById("axiom");
    return text_input.value;
}

function get_user_ruleset()
{
    const text_input = document.getElementById("ruleset");
    const re = new RegExp("(.) -> (.+)");
    const inputs = text_input.value.split(",");

    let ret = {};
    for (const input of inputs)
    {
        let m = input.match(re);
        if (m)
        {
            ret[m[1]] = m[2];
        }
    }
    return ret;
}

function get_user_order()
{
    const text_input = document.getElementById("iterations");
    const n = parseInt(text_input.value);
    if (isNaN(n))
    {
        return 0;
    }
    return Math.min(n, 17);
}

function get_user_angle()
{
    const text_input = document.getElementById("angle");
    const a = parseFloat(text_input.value);
    if (isNaN(a))
    {
        return Math.PI / 2;
    }
    return a * Math.PI / 180;
}

function get_user_draw_symbols()
{
    const text_input = document.getElementById("draw");
    return text_input.value;
}

document.addEventListener('dblclick', function(event)
{
    console.log("dblclick", event);
});

document.addEventListener('mouseup', function(event)
{
    event.preventDefault();
    event.stopPropagation();

    console.log("mouseup", event);
});

let TARGET_ANGLE = 0
let CURRENT_ANGLE = 0

document.addEventListener("wheel", function(event)
{
    console.log("scroll", event)

    TARGET_ANGLE += Math.sign(event.deltaY) * Math.PI / 12;
});

function request_redraw()
{
    console.log("wow");
}

function update(previous, now, frame)
{
    let dt = now - previous;

    // if (Math.abs(dt) > NOMINAL_DT * 3)
    // {
    //     console.log("Large timestep: " + dt.toFixed(3) + " (nominally "
    //         + NOMINAL_DT.toFixed(3) + ")");
    //     return;
    // }

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    get_user_ruleset();

    const n = get_user_order();

    ctx.font = "36px Garamond Bold";
    ctx.fillText("Lindenmayer Curves", 30, 50);
    ctx.font = "18px Garamond";
    let height = 65;
    let dh = 25;
    ctx.fillText("https://en.wikipedia.org/wiki/L-system", 30, height += dh);
    if (ctx.canvas.width < ctx.canvas.height)
    {
        ctx.fillText("(Sorry, this isn't designed for mobile devices)", 30, height += dh);
    }

    let a = get_user_angle();
    let d = 30;
    const axiom = get_user_axiom();
    const rules = get_user_ruleset();
    const draw_forward = get_user_draw_symbols();

    const lstring = iterate_rules(axiom, rules, n);
    let lines = render_string(lstring, a, d, draw_forward);
    lines = rotate_about(lines, [WIDTH/2, HEIGHT/2], CURRENT_ANGLE);
    lines = center_bounds_on(lines, [WIDTH/2, HEIGHT/2]);
    lines = shrink_to_within_wh(lines, WIDTH*0.9, HEIGHT*0.9);
    render_lines(lines, ctx, 1, "black");

    CURRENT_ANGLE += (TARGET_ANGLE - CURRENT_ANGLE) * 0.25;
}

let START_TIME = new Date().getTime() / 1000;
let previous = null;
let frame_number = 0;

let WIDTH = 0;
let HEIGHT = 0;

var gameloop = setInterval(function()
{
    WIDTH = ctx.canvas.width = document.body.clientWidth;
    HEIGHT = ctx.canvas.height = document.body.clientHeight;
    let now = new Date().getTime() / 1000 - START_TIME;
    if (previous != null)
    {
        update(previous, now, frame_number)
        frame_number++;
    }
    previous = now;

}, NOMINAL_DT * 1000);
