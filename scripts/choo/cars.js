"use strict"

function Railcar(length, width, color)
{
    this.length = length;
    this.width = width;
    this.color = color;
}

Railcar.prototype.polyline(rctx, points)
{
    
}

function Locomotive(length, width, color)
{
    Railcar.call(this, length, width, color)
}

function car_to_world(center, l2, w2, lw)
{
    return add2d(center, add2d(mult2d(l2, lw[0]), mult2d(w2, lw[1])));
}

function car_to_world_vec(center, l2, w2, lws)
{
    return lws.map(x => car_to_world(center, l2, w2, x));
}

Railcar.prototype.draw = function(rctx, center, tangent)
{
    let normal = rot2d(tangent, Math.PI / 2);
    let l2 = mult2d(tangent, this.length / 2);
    let w2 = mult2d(normal,  this.width  / 2);

    let outline =
    [
        [ 1,  1], [ 1, -1],
        [-1, -1], [-1,  1],
        [ 1,  1]
    ];

    let ps = car_to_world_vec(center, l2, w2, outline);
    rctx.polyline(ps, 3, "black", this.color, 100);
}

Locomotive.prototype.draw = function(rctx, center, tangent)
{
    let normal = rot2d(tangent, Math.PI / 2);
    let l2 = mult2d(tangent, this.length / 2);
    let w2 = mult2d(normal,  this.width  / 2);

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
        [ 0.7,  1.0],
        [ 0.75,  0.0],
        [ 0.7, -1.0],
        [ 0.6, -1.0],
        [ 0.6,  1.0],
        [ 0.7,  1.0]
    ];

    let ps = car_to_world_vec(center, l2, w2, outline);
    rctx.polyline(ps, 2, "black", this.color, 100);
    ps = car_to_world_vec(center, l2, w2, windshield);
    rctx.polyline(ps, 1, "black", "lightgray", 101);
}
