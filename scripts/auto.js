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
        ctx.beginPath();
        ctx.rotate(-this.turn);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, this.w/2);
        ctx.stroke();
        ctx.restore();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.seekx, this.seeky);
        ctx.strokeStyle = "lightgray";
        ctx.stroke();
    }

    steer(vx, vy)
    {
        // if (isNaN(this.seekx) || isNaN(this.seeky)) return;
        // var dx = this.seekx - this.x;
        // var dy = this.seeky - this.y;
        var da = Math.atan2(vx, vy) - this.theta;
        while (da < -Math.PI)
            da += 2*Math.PI;
        while (da > Math.PI)
            da -= 2*Math.PI;

        this.a = Math.sqrt(vx*vx + vy*vy) - this.v;
        this.turn = Math.max(-Math.PI/5, Math.min(da, Math.PI/5));
    }

    step(dt)
    {
        var s = this.v * dt;
        this.x += s*Math.sin(this.theta);
        this.y += s*Math.cos(this.theta);
        this.v += this.a * dt;
        this.v = Math.max(-20, Math.min(this.v, 200));
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
var inv = 1;

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
            var dx = c.x - mx;
            var dy = c.y - my;
            var dr = Math.sqrt(dx*dx + dy*dy) - c.r;

            var angle = Math.atan2(dy, dx);
            var desired_x = c.r*Math.cos(angle) + mx;
            var desired_y = c.r*Math.sin(angle) + my;

            c.steer(inv*dy + (desired_x - c.x), -inv*dx + (desired_y - c.y));
            // ctx.beginPath();
            // ctx.arc(width/2, height/2, r, 0, 2*Math.PI);
            // ctx.stroke();
        });
        ctx.fillStyle = "red";
        ctx.fillRect(mx - 2, my - 2, 4, 4);

    }, 1000/fps);
}

canvas.onmousemove = function(e)
{
    var rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
}

canvas.addEventListener("click", function(e)
{
    inv *= -1;
}, false);

var num = Math.random()*30;
for (var i = 0; i < 300; ++i)
{
    cars.push(new Car(Math.random()*width, Math.random()*height, Math.random()*2*Math.PI));
    var dx = cars[i].x - width/2;
    var dy = cars[i].y - height/2;
    cars[i].r = Math.sqrt(dx*dx + dy*dy);
}
draw();
