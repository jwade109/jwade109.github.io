
LAST_MOUSE_POSITION = null;

PIXELS_PER_METER = 9; // pixels per meter
PPS_PER_MPH = PIXELS_PER_METER/2.23694; // pixels/s per mph

var cars = [];
var fps = 50;
var canvas = document.getElementById("canvas");
canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;

const CAR_TURN_RATE = 0.5;

function clamp(x, min, max)
{
    if (x > max) return max;
    if (x < min) return min;
    return x;
}

class Car
{
    constructor(x, y, theta)
    {
        this.pos = [x, y];
        this.theta = theta;

        this.history = [[], [], [], []]

        this.target_v = 0;
        this.target_turn_angle = 0;

        this.size = [4 * PIXELS_PER_METER, 10 * PIXELS_PER_METER];
        this.v = 0;
        this.omega = 0;
        this.turn_angle = 0;
        this.a = 0;
    }

    pointing_x(len=1)
    {
        return mult2d([Math.sin(this.theta), Math.cos(this.theta)], len);
    }

    pointing_y(len=1)
    {
        return mult2d([-Math.cos(this.theta), Math.sin(this.theta)], len);
    }

    draw(ctx)
    {
        ctx.save();
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

        ctx.translate(this.pos[0], this.pos[1]);
        ctx.rotate(-this.theta)
        // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE FRAME

        // ctx.save();
        // ctx.translate(0, -this.size[1]/2 - 5);
        // ctx.rotate(this.trailer_angle)
        // ctx.strokeRect(-this.size[0]/2, -this.trailer_length, this.size[0], this.trailer_length)
        // ctx.restore();
        // ctx.strokeRect(-this.size[0]/2, this.trailer_angle, this.size[0], 0)

        function draw_wheel(car, x, y, rotate)
        {
            ctx.save();
            ctx.translate(x, y);
            if (rotate)
            {
                ctx.rotate(-car.turn_angle);
            }
            const w = car.size[0]/4;
            const l = car.size[1]/4;

            ctx.fillRect(-w/2, -l/2, w, l)

            // ctx.globalAlpha = 0.1;
            // draw_line_list(ctx, [[-500, 0], [500, 0]]);

            ctx.restore();
        }

        ctx.fillStyle = "black";
        draw_wheel(this,  this.size[0]/2,  this.size[1]/2.7, true);
        draw_wheel(this, -this.size[0]/2,  this.size[1]/2.7, true);
        draw_wheel(this,  this.size[0]/2, -this.size[1]/2.7, false);
        draw_wheel(this, -this.size[0]/2, -this.size[1]/2.7, false);

        ctx.fillStyle = "white";
        ctx.fillRect(-this.size[0]/2, -this.size[1]/2, this.size[0], this.size[1])
        ctx.strokeRect(-this.size[0]/2, -this.size[1]/2, this.size[0], this.size[1])
        ctx.strokeRect(-this.size[0]/2.6, -this.size[1]*0.3, this.size[0]/1.3, this.size[1]*0.4)
        ctx.strokeRect(-this.size[0]/2.6, -this.size[1]*0.4, this.size[0]/1.3, this.size[1]*0.7)

        ctx.restore();
    }

    velocity()
    {
        const beta = this.turn_angle / 2; // TODO this isn't right
        const a = this.theta + beta;
        return mult2d([Math.sin(a), Math.cos(a)], this.v);
    }

    target_velocity()
    {
        const beta = this.target_turn_angle / 2; // TODO this isn't right
        const a = this.theta + beta;
        return mult2d([Math.sin(a), Math.cos(a)], this.target_v);
    }

    sideslip_angle()
    {

    }

    step(dt, ctx)
    {
        let wheels = [
            [ this.size[0]/2,  this.size[1]/2.7],
            [-this.size[0]/2,  this.size[1]/2.7],
            [ this.size[0]/2, -this.size[1]/2.7],
            [-this.size[0]/2, -this.size[1]/2.7]
        ];

        for (let i = 0; i < 4; ++i)
        {
            let u = wheels[i].slice();
            u = add2d(rot2d(u, this.theta), [this.pos[0], this.pos[1]]);
            this.history[i].push(u);
            const n = 600;
            if (this.history[i].length > n)
            {
                this.history[i] = this.history[i].slice(-n);
            }
        }

        renderv2d(this.pos, this.target_velocity(), ctx, 2, "green");
        renderv2d(this.pos, this.velocity(), ctx, 2, "red");

        const vel_vector = this.velocity();

        this.a = (this.target_v - this.v) * dt * 200;
        this.v += this.a * dt;
        this.pos = add2d(this.pos, mult2d(vel_vector, dt));

        this.turn_rate = (this.target_turn_angle - this.turn_angle) * dt * 200;
        this.turn_angle += this.turn_rate * dt;

        const theta_dot = this.v * Math.tan(this.turn_angle) / this.size[1];
        this.theta += theta_dot * dt;
    }
}

function get_path_plan(start, end, start_dir=[0, 0], end_dir=[0, 0])
{
    const d = distance(start, end);
    const middle = add2d(start, mult2d(start_dir, d));
    return new BezierCurve([start.slice(), middle, end.slice()]);
}

function draw()
{
    setTimeout(function()
    {
        let ctx = canvas.getContext("2d");
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
        ctx.fillText("Velocity: " + Math.round(cars[0].v)
            + " / " + Math.round(cars[0].target_v), 30, th += dh);
        ctx.fillText("Turn angle: " + Math.round(cars[0].turn_angle * 180 / Math.PI)
            + " / " + Math.round(cars[0].target_turn_angle * 180 / Math.PI), 30, th += dh);

        ctx.save();
        ctx.globalAlpha = 0.4;
        draw_line_list(ctx,
            [[canvas.width/2, 0], [canvas.width/2, canvas.height]])
        draw_line_list(ctx,
            [[0, canvas.height/2], [canvas.width, canvas.height/2]])
        ctx.restore();

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

        let input = [0, 0];

        for (let c in cars)
        {
            cars[c].target_v = 0;
            cars[c].target_turn_angle = 0;

            if (LAST_MOUSE_POSITION != null)
            {
                const center = [canvas.width/2, canvas.height/2];
                input = sub2d(LAST_MOUSE_POSITION, center);

                renderv2d(center, input, ctx, 2, "red");
                renderv2d(center, [0, input[1]], ctx, 2, "black");
                renderv2d(center, [input[0], 0], ctx, 2, "black");

                const k1 = 1.2 / canvas.width;
                const k2 = 900 / canvas.height;

                cars[c].target_turn_angle = -input[0] * k1;
                cars[c].target_v          = -input[1] * k2;

                const ss_repr = add2d([-cars[c].turn_angle / k1, -cars[c].v / k2], center);
                console.log(ss_repr);
                render2d(ss_repr, ctx, 3, "grey");
            }

            cars[c].draw(ctx);
            cars[c].step(1/fps, ctx);
        }

        function map_01(axis, sign)
        {
            const s = [canvas.width, canvas.height];
            return clamp(input[axis]*sign / s[axis], 0, 1);
        }

        function do_label_text(text, x, y, axis, sign)
        {
            ctx.save();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.globalAlpha = map_01(axis, sign) * 0.7 + 0.3;
            const size = map_01(axis, sign) * 40 + 15;
            console.log(size);
            ctx.font = "bold " + size + "px Helvetica";
            ctx.fillText(text, x, y);
        }

        do_label_text("FORWARDS",  canvas.width*0.50, canvas.height*0.25, 1, -1);
        do_label_text("BACKWARDS", canvas.width*0.50, canvas.height*0.75, 1,  1);
        do_label_text("LEFT",      canvas.width*0.25, canvas.height*0.50, 0, -1);
        do_label_text("RIGHT",     canvas.width*0.75, canvas.height*0.50, 0,  1);

    }, 1000/fps);
}

canvas.onmousemove = function(e)
{
    let box = canvas.getBoundingClientRect();
    LAST_MOUSE_POSITION = [event.clientX - box.left, event.clientY - box.top];
}

for (var i = 0; i < 1; ++i)
{
    // cars.push(new Car(Math.random()*canvas.width,
    //                   Math.random()*canvas.height,
    //                   Math.random()*2*Math.PI));
    cars.push(new Car(canvas.width/2, canvas.height/2, 0));
}
draw();
