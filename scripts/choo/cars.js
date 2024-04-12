"use strict"

function car_to_world(center, l2, w2, lw)
{
    return add2d(center, add2d(mult2d(l2, lw[0]), mult2d(w2, lw[1])));
}

function car_to_world_vec(center, l2, w2, lws)
{
    return lws.map(x => car_to_world(center, l2, w2, x));
}

function Railcar(length, width)
{
    this.length = length;
    this.width = width;
    this.emits_smoke = false;
}

Railcar.prototype.polyline = function(rctx, points, center, tangent, color, width)
{
    let normal = rot2d(tangent, Math.PI / 2);
    let l2 = mult2d(tangent, this.length / 2);
    let w2 = mult2d(normal,  this.width  / 2);
    let ps = car_to_world_vec(center, l2, w2, points);
    rctx.polyline(ps, width, "black", color, 100);
}

Railcar.prototype.draw = function(rctx, center, tangent)
{
    this.polyline(rctx,
    [
        [ 1,  1],
        [ 1, -1],
        [-1, -1],
        [-1,  1],
        [ 1,  1]
    ],
    center, tangent, null, 1);
}

function Locomotive(length, width, color)
{
    Railcar.call(this, length, width);
    this.color = color;
    this.emits_smoke = true;
}

Locomotive.prototype = Object.create(Railcar.prototype);

Locomotive.prototype.draw = function(rctx, center, tangent)
{
    let outline =
    [
        [ 0.9,  1.0],
        [ 1.0,  0.0],
        [ 0.9, -1.0],
        [-1.0, -1.0],
        [-1.0,  1.0],
        [ 0.9,  1.0]
    ];

    let windshield =
    [
        [ 0.8,   1.0],
        [ 0.85,  0.0],
        [ 0.8,  -1.0],
        [ 0.74, -1.0],
        [ 0.74,  1.0],
        [ 0.8,   1.0]
    ];

    this.polyline(rctx, outline, center, tangent, this.color, 2);
    this.polyline(rctx, [[0.8, 0], [1.0, 0]], center, tangent, null, 1);
    this.polyline(rctx, [[0.6, 0.8], [-0.6, 0.8]], center, tangent, null, 1);
    this.polyline(rctx, [[0.6, -0.8], [-0.6, -0.8]], center, tangent, null, 1);
    this.polyline(rctx, windshield, center, tangent, "#E0E0E0", 1);

    function draw_fan(car, c_x)
    {
        let n_points = 20;
        let r_y = 0.3;
        let r_x = r_y * car.width / car.length;

        let circle = [];
        for (let i = 0; i < n_points + 1; ++i)
        {
            let a = 2 * Math.PI * i / n_points;
            let x = r_x * Math.sin(a);
            let y = r_y * Math.cos(a);
            circle.push([c_x + x, y]);
        }

        car.polyline(rctx, circle, center, tangent, "#303030", 1);
    }

    draw_fan(this,  0.2);
    draw_fan(this,  0.0);
    draw_fan(this, -0.2);
    draw_fan(this, -0.4);

    this.polyline(rctx, [[-0.7, -0.8], [-0.7, 0.8]], center, tangent, null, 1);
    this.polyline(rctx, [[-0.8, -0.8], [-0.8, 0.8]], center, tangent, null, 1);
    this.polyline(rctx, [[-0.9, -0.8], [-0.9, 0.8]], center, tangent, null, 1);
}

function HopperWagon(length, width, outer_color, inner_color)
{
    Railcar.call(this, length, width);
    this.outer_color = outer_color;
    this.inner_color = inner_color;
}

HopperWagon.prototype = Object.create(Railcar.prototype);

HopperWagon.prototype.draw = function(rctx, center, tangent)
{
    this.polyline(rctx,
    [
        [ 1,  1],
        [ 1, -1],
        [-1, -1],
        [-1,  1],
        [ 1,  1]
    ],
    center, tangent, this.outer_color, 2);

    this.polyline(rctx,
    [
        [ 0.93,  0.78],
        [ 0.93, -0.78],
        [-0.93, -0.78],
        [-0.93,  0.78],
        [ 0.93,  0.78]
    ],
    center, tangent, this.inner_color, 1);

    this.polyline(rctx, [[ 0.3, 0.78], [ 0.3, -0.78]], center, tangent, null, 0.5);
    this.polyline(rctx, [[-0.3, 0.78], [-0.3, -0.78]], center, tangent, null, 0.5);
}

function TankWagon(length, width, primary_color, secondary_color)
{
    Railcar.call(this, length, width);
    this.primary_color = primary_color;
    this.secondary_color = secondary_color;
}

TankWagon.prototype = Object.create(Railcar.prototype);

TankWagon.prototype.draw = function(rctx, center, tangent)
{
    this.polyline(rctx,
    [
        [ 1,  0.75],
        [ 1, -0.75],
        [-1, -0.75],
        [-1,  0.75],
        [ 1,  0.75]
    ],
    center, tangent, this.secondary_color, 1.5);

    let tank = [];

    let n_points = 6;
    let scale = 0.97;
    let r_x = this.width / this.length * scale;
    let r_y = scale;

    let c_x = 0.76;

    for (let i = 0; i < n_points + 1; ++i)
    {
        let a = Math.PI * i / n_points;
        let x = r_x * Math.sin(a);
        let y = r_y * Math.cos(a);
        tank.push([c_x + x, y]);
    }

    for (let i = 0; i < n_points + 1; ++i)
    {
        let a = Math.PI * i / n_points;
        let x = r_x * Math.sin(a);
        let y = r_y * Math.cos(a);
        tank.push([-c_x - x, -y]);
    }

    tank.push(tank[0]);

    this.polyline(rctx, tank, center, tangent, this.primary_color, 2);

    this.polyline(rctx, [[ 0.1,  0.9], [ 0.1, -0.9]], center, tangent, null, 0.5);
    this.polyline(rctx, [[-0.1,  0.9], [-0.1, -0.9]], center, tangent, null, 0.5);
    this.polyline(rctx, [[-0.1, -0.3], [ 0.1, -0.3]], center, tangent, null, 0.5);
    this.polyline(rctx, [[-0.1,  0.3], [ 0.1,  0.3]], center, tangent, null, 0.5);
}
