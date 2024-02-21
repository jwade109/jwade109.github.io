"use strict"

function to_grid_index(pos, scale)
{
    return [Math.floor(pos[0] / scale), Math.floor(pos[1] / scale)];
}

function grid_aabb(gi, scale)
{
    let lower = [gi[0] * scale, gi[1] * scale];
    let upper = [lower[0] + scale, lower[1] + scale];
    return new AABB(lower, upper);
}
