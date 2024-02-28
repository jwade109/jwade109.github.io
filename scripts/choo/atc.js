"use strict"

let DEBUG_DRAW_ROUTE_RESERVATIONS = true;
let DEBUG_DRAW_TRAIN_TARGET_SEGMENTS = true;

const ATC_RESERVATION_GRID_SIZE = 10;

let GENERATED_COLORS = {
    0: "lightblue",
    1: "salmon",
    2: "lightgreen",
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
    this.target_segments = {};
    this.reserved_grids = [];

    this.deadlock_timer = 0;
    this.reroute_timer = 0;
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

    let max_vel = 0;

    this.reroute_timer += dt;

    for (let i = 0; i < this.trains.length; ++i)
    {
        let t = this.trains[i];
        t.step(dt, this.multitrack);

        let n = this.multitrack.segments.length;

        // if (this.reroute_timer > 1)
        {
            this.send_train(this.target_segments[i], i)
        }

        if ((t.history.length == 0 && this.target_segments[i] === undefined) ||
            (t.history.length > 0 &&
             t.history[t.history.length - 1] == this.target_segments[i] &&
             t.vel < 1))
        {
            let rn = this.multitrack.random_node();
            if (rn != null)
            {
                this.target_segments[i] = rn;
            }
        }

        max_vel = Math.max(max_vel, t.vel);
    }

    if (this.reroute_timer > 1)
    {
        this.reroute_timer = 0;
    }

    // if (max_vel < 0.05)
    // {
    //     this.deadlock_timer += dt;
    // }

    // if (this.deadlock_timer > 5)
    // {
    //     this.reservations = {};
    //     this.deadlock_timer = 0;
    // }
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

AutomaticTrainControl.prototype.get_train_pos = function(train_no)
{
    let train = this.get_train(train_no);
    if (train == null)
    {
        return null;
    }
    let track = train.get_track(this.multitrack);
    if (track == null)
    {
        return null;
    }
    let t = track.s_to_t(train.pos);
    if (t == null)
    {
        return null;
    }
    return track.evaluate(t);
}

AutomaticTrainControl.prototype.route_between = function(src, dst, train_no)
{
    let weights = {}
    for (let seg_id in this.multitrack.segments)
    {
        weights[seg_id]  = this.multitrack.segments[seg_id].arclength;
        weights[-seg_id] = this.multitrack.segments[seg_id].arclength;
    }

    for (let [segment_no, tid] of Object.entries(this.reservations))
    {
        if (train_no != tid)
        {
            segment_no = Number.parseInt(segment_no);
            weights[segment_no] += 1000;
            weights[-segment_no] += 1000;
        }
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
    let src = this.multitrack.random_node();
    if (train.history.length > 0)
    {
        src = train.history[train.history.length - 1];
    }

    function get_and_reserve_best_route(atc, src, nominal_dst, train_no)
    {
        // console.log(src, nominal_dst);
        let dst = nominal_dst;
        let route = null;

        let to_reserve = [];

        while (src != dst)
        {
            to_reserve = [];
            let reduced = false;
            route = atc.route_between(src, dst, train_no);
            if (route == null)
            {
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
                        // the reservation is available,
                        // or this train has already reserved it
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

AutomaticTrainControl.prototype.grid_cells = function()
{
    let cells = [];
    for (let seg of this.multitrack.segments)
    {
        let gis = seg.grid_cells(ATC_RESERVATION_GRID_SIZE);
        for (let gi of gis)
        {
            push_grid_set(cells, gi);
        }
    }
    return cells;
}

AutomaticTrainControl.prototype.draw = function(rctx)
{
    this.multitrack.draw(rctx);
    for (let t of this.trains)
    {
        t.draw(rctx, this.multitrack);
    }

    if (DEBUG_DRAW_TRAIN_TARGET_SEGMENTS)
    {
        for (let [train_no, segment_no] of Object.entries(this.target_segments))
        {
            let c = get_stable_random_color(train_no);
            let seg = this.multitrack.segments[segment_no];
            rctx.polyline(seg.points, 70, c, null, -100);
        }
    }

    if (DEBUG_DRAW_ROUTE_RESERVATIONS)
    {
        for (let [segment_no, train_no] of Object.entries(this.reservations))
        {
            let c = get_stable_random_color(train_no);
            let [seg_id, ignore] = split_signed_index(segment_no);
            let seg = this.multitrack.segments[seg_id + 1];
            rctx.polyline(seg.points, 25, c, null, -99);
        }
    }
}

AutomaticTrainControl.prototype.occupied = function()
{

}
