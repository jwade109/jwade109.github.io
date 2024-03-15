
function TrackBuilder(root_segment=null)
{
    this.segments = {};
    this.connections = [];
    this.signed_index = null;
    if (root_segment)
    {
        this.segments[root_segment.id] = root_segment;
        this.signed_index = root_segment.id;
    }
}

function split_signed_index(signed_index)
{
    let idx = Math.abs(signed_index) - 1;
    let sign = Math.sign(signed_index);
    return [idx, sign];
}

TrackBuilder.prototype.add = function(segment)
{
    this.segments[segment.id] = segment;
    this.signed_index = segment.id;
    return this.signed_index;
}

TrackBuilder.prototype.extend = function(arclength, curvature, bidirectional=false)
{
    function connect(tb, src, dst)
    {
        tb.connections.push([src, dst]);
    };

    let [idx, sign] = split_signed_index(this.signed_index);
    let backwards = sign < 0;
    let c = this.segments[idx + 1];
    let n = c.extend_clothoid(arclength, curvature, backwards);
    this.segments[n.id] = n;
    let old = this.signed_index;
    this.signed_index = n.id;
    connect(this, old, this.signed_index);
    if (bidirectional)
    {
        connect(this, -this.signed_index, -old);
    }
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

TrackBuilder.prototype.connect = function(dst, strength_mult=0.4, bidirectional=false)
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

    let p0 = this.segments[cidx + 1].evaluate(t0);
    let u0 = this.segments[cidx + 1].tangent(t0);
    let p1 = this.segments[idx + 1].evaluate(t1);
    let u1 = this.segments[idx + 1].tangent(t1);

    if (csign < 0)
    {
        u0 = mult2d(u0, -1);
    }
    if (sign < 0)
    {
        u1 = mult2d(u1, -1);
    }

    let strength = distance(p0, p1) * strength_mult;

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
    this.segments[path.id] = path;
    let old = this.signed_index;
    this.signed_index = path.id;
    this.connections.push([old, this.signed_index]);
    this.connections.push([this.signed_index, -dst]);
    if (bidirectional)
    {
        this.connections.push([-this.signed_index, -old]);
        this.connections.push([dst, -this.signed_index]);
    }
    return this.signed_index;
}

TrackBuilder.prototype.cursor = function(index = 1)
{
    this.signed_index = index;
}
