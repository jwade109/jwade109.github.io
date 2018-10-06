class Car
{
    constructor(x, y, theta)
    {
        this.x = x;
        this.y = y;
        this.theta = theta;

        this.w = 20;
        this.l = 40;
        this.v = 0;
        this.omega = 0;

        this.seekx = NaN;
        this.seeky = NaN;
    }

    draw(canvas)
    {
        var ctx = canvas.getContext("2d");
        ctx.strokeStyle = "black";
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.theta)

        ctx.beginPath();
        ctx.moveTo(0, this.l/2);
        ctx.lineTo(-this.w/2, -this.l/2);
        ctx.lineTo(this.w/2, -this.l/2);
        ctx.lineTo(0, this.l/2);
        ctx.stroke();

        // ctx.strokeRect(-this.w/2, -this.l/2, this.w, this.l);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, this.l/2);
        ctx.stroke();
        ctx.rotate(this.theta)
        ctx.translate(-this.x, -this.y);

        // ctx.beginPath();
        // ctx.moveTo(this.x, this.y);
        // ctx.lineTo(this.seekx, this.seeky);
        // ctx.stroke();
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
        var ds = Math.sqrt(dx*dx + dy*dy);
        this.v = Math.max(-20, Math.min(200, ds*Math.cos(da)));
        this.omega = da/10 * Math.abs(Math.sin(this.v));
    }

    step(dt)
    {
        var s = this.v * dt;
        this.x += s*Math.sin(this.theta);
        this.y += s*Math.cos(this.theta);
        this.theta += this.omega;
    }
}

var cars = [];
var height = document.body.scrollHeight;
var width = document.body.clientWidth;

var sx = Math.random()*width;
var sy = Math.random()*height;

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
            c.seek(sx, sy);
        });

    }, 1000/fps);
}

var fps = 50;
var canvas = document.getElementById("canvas");
for (var i = 0; i < 30; ++i)
    cars.push(new Car(Math.random()*width, Math.random()*height, Math.random()*2*Math.PI));
draw();
