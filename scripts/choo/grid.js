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

function push_grid_set(cells, gi)
{
    if (!cells.some(e => e[0] == gi[0] && e[1] == gi[1]))
    {
        cells.push(gi);
    }
}
