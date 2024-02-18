"use strict"

const LINKAGE_OFFSET = 3;

function SmokeParticle(pos, vel, lifetime)
{
    this.pos = pos;
    this.vel = vel;
    this.lifetime = lifetime;
    this.max_lifetime = lifetime;
    this.growth_rate = rand(1.3, 2.6);
}

SmokeParticle.prototype.step = function(dt)
{
    this.pos = add2d(this.pos, mult2d(this.vel, dt));
    this.vel = mult2d(this.vel, 0.95);
    this.lifetime -= dt;
}

SmokeParticle.prototype.draw = function(ctx)
{
    let r = 4 + this.growth_rate * (this.max_lifetime - this.lifetime);
    ctx.globalAlpha = 0.6 * this.lifetime / this.max_lifetime;
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(this.pos[0], this.pos[1], r, 0, 2 * Math.PI);
    ctx.fill();
}

function Railcar(length, width, is_loco)
{
    this.length = length;
    this.width = width;
    let rgb = Math.floor(Math.random() * 60 + 150).toString(16);
    this.color = '#' + rgb + rgb + rgb;
    if (rand(0, 1) < 0.3)
    {
        this.color = "peru";
    }
    else if (rand(0, 1) < 0.4)
    {
        this.color = "sienna";
    }
    else if (rand(0, 1) < 0.05)
    {
        this.color = "saddlebrown";
    }
    else if (rand(0, 1) < 0.05)
    {
        this.color = "tan";
    }
    else if (rand(0, 1) < 0.05)
    {
        this.color = "#eeeeee";
    }
    else if (rand(0, 1) < 0.05)
    {
        this.color = "#444444";
    }
    this.is_loco = is_loco;
}

function Train(position, n_cars, width, height)
{
    this.cars = [];
    this.acc = 40;
    this.maxspeed = rand(50, 200);
    this.vel = this.maxspeed;
    this.pos = position;
    this.dir = 1; // Math.random() < 0.5 ? 1 : -1;
    this.emits_smoke = Math.random() < 0.2;
    this.has_caboose = Math.random() < 0.15;

    this.particles = [];

    this.acc *= this.dir;

    let n_locos = Math.max(1, Math.ceil(n_cars / 12));

    console.log(n_locos);

    for (let i = 0; i < n_cars + n_locos; ++i)
    {
        let l = rand(18, 25);
        let w = rand(7, 11);
        if (i < n_locos)
        {
            l = 32;
            w = 10;
        }
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

        // if (i == 0)
        // {
        //     ctx.fillStyle = "black";
        //     ctx.globalAlpha = 1;
        //     ctx.font = "18px Cambria Bold";
        //     ctx.fillText("train fountain", p[0] + 30, p[1]);
        //     ctx.fillText("t = " + t.toFixed(2), p[0] + 30, p[1]);
        //     ctx.fillText("s = " + s.toFixed(2), p[0] + 30, p[1] + 15);
        //     ctx.fillText("v = " + this.vel.toFixed(2), p[0] + 30, p[1] + 30);
        // }

        s -= ((c.length / 2 + LINKAGE_OFFSET) * this.dir);

        if (i + 1 < this.cars.length)
        {
            let t_link = path.s_to_t(s);
            let p_link = path.evaluate(t_link);
            render2d(p_link, ctx, 3, "black", 0.5);
        }

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
            if (this.emits_smoke)
            {
                ctx.fillStyle = "lightsalmon";
            }
        }

        if (this.has_caboose && i + 1 == this.cars.length)
        {
            ctx.fillStyle = "red";
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

    for (let part of this.particles)
    {
        part.draw(ctx);
    }

    ctx.restore();
}

Train.prototype.step = function(dt, path)
{
    if (Math.abs(this.vel) < this.maxspeed)
    {
        this.vel += this.acc * dt;
    }
    this.pos += this.vel * dt;

    let t = path.s_to_t(this.pos - 20);
    let p = path.evaluate(t);
    let u = path.tangent(t);

    let train_v = mult2d(u, this.vel);
    train_v[0] += rand(-10, 10);
    train_v[1] += rand(-10, 10);

    if (this.emits_smoke)
    {
        let s = new SmokeParticle(p, train_v, rand(3, 5));
        this.particles.push(s);
    }

    for (let part of this.particles)
    {
        part.step(dt);
    }

    this.particles = this.particles.filter(p => p.lifetime > 0);
}

Train.prototype.normalize = function(path)
{
    while (this.pos < 0)
    {
        this.pos += path.length();
    }
    this.pos %= path.length();
}
