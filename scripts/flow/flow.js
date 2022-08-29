var width = document.body.clientWidth;
var height = document.body.scrollHeight;
var potential = [];
var particles = [];
var scale = 5;
var mx = width/2, my = height/2;

var OFFSET_RATE_X = 0;
var OFFSET_RATE_Y = 0;
var OFFSET_X = 0;
var OFFSET_Y = 0;

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
        this.pos[0] += v[0]*dt*10;
        this.pos[1] += v[1]*dt*10;
        let d = 0;
        if (this.history.length > 0)
        {
            const last = this.history[this.history.length-1];
            d = distance(last, this.pos);
        }
        if (d > 100)
        {
            this.history = [];
        }
        if (this.history.length == 0 || (d > 15 && d < 100))
        {
            this.history.push(this.pos.slice());
        }
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

        const n = 40;
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
        ctx.moveTo(this.pos[0], this.pos[1]);
        for (let i = 0; i < this.history.length; i++)
        {
            const pos = this.history[this.history.length - i - 1];
            ctx.lineTo(pos[0], pos[1]);
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
    return [vx + OFFSET_X, vy + OFFSET_Y];
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

canvas.onmousemove = function(e)
{
    var rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
}

function mouseX()
{
    return mx;
}

function mouseY()
{
    return my;
}

function draw()
{
    var fps = 50;
    var steps_per_frame = 5;
    setTimeout(function()
    {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.canvas.width = document.body.clientWidth;
        ctx.canvas.height = document.body.clientHeight;
        width = ctx.canvas.width;
        height = ctx.canvas.height;
        requestAnimationFrame(draw);

        var pixels = 30;
        var w = Math.round(width/pixels);
        var h = Math.round(height/pixels);
        var px = width/w;
        var py = height/h;
        // for (var i = 0; i < w; ++i)
        // {
        //     var cx = px/2 + i*px;
        //     for (var j = 0; j < h; ++j)
        //     {
        //         var cy = py/2 + j*py;
        //         var vel = velocityAt(cx, cy);
        //         var mag = 2*Math.sqrt(vel[0]*vel[0] + vel[1]*vel[1]);
        //         ctx.strokeStyle = "black";
        //         ctx.globalAlpha = 0.3;
        //         ctx.beginPath();
        //         ctx.moveTo(cx, cy);
        //         ctx.lineTo(cx + vel[0]*pixels/mag, cy + vel[1]*pixels/mag);
        //         ctx.stroke();
        //         ctx.beginPath();
        //         ctx.strokeStyle = "black";
        //         ctx.globalAlpha = 0.1;
        //         ctx.arc(cx, cy, 1, 0, Math.PI*2);
        //         ctx.stroke();
        //     }
        // }

        const dt = 1/(fps*steps_per_frame);
        OFFSET_RATE_X =+ Math.random() * 0.2 - 0.1;
        OFFSET_RATE_Y =+ Math.random() * 0.2 - 0.1;
        OFFSET_X =+ OFFSET_RATE_X * dt;
        OFFSET_Y =+ OFFSET_RATE_Y * dt;

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

        // ctx.beginPath();
        // ctx.arc(width/3, height/2, 40, 0, Math.PI*2);
        // ctx.strokeStyle = "black";
        // ctx.stroke();
        // ctx.fillStyle = "lightgray";
        // ctx.fill();
        // ctx.beginPath();
        // ctx.arc(width*2/3, height/2, 55, 0, Math.PI*2);
        // ctx.strokeStyle = "black";
        // ctx.stroke();
        // ctx.fillStyle = "lightgray";
        // ctx.fill();
        // ctx.beginPath();
        // ctx.arc(width/2 + 20, height/4 + 20, 60, 0, Math.PI*2);
        // ctx.strokeStyle = "black";
        // ctx.stroke();
        // ctx.fillStyle = "lightgray";
        // ctx.fill();

    }, 1000/fps);
}

draw();

function randomize_field()
{
    potential = [];
    let num_vortices = Math.round(Math.random() * 6 + 2);
    for (let i = 0; i < num_vortices; i++)
    {
        let x = Math.random() * 4*width/6 + width/6;
        let y = Math.random() * 4*height/6 + height/6;
        let strength = Math.random() * 120000 - 60000;
        potential.push(vortex(x, y, strength));
    }

    potential.push(uniform(Math.random() * 30 + 12, Math.random() * 30 + 12)); // Math.random() * 40 - 20));
    for (const p of particles)
    {
        p.history = [];
    }
    let x = Math.random() * 4*width/6 + width/6;
    let y = Math.random() * 4*height/6 + height/6;
}

function regenerate_particles()
{
    particles = [];
    for (var i = 0; i < 1200; ++i)
    {
        particles.push(new Particle(Math.random()*width*2 - width/2,
                                    Math.random()*height*2 - height/2));
    }
}

randomize_field();

regenerate_particles();