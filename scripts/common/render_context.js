
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

RenderContext.prototype.point = function(u, radius=1,
    fill_color="black", stroke_color=null, alpha=1, linewidth=0, z_index=0)
{
    let c = new Circle(u, radius, fill_color, stroke_color, alpha, linewidth, z_index)
    this.render_array.push(c);
    return c;
}

RenderContext.prototype.screen_point = function(u, radius)
{
    render2d(u, this.ctx, radius);
}

RenderContext.prototype.polyline = function(points, linewidth=1, stroke_color="black", fill_color=null, z_index=0)
{
    return this.render_array.push(new Polyline(points, linewidth, stroke_color, fill_color, z_index));
}

RenderContext.prototype.arrow = function(base, tip, linewidth=1, color="black", z_index=0)
{
    this.render_array.push(new Arrow(base, tip, linewidth, color, z_index));
}

RenderContext.prototype.text = function(text, screen_coords, font="24px Cambria Bold", alignment="left", z_index=10000)
{
    this.render_array.push(new Text(screen_coords, text, font, alignment, z_index));
}

RenderContext.prototype.arc = function(center, radius, linewidth, color, start_angle, end_angle, z_index=0)
{
    this.render_array.push(new ArcStroke(center, radius, linewidth, color, start_angle, end_angle, z_index));
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

function Text(screen_coords, text, font, alignment, z_index)
{
    this.screen_coords = screen_coords;
    this.text = text;
    this.font = font;
    this.alignment = alignment;
    this.z_index = z_index;
}

Text.prototype.draw = function(rctx)
{
    rctx.ctx.fillStyle = "black";
    rctx.ctx.globalAlpha = 1;
    rctx.ctx.font = this.font;
    rctx.ctx.textAlign = this.alignment;
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

function Arrow(base, tip, linewidth, color, z_index)
{
    this.base = base;
    this.tip = tip;
    this.linewidth = linewidth;
    this.color = color;
    this.z_index = z_index;
}

Arrow.prototype.draw = function(rctx)
{
    let base = rctx.world_to_screen(this.base);
    let tip = rctx.world_to_screen(this.tip);

    let u = mult2d(unit2d(sub2d(tip, base)), 9 * this.linewidth);

    let left  = add2d(tip, rot2d(u,  Math.PI * 1.1));
    let right = add2d(tip, rot2d(u, -Math.PI * 1.1));

    rctx.ctx.globalAlpha = 1;
    rctx.ctx.lineWidth = this.linewidth;
    rctx.ctx.strokeStyle = this.color;
    rctx.ctx.fillStyle = this.color;
    rctx.ctx.beginPath();
    rctx.ctx.moveTo(base[0], base[1]);
    rctx.ctx.lineTo(tip[0], tip[1]);
    rctx.ctx.stroke();
    rctx.ctx.beginPath();
    rctx.ctx.moveTo(tip[0], tip[1]);
    rctx.ctx.lineTo(left[0], left[1]);
    rctx.ctx.stroke();
    rctx.ctx.beginPath();
    rctx.ctx.moveTo(tip[0], tip[1]);
    rctx.ctx.lineTo(right[0], right[1]);
    rctx.ctx.stroke();
    rctx.ctx.beginPath();
    rctx.ctx.moveTo(tip[0], tip[1]);
    rctx.ctx.lineTo(right[0], right[1]);
    rctx.ctx.lineTo(left[0], left[1]);
    rctx.ctx.moveTo(tip[0], tip[1]);
    rctx.ctx.fill();
}

function ArcStroke(center, radius, linewidth, color, start_angle, delta_angle, z_index=0)
{
    this.center = center;
    this.radius = radius;
    this.linewidth = linewidth;
    this.color = color;
    this.start_angle = start_angle;
    this.delta_angle = delta_angle;
    this.z_index = z_index;
}

ArcStroke.prototype.draw = function(rctx)
{
    rctx.ctx.save();
    rctx.ctx.strokeStyle = this.color;
    rctx.ctx.lineWidth = this.linewidth * rctx.scalar();
    rctx.ctx.globalAlpha = 1;
    let center_screen = rctx.world_to_screen(this.center);
    rctx.ctx.beginPath();
    if (this.delta_angle > 0)
    {
        rctx.ctx.arc(center_screen[0], center_screen[1],
            this.radius * rctx.scalar(),
            -this.start_angle,
            -this.start_angle - this.delta_angle,
            true);
    }
    else
    {
        rctx.ctx.arc(center_screen[0], center_screen[1],
            this.radius * rctx.scalar(),
            Math.PI - this.start_angle,
            Math.PI - this.start_angle - this.delta_angle,
            false);
    }
    rctx.ctx.stroke();
    rctx.ctx.restore();
}

function get_render_context(center_world, zoom_scale)
{
    let du = [zoom_scale * document.body.clientWidth / 2,
              zoom_scale * document.body.clientHeight / 2];
    let min = sub2d(center_world, du);
    let max = add2d(center_world, du);
    let bounds = new AABB(min, max);

    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");
    ctx.canvas.width = document.body.clientWidth;
    ctx.canvas.height = document.body.clientHeight;
    return new RenderContext(ctx, ctx.canvas.width, ctx.canvas.height, bounds);
}
