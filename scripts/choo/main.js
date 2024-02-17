"use strict";

var WIDTH = document.body.clientWidth;
var HEIGHT = document.body.scrollHeight;

let NOMINAL_FRAMERATE = 30;
let NOMINAL_DT = 1 / NOMINAL_FRAMERATE;
let LAST_MOUSE_POSITION = [];
let PAUSED = false;
let STEPS = 0;

let MOUSEDOWN_AT = []

function random_walk_track_segment(start, dir, arclength)
{
    start[0] *= document.body.clientWidth;
    start[1] *= document.body.clientHeight;
    return random_walk_track(start, dir, arclength, 200);
}

function construct_coherent_random_track()
{
    let random_walks = [
        random_walk_track_segment([0.3, 0.8], [0, -1], 200),
        random_walk_track_segment([0.6, 0.3], [-0.3, 1], 400),
        random_walk_track_segment([0.8, 0.8], [0.1, -1], 400)
    ];

    let segments = [];
    for (let i = 0; i < random_walks.length; ++i)
    {
        let r1 = random_walks[i];
        let r2 = random_walks[(i + 1) % random_walks.length];

        let u = r1.points[r1.points.length - 1];
        let v = r2.points[0];

        let d1 = unit2d(sub2d(u, r1.evaluate(0.98)));
        let d2 = unit2d(sub2d(v, r2.evaluate(0.02)));

        d1 = add2d(u, mult2d(d1, 300));
        d2 = add2d(v, mult2d(d2, 300));

        let b = new BezierCurve([u, d1, d2, v]);
        let t = new bezier_to_track_segment(b, 100);
        segments.push(r1);
        segments.push(t);
    }
    return new Track(segments);
}

let trains = [new Train(rand(8, 34), rand(1, 3))];
let track = construct_coherent_random_track();

function draw(ctx)
{
    track.draw(ctx);

    for (let t of trains)
    {
        t.draw(ctx, track);
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
        t.normalize(track);
    }

    ctx.save();
    draw(ctx);
    ctx.restore();

    const update_end = new Date().getTime() / 1000;
    const real_dt = update_end - update_start;
}

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

// ===========================================================================
// EVENT HANDLERS

document.addEventListener('keypress', function(event)
{
    console.log(event);
});

document.addEventListener('keydown', function(event)
{
    console.log(event);
});

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

// ===========================================================================
