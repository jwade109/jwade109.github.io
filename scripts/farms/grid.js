"use strict";

const Y_COORDINATE_FACTOR = 10000000;
const COORDINATE_OFFSET = 1000000;

function index_to_xy(idx)
{
    let x = (idx % Y_COORDINATE_FACTOR) - COORDINATE_OFFSET;
    let y = Math.floor(idx / Y_COORDINATE_FACTOR) - COORDINATE_OFFSET;
    return [x, y];
}

function xy_to_index(x, y)
{
    return (y + COORDINATE_OFFSET) * Y_COORDINATE_FACTOR + (x + COORDINATE_OFFSET);
}

function grid_to_px(x, y, size)
{
    return [x * size, y * size]
}

function px_to_grid(x, y, size)
{
    return [Math.floor(x / size), Math.floor(y / size)];
}

function tile_index_to_bounds(index, size)
{
    let [x, y] = index_to_xy(index);
    let lower = grid_to_px(x, y, size);
    let upper = grid_to_px(x + 1, y + 1, size);
    return [lower, upper];
}

function rgb(r, g, b)
{
    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);

    if (r.length == 1)
    {
        r = "0" + r;
    }
    if (g.length == 1)
    {
        g = "0" + g;
    }
    if (b.length == 1)
    {
        b = "0" + b;
    }

    return "#" + r + g + b;
}

function Grid()
{
    this.size = 20;
    this.regen();
}

Grid.prototype.regen = function()
{

    this.tiles = {}

    for (let i = 0; i < 1000; ++i)
    {
        let a = Math.PI * 2 * i / 100;
        for (let r = 0; r < 100; r += 0.5)
        {
            if (rand() < 0.04)
            {
                break;
            }

            let x = Math.round(Math.cos(a) * r);
            let y = Math.round(Math.sin(a) * r);
            let idx = xy_to_index(x, y);
            if (idx in this.tiles)
            {
                continue;
            }

            let [lower, upper] = tile_index_to_bounds(idx, this.size);
            let center = mult2d(add2d(lower, upper), 0.5);

            let rb = randint(20, 40);
            let g = randint(90, 140);
            let color = rgb(rb, g, rb);

            if (rand() < 0.4)
            {
                this.tiles[idx] = new CircularTile(center, this.size, color);
            }
            else
            {
                this.tiles[idx] = new SquareTile(center, this.size, color);
            }

        }
    }
}

Grid.prototype.draw = function(rctx)
{
    for (let index in this.tiles)
    {
        this.tiles[index].draw(rctx);
    }
}

Grid.prototype.step = function(dt)
{

}
