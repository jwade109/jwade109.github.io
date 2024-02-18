"use strict"

const LINKAGE_OFFSET = 3;

function Railcar(length, width, is_loco)
{
    this.length = length;
    this.width = width;
    let rgb = Math.floor(Math.random() * 60 + 150).toString(16);
    this.color = '#' + rgb + rgb + rgb;
    this.is_loco = is_loco;
}

function Train(n_cars, n_locos, width, height)
{
    this.cars = [];
    this.acc = 40;
    this.maxspeed = Math.random() * 120 + 200;
    this.vel = this.maxspeed;
    this.pos = Math.random() * 50000;
    this.dir = 1; // Math.random() < 0.5 ? 1 : -1;

    this.acc *= this.dir;

    for (let i = 0; i < n_cars + n_locos; ++i)
    {
        let l = rand(32, 41);
        if (i < n_locos)
        {
            l = rand(45, 55);
        }
        let w = Math.random() * 5 + 11;
        let c = new Railcar(l, w, i < n_locos);
        this.cars.push(c);
    }
}

Train.prototype.s_limits = function()
{
    // front, back
    return [this.pos + 200, this.pos - this.length() - 200]
}

Train.prototype.length = function()
{
    // TODO this doesn't take the linkage buffer into account
    let sum = 0;
    for (let c of this.cars)
    {
        sum += c.length + LINKAGE_OFFSET;
    }
    return sum - LINKAGE_OFFSET;
}

Train.prototype.draw = function(ctx, path)
{
    ctx.save();

    // ctx.fillStyle = "green";

    // for (let s = 0; s < this.pos; s += 50)
    // {
    //     let t = path.s_to_t(s);
    //     let p = path.evaluate(t);
    //     ctx.beginPath();
    //     ctx.arc(p[0], p[1], 2, 0, 2 * Math.PI);
    //     ctx.fill();
    // }

    let s = this.pos;
    for (let i = 0; i < this.cars.length; ++i)
    {
        let c = this.cars[i];
        s -= ((c.length / 2) * this.dir);
        let t = path.s_to_t(s);
        let p = path.evaluate(t);
        let tangent = path.tangent(t);
        let normal = rot2d(tangent, Math.PI / 2);

        if (i == 0)
        {
            ctx.fillStyle = "black";
            ctx.globalAlpha = 1;
            ctx.font = "18px Cambria Bold";
            ctx.fillText("train fountain", p[0] + 30, p[1]);
            // ctx.fillText("t = " + t.toFixed(2), p[0] + 30, p[1]);
            // ctx.fillText("s = " + s.toFixed(2), p[0] + 30, p[1] + 15);
            // ctx.fillText("v = " + this.vel.toFixed(2), p[0] + 30, p[1] + 30);
        }

        s -= ((c.length / 2 + LINKAGE_OFFSET) * this.dir);

        let l2 = mult2d(tangent, c.length / 2);
        let w2 = mult2d(normal,  c.width  / 2);

        let p1 = add2d(p, add2d(mult2d(l2,  1), mult2d(w2,  1)));
        let p2 = add2d(p, add2d(mult2d(l2,  1), mult2d(w2, -1)));
        let p3 = add2d(p, add2d(mult2d(l2, -1), mult2d(w2, -1)));
        let p4 = add2d(p, add2d(mult2d(l2, -1), mult2d(w2,  1)));

        ctx.strokeStyle = "black";
        ctx.lineWidth = 1.3;
        ctx.fillStyle = c.color;
        if (c.is_loco)
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

    // for (let s of this.s_limits())
    // {
    //     let t = path.s_to_t(s);
    //     let p = path.evaluate(t);
    //     ctx.fillStyle = "blue";
    //     ctx.beginPath();
    //     ctx.arc(p[0], p[1], 5, 0, 2 * Math.PI);
    //     ctx.fill();
    // }

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

Train.prototype.normalize = function(path)
{
    while (this.pos < 0)
    {
        this.pos += path.length();
    }
    this.pos %= path.length();
}
