
LAST_MOUSE_POSITION = null;

PIXELS_PER_METER = 9; // pixels per meter
PPS_PER_MPH = PIXELS_PER_METER/2.23694; // pixels/s per mph

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
        this.history = [[], [], [], []]

        this.w = 4 * PIXELS_PER_METER;
        this.l = 10 * PIXELS_PER_METER;
        this.v = 0;
        this.omega = 0;
        this.turn = 0;
        this.turn_rate = 0.5;
        this.target_turn = 0;
        this.wheel_angle = 0;
        this.a = 0;
        this.maxdecel = 80 * PPS_PER_MPH;
        this.maxaccel = 12 * PIXELS_PER_METER;
        this.maxvel = Infinity; // 80*mph;

        this.trailer_length = 20 * PIXELS_PER_METER;
        this.trailer_angle = 0;

        this.velocity = [0, 0];

        this.collision_radius = 5*PIXELS_PER_METER;

        this.forces = [];
        this.heading = [Math.sin(this.theta), Math.cos(this.theta)];
    }

    draw(canvas)
    {
        var ctx = canvas.getContext("2d");

        ctx.save(); // save global reference frame

        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";
        ctx.lineWidth = 7;

        for (let i = 0; i < 4; ++i)
        {
            let alphas = [];
            for (let j = 0; j < this.history[i].length; ++j)
            {
                let a = 0.5 * j / this.history[i].length;
                alphas.push(a);
            }
            draw_line_list(ctx, this.history[i], alphas);
        }

        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;

        ctx.translate(shiftx, shifty);

        ctx.translate(this.x, this.y);
        ctx.rotate(-this.theta)
        // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE FRAME

        // ctx.save();
        // ctx.translate(0, -this.l/2 - 5);
        // ctx.rotate(this.trailer_angle)
        // ctx.strokeRect(-this.w/2, -this.trailer_length, this.w, this.trailer_length)
        // ctx.restore();
        // ctx.strokeRect(-this.w/2, this.trailer_angle, this.w, 0)

        function draw_wheel(car, x, y, is_front)
        {
            ctx.save();
            ctx.translate(x, y);
            if (is_front)
            {
                ctx.rotate(-car.wheel_angle/2.3);
            }
            const w = car.w/4;
            const l = car.l/4;

            ctx.fillRect(-w/2, -l/2, w, l)
            ctx.restore();
        }

        ctx.fillStyle = "black";
        draw_wheel(this,  this.w/2,  this.l/2.7, true);
        draw_wheel(this, -this.w/2,  this.l/2.7, true);
        draw_wheel(this,  this.w/2, -this.l/2.7, false);
        draw_wheel(this, -this.w/2, -this.l/2.7, false);

        ctx.fillStyle = "white";
        ctx.fillRect(-this.w/2, -this.l/2, this.w, this.l)
        ctx.strokeRect(-this.w/2, -this.l/2, this.w, this.l)
        ctx.strokeRect(-this.w/2.6, -this.l*0.3, this.w/1.3, this.l*0.4)
        ctx.strokeRect(-this.w/2.6, -this.l*0.4, this.w/1.3, this.l*0.7)
        // ctx.strokeRect(-this.w/2.6, this.l*0.1, this.w/1.3, this.l*0.2)
        // ctx.strokeRect(-this.w/2.6, -this.l*0.4, this.w/1.3, this.l*0.1)

        ctx.restore();
    }

    arrive(px, py)
    {
        if (Math.abs(px - this.x) > this.w ||
            Math.abs(py - this.y) > this.w)
            this.forces.push([px - this.x, py - this.y]);
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
        let wheels = [
            [ this.w/2,  this.l/2.7],
            [-this.w/2,  this.l/2.7],
            [ this.w/2, -this.l/2.7],
            [-this.w/2, -this.l/2.7]
        ];

        for (let i = 0; i < 4; ++i)
        {
            let u = wheels[i].slice();
            u = add2d(rot2d(u, this.theta), [this.x, this.y]);
            this.history[i].push(u);
            const n = 600;
            if (this.history[i].length > n)
            {
                this.history[i] = this.history[i].slice(-n);
            }
        }

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

        this.heading = [Math.sin(this.theta), Math.cos(this.theta)];

        this.forces = [];
        this.trailer_angle += (this.turn - this.trailer_angle) * dt * 4;

        const dot = dot2d(this.velocity, this.heading);
        const signed_turn = dot < 0 ? -this.turn : this.turn;
        this.wheel_angle += (signed_turn - this.wheel_angle) * dt * 4;
    }
}

function draw_line_list(ctx, points, alphas=[])
{
    if (points.length < 2)
    {
        return;
    }

    ctx.save();
    if (alphas)
    {
        for (let i = 0; i < points.length - 1; ++i)
        {
            let p = points[i];
            let q = points[i+1];
            let a = alphas[i];
            ctx.globalAlpha = a;
            ctx.beginPath();
            ctx.moveTo(p[0], p[1]);
            ctx.lineTo(q[0], q[1]);
            ctx.stroke();
        }
    }
    else
    {
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; ++i)
        {
            ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.stroke();
    }
    ctx.restore();
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

            if (LAST_MOUSE_POSITION)
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
