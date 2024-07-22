"use strict"

const DEFAULT_GRID_SCALE = 1000;

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

function generate_terrain(multitrack, aabb)
{
    let points = [];

    for (let segment_id in multitrack.segments)
    {
        for (let t of linspace(0, 1, 20))
        {
            let p = multitrack.segments[segment_id].evaluate(t);
            points.push(p);
        }
    }

    function distance_to(test_point)
    {
        let [best, dist] = nearest_point(points, test_point);
        return dist;
    }

    let tree_pts = [];

    for (let i = 0; i < 300; ++i)
    {
        let pt = aabb.random();
        let noise = perlin_get(pt[0] / 2000, pt[1] / 2000);
        if (distance_to(pt) < 30)
        {
            continue;
        }
        if (noise > 0)
        {
            tree_pts.push(pt);
        }
    }

    let trees = [];
    for (let pt of tree_pts)
    {
        trees.push({
            "pos": pt,
            "radius": rand(4, 12),
            "g": randint(40, 100),
            "alpha": rand(0.4, 1)
        });
    }

    return trees;
}

function WorldChunk(gi, multitrack)
{
    this.index = gi;
    this.aabb = grid_aabb(gi, DEFAULT_GRID_SCALE);
    this.trees = generate_terrain(multitrack, this.aabb);
}

WorldChunk.prototype.draw = function(rctx)
{
    for (let tree of this.trees)
    {
        let c = rgb(0, tree.g, 0);
        rctx.point(tree.pos, tree.radius, c, null, 1, 0, 0);
    }
    for (let tree of this.trees)
    {
        let c = rgb(0, tree.g + 8, 0);
        rctx.point(tree.pos, tree.radius * 0.7, c, null, 1, 0, 0);
    }
}
