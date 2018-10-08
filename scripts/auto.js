class Car
{
    constructor(x, y, theta)
    {
        this.x = x;
        this.y = y;
        this.theta = theta;

        this.w = Math.random()*8 + 8;
        this.l = Math.random()*16 + 13;
        this.v = 200;
        this.omega = 0;
        this.turn = 0;
        this.a = 0;

        this.tvx = 0;
        this.tvy = 0;
        this.vx = 0;
        this.vy = 0;
    }

    draw(canvas)
    {
        var ctx = canvas.getContext("2d");
        ctx.strokeStyle = "black";
        ctx.globalAlpha = 1;
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
        // ctx.beginPath();
        // ctx.globalAlpha = 0.1;
        // ctx.strokeStyle = "red";
        // ctx.moveTo(this.x, this.y);
        // ctx.lineTo(this.x + this.tvx, this.y + this.tvy);
        // ctx.stroke();
        // ctx.strokeStyle = "blue";
        // ctx.beginPath();
        // ctx.moveTo(this.x, this.y);
        // ctx.lineTo(this.x + this.vx, this.y + this.vy);
        // ctx.stroke();
    }

    applyForce(vx, vy)
    {
        this.tvx += vx;
        this.tvy += vy;
    }

    avoid(cars)
    {
        var sx = 0;
        var sy = 0;
        var x = this.x;
        var y = this.y;
        var count = 0;
        cars.forEach(function(other)
        {
            var dx = x - other.x;
            var dy = y - other.y;
            var ds = Math.sqrt(dx*dx + dy*dy);
            if (ds < 700 && ds > 0)
            {
                sx += 40*dx/(ds*ds);
                sy += 40*dy/(ds*ds);
                ++count;
            }
        });
        this.applyForce(30*sx, 30*sy);
    }

    steer(vx, vy)
    {
        var da = Math.atan2(vx, vy) - this.theta;
        if (vx == 0 && vy == 0) da = 0;
        while (da < -Math.PI)
            da += 2*Math.PI;
        while (da > Math.PI)
            da -= 2*Math.PI;

        this.a = 20*(Math.sqrt(vx*vx + vy*vy) - this.v);
        // this.a = Math.max(-this.maxaccel, Math.min(this.a, this.maxaccel));
        this.turn = Math.max(-Math.PI/5, Math.min(da, Math.PI/5));
    }

    step(dt)
    {
        this.steer(this.tvx, this.tvy);
        this.tvx = 0;
        this.tvy = 0;

        var s = this.v * dt;
        this.x += s*Math.sin(this.theta);
        this.y += s*Math.cos(this.theta);
        this.v += this.a * dt;
        this.v = Math.max(-20, Math.min(this.v, 300));
        this.omega = Math.sin(this.turn) * Math.abs(this.v) / 20;
        this.theta += this.omega * dt;

        this.vx = this.v*Math.sin(this.theta);
        this.vy = this.v*Math.cos(this.theta);
    }
}

var cars = [];
var height = document.body.scrollHeight;
var width = document.body.clientWidth;

var fps = 50;
var canvas = document.getElementById("canvas");
var mx = width/2, my = height/2;
var follow = false;

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
            c.draw(canvas);
            c.step(1/fps);

            var dx = c.x - mx;
            var dy = c.y - my;
            var des_x = c.r*Math.cos(Math.atan2(dy, dx)) + mx;
            var des_y = c.r*Math.sin(Math.atan2(dy, dx)) + my;
            c.applyForce(dy, -dx);
            c.applyForce(3*(des_x - c.x), 3*(des_y - c.y));
            c.avoid(cars);
        });

        if (Math.random()*100 < 30)
        {
            var ind = Math.floor(Math.random()*cars.length);
            cars[ind].r += Math.random()*200 - 100;
            cars[ind].r = Math.max(100, Math.min(cars[ind].r, width/2));
        }

        ctx.fillStyle = "red";
        ctx.fillRect(mx - 2, my - 2, 4, 4);

    }, 1000/fps);
}

canvas.onmousemove = function(e)
{
    if (follow)
    {
        var rect = canvas.getBoundingClientRect();
        mx = e.clientX - rect.left;
        my = e.clientY - rect.top;
    }
}

canvas.addEventListener("click", function(e)
{
    follow = !follow;
}, false);

var num = Math.random()*30;
for (var i = 0; i < 700; ++i)
{
    cars.push(new Car(Math.random()*width,
                      Math.random()*height,
                      Math.random()*2*Math.PI));
    var dx = cars[i].x - width/2;
    var dy = cars[i].y - height/2;
    cars[i].r = Math.random()*width/2 + 100;
}
draw();
