var width = document.body.clientWidth;
var height = document.body.scrollHeight;
var potential = [];
var particles = [];

let NOMINAL_FRAMERATE = 25;
let NOMINAL_DT = 1 / NOMINAL_FRAMERATE;

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
});

class Particle
{
    constructor(x, y)
    {
        this.pos = [x, y];
        this.history = []
    }

    step(dt)
    {
        var v = add2d(velocityAt(this.pos[0], this.pos[1]),
                [Math.random() * 2 - 1, Math.random() * 2 - 1]);
        this.pos[0] += v[0] * dt;
        this.pos[1] += v[1] * dt;
        this.history.push(this.pos.slice());
        if (this.pos[0] > width*1.5 && v[0] > 0)
        {
            this.pos[0] = -10;
            this.pos[1] = Math.random()*height*2 - height;
            this.history = []
        }
        if (this.pos[0] < -width/2 && v[0] < 0)
        {
            this.pos[0] = width + 10;
            this.pos[1] = Math.random()*height*2 - height;
            this.history = []
        }
        if (this.pos[1] > height*1.5 && v[1] > 0)
        {
            this.pos[0] = Math.random()*width*2 - width;
            this.pos[1] = -10;
            this.history = []
        }
        if (this.pos[1] < -height/2 && v[1] < 0)
        {
            this.pos[0] = Math.random()*width*2 - width;
            this.pos[1] = height + 10;
            this.history = []
        }

        const n = 150;
        if (this.history.length > n)
        {
            this.history = this.history.slice(-n);
        }
    }

    draw(ctx)
    {
        ctx.fillStyle = "black";
        ctx.strokeStyle = "black";
        ctx.globalAlpha = 0.2;
        // ctx.beginPath();
        // ctx.arc(this.pos[0], this.pos[1], 4, 0, Math.PI*2);
        // ctx.fill();
        ctx.beginPath();
        let last = this.pos;
        ctx.moveTo(this.pos[0], this.pos[1]);
        for (let i = 1; i < this.history.length; i++)
        {
            const a = this.history[this.history.length - i - 1];
            if (distance(last, a) > 15 || i + 1 == this.history.length)
            {
                ctx.lineTo(a[0], a[1]);
                last = a;
            }
        }
        ctx.lineWidth = 4;
        ctx.stroke();
    }
}

function potentialAt(x, y)
{
    var sum = 0;
    for (var p in potential)
    {
        sum += potential[p](x, y);
    }
    return sum;
}

function velocityAt(x, y)
{
    var r = 0.001;
    var vx = (potentialAt(x+r, y) - potentialAt(x-r, y))/(2*r);
    var vy = (potentialAt(x, y+r) - potentialAt(x, y-r))/(2*r);
    if (isNaN(vx)) vx = 0;
    if (isNaN(vy)) vy = 0;
    return [vx, vy];
}

function vortex(x0, y0, gamma)
{
    return function(x, y)
    {
        var theta = Math.atan2(y - y0, x - x0);
        return gamma*theta/(Math.PI*2)
    }
}

function source(x0, y0, lambda)
{
    return function(x, y)
    {
        var r = Math.sqrt(Math.pow(x - x0, 2) + Math.pow(y - y0, 2));
        return lambda*Math.log(r)/(Math.PI*2);
    }
}

function uniform(theta, v)
{
    return function(x, y)
    {
        return v*x*Math.cos(-theta) + v*y*Math.sin(-theta);
    }
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

FRAME_DT_BUFFER = [];

function update(previous, now, frame_number)
{
    const dt = now - previous;
    if (Math.abs(dt) > NOMINAL_DT * 3)
    {
        console.log("Large timestep: " + dt.toFixed(3) + " (nominally "
            + NOMINAL_DT.toFixed(3) + ")");
        return;
    }

    var fps = 50;
    var steps_per_frame = 2;

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.canvas.width = document.body.clientWidth;
    ctx.canvas.height = document.body.clientHeight;
    width = ctx.canvas.width;
    height = ctx.canvas.height;

    FRAME_DT_BUFFER.push([now, dt]);
    if (FRAME_DT_BUFFER.length > 100)
    {
        FRAME_DT_BUFFER = FRAME_DT_BUFFER.slice(-100);
    }

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
    ctx.fillText("Press R to randomize the potential field", 30, th += dh);
    let avg = 0;
    for (let e of FRAME_DT_BUFFER)
    {
        avg += e[1];
    }
    let min = FRAME_DT_BUFFER[0][0]
    let max = FRAME_DT_BUFFER[FRAME_DT_BUFFER.length - 1][0]
    avg /= FRAME_DT_BUFFER.length;
    let framerate = (FRAME_DT_BUFFER.length - 1) / (max - min);
    ctx.fillText("dt = " + avg.toFixed(4) + "s", 30, th += dh);
    if (FRAME_DT_BUFFER.length > 5)
    {
        ctx.fillText("Framerate = " + framerate.toFixed(1) + " Hz", 30, th += dh);
    }
}

function randomize_field()
{
    potential = [];
    let num_vortices = Math.round(Math.random() * 6 + 2);
    for (let i = 0; i < num_vortices; i++)
    {
        let x = Math.random() * 4*width/6 + width/6;
        let y = Math.random() * 4*height/6 + height/6;
        let strength = Math.random() * 400000 - 200000;
        potential.push(vortex(x, y, strength));
    }

    let theta = Math.random() * Math.PI * 2;
    let strength = Math.random() * 80 + 30;
    potential.push(uniform(theta, strength));
    for (const p of particles)
    {
        p.history = [];
    }
}

function regenerate_particles()
{
    particles = [];
    for (var i = 0; i < 800; ++i)
    {
        particles.push(
            new Particle(Math.random()*width*2 - width/2,
                         Math.random()*height*2 - height/2));
    }
}

randomize_field();

regenerate_particles();

let START_TIME = new Date().getTime() / 1000;
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
