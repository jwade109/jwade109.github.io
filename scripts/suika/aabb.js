
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

function aabb_from_points(pts)
{
    let min = pts[0].slice();
    let max = pts[0].slice();
    for (let p of pts)
    {
        min[0] = Math.min(min[0], p[0]);
        min[1] = Math.min(min[1], p[1]);
        max[0] = Math.max(max[0], p[0]);
        max[1] = Math.max(max[1], p[1]);
    }
    return new AABB(min, max);
}
