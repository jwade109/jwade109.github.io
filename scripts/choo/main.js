"use strict";

var WIDTH = document.body.clientWidth;
var HEIGHT = document.body.scrollHeight;

let NOMINAL_FRAMERATE = 30;
let NOMINAL_DT = 1 / NOMINAL_FRAMERATE;
let LAST_MOUSE_POSITION = [];
let PAUSED = false;
let STEPS = 0;

let MAX_CURVATURE = 5E-3;

let MOUSEDOWN_AT = []

function construct_coherent_random_track()
{
    let segments = [];
    for (let i = 0; i < 40; ++i)
    {
        let x = document.body.clientWidth / 2;
        let y = document.body.clientHeight * 0.9;
        let dir = [0, -1];
        let arclength = rand(700, 2000);
        let t = generate_clothoid([x, y], dir, arclength,
            rand(-MAX_CURVATURE, MAX_CURVATURE),
            rand(-MAX_CURVATURE, MAX_CURVATURE));
        segments.push(t);
    }
    return new Track(segments);
}

function make_trains()
{
    let trains = [];
    for (let i = 0; i < 30; ++i)
    {
        trains.push(new Train(rand(8, 34), rand(1, 3)));
    }
    return trains;
}

let trains = make_trains();
let track = construct_coherent_random_track();

function targeted_bezier(start, start_dir, end, end_dir, distance)
{
    let u = add2d(start, mult2d(start_dir, distance));
    let v = add2d(end,   mult2d(end_dir,   distance));
    return new BezierCurve([start, u, v, end]);
}

function targeted_clothoid(start, start_dir, end)
{
    let arclength = distance(start, end);
    let dmin = undefined;
    let best = undefined;
    for (let c = -2; c <= 2; c += 0.05)
    {
        let curvature = c / 1E3;
        let candidate = generate_clothoid(start, start_dir, arclength, curvature, curvature);
        let p = candidate.points[candidate.points.length - 1];
        let d = distance(p, end);
        if (dmin === undefined || d < dmin)
        {
            dmin = d;
            best = candidate;
        }
    }
    return best;
}

function draw(ctx)
{
    track.draw(ctx);

    for (let t of trains)
    {
        t.draw(ctx, track);
        // let tt = track.s_to_t(t.pos)
        // let p = track.evaluate(tt);
        // let u = track.tangent(tt);

        // let arclength = 600;

        // for (let i = 0; i < 4; ++i)
        // {
        //     let w = generate_clothoid(p, u, arclength,
        //         rand(-MAX_CURVATURE, MAX_CURVATURE),
        //         rand(-MAX_CURVATURE, MAX_CURVATURE));
        //     w.draw(ctx);
        //     ctx.beginPath();
        //     ctx.arc(p[0], p[1], arclength, 0, 2 * Math.PI);
        //     ctx.stroke();
        // }

        // let p2 = add2d(p, mult2d(u, 100));
        // ctx.strokeStyle = "purple";
        // ctx.lineWidth = 3;
        // ctx.beginPath();
        // ctx.moveTo(p[0], p[1]);
        // ctx.lineTo(p2[0], p2[1]);
        // ctx.stroke();
    }

    if (LAST_MOUSE_POSITION.length == 0)
    {
        return;
    }

    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.arc(LAST_MOUSE_POSITION[0], LAST_MOUSE_POSITION[1], 8, 0, 2 * Math.PI);
    ctx.stroke();

    // random walk targeted generation
    let start = [200, 400];
    let start_dir = [1, 0];
    let end_dir = unit2d(sub2d(start, LAST_MOUSE_POSITION));

    let arclength = 500;
    let segments = rand(30, 400);

    // let b = targeted_bezier(start.slice(), start_dir.slice(), LAST_MOUSE_POSITION.slice(), end_dir.slice(), 500);
    // let t = bezier_to_track_segment(b, 100);
    // let c = targeted_clothoid(start, start_dir, LAST_MOUSE_POSITION);
    // c.draw(ctx);

    // track.segments[track.segments.length - 1] = t;
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
