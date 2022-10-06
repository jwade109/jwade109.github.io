showVelocity = false;
showAccel = false;
showDesired = false;
showPath = false;
showBounding = false;
showRadius = false;
seekCursor = true;
avoidCars = true;
LAST_MOUSE_POSITION = null;

meters = 9; // pixels per meter
feet = meters/3.28084; // pixels per foot
mph = meters/2.23694; // pixels/s per mph

var cars = [];

var fps = 50;
var canvas = document.getElementById("canvas");
canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;
var follow = false;

var old_sx = 0, old_sy = 0;
var shiftx = 0, shifty = 0;
var initx = 0, inity = 0;
var deltax = 0, deltay = 0;
var moving = false;

class Car
{
    constructor(x, y, theta)
    {
        this.x = x;
        this.y = y;
        this.theta = theta;

        this.w = 2 * meters;
        this.l = 4 * meters;
        this.v = 0;
        this.omega = 0;
        this.turn = 0;
        this.turn_rate = 0.5;
        this.target_turn = 0;
        this.a = 0;
        this.maxdecel = 80*mph;
        this.maxaccel = 12*meters;
        this.maxvel = Infinity; // 80*mph;

        this.trailer_length = 8 * meters;
        this.trailer_angle = 0;

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

        ctx.translate(this.x, this.y);
        ctx.rotate(-this.theta)
        ctx.lineWidth = 2;
        // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE FRAME

        ctx.strokeStyle = "black";
        ctx.fillStyle = "lightgray";
        ctx.globalAlpha = 1;
        ctx.fillRect(-this.w/2, -this.l/2, this.w, this.l)
        ctx.strokeRect(-this.w/2, -this.l/2, this.w, this.l)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, this.l/2);
        ctx.stroke();

        ctx.save();
        ctx.translate(0, -this.l/2 - 5);
        ctx.rotate(this.trailer_angle)
        ctx.strokeStyle = "black";
        ctx.fillStyle = "lightgray";
        ctx.globalAlpha = 1;
        ctx.fillRect(-this.w/2, -this.trailer_length, this.w, this.trailer_length)
        ctx.strokeRect(-this.w/2, -this.trailer_length, this.w, this.trailer_length)
        ctx.restore();
        // ctx.strokeRect(-this.w/2, this.trailer_angle, this.w, 0)

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
        this.trailer_angle += (this.turn - this.trailer_angle) * dt * 4;
    }
}

function draw()
{
    setTimeout(function()
    {
        var ctx = canvas.getContext("2d");
        ctx.canvas.width = document.body.clientWidth;
        ctx.canvas.height = document.body.clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        requestAnimationFrame(draw);

        ctx.fillStyle = "black";
        ctx.globalAlpha = 1;
        ctx.font = "36px Cambria Bold";
        ctx.fillText("Traffic Simulator 2022", 30, 50);
        ctx.font = "18px Cambria";
        let th = 60;
        let dh = 25;
        ctx.fillText("Apologies; this is dumb right now.", 30, th += dh);
        ctx.fillText("Efforts are underway to make this less dumb.", 30, th += dh);
        ctx.fillText("In the meantime, enjoy this fun car driving around.", 30, th += dh);
        ctx.fillText("Look at him go, dude!", 30, th += dh);


        if (LAST_MOUSE_POSITION)
        {
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = "black";
            ctx.beginPath();
            ctx.arc(LAST_MOUSE_POSITION[0], LAST_MOUSE_POSITION[1], 5, 0, Math.PI*2);
            ctx.stroke();
            ctx.restore();
        }

        for (var c in cars)
        {
            cars[c].draw(canvas);
            cars[c].step(1/fps);

            var dx = cars[c].x - canvas.width/2;
            var dy = cars[c].y - canvas.height/2;
            var des_x = cars[c].r*Math.cos(Math.atan2(dy, dx))*30 + canvas.width/2;
            var des_y = cars[c].r*Math.sin(Math.atan2(dy, dx))*30 + canvas.height/2;

            if (seekCursor && LAST_MOUSE_POSITION)
            {
                cars[c].arrive(LAST_MOUSE_POSITION[0], LAST_MOUSE_POSITION[1]);
            }
        }

    }, 1000/fps);
}

canvas.onmousemove = function(e)
{
    let box = canvas.getBoundingClientRect();
    LAST_MOUSE_POSITION = [event.clientX - box.left, event.clientY - box.top];
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

for (var i = 0; i < 1; ++i)
{
    cars.push(new Car(Math.random()*canvas.width,
                      Math.random()*canvas.height,
                      Math.random()*2*Math.PI));
    var dx = cars[i].x - canvas.width/2;
    var dy = cars[i].y - canvas.height/2;
    cars[i].r = 7; // Math.floor(Math.random()*14) + 2;
}
draw();
