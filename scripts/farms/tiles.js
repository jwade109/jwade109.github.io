"use strict";

function CircularTile(pos, size, color)
{
    this.center = pos.slice();
    this.size = size;
    this.color = color;
}

CircularTile.prototype.draw = function(rctx)
{
    rctx.point(this.center, this.size / 2, this.color);
}

function SquareTile(pos, size, color)
{
    this.center = pos.slice();
    this.size = size;
    this.color = color;
}

SquareTile.prototype.draw = function(rctx)
{
    let s2 = this.size / 2.2;
    let ll = [this.center[0] - s2, this.center[1] - s2];
    let lr = [this.center[0] + s2, this.center[1] - s2];
    let ur = [this.center[0] + s2, this.center[1] + s2];
    let ul = [this.center[0] - s2, this.center[1] + s2];
    rctx.polyline([ll, lr, ur, ul, ll], 1, "", this.color);
}
