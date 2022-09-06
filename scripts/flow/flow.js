"use strict";

var width = document.body.clientWidth;
var height = document.body.scrollHeight;
var velocity_fields = [];
var particles = [];

let NOMINAL_FRAMERATE = 60;
let NOMINAL_DT = 1 / NOMINAL_FRAMERATE;
let LAST_MOUSE_POSITION = null;

document.addEventListener('mousemove', function(event)
{
    var box = canvas.getBoundingClientRect();
    LAST_MOUSE_POSITION = [event.clientX - box.left, event.clientY - box.top];
});

document.addEventListener('keypress', function(event)
{
    console.log(event);
    if (event.code == "KeyR")
    {
        randomize_field();
    }
    if (event.code == "KeyG")
    {
        regenerate_particles();
    }
    if (event.code == "KeyV")
    {
        if (LAST_MOUSE_POSITION != null)
        {
            let x = LAST_MOUSE_POSITION[0];
            let y = LAST_MOUSE_POSITION[1];
            let strength = Math.random() * 750000 + 200000;
            let field = vortex(x, y, strength);
            velocity_fields.push(field);
        }
    }
    if (event.code == "KeyS")
    {
        if (LAST_MOUSE_POSITION != null)
        {
            let x = LAST_MOUSE_POSITION[0];
            let y = LAST_MOUSE_POSITION[1];
            let strength = Math.random() * 50000 + 20000;
            let field = source(x, y, strength);
            velocity_fields.push(field);
        }
    }
});

function rgb_to_color(color)
{
    return "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
}

class Particle
{
    constructor(x, y)
    {
        this.pos = [x, y];
        this.vel = [0, 0];
        this.history = []
    }

    step(dt)
    {
        this.vel = add2d(velocityAt(this.pos[0], this.pos[1]),
                [Math.random() * 2 - 1, Math.random() * 2 - 1]);
        this.pos[0] += this.vel[0] * dt;
        this.pos[1] += this.vel[1] * dt;
        this.history.push(this.pos.slice());
        if (this.pos[0] > width*1.5 && this.vel[0] > 0)
        {
            this.pos[0] = -10;
            this.pos[1] = Math.random()*height*2 - height;
            this.history = []
        }
        if (this.pos[0] < -width/2 && this.vel[0] < 0)
        {
            this.pos[0] = width + 10;
            this.pos[1] = Math.random()*height*2 - height;
            this.history = []
        }
        if (this.pos[1] > height*1.5 && this.vel[1] > 0)
        {
            this.pos[0] = Math.random()*width*2 - width;
            this.pos[1] = -10;
            this.history = []
        }
        if (this.pos[1] < -height/2 && this.vel[1] < 0)
        {
            this.pos[0] = Math.random()*width*2 - width;
            this.pos[1] = height + 10;
            this.history = []
        }

        const n = 20;
        if (this.history.length > n)
        {
            this.history = this.history.slice(-n);
        }
    }

    draw(ctx)
    {
        // ctx.fillStyle = "black";
        // ctx.strokeStyle = "black";
        let vmag = mag2d(this.vel);
        let s = Math.atan(vmag / 1000);
        let r = Math.floor(256 * s);
        let color = [r, 0, 256 - r];
        ctx.strokeStyle = rgb_to_color(color);
        ctx.globalAlpha = 0.1 * s + 0.2;
        ctx.beginPath();
        let last = this.pos;
        ctx.moveTo(this.pos[0], this.pos[1]);
        for (let i = 1; i < this.history.length; i++)
        {
            const a = this.history[this.history.length - i - 1];
            if (distance(last, a) > 8 || i + 1 == this.history.length)
            {
                ctx.lineTo(a[0], a[1]);
                last = a;
            }
        }
        ctx.lineWidth = 4;
        ctx.stroke();
    }
}

function velocityAt(x, y)
{
    let sum = [0, 0];
    for (const field of velocity_fields)
    {
        sum = add2d(sum, field.evaluate([x, y]));
    }
    return sum;
}

function vortex(x0, y0, gamma)
{
    let ret = {};
    ret.origin = [x0, y0];
    ret.magnitude = gamma;
    ret.type = "vortex";
    ret.evaluate = function(pos)
    {
        let dpos = sub2d(pos, this.origin);
        let theta = Math.atan2(dpos[1], dpos[0]);
        let basis = [-Math.sin(theta), Math.cos(theta)];
        let r = mag2d(dpos);
        let vel = mult2d(basis, this.magnitude / (2 * Math.PI * r));
        return vel;
    }
    return ret;
}

function source(x0, y0, lambda)
{
    let ret = {};
    ret.origin = [x0, y0];
    ret.magnitude = lambda;
    ret.type = "source";
    ret.evaluate = function(pos)
    {
        let dpos = sub2d(pos, this.origin);
        let r2 = magsq2d(dpos);
        let vel = mult2d(dpos, lambda / (Math.PI * 2 * r2));
        return vel;
    };
    return ret;
}

function uniform(vx, vy)
{
    let ret = {};
    ret.type = "uniform";
    ret.evaluate = function()
    {
        return [vx, vy];
    };
    return ret;
}

function doublet(x0, y0, kappa)
{
    return function(x, y)
    {
        if (typeof x0 == "function" && typeof y0 == "function")
        {
            var r = Math.sqrt(Math.pow(x - x0(), 2) + Math.pow(y - y0(), 2));
            var theta = Math.atan2(y - y0(), x - x0());
        }
        else if (typeof x0 == "function")
        {
            var r = Math.sqrt(Math.pow(x - x0(), 2) + Math.pow(y - y0, 2));
            var theta = Math.atan2(y - y0, x - x0());
        }
        else if (typeof y0 == "function")
        {
            var r = Math.sqrt(Math.pow(x - x0, 2) + Math.pow(y - y0(), 2));
            var theta = Math.atan2(y - y0(), x - x0);
        }
        else
        {
            var r = Math.sqrt(Math.pow(x - x0, 2) + Math.pow(y - y0, 2));
            var theta = Math.atan2(y - y0, x - x0);
        }
        return kappa*Math.cos(theta)/r;
    }
}

let FRAME_DT_BUFFER = [];

function update(previous, now, frame_number)
{
    const dt = now - previous;
    const update_start = new Date().getTime() / 1000;

    var steps_per_frame = 1;

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.canvas.width = document.body.clientWidth;
    ctx.canvas.height = document.body.clientHeight;
    width = ctx.canvas.width;
    height = ctx.canvas.height;

    if (FRAME_DT_BUFFER.length > NOMINAL_FRAMERATE*3)
    {
        FRAME_DT_BUFFER = FRAME_DT_BUFFER.slice(-NOMINAL_FRAMERATE*3);
    }

    let ideal_avg_dt = 0;
    let true_avg_dt = 0;
    let framerate = 0;
    if (FRAME_DT_BUFFER.length)
    {
        for (let e of FRAME_DT_BUFFER)
        {
            ideal_avg_dt += e[1];
            true_avg_dt += e[2];
        }
        ideal_avg_dt /= FRAME_DT_BUFFER.length;
        true_avg_dt /= FRAME_DT_BUFFER.length;
        let min = FRAME_DT_BUFFER[0][0]
        let max = FRAME_DT_BUFFER[FRAME_DT_BUFFER.length - 1][0]
        framerate = (FRAME_DT_BUFFER.length - 1) / (max - min);
    }
    const target_dt = NOMINAL_DT;
    const delta_dt = target_dt - ideal_avg_dt;
    console.log(delta_dt);
    let delta_pop = Math.round((delta_dt / target_dt) * particles.length / 500);
    if (!particles.length)
    {
        delta_pop = 250;
    }
    if (delta_pop > 0)
    {
        for (let i = 0; i < delta_pop; i++)
        {
            add_new_particle();
        }
    }
    else
    {
        for (let i = 0; i < -delta_pop; i++)
        {
            remove_particle();
        }
    }

    if (Math.abs(dt) > NOMINAL_DT * 4)
    {
        console.log("Large timestep: " + dt.toFixed(3) + " (nominally "
            + NOMINAL_DT.toFixed(3) + ")");
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var p in particles)
    {
        particles[p].draw(ctx);
        for (var f = 0; f < steps_per_frame; ++f)
            particles[p].step(dt);
    }

    ctx.fillStyle = "black";
    ctx.globalAlpha = 1;
    ctx.font = "36px Garamond Bold";
    ctx.fillText("Ideal Flow Numerical Simulation", 30, 50);
    ctx.font = "18px Garamond";
    let th = 60;
    let dh = 25;
    ctx.fillText("Press G to regenerate particles", 30, th += dh);
    ctx.fillText("Press R to reset the potential field", 30, th += dh);
    ctx.fillText("Press S to add a source", 30, th += dh);
    ctx.fillText("Press V to add a vortex", 30, th += dh);
    ctx.fillText(particles.length + " test particles", 30, th += dh);
    ctx.fillText("dt = " + (1000 * true_avg_dt).toFixed(1) +
        "ms / " + (1000 * ideal_avg_dt).toFixed(1) + "ms", 30, th += dh);
    ctx.fillText("Framerate = " + framerate.toFixed(0) + " Hz", 30, th += dh);

    ctx.globalAlpha = 1;
    ctx.save();
    ctx.textAlign = "center";
    ctx.globalAlpha = 0.3;
    for (let field of velocity_fields)
    {
        if (typeof field.origin != "undefined")
        {
            ctx.fillText(field.type, field.origin[0], field.origin[1] - 10);
            ctx.beginPath();
            ctx.arc(field.origin[0], field.origin[1], 4, 0, Math.PI*2);
            ctx.fill();
        }
    }
    ctx.restore();

    const update_end = new Date().getTime() / 1000;
    const real_dt = update_end - update_start;
    FRAME_DT_BUFFER.push([now, dt, real_dt]);
}

function randomize_field()
{
    velocity_fields = [];
    // let num_fields = Math.round(Math.random() * 4 + 2);
    // for (let i = 0; i < num_fields; i++)
    // {
    //     let x = Math.random() * 4*width/6 + width/6;
    //     let y = Math.random() * 4*height/6 + height/6;
    //     let strength = Math.random() * 1500000 - 750000;
    //     let field = vortex(x, y, strength);
    //     if (Math.random() < 0.5)
    //     {
    //         strength = Math.random() * 50000 + 20000;
    //         field = source(x, y, strength);
    //     }
    //     velocity_fields.push(field);
    // }

    let theta = Math.random() * Math.PI * 2;
    let vel = 200;
    let vx = Math.cos(theta) * vel;
    let vy = Math.sin(theta) * vel;
    velocity_fields.push(uniform(vx, vy));
    for (const p of particles)
    {
        p.history = [];
    }
}

function add_new_particle()
{
    particles.push(new Particle(
        Math.random() * width  * 2 - width  / 2,
        Math.random() * height * 2 - height / 2));
}

function remove_particle()
{
    particles.pop();
}

function regenerate_particles()
{
    let N = 1000;
    if (particles.length)
    {
        N = particles.length;
    }
    particles = [];
    for (var i = 0; i < N; ++i)
    {
        add_new_particle();
    }
}

randomize_field();

regenerate_particles();

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

}, NOMINAL_DT / 2 * 1000);
