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

    // console.log("mousedown", event)
});

let trackers = []
for (let i = 0; i < 200; i++)
{
    let pos = new Vector2(Math.random() * WIDTH, Math.random() * HEIGHT);
    trackers.push(new Tracker(pos, 9, 0, 15));
}

function update(previous, now, frame)
{
    let dt = now - previous;

    if (LAST_MOUSE_POSITION == null)
    {
        return;
    }

    if (dt > NOMINAL_DT * 3)
    {
        console.log("Large timestep!")
        return;
    }

    let mpos = LAST_MOUSE_POSITION.copy();
    let mvel = new Vector2(0, 0);
    if (MOUSE_PHYSICS != null)
    {
        mvel.x = (mpos.x - MOUSE_PHYSICS.pos.x) / dt;
        mvel.y = (mpos.y - MOUSE_PHYSICS.pos.y) / dt;
    }
    MOUSE_PHYSICS = new Particle(mpos, mvel);

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    for (let i = 0; i < trackers.length; i++)
    {
        if (MOUSE_PHYSICS != null)
        {
            let particle = MOUSE_PHYSICS.copy();
            if (i != 0)
            {
                particle = trackers[i-1].physics.copy();
            }
            trackers[i].update(particle, dt);
        }
        trackers[i].render(ctx);

        trackers[i].physics.render(ctx);
    }
    if (MOUSE_PHYSICS != null)
    {
        MOUSE_PHYSICS.render(ctx);
    }
}

let previous = new Date().getTime()
let frame_number = 0;

var gameloop = setInterval(function()
{
    let now = new Date().getTime() / 1000
    update(previous, now, frame_number)
    frame_number++;
    previous = now;

}, NOMINAL_DT * 1000);
