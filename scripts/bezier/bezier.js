"use strict";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.canvas.width = document.body.clientWidth;
ctx.canvas.height = document.body.clientHeight - 3;
var WIDTH = ctx.canvas.width;
var HEIGHT = ctx.canvas.height;

let NOMINAL_FRAMERATE = 50
let NOMINAL_DT = 1 / NOMINAL_FRAMERATE
let LAST_MOUSE_POSITION = null;
let MOUSE_PHYSICS = null;

let HANDLE_INDEX = -1;
let INSERTION_INDEX = -1;
let NEAREST_HANDLE_INDEX = -1;
let NEAREST_INSERTION_POINT_INDEX = -1;
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

    console.log("mousedown", event);
    if (event.button == 0)
    {
        HANDLE_INDEX = NEAREST_HANDLE_INDEX;
        INSERTION_INDEX = NEAREST_INSERTION_POINT_INDEX;
        on_left_click();
    }
    if (event.button == 2)
    {
        HANDLE_INDEX = NEAREST_HANDLE_INDEX;
        INSERTION_INDEX = NEAREST_INSERTION_POINT_INDEX;
        on_right_click();
    }
    if (event.button == 1)
    {
        on_middle_click();
    }
});

document.addEventListener('keypress', function(event)
{
    console.log(event);
    if (event.code == "KeyS")
    {
        update_url_with_handles();
    }
    if (event.code == "KeyR")
    {
        randomize_spline();
    }
});

function on_left_click()
{
    if (INSERTION_INDEX > -1)
    {
        console.log("Adding a point at insertion index " + INSERTION_INDEX);
        const p0 = spline.handles[INSERTION_INDEX];
        const p1 = spline.handles[INSERTION_INDEX + 1];
        const to_add = lerp(p0, p1, 0.5);
        spline.handles.splice(INSERTION_INDEX + 1, 0, to_add);
        HANDLE_INDEX = INSERTION_INDEX + 1;
    }
}

function on_right_click()
{
    console.log("right click", HANDLE_INDEX);
    if (HANDLE_INDEX > -1 && spline.handles.length > 2)
    {
        spline.handles.splice(HANDLE_INDEX, 1);
        console.log("Removing " + HANDLE_INDEX);
        HANDLE_INDEX = -1;
    }
}

function on_middle_click()
{
    T_TRACK_MOUSE = !T_TRACK_MOUSE;
}

document.addEventListener('dblclick', function(event)
{
    console.log("dblclick", event);
    spline.handles.push(LAST_MOUSE_POSITION);
});

document.addEventListener('mouseup', function(event)
{
    event.preventDefault();
    event.stopPropagation();

    console.log("mouseup", event);
    HANDLE_INDEX = -1;
});

let spline = new Spline([]);

function randomize_spline()
{
    let points = [];
    let N = Math.floor(Math.random() * 5 + 3);
    for (let i = 0; i < N; i++)
    {
        let x = Math.random() * 4*WIDTH/6 + WIDTH/6;
        let y = Math.random() * 4*HEIGHT/6 + HEIGHT/6;
        points.push(new Vector2(x, y));
    }
    // points.sort(function(a, b)
    // {
    //     let a1 = Math.atan2(a.y - HEIGHT/2, a.x - WIDTH/2);
    //     let a2 = Math.atan2(b.y - HEIGHT/2, b.x - WIDTH/2);
    //     if (a1 < a2)
    //     {
    //         return -1;
    //     }
    //     if (a2 > a1)
    //     {
    //         return 1;
    //     }
    //     return 0;
    // });
    spline.handles = points;
}

function load_spline_from_url()
{
    console.log("Loading from URL.");
    const url = new URL(window.location.href);
    if (!url.searchParams.has("handles"))
    {
        console.log("No handles param.");
        randomize_spline();
        return;
    }
    const points = url.searchParams.get("handles").split(".");
    console.log(points);
    spline.handles = [];
    for (let i = 0; i + 1 < points.length; i += 2)
    {
        let p = new Vector2(Number(points[i]), Number(points[i+1]));
        console.log("Point: " + p);
        spline.handles.push(p);
    }
    console.log(spline.handles);
}

load_spline_from_url();

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

function update_url_with_handles()
{
    const url = new URL(window.location.href);
    let points = "";
    for (const handle of spline.handles)
    {
        points += Math.round(handle.x) + "." + Math.round(handle.y) + "."
    }
    url.searchParams.set('handles', points);
    window.history.replaceState(null, null, url);
}

function nth(n)
{
    const digit_2 = Math.floor(n / 10) % 10;
    const digit_1 = n % 10;
    if (digit_2 == 1)
    {
        return n + "th";
    }
    if (digit_1 == 1)
    {
        return n + "st";
    }
    if (digit_1 == 2)
    {
        return n + "nd";
    }
    if (digit_1 == 3)
    {
        return n + "rd";
    }
    return n + "th";
}

let T_SETPOINT = 0;
let GLOBAL_T = 0;
let T_TRACK_MOUSE = false;

function update(previous, now, frame)
{
    let dt = now - previous;

    if (Math.abs(dt) > NOMINAL_DT * 3)
    {
        console.log("Large timestep: " + dt.toFixed(3) + " (nominally "
            + NOMINAL_DT.toFixed(3) + ")");
        return;
    }

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // re-centering
    if (HANDLE_INDEX == -1) // not currently moving anything
    {
        let min = spline.handles[0].copy();
        let max = spline.handles[0].copy();
        for (const h of spline.handles)
        {
            min.x = Math.min(min.x, h.x);
            min.y = Math.min(min.y, h.y);
            max.x = Math.max(max.x, h.x);
            max.y = Math.max(max.y, h.y);
        }

        let centroid = new Vector2(0, 0);
        centroid.x = (min.x + max.x) / 2;
        centroid.y = (min.y + max.y) / 2;

        // centroid.x /= n;
        // centroid.y /= n;

        centroid.x -= WIDTH/2;
        centroid.y -= HEIGHT/2;

        for (let handle of spline.handles)
        {
            handle.x -= centroid.x * dt * 10;
            handle.y -= centroid.y * dt * 10;
        }
    }

    spline.render(ctx);
    T_SETPOINT = 0.5 * Math.sin(now/4 - Math.PI/2) + 0.5;

    if (LAST_MOUSE_POSITION != null && T_TRACK_MOUSE)
    {
        let near_point = spline.nearestPoint(LAST_MOUSE_POSITION);
        let pos = near_point[0];
        let mouse_t = near_point[1];
        T_SETPOINT = mouse_t;
    }

    GLOBAL_T += (T_SETPOINT - GLOBAL_T) * dt * 6;

    let order = spline.handles.length - 1;
    ctx.font = "36px Garamond Bold";
    ctx.fillText(nth(order) + " Order Bezier Curve", 30, 50);
    ctx.fillText("t = " + GLOBAL_T.toFixed(2), 30, 90);
    ctx.font = "18px Garamond";
    let height = 115;
    let dh = 25;
    ctx.fillText("Double click to add a control point", 30, height += dh);
    ctx.fillText("Click on a green marker to insert a control point", 30, height += dh);
    ctx.fillText("Click and drag to move control points", 30, height += dh);
    ctx.fillText("Right click on a control point to delete it", 30, height += dh);
    ctx.fillText("Middle click to toggle mouse tracking/animation", 30, height += dh);
    ctx.fillText("Press S to save your drawing to the page URL (shareable)", 30, height += dh);
    ctx.fillText("Press R to generate a random curve", 30, height += dh);
    if (WIDTH < HEIGHT)
    {
        ctx.fillText("(Sorry, this isn't designed for mobile devices)", 30, height += dh);
    }

    let e = spline.evaluate(GLOBAL_T);
    let inter = collapse_once(spline.handles, GLOBAL_T);
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
        inter = collapse_once(inter, GLOBAL_T);
        ctx.globalAlpha = 1;
    }
    e.render(ctx);

    let insertion_points = collapse_once(spline.handles, 0.5);
    for (const ip of insertion_points)
    {
        ip.render(ctx, 5, "green");
    }

    if (LAST_MOUSE_POSITION != null)
    {
        let nearest = spline.nearestHandle(LAST_MOUSE_POSITION);
        let index = nearest[0];
        let dist = nearest[1];
        if (dist < 15)
        {
            let pos = spline.handles[index];
            pos.render(ctx, 8, "red");
            NEAREST_HANDLE_INDEX = index;
        }
        else
        {
            NEAREST_HANDLE_INDEX = -1;
        }

        nearest = nearest_point(insertion_points, LAST_MOUSE_POSITION);
        index = nearest[0];
        dist = nearest[1];
        if (dist < 15)
        {
            let pos = insertion_points[index];
            pos.render(ctx, 8, "green");
            NEAREST_INSERTION_POINT_INDEX = index;
        }
        else
        {
            NEAREST_INSERTION_POINT_INDEX = -1;
        }
    }

    if (LAST_MOUSE_POSITION != null)
    {
        let nearest = spline.nearestHandle(LAST_MOUSE_POSITION);
        let index = nearest[0];
        let dist = nearest[1];
        if (dist < 60)
        {
            let pos = spline.handles[index];
            pos.render(ctx, 8, "red");
            NEAREST_HANDLE_INDEX = index;
        }
        else
        {
            NEAREST_HANDLE_INDEX = -1;
        }
    }

    if (HANDLE_INDEX > -1)
    {
        let pos = spline.handles[HANDLE_INDEX].copy();
        let dx = LAST_MOUSE_POSITION.x - pos.x;
        let dy = LAST_MOUSE_POSITION.y - pos.y;
        let smoothpos = new Vector2(pos.x + dx * dt * 12, pos.y + dy * dt * 12)
        spline.handles[HANDLE_INDEX] = smoothpos;
    }
}

let START_TIME = new Date().getTime() / 1000;
let previous = START_TIME;
let frame_number = 0;

var gameloop = setInterval(function()
{
    let now = new Date().getTime() / 1000 - START_TIME;
    update(previous, now, frame_number)
    frame_number++;
    previous = now;

}, NOMINAL_DT * 1000);
