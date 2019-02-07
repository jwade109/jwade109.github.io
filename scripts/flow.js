var width = document.body.clientWidth;
var height = document.body.scrollHeight;
var potential = [];
var particles = [];
var scale = 5;
var mx = width/2, my = height/2;

class Particle
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }

    step(dt)
    {
        var v = velocityAt(this.x, this.y);
        this.x += v.x*dt*100;
        this.y += v.y*dt*100;
        if (this.x > width && v.x > 0)
        {
            this.x = -10;
            this.y = Math.random()*height;
        }
        if (this.x < 0 && v.x < 0)
        {
            this.x = width + 10;
            this.y = Math.random()*height;
        }
        if (this.y > height && v.y > 0)
        {
            this.x = Math.random()*width;
            this.y = -10;
        }
        if (this.y < 0 && v.y < 0)
        {
            this.x = Math.random()*width;
            this.y = height + 10;
        }
    }

    draw(ctx)
    {
        ctx.fillStyle = "blue";
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI*2);
        ctx.fill();
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
    return { x: vx, y: vy };
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
        for (var i = 0; i < w; ++i)
        {
            var cx = px/2 + i*px;
            for (var j = 0; j < h; ++j)
            {
                var cy = py/2 + j*py;
                var vel = velocityAt(cx, cy);
                var mag = 2*Math.sqrt(vel.x*vel.x + vel.y*vel.y);
                ctx.strokeStyle = "black";
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + vel.x*pixels/mag, cy + vel.y*pixels/mag);
                ctx.stroke();
                ctx.beginPath();
                ctx.strokeStyle = "black";
                ctx.globalAlpha = 0.1;
                ctx.arc(cx, cy, 1, 0, Math.PI*2);
                ctx.stroke();
            }
        }

        for (var p in particles)
        {
            particles[p].draw(ctx);
            for (var f = 0; f < steps_per_frame; ++f)
                particles[p].step(1/(fps*steps_per_frame));
        }

        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(width/3, height/2, 40, 0, Math.PI*2);
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.fillStyle = "lightgray";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(width*2/3, height/2, 55, 0, Math.PI*2);
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.fillStyle = "lightgray";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(width/2 + 20, height/4 + 20, 60, 0, Math.PI*2);
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.fillStyle = "lightgray";
        ctx.fill();

    }, 1000/fps);
}

potential.push(uniform(0, 5));
potential.push(vortex(width/3, height/2, 6000));
potential.push(vortex(width*2/3, height/2, -11000));
potential.push(source(width/2, height/4, 2000));

draw();

for (var i = 0; i < 400; ++i)
{
    particles.push(new Particle(Math.random()*width, Math.random()*height));
}
