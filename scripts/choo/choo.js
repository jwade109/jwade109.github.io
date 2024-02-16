"use strict"

const LINKAGE_RADIUS = 2;
const LINKAGE_OFFSET = 2;

function Railcar(pos, length, width, theta)
{
    this.pos = pos;
    this.length = length;
    this.width = width;
    this.theta = theta;
}

Railcar.prototype.linkages = function(dt)
{
    let d = rot2d([LINKAGE_OFFSET + this.length / 2, 0], this.theta);
    return [add2d(this.pos, d), sub2d(this.pos, d)];
}

Railcar.prototype.moveTowards = function(linkage, theta)
{
    let front = this.linkages()[1];

    let d = sub2d(linkage, front);
    let r = sub2d(front, this.pos);

    let m = cross2d(r, d);
    let du = unit2d(d);
    let mag = norm2d(d);

    let step = mag * 0.8;
    // if (mag < LINKAGE_RADIUS)
    // {
    //     step = 0;
    // }

    if (step > 0)
    {
        this.pos = add2d(this.pos, mult2d(du, step));
    }

    this.theta -= m * 0.001;
    if (theta === undefined)
    {
        return;
    }

    let dtheta = theta - this.theta;
    if (Math.abs(dtheta) > 0.5)
    {
        this.theta += dtheta * 0.1;
    }
}

Railcar.prototype.draw = function(ctx)
{
    ctx.save();

    let l2 = this.length / 2;
    let w2 = this.width / 2;

    let p1 = add2d(this.pos, rot2d([ l2,  w2], this.theta))
    let p2 = add2d(this.pos, rot2d([-l2,  w2], this.theta))
    let p3 = add2d(this.pos, rot2d([-l2, -w2], this.theta))
    let p4 = add2d(this.pos, rot2d([ l2, -w2], this.theta))

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.fillStyle = "lightgray";
    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.lineTo(p3[0], p3[1]);
    ctx.lineTo(p4[0], p4[1]);
    ctx.lineTo(p1[0], p1[1]);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "green";
    ctx.lineWidth = 1;
    for (let l of this.linkages())
    {
        ctx.beginPath();
        ctx.arc(l[0], l[1], LINKAGE_RADIUS, 0, 2 * Math.PI);
        ctx.stroke();
    }

    ctx.restore();
}

function Train(cars)
{
    this.cars = cars;

    // TODO
    this.cars = [];
    for (let i = 0; i < Math.random() * 70 + 20; ++i)
    {
        let x = Math.random() * 900 + 200;
        let y = Math.random() * 600 + 100;
        let l = Math.random() * 10 + 20;
        let w = Math.random() * 5 + 10;
        let a = Math.random() * Math.PI / 2;
        let c = new Railcar([x, y], l, w, a);
        this.cars.push(c);
    }
}

Train.prototype.draw = function(ctx)
{
    ctx.save();

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;

    for (let i = 0; i < this.cars.length; ++i)
    {
        let c = this.cars[i];
        c.draw(ctx);
        // ctx.fillStyle = "black";
        // ctx.globalAlpha = 1;
        // ctx.font = "12px Cambria Bold";
        // ctx.fillText(i, c.pos[0], c.pos[1]);
    }

    for (let i = 0; i + 1 < this.cars.length; ++i)
    {
        let c1 = this.cars[i];
        let c2 = this.cars[i+1];

        let [l1, l2] = c1.linkages();
        let [l3, l4] = c2.linkages();

        ctx.beginPath();
        ctx.moveTo(l2[0], l2[1]);
        ctx.lineTo(l3[0], l3[1]);
        ctx.stroke();
    }

    ctx.restore();
}

Train.prototype.step = function(dt)
{
    for (let i = this.cars.length - 1; i > 0; --i)
    {
        let front = this.cars[i];
        let back = this.cars[i-1];

        let [l1, l2] = front.linkages();

        back.moveTowards(l1, front.theta);
    }
}
