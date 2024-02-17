"use strict";

var WIDTH = document.body.clientWidth;
var HEIGHT = document.body.scrollHeight;

let NOMINAL_FRAMERATE = 30;
let NOMINAL_DT = 1 / NOMINAL_FRAMERATE;
let LAST_MOUSE_POSITION = [];
let PAUSED = false;
let STEPS = 0;

let MOUSEDOWN_AT = []

document.addEventListener('mousemove', function(event)
{
    var box = canvas.getBoundingClientRect();
    LAST_MOUSE_POSITION = [event.clientX - box.left, event.clientY - box.top];
});

document.addEventListener('mousedown', function(event)
{
    console.log(event);

    if (event.button == 0)
    {
        MOUSEDOWN_AT = LAST_MOUSE_POSITION.slice();
    }
    else if (event.button == 2)
    {

    }
});

document.addEventListener('mouseup', function(event)
{
    console.log(event);
    MOUSEDOWN_AT = [];
});

canvas.oncontextmenu = function(e)
{
    e.preventDefault();
};

let trains = [];

for (let i = 0; i < 50; ++i)
{
    if (Math.random() < 0.3)
    {
        continue;
    }
    let center = mult2d([document.body.clientWidth, document.body.clientHeight], 0.5);
    let r = 150 + 26 * i;
    let t = new Train(Math.random() * r / 15 + 3, center, r, r);
    trains.push(t);
}

function draw(ctx)
{
    for (let t of trains)
    {
        t.draw(ctx);
    }

    ctx.beginPath();
    ctx.arc(LAST_MOUSE_POSITION[0], LAST_MOUSE_POSITION[1], 8, 0, 2 * Math.PI);
    ctx.stroke();
}

function update(previous, now, frame_number)
{
    const dt = now - previous;
    const update_start = new Date().getTime() / 1000;

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.canvas.width = document.body.clientWidth;
    ctx.canvas.height = document.body.clientHeight;

    for (let t of trains)
    {
        t.step(NOMINAL_DT);
    }

    ctx.save();
    draw(ctx);
    ctx.restore();

    const update_end = new Date().getTime() / 1000;
    const real_dt = update_end - update_start;
}

document.addEventListener('keypress', function(event)
{
    console.log(event);
    if (event.code == "Space")
    {
        PAUSED = !PAUSED;
    }
    if (event.code == "KeyS")
    {
        console.log(STEPS);
        STEPS += 1;
    }
});

document.addEventListener('keydown', function(event)
{
    console.log(event);
    if (event.code == "ArrowUp")
    {
        ACCELERATION_DUE_TO_GRAVITY -= 50;
    }
    if (event.code == "ArrowDown")
    {
        ACCELERATION_DUE_TO_GRAVITY += 50;
    }
    if (event.code == "ArrowLeft")
    {
        COEFFICIENT_OF_RESTITUTION -= 0.01;
        COEFFICIENT_OF_RESTITUTION = Math.max(0.05, COEFFICIENT_OF_RESTITUTION);
    }
    if (event.code == "ArrowRight")
    {
        COEFFICIENT_OF_RESTITUTION += 0.01;
        COEFFICIENT_OF_RESTITUTION = Math.min(1.02, COEFFICIENT_OF_RESTITUTION);
    }
});

const START_TIME = new Date().getTime() / 1000;
let previous = null;
let frame_number = 0;

var gameloop = setInterval(function()
{
    let now = new Date().getTime() / 1000 - START_TIME;
    if (previous != null)
    {
        update(previous, now, frame_number)
        frame_number++;
    }
    previous = now;

}, NOMINAL_DT * 1000);
