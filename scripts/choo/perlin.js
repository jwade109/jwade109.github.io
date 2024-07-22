// adapted from https://github.com/joeiddon/perlin

"use strict"

let gradients = {};
let memory = {};

function rand_vect()
{
    let theta = Math.random() * 2 * Math.PI;
    return {x: Math.cos(theta), y: Math.sin(theta)};
}

function dot_prod_grid(x, y, vx, vy)
{
    let g_vect;
    let d_vect = {x: x - vx, y: y - vy};
    if (gradients[[vx,vy]])
    {
        g_vect = gradients[[vx,vy]];
    }
    else
    {
        g_vect = rand_vect();
        gradients[[vx, vy]] = g_vect;
    }
    return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
}

function smootherstep(x)
{
    return 6*x**5 - 15*x**4 + 10*x**3;
}

function interp(x, a, b)
{
    return a + smootherstep(x) * (b-a);
}

function perlin_get(x, y)
{
    if (memory.hasOwnProperty([x,y]))
    {
        return memory[[x,y]];
    }
    let xf = Math.floor(x);
    let yf = Math.floor(y);
    //interpolate
    let tl = dot_prod_grid(x, y, xf,   yf);
    let tr = dot_prod_grid(x, y, xf+1, yf);
    let bl = dot_prod_grid(x, y, xf,   yf+1);
    let br = dot_prod_grid(x, y, xf+1, yf+1);
    let xt = interp(x-xf, tl, tr);
    let xb = interp(x-xf, bl, br);
    let v = interp(y-yf, xt, xb);
    memory[[x,y]] = v;
    return v;
}
