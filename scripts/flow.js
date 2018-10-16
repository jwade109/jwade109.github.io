var width = document.body.clientWidth;
var height = document.body.scrollHeight;
var potential = [];
var particles = [];
var scale = 5;
var mx, my;

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
        ctx.arc(this.x, this.y, 3, 0, Math.PI*2);
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

canvas.onmousemove = function(e)
{
    var rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
}

function draw()
{
    var fps = 100;
    setTimeout(function()
    {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.canvas.width = document.body.clientWidth;
        ctx.canvas.height = document.body.scrollHeight;
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
                ctx.arc(cx, cy, 2, 0, Math.PI*2);
                ctx.stroke();
            }
        }

        for (var p in particles)
        {
            particles[p].draw(ctx);
            particles[p].step(1/fps);
        }


    }, 1000/fps);
}

potential.push(function(x, y)
{
    return 7*x;
});
potential.push(function(x, y)
{
    var r1 = Math.sqrt(Math.pow(x - mx, 2) + Math.pow(y - my, 2));
    var r2 = Math.sqrt(Math.pow(x - mx - 1, 2) + Math.pow(y - my, 2));
    return 2000000*Math.log(r1)/(Math.PI*2) - 2000000*Math.log(r2)/(Math.PI*2);
});
// potential.push(function(x, y)
// {
//     var theta1 = Math.atan2(y - height/4, x - width/2);
//     return 3000*(theta1)/(Math.PI*2)
// })

draw();

for (var i = 0; i < 1500; ++i)
{
    particles.push(new Particle(Math.random()*width, Math.random()*height));
}
