showVelocity = false;
showAccel = false;
showDesired = false;
showPath = false;
showBounding = false;
showRadius = false;
orbitCursor = true;
seekCursor = false;
followLeader = false;
avoidCars = true;
allStop = false;

meters = 9; // pixels per meter
feet = meters/3.28084; // pixels per foot
mph = meters/2.23694; // pixels/s per mph

var cars = [];
var height = document.body.scrollHeight;
var width = document.body.clientWidth;

var fps = 50;
var canvas = document.getElementById("canvas");
var mx = width/2, my = height/2;
var follow = false;

var old_sx = 0, old_sy = 0;
var shiftx = 0, shifty = 0;
var initx = 0, inity = 0;
var deltax = 0, deltay = 0;
var moving = false;

class Curve
{
    constructor(...points)
    {
        this.points = points;
        this.isLoop = false;
    }

    draw(canvas)
    {
        var ctx = canvas.getContext("2d");
        ctx.save();
        ctx.translate(shiftx, shifty);
        ctx.strokeStyle = "black";
        ctx.globalAlpha = 0.3;
        var p0 = this.point(0);
        var ds = 1/100;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        for (var s = 0; s <= 1 + ds; s += ds)
        {
            var p = this.point(s);
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        for (var p in this.points)
        {
            ctx.beginPath();
            ctx.arc(this.points[p][0], this.points[p][1],
                    2, 0, Math.PI*2);
            ctx.stroke();
        }
        ctx.restore();
    }

    point(s)
    {
        function interpolate(s, pts)
        {
            if (s > 1) s = 1;
            if (s < 0) s = 0;
            var newpoints = [];
            for (var i = 0; i < pts.length - 1; ++i)
            {
                var nx = pts[i][0] + s*(pts[i+1][0] - pts[i][0]);
                var ny = pts[i][1] + s*(pts[i+1][1] - pts[i][1]);
                newpoints.push([nx, ny]);
            }
            return newpoints;
        }

        var interp = this.points.slice(0, this.points.length);
        if (this.isLoop) interp.push(this.points[0]);
        while (interp.length > 1)
        {
            interp = interpolate(s, interp);
        }
        return { x: interp[0][0], y: interp[0][1] };
    }

    nearestPoint(px, py)
    {
        var best, min = Infinity;
        var ds = 1/300;
        for (var s = 0; s <= 1 + ds; s += ds)
        {
            var p = this.point(s);
            var dx = p.x - px;
            var dy = p.y - py;
            var dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < min)
            {
                best = p;
                min = dist;
            }
        }
        return best;
    }

    distanceFrom(px, py)
    {
        var np = this.nearestPoint(px, py);
        var dx = np.x - px;
        var dy = np.y - py;
        return Math.sqrt(dx*dx + dy*dy);
    }
}

class Car
{
    constructor(x, y, theta)
    {
        this.x = x;
        this.y = y;
        this.theta = theta;

        this.w = (Math.random()*0.2 + 1.9) * meters;
        this.l = (Math.random()*2 + 3) * meters;
        this.v = 0;
        this.omega = 0;
        this.turn = 0;
        this.turn_rate = 0.3;
        this.target_turn = 0;
        this.a = 0;
        this.maxdecel = 50*mph;
        this.maxaccel = 5*meters;
        this.maxvel = Infinity; // 80*mph;

        this.velocity = [0, 0];

        this.rc = 0;
        this.collision_radius = 5*meters;

        this.forces = [];
        this.heading = [Math.sin(this.theta), Math.cos(this.theta)];
    }

    draw(canvas)
    {
        var ctx = canvas.getContext("2d");
        ctx.save(); // save global reference frame

        ctx.translate(shiftx, shifty);

        if (showDesired)
        {
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = "red";
            var sx = 0, sy = 0;
            for (var i in this.forces)
            {
                sx += this.forces[i][0];
                sy += this.forces[i][1];
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + this.forces[i][0], this.y + this.forces[i][1]);
                ctx.stroke();
            }
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = "purple";
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + sx, this.y + sy);
            ctx.stroke();
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(-this.theta)
        // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE FRAME

        ctx.strokeStyle = "black";
        ctx.fillStyle = "lightgray";
        ctx.globalAlpha = 1;
        if (this === cars[0])
            ctx.fillRect(-this.w/2, -this.l/2, this.w, this.l)
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
        if (showAccel)
        {
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = "orange";
            ctx.beginPath();
            ctx.moveTo(0, this.a);
            ctx.lineTo(0, 0);
            ctx.lineTo(Math.pow(this.v, 2)/this.rc, 0);
            ctx.stroke();
        }
        // if (true)
        // {
        //     ctx.globalAlpha = 0.3;
        //     ctx.strokeStyle = "gray";
        //     ctx.beginPath();
        //     ctx.arc(0, 0, this.collision_radius, 0, Math.PI*2);
        //     ctx.stroke();
        //     ctx.beginPath();
        //     ctx.arc(0, 0, this.stop_distance, 0, Math.PI*2);
        //     ctx.stroke();
        // }

        ctx.rotate(-this.turn);
        // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE
        // FRAME, ROTATED BY THE TURNING ANGLE

        ctx.globalAlpha = 1;
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(0, -this.w/2);
        ctx.lineTo(0, this.w/2);
        ctx.stroke();

        ctx.restore();
    }

    seekVel(vx, vy)
    {
        this.forces.push([vx, vy]);
    }

    seekBodyVel(vn, vt)
    {
        var vx = vt*Math.sin(this.theta) - vn*Math.cos(this.theta);
        var vy = vt*Math.cos(this.theta) + vn*Math.sin(this.theta);
        this.forces.push([vx, vy]);
    }

    arrive(px, py)
    {
        if (Math.abs(px - this.x) > this.w ||
            Math.abs(py - this.y) > this.w)
            this.seekVel(px - this.x, py - this.y);
    }

    stop()
    {
        this.forces = [];
    }

    avoid(cars)
    {
        // var sx = 0;
        // var sy = 0;
        // var x = this.x;
        // var y = this.y;
        // var count = 0;
        // for (var c in cars)
        // {
        //     var dx = x - cars[c].x;
        //     var dy = y - cars[c].y;
        //     var ds = Math.sqrt(dx*dx + dy*dy);
        //     if (ds < 100 && ds > 0)
        //     {
        //         sx += 40*dx/(ds*ds);
        //         sy += 40*dy/(ds*ds);
        //         ++count;
        //     }
        // }
        // this.seekVel(30*sx, 30*sy);

        var desired = [0, 0];
        for (var f in this.forces)
        {
            desired[0] += this.forces[f][0];
            desired[1] += this.forces[f][1];
        }

        var sigmoid = function(x, r)
        {
            return -(1/Math.PI) * Math.atan(1*(x - r)) + 0.5;
        }

        for (var c in cars)
        {
            var separation = [cars[c].x - this.x, cars[c].y - this.y];
            if (norm2d(separation) <= 0) continue;
            var other = cars[c].velocity;
            var scaleDist = sigmoid(norm2d(separation), cars[c].collision_radius);
            var scaleCollide = Math.max(0, scaleDist*(cars[c].collision_radius - norm2d(separation)));
            var scaleDesire = Math.max(0, scaleDist*dot2d(desired, unit2d(separation)));
            var scaleVel = Math.max(0, sigmoid(norm2d(separation),
                Math.max(1.5*this.stop_distance, cars[c].collision_radius))*dot2d(this.velocity, unit2d(separation)));

            var collisionAvoid = mult2d(unit2d(separation), -scaleCollide);
            this.forces.push(collisionAvoid);
            var desireAvoid = mult2d(unit2d(separation), -scaleDesire);
            this.forces.push(desireAvoid);
            var velocityAvoid = mult2d(unit2d(separation), -scaleVel);
            this.forces.push(velocityAvoid);
        }
    }

    steer(command)
    {
        this.a = 3*sproj2d(this.heading, command);
        if (isNaN(this.a)) this.a = 0;
        if (Math.sign(this.v) > 0)
            this.a = Math.max(-this.maxdecel, Math.min(this.a, this.maxaccel));
        else
            this.a = Math.max(-this.maxaccel, Math.min(this.a, this.maxdecel));
        var da = -srej2d(this.heading, command)/100;
        if (isNaN(da)) da = this.target_turn;
        this.target_turn = Math.max(-Math.PI/5, Math.min(da, Math.PI/5));
    }

    step(dt)
    {
        var tvx = 0, tvy = 0;
        for (var f in this.forces)
        {
            tvx += this.forces[f][0];
            tvy += this.forces[f][1];
        }
        var command = [tvx - this.velocity[0], tvy - this.velocity[1]];
        this.steer(command);
        this.turn += (this.target_turn - this.turn)*this.turn_rate;

        var s = this.v * dt;
        this.x += s*Math.sin(this.theta);
        this.y += s*Math.cos(this.theta);
        this.v += this.a * dt;
        this.omega = Math.sin(this.turn) * Math.abs(this.v) / this.l;
        this.theta += this.omega * dt;

        this.velocity = [this.v*Math.sin(this.theta), this.v*Math.cos(this.theta)];

        this.rc = this.l/Math.tan(this.turn);
        this.stop_distance = Math.pow(this.v, 2)/(2*this.maxdecel);
        this.heading = [Math.sin(this.theta), Math.cos(this.theta)];

        this.forces = [];
    }
}

function draw()
{
    setTimeout(function()
    {
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.canvas.width = document.body.clientWidth;
        ctx.canvas.height = document.body.clientHeight;
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
                cars[c].seekVel(-dy, dx);
                cars[c].arrive(des_x, des_y);
            }

            if (seekCursor) cars[c].arrive(mx, my);
            if (avoidCars) cars[c].avoid(cars);
            if (followLeader)
            {
                if (c == 0 && follow)
                {
                    cars[c].arrive(mx, my);
                }
                else if (c == 0)
                {
                    cars[c].arrive(cars[cars.length - 1].x,
                                   cars[cars.length - 1].y);
                }
                else
                    cars[c].arrive(cars[c-1].x, cars[c-1].y);
            }
            if (allStop) cars[c].stop();
        }

        ctx.globalAlpha = 1;
        ctx.fillStyle = "black";
        ctx.fillText("Car[0] velocity: " +
            Math.round(cars[0].v/meters) + " m/s " +
            Math.round(cars[0].v/mph) + " mph", 5, height - 40);
        ctx.fillText("10 Meters/25 Feet", 5, height - 25);
        for (var i = 5; i < width - 100; i += 10*meters)
            ctx.fillRect(i, height - 20, meters*5, 5);
        for (var i = 5; i < width - 100; i += 50*feet)
            ctx.fillRect(i, height - 10, feet*25, 5);

        ctx.globalAlpha = 1;
        ctx.fillStyle = "red";
        ctx.fillRect(mx - 2 + shiftx, my - 2 + shifty, 4, 4);

    }, 1000/fps);
}

canvas.onmousemove = function(e)
{
    var rect = canvas.getBoundingClientRect();
    if (follow)
    {
        mx = e.clientX - rect.left - shiftx;
        my = e.clientY - rect.top - shifty;
    }
    if (moving)
    {
        deltax = e.clientX - rect.left - initx;
        deltay = e.clientY - rect.top - inity;
        shiftx = old_sx + deltax;
        shifty = old_sy + deltay;
    }
}

canvas.onmousedown = function(e)
{
    if (e.which == 2 || e.which == 4)
    {
        var rect = canvas.getBoundingClientRect();
        if (!moving)
        {
            old_sx = shiftx;
            old_sy = shifty;
            initx = e.clientX - rect.left;
            inity = e.clientY - rect.top;
        }
        moving = true;
    }
}

canvas.onmouseup = function(e)
{
    if (e.which == 2 || e.which == 4)
    {
        moving = false;
        shiftx = old_sx + deltax;
        shifty = old_sy + deltay;
    }
}

canvas.addEventListener("click", function(e)
{
    follow = !follow;
    var rect = canvas.getBoundingClientRect();
        mx = e.clientX - rect.left - shiftx;
        my = e.clientY - rect.top - shifty;
}, false);

canvas.addEventListener("mousescroll", function(e)
{
    follow = !follow;
    var rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
}, false);

for (var i = 0; i < 50; ++i)
{
    cars.push(new Car(Math.random()*width,
                      Math.random()*height,
                      Math.random()*2*Math.PI));
    var dx = cars[i].x - width/2;
    var dy = cars[i].y - height/2;
    cars[i].r = 7; // Math.floor(Math.random()*14) + 2;
}
draw();
