
function Polyline(points, spacing)
{
    this.points = points;
    this.lengths = [0];
    this.length = 0;
    for (let i = 0; i + 1 < this.points.length; ++i)
    {
        let d = distance(this.points[i], this.points[i+1]);
        this.length += d;
        this.lengths.push(this.length);
    }
}

Polyline.prototype.evaluate = function(t)
{
    while (t < 0) // TODO shouldn't be a while loop
    {
        t += 1;
    }
    t = t % 1.0;
    let n = this.points.length - 1;
    let i = Math.floor(n * t);
    let j = i + 1;
    let ti = i / n;
    let tj = j / n;
    let tt = (t - ti) / (tj - ti);
    return lerp2d(this.points[i], this.points[i+1], tt);
}

Polyline.prototype.tangent = function(t)
{
    while (t < 0) // TODO shouldn't be a while loop
    {
        t += 1;
    }
    t = t % 1.0;
    let n = this.points.length - 1;
    let i = Math.floor(n * t);
    let j = i + 1;
    return unit2d(sub2d(this.points[j], this.points[i]));
}

Polyline.prototype.s_to_t = function(s)
{
    while (s < this.length) // TODO shouldn't be a while loop
    {
        s += this.length;
    }
    s = s % this.length;
    let n = this.points.length - 1;

    let left = 0;
    let right = n;
    while (left + 1 < right)
    {
        let i = Math.floor((left + right) / 2);
        let s_test = this.lengths[i];
        if (s >= s_test)
        {
            left = i;
        }
        else if (s <= s_test)
        {
            right = i;
        }
        else
        {
            break;
        }
    }

    let ls = this.lengths[left];
    let rs = this.lengths[right];
    let tt = (s - ls) / (rs - ls);
    let ti = left / n;
    return tt / n + ti;
}

Polyline.prototype.nearestHandle = function(pos)
{
    return nearest_point(this.points, pos);
}

Polyline.prototype.nearestPoint = function(pos)
{
    let nh = this.nearestHandle(pos);
    let index = nh[0];
    let handle = this.points[index];
    let n = 500;
    let dist = Number.MAX_VALUE;
    let best = pos;
    let best_t = 0;
    for (let t = 0; t <= n; t++)
    {
        let p = this.evaluate(t/n);
        let d = distance(p, pos);
        if (d < dist)
        {
            dist = d;
            best = p;
            best_t = t/n;
        }
    }
    return [best, best_t];
}

Polyline.prototype.draw = function(ctx)
{
    ctx.save();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    for (let i = 0; i < this.points.length; i++)
    {
        let pos = this.points[i];
        if (i == 0)
        {
            ctx.moveTo(pos[0], pos[1]);
        }
        else
        {
            ctx.lineTo(pos[0], pos[1]);
        }
    }
    ctx.stroke();

    ctx.lineWidth = 2;
    for (let s = 0; s <= this.length; s += 8)
    {
        let t = this.s_to_t(s);
        let p = this.evaluate(t);
        let normal = mult2d(rot2d(this.tangent(t), Math.PI / 2), 4);

        let u = add2d(p, normal);
        let v = sub2d(p, normal);

        ctx.beginPath();
        ctx.moveTo(u[0], u[1]);
        ctx.lineTo(v[0], v[1]);
        ctx.stroke();
    }

    ctx.restore();
}