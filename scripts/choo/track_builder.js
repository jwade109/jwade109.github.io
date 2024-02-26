
function TrackBuilder(initial_segment)
{
    this.segments = [initial_segment];
    this.connections = [];
    this.signed_index = 1;
}

function split_signed_index(signed_index)
{
    let idx = Math.abs(signed_index) - 1;
    let sign = Math.sign(signed_index);
    return [idx, sign];
}

TrackBuilder.prototype.extend = function(arclength, curvature)
{
    function connect(tb, src, dst)
    {
        tb.connections.push([src, dst]);
    };

    let [idx, sign] = split_signed_index(this.signed_index);
    let backwards = sign < 0;
    let c = this.segments[idx];
    let n = c.extend_clothoid(arclength, curvature, backwards);
    this.segments.push(n);
    let old = this.signed_index;
    this.signed_index = this.segments.length;
    connect(this, old, this.signed_index);
    for (let [src, dst] of this.connections)
    {
        if (dst == -old)
        {
            for (let [src2, dst2] of this.connections)
            {
                if (src2 == src && -dst2 != old)
                {
                    connect(this, -dst2, this.signed_index);
                }
            }
        }
    }
    return this.signed_index;
}

TrackBuilder.prototype.connect = function(dst)
{
    let [cidx, csign] = split_signed_index(this.signed_index);
    let [idx, sign] = split_signed_index(dst);

    let t0 = 1;
    if (csign < 0)
    {
        t0 = 0;
    }
    let t1 = 1;
    if (sign < 0)
    {
        t1 = 0;
    }

    let p0 = this.segments[cidx].evaluate(t0);
    let u0 = this.segments[cidx].tangent(t0);
    let p1 = this.segments[idx].evaluate(t1);
    let u1 = this.segments[idx].tangent(t1);

    if (csign < 0)
    {
        u0 = mult2d(u0, -1);
    }
    if (sign < 0)
    {
        u1 = mult2d(u1, -1);
    }

    let strength = distance(p0, p1) * 0.4;

    let d0 = add2d(p0, mult2d(u0, strength));
    let d1 = add2d(p1, mult2d(u1, strength));

    let b = new BezierCurve([p0, d0, d1, p1]);

    let ds = 2;
    let points = [];
    for (let t of linspace(0, 1, 100000))
    {
        let p = b.evaluate(t);
        if (points.length == 0 || t == 1)
        {
            points.push(p);
        }
        else
        {
            let old = points[points.length - 1];
            let d = distance(p, old);
            if (d > ds)
            {
                points.push(p);
            }
        }
    }

    let path = new TrackSegment(points, 0, 0);
    this.segments.push(path);
    let old = this.signed_index;
    this.signed_index = this.segments.length;
    this.connections.push([old, this.signed_index]);
    this.connections.push([this.signed_index, -dst]);
    return this.signed_index;
}

TrackBuilder.prototype.cursor = function(index = 1)
{
    this.signed_index = index;
}
