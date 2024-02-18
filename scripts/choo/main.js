"use strict";

var WIDTH = document.body.clientWidth;
var HEIGHT = document.body.scrollHeight;

let NOMINAL_FRAMERATE = 30;
let NOMINAL_DT = 1 / NOMINAL_FRAMERATE;
let LAST_MOUSE_POSITION = [];
let PAUSED = false;
let STEPS = 0;

let MAX_CURVATURE = 4E-3;

let NEW_SEGMENT_GENERATION_LENGTH = [300, 1200];

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

            let t = generate_clothoid(start, dir, arclength, n, k0, kf);
            segments.push(t);
        }
    }

    return segments;
}

function construct_coherent_random_track()
{
    let n0 = 3;
    let nf = 3;
    let arclength = document.body.clientHeight;
    let n = arclength / 20;

    let x = document.body.clientWidth / 2;
    let y = document.body.clientHeight * 0.95;
    let dir = [0, -1];

    let segments = [];
    for (let s of generate_clothoid_sweep([x, y], dir, arclength, n, n0, nf, MAX_CURVATURE))
    {
        segments.push(s);
    }

    segments = [segments[1]];

    return new Track(segments);
}

function make_trains(length)
{
    let trains = [];
    for (let i = 0; i < 1; ++i)
    {
        trains.push(new Train(rand(0, length), rand(30, 60)));
    }
    return trains;
}

let track = construct_coherent_random_track();
let trains = make_trains(track.length());

function targeted_clothoid(start, dir, end)
{
    let arclength = distance(start, end) * 1.5;
    let sweep = generate_clothoid_sweep(start, dir, arclength, arclength, 5, 5, MAX_CURVATURE);
    return sweep[Math.floor(sweep.length / 2)];
}

function targeted_hyperclothoid(start, start_dir, end, end_dir)
{
    let midpoint = mult2d(add2d(start, end), 0.5);

    let a = targeted_clothoid(start, start_dir, [0, 0]);
    let b = targeted_clothoid(end, end_dir, [0, 0]);

    return [a, b];
    // return [null, null];
}

function draw(ctx)
{
    track.draw(ctx);


    let end_segment = track.segments[track.segments.length - 1];
    let p = end_segment.evaluate(0.999);
    let u = end_segment.tangent(0.999);
    let k_0 = end_segment.k_f;
    for (let i = 0; i < 10; ++i)
    {
        let arclength = NEW_SEGMENT_GENERATION_LENGTH[0];
        let k_f = rand(-MAX_CURVATURE, MAX_CURVATURE);
        let new_segment = generate_clothoid(p, u,
            arclength, arclength / 10, k_0, k_f);
        new_segment.draw(ctx);
    }

    for (let t of trains)
    {
        t.draw(ctx, track);
    }

    // if (LAST_MOUSE_POSITION.length == 0)
    // {
    //     return;
    // }

    // ctx.strokeStyle = "black";
    // ctx.beginPath();
    // ctx.arc(LAST_MOUSE_POSITION[0], LAST_MOUSE_POSITION[1], 8, 0, 2 * Math.PI);
    // ctx.stroke();

    // // random walk targeted generation
    // let x = document.body.clientWidth / 2;
    // let y = document.body.clientHeight * 0.9;
    // let start = [x, y];
    // let start_dir = [0, -1];
    // let end = LAST_MOUSE_POSITION;
    // let end_dir = unit2d(sub2d(start, LAST_MOUSE_POSITION));

    // let [a, b] = targeted_hyperclothoid(start, start_dir, LAST_MOUSE_POSITION, end_dir);
    // if (a)
    // {
    //     a.draw(ctx);
    // }
    // if (b)
    // {
    //     b.draw(ctx);
    // }
}

let CAMERA_TRANSLATION = [0, 0];

function normalize_path_coords(track, trains)
{
    for (let t of trains)
    {
        t.pos -= track.offset;
    }
    track.offset = 0;
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

        let [max_s, min_s] = t.s_limits();
        if (max_s > track.length())
        {
            let arclength = rand(NEW_SEGMENT_GENERATION_LENGTH[0], NEW_SEGMENT_GENERATION_LENGTH[1]);
            track.extend(max_s, arclength);
        }
        track.prune(min_s);
    }

    let t = track.s_to_t(trains[0].pos);
    if (t != null)
    {
        let p = track.evaluate(t);
        CAMERA_TRANSLATION = [-p[0] + ctx.canvas.width/2, -p[1] + ctx.canvas.height/2];
    }

    normalize_path_coords(track, trains);

    ctx.save();
    ctx.translate(CAMERA_TRANSLATION[0], CAMERA_TRANSLATION[1]);
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
