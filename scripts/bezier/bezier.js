
function BezierCurve(handles)
{
    this.handles = handles;
}

function collapse_once(elements, s)
{
    if (elements.length < 2)
    {
        return elements;
    }

    let results = []
    for (let i = 0; i + 1 < elements.length; i++)
    {
        let first = elements[i];
        let second = elements[i+1];
        let middle = lerp2d(first, second, s);
        results.push(middle)
    }
    return results;
}

let FACTORIAL_CACHE = [/* 0! = */ 1, /* 1! = */ 1, /* 2! = */ 2];

function factorial(n)
{
    while (FACTORIAL_CACHE.length < n + 1)
    {
        const x = FACTORIAL_CACHE[FACTORIAL_CACHE.length - 1];
        const y = FACTORIAL_CACHE.length;
        FACTORIAL_CACHE.push(x*y)
    }
    return FACTORIAL_CACHE[n];
}

function n_choose_k(n, k)
{
    // expects that n >= k >= 0
    return factorial(n) / (factorial(k) * factorial(n - k));
}

BezierCurve.prototype.evaluate = function(t)
{
    let sum = [0, 0]
    let n = this.handles.length - 1;
    for (let i = 0; i <= n; i++)
    {
        const scalar = n_choose_k(n, i) * Math.pow((1 - t), n - i) * Math.pow(t, i);
        const vector = this.handles[i];
        sum = add2d(sum, mult2d(vector, scalar));
    }
    return sum;
}

BezierCurve.prototype.nearestHandle = function(pos)
{
    return nearest_point(this.handles, pos);
}

BezierCurve.prototype.nearestPoint = function(pos)
{
    let nh = this.nearestHandle(pos);
    let index = nh[0];
    let handle = this.handles[index];
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

BezierCurve.prototype.render = function(ctx)
{
    ctx.save();
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < this.handles.length; i++)
    {
        let pos = this.handles[i];
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
    ctx.beginPath();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    let n = 500;
    for (let t = 0; t <= n; t++)
    {
        let pos = this.evaluate(t/n);
        if (t == 0)
        {
            ctx.moveTo(pos[0], pos[1]);
        }
        else
        {
            ctx.lineTo(pos[0], pos[1]);
        }
    }
    ctx.stroke();
    ctx.strokeStyle = "red";
    for (let i = 0; i < this.handles.length; i++)
    {
        let pos = this.handles[i];
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], 3, 0, 2 * Math.PI);
        ctx.stroke();
    }
    ctx.restore();
}