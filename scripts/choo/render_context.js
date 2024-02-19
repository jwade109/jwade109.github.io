
function RenderContext(ctx, width, height, aabb)
{
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.screen_bounds = new AABB([0, 0], [width, height]);
    this.aabb = aabb;

    this.render_array = [];
}

function compare_z_index(a, b)
{
    return a.z_index - b.z_index;
}

RenderContext.prototype.draw = function()
{
    this.render_array.sort(compare_z_index);

    for (let elem of this.render_array)
    {
        elem.draw(this);
    }

    this.render_array = [];
}

RenderContext.prototype.scalar = function()
{
    return this.width / (this.aabb.max[0] - this.aabb.min[0]);
}

RenderContext.prototype.world_to_screen = function(v)
{
    let [tx, ty] = this.aabb.to_parametric(v);
    return this.screen_bounds.evaluate(tx, 1 - ty);
}

RenderContext.prototype.screen_to_world = function(v)
{
    let [tx, ty] = this.screen_bounds.to_parametric(v);
    ty = 1 - ty;
    return add2d(this.aabb.evaluate(tx - 0.5, ty - 0.5), this.aabb.center());
}

RenderContext.prototype.point = function(u, radius, fill_color, stroke_color, alpha, linewidth, z_index=0)
{
    this.render_array.push(new Circle(u, radius, fill_color, stroke_color, alpha, linewidth, z_index));
}

RenderContext.prototype.screen_point = function(u, radius)
{
    render2d(u, this.ctx, radius);
}

RenderContext.prototype.polyline = function(points, linewidth=1, stroke_color="black", fill_color=null, z_index=0)
{
    this.render_array.push(new Polyline(points, linewidth, stroke_color, fill_color, z_index));
}

RenderContext.prototype.text = function(text, screen_coords)
{
    this.render_array.push(new Text(screen_coords, text));
}

function Polyline(points, linewidth, stroke_color, fill_color, z_index)
{
    this.points = points;
    this.linewidth = linewidth;
    this.stroke_color = stroke_color;
    this.fill_color = fill_color;
    this.z_index = z_index;
}

Polyline.prototype.draw = function(rctx)
{
    if (this.points.length == 0)
    {
        return;
    }

    let px = [];
    for (let u of this.points)
    {
        let p = rctx.world_to_screen(u);
        px.push(p);
    }

    rctx.ctx.save();
    rctx.ctx.beginPath();
    rctx.ctx.moveTo(px[0][0], px[0][1]);
    for (let i = 1; i < px.length; ++i)
    {
        rctx.ctx.lineTo(px[i][0], px[i][1]);
    }
    if (this.stroke_color)
    {
        rctx.ctx.strokeStyle = this.stroke_color;
        rctx.ctx.lineWidth = this.linewidth * rctx.scalar();
        rctx.ctx.stroke();
    }
    if (this.fill_color)
    {
        rctx.ctx.fillStyle = this.fill_color;
        rctx.ctx.fill();
    }
    rctx.ctx.restore();
}

function Text(screen_coords, text)
{
    this.screen_coords = screen_coords;
    this.text = text;
    this.z_index = 10000;
}

Text.prototype.draw = function(rctx)
{
    rctx.ctx.fillStyle = "black";
    rctx.ctx.globalAlpha = 1;
    rctx.ctx.font = "24px Cambria Bold";
    rctx.ctx.fillText(this.text, this.screen_coords[0], this.screen_coords[1]);
}

function Circle(pos, radius, fill_color, stroke_color, alpha, linewidth, z_index)
{
    this.pos = pos;
    this.radius = radius;
    this.fill_color = fill_color;
    this.stroke_color = stroke_color;
    this.alpha = alpha;
    this.linewidth = linewidth;
    this.z_index = z_index;
}

Circle.prototype.draw = function(rctx)
{
    let p = rctx.world_to_screen(this.pos);

    rctx.ctx.save();

    rctx.ctx.beginPath();
    rctx.ctx.arc(p[0], p[1], this.radius * rctx.scalar(), 0, Math.PI*2);
    rctx.ctx.globalAlpha = this.alpha;
    rctx.ctx.lineWidth = this.linewidth * rctx.scalar();

    if (this.fill_color)
    {
        rctx.ctx.fillStyle = this.fill_color;
        rctx.ctx.fill();
    }
    if (this.stroke_color)
    {
        rctx.ctx.strokeStyle = this.stroke_color;
        rctx.ctx.stroke();
    }

    rctx.ctx.restore();
}
