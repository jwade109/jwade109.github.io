"use strict"

const LINKAGE_RADIUS = 2;
const LINKAGE_OFFSET = 2;

function Railcar(length, width)
{
    this.length = length;
    this.width = width;
    let rgb = Math.floor(Math.random() * 60 + 150).toString(16);
    this.color = '#' + rgb + rgb + rgb;
}

function Train(n_cars, center, rx, ry)
{
    this.cars = [];
    this.acc = Math.random() * 30 + 2;
    this.maxspeed = Math.random() * 120 + 30;
    this.vel = Math.random() * this.maxspeed - this.maxspeed / 2;
    this.pos = Math.random() * 5000;
    this.dir = Math.random() < 0.5 ? 1 : -1;

    this.acc *= this.dir;

    let pts = [];

    let n = 100;

    for (let i = 0; i < n; ++i)
    {
        let a = i * Math.PI * 2 / (n - 1);
        let x = Math.cos(a) * rx + center[0];
        let y = Math.sin(a) * ry + center[1];
        pts.push([x, y]);
    }

    this.path = new Polyline(pts);

    for (let i = 0; i < n_cars; ++i)
    {
        let l = Math.random() * 7 + 32;
        let w = Math.random() * 5 + 11;
        let c = new Railcar(l, w);
        this.cars.push(c);
    }
}

Train.prototype.draw = function(ctx)
{
    ctx.save();

    this.path.draw(ctx);

    let s = this.pos;
    for (let i = 0; i < this.cars.length; ++i)
    {
        let c = this.cars[i];
        let t = this.path.s_to_t(s);
        let p = this.path.evaluate(t);
        let tangent = this.path.tangent(t);
        let normal = rot2d(tangent, Math.PI / 2);

        s -= ((c.length + 5) * this.dir);

        let l2 = mult2d(tangent, c.length / 2);
        let w2 = mult2d(normal,  c.width  / 2);

        let p1 = add2d(p, add2d(mult2d(l2,  1), mult2d(w2,  1)));
        let p2 = add2d(p, add2d(mult2d(l2,  1), mult2d(w2, -1)));
        let p3 = add2d(p, add2d(mult2d(l2, -1), mult2d(w2, -1)));
        let p4 = add2d(p, add2d(mult2d(l2, -1), mult2d(w2,  1)));

        ctx.strokeStyle = "black";
        ctx.lineWidth = 1.3;
        ctx.fillStyle = c.color;
        if (i == 0)
        {
            ctx.fillStyle = "lightblue"
        }
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.lineTo(p3[0], p3[1]);
        ctx.lineTo(p4[0], p4[1]);
        ctx.lineTo(p1[0], p1[1]);
        ctx.fill();
        ctx.stroke();
    }

    ctx.restore();
}

Train.prototype.step = function(dt)
{
    if (Math.abs(this.vel) < this.maxspeed)
    {
        this.vel += this.acc * dt;
    }
    this.pos += this.vel * dt;
}
