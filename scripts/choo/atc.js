"use strict"

let DEBUG_DRAW_ROUTE_RESERVATIONS = true;

let GENERATED_COLORS = {
    0: "salmon",
    1: "lightblue",
    2: "green",
    3: "orange"
};

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
    this.target_segments = {0: 96, 1: 96};
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
                delete this.reservations[segment_no];
            }
        }
    }

    for (let i = 0; i < this.trains.length; ++i)
    {
        let t = this.trains[i];
        t.step(dt, this.multitrack);

        let n = this.multitrack.segments.length;

        this.send_train(this.target_segments[i], i)

        if (t.tbd.length == 0 && t.vel < 2)
        {
            this.target_segments[i] = randint(-n, n + 1);
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

AutomaticTrainControl.prototype.route_between = function(src, dst)
{
    let weights = {}
    for (let i = 1; i <= this.multitrack.segments.length; ++i)
    {
        weights[i]  = this.multitrack.segments[i-1].arclength;
        weights[-i] = this.multitrack.segments[i-1].arclength;
    }

    for (let [segment_no, train_no] of Object.entries(this.reservations))
    {
        segment_no = Number.parseInt(segment_no);
        weights[segment_no] += 1000;
        weights[-segment_no] += 1000;
    }

    let route = get_route_between(src, dst, this.multitrack.connections, weights);
    route.shift(); // TODO remove first element
    return route;
}

AutomaticTrainControl.prototype.send_train = function(dst, train_no)
{
    // console.log("Sending train", train_no, "to segment", dst);
    let train = this.get_train(train_no);
    if (train == null)
    {
        return;
    }
    let n = this.multitrack.segments.length;
    let src = randint(-n, n + 1);
    if (train.history.length > 0)
    {
        src = train.history[train.history.length - 1];
    }

    function get_and_reserve_best_route(atc, src, nominal_dst, train_no)
    {
        let dst = nominal_dst;
        let route = null;

        let to_reserve = [];

        while (src != dst)
        {
            to_reserve = [];
            let reduced = false;
            route = atc.route_between(src, dst);
            if (route == null)
            {
                // console.log("Failed to generate route between", src, "and", dst);
                return null;
            }

            for (let signed_index of route)
            {
                let idx = Math.abs(signed_index);
                // reserve the whole block!
                let block = get_block_members(idx, atc.multitrack.connections);
                for (let b of block)
                {
                    if (atc.reservations[b] === undefined || atc.reservations[b] === train_no)
                    {
                        // console.log("Reserving block containing", idx, block);
                    }
                    else
                    {
                        if (route.length > 1 && !reduced)
                        {
                            dst = route[route.length - 2];
                            reduced = true;
                        }
                        else
                        {
                            return null;
                        }
                    }
                    if (reduced)
                    {
                        break;
                    }
                }
                if (reduced)
                {
                    break;
                }

                to_reserve = to_reserve.concat(block);
            }

            if (!reduced)
            {
                for (let segment of to_reserve)
                {
                    atc.reservations[segment] = train_no;
                }

                return route;
            }
        }

        return null;
    }

    let rt = get_and_reserve_best_route(this, src, dst, train_no);
    if (rt == null)
    {
        return;
    }

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
            rctx.polyline(seg.points, 25, c, null, -100);
            // rctx.polyline(seg.rail_right, 3, c, null, 16000);
        }
    }
}

AutomaticTrainControl.prototype.occupied = function()
{

}
