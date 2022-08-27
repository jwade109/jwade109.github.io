"use strict";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.canvas.width = document.body.clientWidth;
ctx.canvas.height = document.body.clientHeight;
var WIDTH = ctx.canvas.width;
var HEIGHT = ctx.canvas.height;

let NOMINAL_FRAMERATE = 50
let NOMINAL_DT = 1 / NOMINAL_FRAMERATE
let LAST_MOUSE_POSITION = null;
let MOUSE_PHYSICS = null;

let HANDLE_INDEX = -1;
let NEAREST_HANDLE_INDEX = -1;
let PAUSED = false;

canvas.oncontextmenu = function(e)
{
    e.preventDefault();
};

document.addEventListener('mousemove', function(event)
{
    var box = canvas.getBoundingClientRect();
    LAST_MOUSE_POSITION = new Vector2(event.clientX - box.left, event.clientY - box.top);
});

document.addEventListener('mousedown', function(event)
{
    event.preventDefault();
    event.stopPropagation();

    console.log("mousedown", event)
    HANDLE_INDEX = NEAREST_HANDLE_INDEX;
});

document.addEventListener('mouseup', function(event)
{
    event.preventDefault();
    event.stopPropagation();

    console.log("mouseup", event)
    HANDLE_INDEX = -1;
});

let points = [];
let N = Math.floor(Math.random() * 7 + 4);
for (let i = 0; i < N; i++)
{
    points.push(new Vector2(Math.random() * WIDTH, Math.random() * HEIGHT));
}
let spline = new Spline(points);

function add_point()
{
    spline.handles.push(new Vector2(Math.random() * WIDTH, Math.random() * HEIGHT));
}

function remove_point()
{
    if (spline.handles.length > 2)
    {
        spline.handles.pop();
    }
}

function update(previous, now, frame)
{
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    let dt = now - previous;

    if (dt > NOMINAL_DT * 3)
    {
        console.log("Large timestep!")
        return;
    }

    ctx.font = "30px Helvetica";
    ctx.fillText("Order " + (spline.handles.length - 1) + " Bezier Curve", 10, 50);

    spline.render(ctx);
    let t = now/12 % 1;
    let e = spline.evaluate(t);
    let inter = collapse_once(spline.handles, t);
    while (inter.length > 1)
    {
        ctx.beginPath();
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < inter.length; i++)
        {
            let pos = inter[i];
            if (i == 0)
            {
                ctx.moveTo(pos.x, pos.y);
            }
            else
            {
                ctx.lineTo(pos.x, pos.y);
            }
        }
        ctx.stroke();
        for (let pos of inter)
        {
            pos.render(ctx);
        }
        inter = collapse_once(inter, t);
        ctx.globalAlpha = 1;
    }
    e.render(ctx);

    if (LAST_MOUSE_POSITION != null)
    {
        let nearest = spline.nearestHandle(LAST_MOUSE_POSITION);
        let index = nearest[0];
        let dist = nearest[1];
        if (dist < 25)
        {
            let pos = spline.handles[index];
            pos.render(ctx);
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 12, 0, 2 * Math.PI);
            ctx.stroke();
            NEAREST_HANDLE_INDEX = index;
        }
        else
        {
            NEAREST_HANDLE_INDEX = -1;
        }
    }

    if (HANDLE_INDEX > -1)
    {
        spline.handles[HANDLE_INDEX] = LAST_MOUSE_POSITION;
    }
}

let previous = new Date().getTime()
let frame_number = 0;

var gameloop = setInterval(function()
{
    let now = new Date().getTime() / 1000;
    update(previous, now, frame_number)
    frame_number++;
    previous = now;

}, NOMINAL_DT * 1000);
