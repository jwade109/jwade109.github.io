"use strict";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.canvas.width = document.body.clientWidth;
ctx.canvas.height = document.body.clientHeight;

let NOMINAL_FRAMERATE = 5
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
    // event.preventDefault();
    // event.stopPropagation();

    // console.log("mousedown", event);
    // if (event.button == 0)
    // {
    //     on_left_click();
    // }
    // if (event.button == 2)
    // {
    //     on_right_click();
    // }
    // if (event.button == 1)
    // {
    //     on_middle_click();
    // }
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

function update(previous, now, frame)
{
    let dt = now - previous;

    if (Math.abs(dt) > NOMINAL_DT * 3)
    {
        console.log("Large timestep: " + dt.toFixed(3) + " (nominally "
            + NOMINAL_DT.toFixed(3) + ")");
        return;
    }

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    let n = 12;

    ctx.font = "36px Garamond Bold";
    ctx.fillText("Lindenmayer Curves", 30, 50);
    ctx.font = "18px Garamond";
    let height = 65;
    let dh = 25;
    ctx.fillText("https://en.wikipedia.org/wiki/L-system", 30, height += dh);
    ctx.fillText("Dragon Curve (order " + n + ")", 30, height += dh);
    if (ctx.canvas.width < ctx.canvas.height)
    {
        ctx.fillText("(Sorry, this isn't designed for mobile devices)", 30, height += dh);
    }

    let a = Math.PI / 2;
    let d = 30;
    const axiom = "F";
    const rules = { "F": "F+G", "G": "F-G" };
    const draw_forward = "FG";
    const turn_left = "+";
    const turn_right = "-";

    // koch curve
    // const lstring = iterate_rules("F-G-G", {"F": "F-G+F+G-F", "G": "GG"}, n);
    // let line = render_string(lstring, Math.PI/1.5, 50, "+", "-", "FG")

    // sierpinski arrowhead
    // const lstring = iterate_rules("A", {"A": "B-A-B", "B": "A+B+A"}, n);
    // let line = render_string(lstring, Math.PI/3, 15, "+", "-", "AB");

    const lstring = iterate_rules(axiom, rules, n);
    let line = render_string(lstring, a, d, turn_left, turn_right, draw_forward);
    line = shrink_to_within_wh(line, WIDTH*0.9, HEIGHT*0.9);
    line = center_bounds_on(line, [WIDTH/2, HEIGHT/2]);
    render_line(line, ctx, 1, "black");
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
