"use strict";

var WIDTH = document.body.clientWidth;
var HEIGHT = document.body.scrollHeight;

let NOMINAL_FRAMERATE = 30;
let NOMINAL_DT = 1 / NOMINAL_FRAMERATE;
let LAST_MOUSE_POSITION = null;
let PAUSED = false;
let STEPS = 0;

let VELOCITY_RENDER_SCALE = 0.5;

function AABB(u, v)
{
    let xmin = Math.min(u[0], v[0]);
    let xmax = Math.max(u[0], v[0]);
    let ymin = Math.min(u[1], v[1]);
    let ymax = Math.max(u[1], v[1]);

    this.p1 = [xmin, ymin];
    this.p2 = [xmax, ymax];
}

AABB.prototype.draw = function(ctx)
{
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(this.p1[0], this.p1[1]);
    ctx.lineTo(this.p1[0], this.p2[1]);
    ctx.lineTo(this.p2[0], this.p2[1]);
    ctx.lineTo(this.p2[0], this.p1[1]);
    ctx.lineTo(this.p1[0], this.p1[1]);
    ctx.stroke();
}

function Ball(id, pos, radius)
{
    this.id = id;
    this.pos = pos;
    this.vel = [Math.random() * 700 - 350, Math.random() * 700 - 350];
    this.radius = radius;
    this.mass = radius * radius;
    this.accels = [];
}

Ball.prototype.draw = function(ctx)
{
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(this.pos[0], this.pos[1], this.radius, 0, 2 * Math.PI);
    ctx.stroke();

    let v = add2d(this.pos, mult2d(this.vel, VELOCITY_RENDER_SCALE));

    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "green";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(this.pos[0], this.pos[1]);
    ctx.lineTo(v[0], v[1]);
    ctx.stroke();

    this.aabb().draw(ctx);
}

Ball.prototype.collidesBall = function(ball)
{
    let d = mag2d(sub2d(this.pos, ball.pos));
    return d < (this.radius + ball.radius);
}

Ball.prototype.collidesWall = function(wall)
{
    let d = sub2d(wall.p2, wall.p1);
    let f = sub2d(wall.p1, this.pos);

    let a = dot2d(d, d);
    let b = 2 * dot2d(f, d);
    let c = dot2d(f, f) - this.radius * this.radius;
    let disc = b*b-4*a*c;
    if (disc < 0)
    {
        return [false];
    }

    disc = Math.sqrt(disc);

    let t1 = (-b - disc) / (2 * a);
    let t2 = (-b + disc) / (2 * a);

    let u1 = add2d(wall.p1, mult2d(d, t1));
    let u2 = add2d(wall.p1, mult2d(d, t2));

    if (t1 >= 0 && t1 <= 1)
    {
        return [true, u1, u2];
    }

    if (t2 >= 0 && t2 <= 1)
    {
        return [true, u1, u2];
    }

    return [false];
}

Ball.prototype.aabb = function(ball)
{
    return new AABB(
        [this.pos[0] - this.radius, this.pos[1] - this.radius],
        [this.pos[0] + this.radius, this.pos[1] + this.radius]
    );
}

Ball.prototype.step = function(dt)
{
    for (let acc of this.accels)
    {
        this.vel = add2d(this.vel, mult2d(acc, dt));
    }
    this.accels = [];

    this.pos = add2d(this.pos, mult2d(this.vel, dt));
}

function Reflector(p1, p2)
{
    this.p1 = p1;
    this.p2 = p2;
}

Reflector.prototype.draw = function(ctx)
{
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(this.p1[0], this.p1[1]);
    ctx.lineTo(this.p2[0], this.p2[1]);
    ctx.stroke();

    this.aabb().draw(ctx);
}

Reflector.prototype.aabb = function()
{
    return new AABB(this.p1, this.p2);
}

function BallBallCollision(ball_a, ball_b)
{
    this.ball_a = ball_a;
    this.ball_b = ball_b;
    this.pointing = unit2d(sub2d(this.ball_b.pos, this.ball_a.pos));
    this.relative_vel = sub2d(this.ball_a.vel, this.ball_b.vel);
    this.dot = dot2d(this.pointing, unit2d(this.relative_vel));
    this.active = this.dot > 0;

    let fvela = vproj2d(this.pointing, this.ball_a.vel);
    let fvelb = vproj2d(this.pointing, this.ball_b.vel);
    let rvela = vrej2d(this.pointing, this.ball_a.vel);
    let rvelb = vrej2d(this.pointing, this.ball_b.vel);

    this.new_vel_a = add2d(rvela, mult2d(fvela, -1));
    this.new_vel_b = add2d(rvelb, mult2d(fvelb, -1));
}

BallBallCollision.prototype.draw = function(ctx)
{
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(this.ball_a.pos[0], this.ball_a.pos[1]);
    ctx.lineTo(this.ball_b.pos[0], this.ball_b.pos[1]);
    ctx.stroke();

    ctx.strokeStyle = "blue";
    ctx.beginPath();
    let u = add2d(this.ball_a.pos, mult2d(this.new_vel_a, VELOCITY_RENDER_SCALE));
    ctx.moveTo(this.ball_a.pos[0], this.ball_a.pos[1]);
    ctx.lineTo(u[0], u[1]);
    ctx.stroke();

    ctx.beginPath();
    let v = add2d(this.ball_b.pos, mult2d(this.new_vel_b, VELOCITY_RENDER_SCALE));
    ctx.moveTo(this.ball_b.pos[0], this.ball_b.pos[1]);
    ctx.lineTo(v[0], v[1]);
    ctx.stroke();
}

function BallReflectorCollision(ball, wall, p1, p2)
{
    this.ball = ball;
    this.wall = wall;
    this.p1 = p1;
    this.p2 = p2;

    let u = mult2d(add2d(this.p1, this.p2), 0.5);
    this.pointing = unit2d(sub2d(this.ball.pos, u));
    this.active = dot2d(this.pointing, this.ball.vel) < 0;

    let fvel = vproj2d(this.pointing, this.ball.vel);
    let rvel = vrej2d(this.pointing, this.ball.vel);

    if (norm2d(fvel) < 30)
    {
        fvel = mult2d(unit2d(fvel), 50);
    }

    this.new_vel = add2d(rvel, mult2d(fvel, -1));
}

BallReflectorCollision.prototype.draw = function(ctx)
{
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 1;

    let u = mult2d(add2d(this.p1, this.p2), 0.5);

    ctx.beginPath();
    ctx.arc(this.p1[0], this.p1[1], 2, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.p2[0], this.p2[1], 2, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(u[0], u[1], 3, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.ball.pos[0], this.ball.pos[1]);
    ctx.lineTo(u[0], u[1]);
    ctx.stroke();

    ctx.strokeStyle = "blue";
    ctx.beginPath();
    let v = add2d(this.ball.pos, mult2d(this.new_vel, VELOCITY_RENDER_SCALE));
    ctx.moveTo(this.ball.pos[0], this.ball.pos[1]);
    ctx.lineTo(v[0], v[1]);
    ctx.stroke();
}

function Physics(width, height)
{
    this.reflectors = [];
    this.balls = [];
    this.ball_ball_collisions = [];
    this.ball_wall_collisions = [];

    for (let i = 0; i < 30; i++)
    {
        let x = width  * Math.random();
        let y = height * Math.random();
        let r = 30 * Math.random() + 20;
        this.balls.push(new Ball(i, [x, y], r));
    }

    for (let i = 0; i < 2; i++)
    {
        let x1 = width  * Math.random();
        let y1 = height * Math.random();
        let x2 = width  * Math.random();
        let y2 = height * Math.random();
        this.reflectors.push(new Reflector([x1, y1], [x2, y2]));
    }

    this.reflectors.push(new Reflector(
        [10, 0], [10, height]
    ));
    this.reflectors.push(new Reflector(
        [width - 10, 0], [width - 10, height]
    ));
    this.reflectors.push(new Reflector(
        [0, 10], [width, 10]
    ));
    this.reflectors.push(new Reflector(
        [0, height - 10], [width, height - 10]
    ));
}

Physics.prototype.draw = function(ctx)
{
    for (let b of this.balls)
    {
        b.draw(ctx);
    }
    for (let r of this.reflectors)
    {
        r.draw(ctx);
    }
    for (let c of this.ball_ball_collisions)
    {
        c.draw(ctx);
    }
    for (let c of this.ball_wall_collisions)
    {
        c.draw(ctx);
    }
}

Physics.prototype.ke = function()
{
    // assuming each ball has a mass of 1
    let ke = 0;
    for (let b of this.balls)
    {
        let v = norm2d(b.vel);
        ke += 0.5 * b.mass * v * v;
    }
    return ke;
}

const ACCELERATION_DUE_TO_GRAVITY = 0;

Physics.prototype.step = function(dt)
{
    for (let c of this.ball_ball_collisions)
    {
        if (!c.active)
        {
            continue;
        }

        this.balls[c.ball_a.id].vel = mult2d(c.new_vel_a, 1);
        this.balls[c.ball_b.id].vel = mult2d(c.new_vel_b, 1);
    }

    for (let c of this.ball_wall_collisions)
    {
        if (!c.active)
        {
            continue;
        }

        this.balls[c.ball.id].vel = c.new_vel;
    }

    this.ball_ball_collisions = [];
    this.ball_wall_collisions = [];

    for (let b of this.balls)
    {
        b.accels.push([0, ACCELERATION_DUE_TO_GRAVITY]);
        b.step(dt);
    }

    for (let i in this.balls)
    {
        for (let j in this.balls)
        {
            if (i >= j)
            {
                continue;
            }

            let bi = this.balls[i];
            let bj = this.balls[j];

            if (bi.collidesBall(bj))
            {
                let c = new BallBallCollision(bi, bj);
                this.ball_ball_collisions.push(c);
            }
        }
    }

    for (let b of this.balls)
    {
        for (let r of this.reflectors)
        {
            let res = b.collidesWall(r);
            if (res[0])
            {
                let c = new BallReflectorCollision(b, r, res[1], res[2]);
                this.ball_wall_collisions.push(c);
            }
        }
    }
}

document.addEventListener('mousemove', function(event)
{
    var box = canvas.getBoundingClientRect();
    LAST_MOUSE_POSITION = [event.clientX - box.left, event.clientY - box.top];
});

let physics = new Physics(document.body.clientWidth, document.body.clientHeight);

function draw(ctx)
{
    ctx.font = "36px Cambria Bold";
    ctx.fillText("Suika", 30, 50);
    ctx.font = "24px Cambria Bold";
    ctx.fillText("KE: " + physics.ke(), 30, 100);

    physics.draw(ctx);
}

function update(previous, now, frame_number)
{
    const dt = now - previous;
    const update_start = new Date().getTime() / 1000;

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.canvas.width = document.body.clientWidth;
    ctx.canvas.height = document.body.clientHeight;

    let ministeps = 20;

    if (!PAUSED)
    {
        STEPS = 0;
        for (let i = 0; i < ministeps; ++i)
        {
            physics.step(NOMINAL_DT / ministeps);
        }
    }
    else if (STEPS > 0)
    {
        physics.step(NOMINAL_DT / ministeps);
        STEPS -= 1;
    }

    ctx.save();
    draw(ctx);
    ctx.restore();

    const update_end = new Date().getTime() / 1000;
    const real_dt = update_end - update_start;
}

document.addEventListener('keypress', function(event)
{
    console.log(event);
    if (event.code == "Space")
    {
        PAUSED = !PAUSED;
    }
    if (event.code == "KeyS")
    {
        console.log(STEPS);
        STEPS += 1;
    }
});

const START_TIME = new Date().getTime() / 1000;
let previous = null;
let frame_number = 0;

var gameloop = setInterval(function()
{
    let now = new Date().getTime() / 1000 - START_TIME;
    if (previous != null)
    {
        update(previous, now, frame_number)
        frame_number++;
    }
    previous = now;

}, NOMINAL_DT * 1000);
