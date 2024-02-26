"use strict"

let DEBUG_DRAW_ROUTE_RESERVATIONS = false;

let GENERATED_COLORS = {};


function get_random_color()
{
    let r = randint(40, 255).toString(16);
    let g = randint(40, 255).toString(16);
    let b = randint(40, 255).toString(16);
    return "#" + r + g + b;
}

function get_stable_random_color(i)
{
    if (GENERATED_COLORS[i] === undefined)
    {
        GENERATED_COLORS[i] = get_random_color();
    }
    return GENERATED_COLORS[i];
}

function AutomaticTrainControl(trains, multitrack)
{
    this.trains = trains;
    this.multitrack = multitrack;
    this.reservations = {};
}

AutomaticTrainControl.prototype.step = function(dt)
{
    for (let i = 0; i < this.trains.length; ++i)
    {
        let t = this.trains[i];
        let rt = t.total_route();
        let route_plus_block = [];
        for (let j = 0; j < rt.length; ++j)
        {
            let block = get_block_members(Math.abs(rt[j]), this.multitrack.connections);
            for (let b of block)
            {
                push_set(route_plus_block, b);
            }
        }

        for (let [segment_no, train_no] of Object.entries(this.reservations))
        {
            segment_no = Number.parseInt(segment_no); // I hate JS
            if (train_no == i && !route_plus_block.includes(segment_no))
            {
                // console.log("train", i, "releasing reservation of segment", segment_no);
                delete this.reservations[segment_no];
            }
        }
    }

    for (let i = 0; i < this.trains.length; ++i)
    {
        let t = this.trains[i];
        t.step(dt, this.multitrack);

        let n = this.multitrack.segments.length;

        if (t.tbd.length == 0 && t.vel < 2)
        {
            let dst = randint(-n, n + 1);
            this.send_train(dst, i)
        }
    }
}

AutomaticTrainControl.prototype.get_train = function(train_no)
{
    if (train_no < 0 || train_no >= this.trains.length)
    {
        console.log("No train with id", train_no);
        return null;
    }
    return this.trains[train_no];
}

AutomaticTrainControl.prototype.send_train = function(dst, train_no)
{
    // console.log("Sending train", train_no, "to segment", dst);
    let train = this.get_train(train_no);
    if (train == null)
    {
        return;
    }
    let src = 1;
    if (train.history.length > 0)
    {
        src = train.history[train.history.length - 1];
    }
    let rt = this.multitrack.route_between(src, dst);
    if (rt == null)
    {
        // console.log("Failed to generate route between", src, "and", dst);
        return;
    }

    let to_reserve = [];

    for (let signed_index of rt)
    {
        let idx = Math.abs(signed_index);
        // reserve the whole block!
        let block = get_block_members(idx, this.multitrack.connections);
        for (let b of block)
        {
            if (this.reservations[b] === undefined || this.reservations[b] === train_no)
            {
                // console.log("Reserving block containing", idx, block);
            }
            else
            {
                return;
            }
        }

        to_reserve = to_reserve.concat(block);
    }

    for (let segment of to_reserve)
    {
        this.reservations[segment] = train_no;
    }

    // console.log("Overwriting route", rt);
    train.set_route(rt);
}

AutomaticTrainControl.prototype.draw = function(rctx)
{
    this.multitrack.draw(rctx);
    for (let t of this.trains)
    {
        t.draw(rctx, this.multitrack);
    }

    if (DEBUG_DRAW_ROUTE_RESERVATIONS)
    {
        // for (let seg of this.multitrack.segments)
        // {
        //     rctx.polyline(seg.points, 1, "black", null, -100);
        // }

        for (let [segment_no, train_no] of Object.entries(this.reservations))
        {
            let c = get_stable_random_color(train_no);
            let [seg_id, ignore] = split_signed_index(segment_no);
            let seg = this.multitrack.segments[seg_id];
            rctx.polyline(seg.rail_left, 3, c, null, 16000);
            rctx.polyline(seg.rail_right, 3, c, null, 16000);
        }
    }
}

AutomaticTrainControl.prototype.occupied = function()
{

}
