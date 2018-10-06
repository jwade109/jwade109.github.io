class Car
{
    constructor(x, y, theta)
    {
        this.x = x;
        this.y = y;
        this.theta = theta;

        this.w = Math.random()*20 + 15;
        this.l = Math.random()*20 + 30;
        this.v = Math.random()*400;
        this.omega = 0;
        this.turn = 0;
        this.a = 0;

        this.seekx = NaN;
        this.seeky = NaN;
    }

    draw(canvas)
    {
        var ctx = canvas.getContext("2d");
        ctx.strokeStyle = "black";
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.theta)
        ctx.strokeRect(-this.w/2, -this.l/2, this.w, this.l)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, this.l/2);
        ctx.stroke();
        ctx.save();
        ctx.translate(this.w/2, this.l/2 - 6);
        ctx.rotate(-this.turn);
        ctx.fillRect(-2, -6, 6, 12);
        ctx.restore();
        ctx.translate(-this.w/2, this.l/2 - 6);
        ctx.rotate(-this.turn);
        ctx.fillRect(-4, -6, 6, 12);
        ctx.restore();
    }

    seek(x, y)
    {
        this.seekx = x;
        this.seeky = y;

        var dx = x - this.x, dy = y - this.y;
        var da = Math.atan2(dx, dy) - this.theta;
        while (da < -Math.PI)
            da += 2*Math.PI;
        while (da > Math.PI)
            da -= 2*Math.PI;
        var ds = Math.sqrt(dx*dx + dy*dy)
        if (ds < this.w) ds = 0;

        this.a = ds*Math.cos(da) - this.v*2;
        // this.turn = Math.max(-Math.Pi/5, Math.min(da, Math.PI/5));
        this.turn = da;
    }

    step(dt)
    {
        var s = this.v * dt;
        this.x += s*Math.sin(this.theta);
        this.y += s*Math.cos(this.theta);
        this.v += this.a * dt;
        this.omega = Math.sin(this.turn) * Math.abs(this.v) / 20;
        this.theta += this.omega * dt;
    }
}

var cars = [];
var height = document.body.scrollHeight;
var width = document.body.clientWidth;

var fps = 50;
var canvas = document.getElementById("canvas");
var mx = width/2, my = height/2;

function draw()
{
    setTimeout(function()
    {
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.canvas.width = document.body.clientWidth;
        ctx.canvas.height = document.body.scrollHeight;
        width = ctx.canvas.width;
        height = ctx.canvas.height;
        requestAnimationFrame(draw);

        cars.forEach(function(c)
        {
            c.step(1/fps);
            c.draw(canvas);
            c.seek(mx, my);
        });

    }, 1000/fps);
}

canvas.onmousemove = function(e)
{
    var rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
}

var num = Math.random()*30;
for (var i = 0; i < num; ++i)
    cars.push(new Car(Math.random()*width, Math.random()*height, Math.random()*2*Math.PI));
draw();
