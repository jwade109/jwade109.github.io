"use strict";

var WIDTH = document.body.clientWidth;
var HEIGHT = document.body.scrollHeight;

let NOMINAL_FRAMERATE = 30;
let NOMINAL_DT = 1 / NOMINAL_FRAMERATE;
let LAST_MOUSE_POSITION = [];
let PAUSED = false;
let STEPS = 0;

let MAX_CURVATURE = 8E-3;

let MOUSEDOWN_AT = [];

function generate_clothoid_sweep(start, dir, arclength, n, n0, nf, c_max)
{
    let segments = [];

    for (let i = 0; i < n0; ++i)
    {
        let k0 = lerp(-c_max, c_max, i / (n0 - 1));
        for (let j = 0; j < nf; ++j)
        {
            let kf = lerp(-c_max, c_max, j / (nf - 1));

            // if (Math.sign(k0) == Math.sign(kf))
            // {
            //     continue;
            // }

            let t = generate_clothoid(start, dir, arclength, n, k0, kf);
            segments.push(t);
        }
    }

    return segments;
}

function construct_coherent_random_track()
{
    let n0 = 10;
    let nf = 10;
    let arclength = document.body.clientHeight;
    let n = arclength / 20;

    let x = document.body.clientWidth / 2;
    let y = document.body.clientHeight * 0.95;
    let dir = [0, -1];

    let segments = [];
    for (let s of generate_clothoid_sweep([x, y], dir, arclength, n, n0, nf, MAX_CURVATURE))
    {
        if (rand(0, 1) < 0.5)
        {
            segments.push(s);
        }
    }


    return new Track(segments);
}

function make_trains(length)
{
    let trains = [];
    for (let i = 0; i < 14; ++i)
    {
        trains.push(new Train(rand(0, length), rand(8, 23)));
    }
    return trains;
}

let track = construct_coherent_random_track();
let trains = make_trains(track.length());

function targeted_bezier(start, start_dir, end, end_dir, distance)
{
    let u = add2d(start, mult2d(start_dir, distance));
    let v = add2d(end,   mult2d(end_dir,   distance));
    return new BezierCurve([start, u, v, end]);
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

        // let clothoids = generate_clothoid_sweep(p, u, 500, 5, 4, 4, MAX_CURVATURE);
        // for (let c of clothoids)
        // {
        //     c.draw(ctx);
        // }
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
    let x = document.body.clientWidth / 2;
    let y = document.body.clientHeight * 0.9;
    let start = [x, y];
    let start_dir = [0, -1];
    let end_dir = unit2d(sub2d(start, LAST_MOUSE_POSITION));

    let arclength = 500;
    let segments = rand(30, 400);
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
        t.step(NOMINAL_DT, track);
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
