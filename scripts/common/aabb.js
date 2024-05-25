
function AABB(u, v)
{
    let xmin = Math.min(u[0], v[0]);
    let xmax = Math.max(u[0], v[0]);
    let ymin = Math.min(u[1], v[1]);
    let ymax = Math.max(u[1], v[1]);

    this.min = [xmin, ymin];
    this.max = [xmax, ymax];
}

AABB.prototype.to_parametric = function(p)
{
    let dx = this.max[0] - this.min[0];
    let dy = this.max[1] - this.min[1];

    let tx = (p[0] - this.min[0]) / dx;
    let ty = (p[1] - this.min[1]) / dy;
    return [tx, ty];
}

AABB.prototype.evaluate = function(tx, ty)
{
    let dx = this.max[0] - this.min[0];
    let dy = this.max[1] - this.min[1];
    return [tx * dx, ty * dy];
}

AABB.prototype.center = function()
{
    return mult2d(add2d(this.min, this.max), 0.5);
}

AABB.prototype.draw = function(rctx)
{
    // rctx.ctx.save();
    // rctx.ctx.globalAlpha = 0.1;
    // rctx.ctx.strokeStyle = "black";
    // rctx.ctx.lineWidth = 1;

    rctx.polyline([
        [this.min[0], this.min[1]],
        [this.min[0], this.max[1]],
        [this.max[0], this.max[1]],
        [this.max[0], this.min[1]],
        [this.min[0], this.min[1]]
    ],
    2, "black", null, 100);

    // rctx.ctx.restore();
}

AABB.prototype.random = function()
{
    let x = lerp(this.min[0], this.max[0], rand(0, 1));
    let y = lerp(this.min[1], this.max[1], rand(0, 1));
    return [x, y];
}

AABB.prototype.combine = function(other)
{
    return aabb_from_points([this.min, this.max, other.min, other.max]);
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
