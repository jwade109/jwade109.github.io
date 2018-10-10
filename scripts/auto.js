showVelocity = false;
showDesired = false;
showPath = true;
showRadius = false;
showCommand = false;
showBounding = true;
orbitCursor = true;
seekCursor = false;
followLeader = false;
avoidCars = true;
allStop = false;

class Car
{
    constructor(x, y, theta)
    {
        this.x = x;
        this.y = y;
        this.theta = theta;

        this.w = Math.random()*6 + 10;
        this.l = Math.random()*8 + 12;
        this.v = 0;
        this.omega = 0;
        this.turn = 0;
        this.turn_rate = 0.3;
        this.target_turn = 0;
        this.a = 0;
        this.maxaccel = 120;

        this.tvx = 0;
        this.tvy = 0;
        this.vx = 0;
        this.vy = 0;

        this.rc = 0;
    }

    draw(canvas)
    {
        var ctx = canvas.getContext("2d");

        if (showDesired)
        {
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.tvx, this.y + this.tvy);
            ctx.stroke();
        }
        if (showCommand)
        {
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = "green";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.tvx - this.vx,
                       this.y + this.tvy - this.vy);
            ctx.stroke();
        }

        ctx.save(); // save global reference frame
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.theta)
        // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE FRAME

        ctx.strokeStyle = "black";
        ctx.globalAlpha = 1;
        ctx.fillRect(-2, -2, 4, 4);
        ctx.strokeRect(-this.w/2, -this.l/2, this.w, this.l)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, this.l/2);
        ctx.stroke();

        if (showPath)
        {
            ctx.strokeStyle = "black";
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            var ds = this.stop_distance;
            var rads = ds / Math.abs(this.rc);

            if (Math.abs(this.turn) < 0.001)
            {
                ctx.moveTo(0, 0);
                ctx.lineTo(0, ds);
            }
            else if (this.turn > 0)
                ctx.arc(this.rc, 0, this.rc, Math.PI - rads, Math.PI);
            else if (this.turn < 0)
                ctx.arc(this.rc, 0, -this.rc, 0, rads);
            ctx.stroke();
        }
        if (showBounding)
        {
            var cush = 5;
            ctx.strokeStyle = "black";
            ctx.globalAlpha = 0.2;
            var ds = this.stop_distance;
            var cs = 0.5 * this.l + cush;
            var ds_r = ds / Math.abs(this.rc);
            var cs_r = cs / Math.abs(this.rc);

            if (Math.abs(this.turn) < 0.001)
            {
                ctx.beginPath();
                ctx.moveTo(this.w/2 + cush, -this.l/2 - cush);
                ctx.lineTo(this.w/2 + cush, this.l/2 + cush + ds);
                ctx.lineTo(-this.w/2 - cush, this.l/2 + cush + ds);
                ctx.lineTo(-this.w/2 - cush, -this.l/2 - cush);
                ctx.lineTo(this.w/2 + cush, -this.l/2 - cush);
                ctx.stroke();
            }
            else if (this.turn > 0)
            {
                ctx.beginPath();
                ctx.arc(this.rc, 0, Math.max(0, this.rc - this.w/2 - cush),
                  Math.PI, Math.PI - ds_r - cs_r, true);
                ctx.arc(this.rc, 0, this.rc + this.w/2 + cush,
                  Math.PI - ds_r - cs_r, Math.PI + cs_r, false);
                ctx.arc(this.rc, 0, Math.max(0, this.rc - this.w/2 - cush),
                  Math.PI + cs_r, Math.PI, true);
                ctx.stroke();
            }
            else if (this.turn < 0)
            {
                ctx.beginPath();
                ctx.arc(this.rc, 0, Math.max(0, -this.rc - this.w/2 - cush),
                  0, ds_r + cs_r, false);
                ctx.arc(this.rc, 0, -this.rc + this.w/2 + cush,
                  ds_r + cs_r, -cs_r, true);
                ctx.arc(this.rc, 0, Math.max(0, -this.rc - this.w/2 - cush),
                  -cs_r, 0, false);
                ctx.stroke();
            }
        }
        if (showRadius)
        {
            ctx.globalAlpha = 0.1;
            ctx.strokeStyle = "black";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.rc, 0);
            ctx.stroke();
        }
        if (showVelocity)
        {
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = "blue";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, this.v);
            ctx.stroke();
        }

        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = "purple";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-this.nn, this.nt);
        ctx.stroke();

        ctx.rotate(-this.turn);
        // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE
        // FRAME, ROTATED BY THE TURNING ANGLE

        ctx.globalAlpha = 1;
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, this.w/2);
        ctx.stroke();

        ctx.restore();
    }

    applyForce(vx, vy)
    {
        this.tvx += vx;
        this.tvy += vy;
    }

    stop()
    {
        this.tvx = 0;
        this.tvy = 0;
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
            if (ds < 200 && ds > 0)
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
        if (vx == 0 && vy == 0) da = this.target_turn;
        while (da < -Math.PI)
            da += 2*Math.PI;
        while (da > Math.PI)
            da -= 2*Math.PI;

        this.a = 100*(Math.sqrt(vx*vx + vy*vy) - this.v);
        this.a = Math.max(-this.maxaccel, Math.min(this.a, this.maxaccel));
        this.target_turn = Math.max(-Math.PI/5, Math.min(da, Math.PI/5));
    }

    step(dt)
    {
        this.steer(this.tvx, this.tvy);
        this.tvx = 0;
        this.tvy = 0;

        this.turn += (this.target_turn - this.turn)*this.turn_rate;

        var s = this.v * dt;
        this.x += s*Math.sin(this.theta);
        this.y += s*Math.cos(this.theta);
        this.v += this.a * dt;
        this.v = Math.max(-20, Math.min(this.v, 200));
        this.omega = Math.sin(this.turn) * Math.abs(this.v) / this.l;
        this.theta += this.omega * dt;

        this.vx = this.v*Math.sin(this.theta);
        this.vy = this.v*Math.cos(this.theta);

        this.rc = this.l/Math.tan(this.turn);
        this.stop_distance = Math.pow(this.v, 2)/(2*this.maxaccel);

        // var nn = -dx*Math.cos(this.theta + Math.PI) +
        //            dy*Math.sin(this.theta + Math.PI);
        // var nt =  dx*Math.sin(this.theta + Math.PI) +
        //            dy*Math.cos(this.theta + Math.PI);
    }
}

var cars = [];
var height = document.body.scrollHeight;
var width = document.body.clientWidth;

var fps = 50;
var canvas = document.getElementById("canvas");
var mx = width/2, my = height/2;
var follow = false;
var r = 200;

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

        for (var c in cars)
        {
            cars[c].draw(canvas);
            cars[c].step(1/fps);

            var dx = cars[c].x - mx;
            var dy = cars[c].y - my;
            var des_x = cars[c].r*Math.cos(Math.atan2(dy, dx))*30 + mx;
            var des_y = cars[c].r*Math.sin(Math.atan2(dy, dx))*30 + my;
            if (orbitCursor)
            {
                cars[c].applyForce(-dy, dx);
                cars[c].applyForce(3*(des_x - cars[c].x), 3*(des_y - cars[c].y));
            }
            if (seekCursor) cars[c].applyForce(mx - cars[c].x, my - cars[c].y);
            if (avoidCars) cars[c].avoid(cars);
            if (followLeader)
            {
                if (c == 0 && follow)
                    cars[c].applyForce(mx - cars[c].x, my - cars[c].y);
                else if (c == 0)
                    cars[c].applyForce(cars[cars.length - 1].x - cars[c].x,
                                       cars[cars.length - 1].y - cars[c].y);
                else
                    cars[c].applyForce(cars[c-1].x - cars[c].x,
                                       cars[c-1].y - cars[c].y);
            }
            if (allStop) cars[c].stop();
        }

        // if (Math.random()*100 < 30)
        // {
        //     var ind = Math.floor(Math.random()*cars.length);
        //     cars[ind].r += Math.sign(Math.random()*2-1);
        //     cars[ind].r = Math.max(2, Math.min(cars[ind].r, 20));
        // }

        ctx.globalAlpha = 1;
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
    var rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
}, false);

var num = Math.random()*30;
for (var i = 0; i < 30; ++i)
{
    cars.push(new Car(Math.random()*width,
                      Math.random()*height,
                      Math.random()*2*Math.PI));
    var dx = cars[i].x - width/2;
    var dy = cars[i].y - height/2;
    cars[i].r = Math.floor(Math.random()*14) + 2;
}
draw();
