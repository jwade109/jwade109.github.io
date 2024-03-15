"use strict"

let DEBUG_DRAW_ROUTE_RESERVATIONS = false;
let DEBUG_DRAW_TRAIN_TARGET_SEGMENTS = true;

const ATC_RESERVATION_NEARBY_RADIUS = 40;

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
    i = i % 20;
    if (GENERATED_COLORS[i] === undefined)
    {
        GENERATED_COLORS[i] = get_random_color();
    }
    return GENERATED_COLORS[i];
}

function AutomaticTrainControl(train_limit, multitrack)
{
    this.trains = {};
    this.train_limit = train_limit;
    this.multitrack = multitrack;
    this.reservations = {};
    this.target_segments = {};
}

AutomaticTrainControl.prototype.step = function(dt)
{
    if (Object.keys(this.multitrack.segments).length == 0)
    {
        return;
    }

    for (let tid in this.trains)
    {
        let t = this.trains[tid];
        let rt = t.total_route();
        let blocks = [];

        for (let segment_no of rt)
        {
            push_set(blocks, this.multitrack.blocks[Math.abs(segment_no)]);
        }

        for (let [block_no, train_no] of Object.entries(this.reservations))
        {
            block_no = Number.parseInt(block_no); // I hate JS
            if (train_no == tid && !blocks.includes(block_no))
            {
                delete this.reservations[block_no];
            }
        }
    }

    let to_delete = [];

    for (let tid in this.trains)
    {
        let t = this.trains[tid];
        t.step(dt, this.multitrack);
        if (t.target_segment != null)
        {
            this.send_train(t.target_segment, Number.parseInt(tid));
        }

        if (t.state.desc == "uninitialized" ||
            (t.state.desc == "idle" && t.state.time > 4))
        {
            let rn = this.multitrack.random_node();
            if (rn != null)
            {
                t.target_segment = rn;
            }
        }
        else if (t.state.desc == "no path" && t.state.time > 6)
        {
            to_delete.push(tid);
        }
    }

    for (let tid of to_delete)
    {
        this.delete_train(tid);
    }

    while (Object.entries(this.trains).length < this.train_limit)
    {
        let rn = this.multitrack.random_node()
        if (rn != null)
        {
            this.spawn_train(rn);
        }
        else
        {
            break;
        }
    }
}

AutomaticTrainControl.prototype.spawn_train = function(source)
{
    console.log("New train on segment " + source);
    let segment = this.multitrack.segments[source];
    if (segment === undefined)
    {
        console.log("No segment with id " + source);
        return;
    }
    let t = new Train(segment.arclength * 0.8, 18);
    if (source != null)
    {
        t.tbd.push(source);
    }
    t.target_segment = this.multitrack.random_node();
    this.trains[t.id] = t;
}

AutomaticTrainControl.prototype.delete_train = function(train_no)
{
    delete this.trains[train_no];
    for (let [block_no, tid] of Object.entries(this.reservations))
    {
        if (train_no == tid)
        {
            delete this.reservations[block_no];
        }
    }
}

AutomaticTrainControl.prototype.set_target = function(train_no, segment_id)
{
    this.trains[train_no].target_segment = segment_id;
}

AutomaticTrainControl.prototype.get_train_pos = function(train_no)
{
    let train = this.trains[train_no];
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

AutomaticTrainControl.prototype.route_between = function(src, dst, train_no, limit)
{
    let weights = {}
    for (let seg_id in this.multitrack.segments)
    {
        weights[seg_id]  = this.multitrack.segments[seg_id].arclength;
        weights[-seg_id] = this.multitrack.segments[seg_id].arclength;
    }

    // TODO restore occupied block penalty
    // for (let [block_no, tid] of Object.entries(this.reservations))
    // {
    //     if (train_no != tid)
    //     {
    //         segment_no = Number.parseInt(segment_no);
    //         weights[segment_no] += 1000;
    //         weights[-segment_no] += 1000;
    //     }
    // }

    let route = get_route_between(src, dst, this.multitrack.connections, weights);
    route.shift(); // TODO remove first element
    while (route.length > limit)
    {
        route.pop();
    }
    return route;
}

AutomaticTrainControl.prototype.send_train = function(dst, train_no)
{
    let train = this.trains[train_no];
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
        let dst = nominal_dst;
        let route = null;

        while (src != dst)
        {
            let to_reserve = [];
            let reduced = false;
            route = atc.route_between(src, dst, train_no, 3);
            if (route == null)
            {
                return null;
            }

            for (let signed_index of route)
            {
                let idx = Math.abs(signed_index);
                let block_id = atc.multitrack.blocks[idx];
                if (atc.reservations[block_id] === undefined || atc.reservations[block_id] === train_no)
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

                to_reserve.push(block_id);
            }

            if (!reduced)
            {
                for (let block_id of to_reserve)
                {
                    atc.reservations[block_id] = train_no;
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
    for (let tid in this.trains)
    {
        let t = this.trains[tid];
        t.draw(rctx, this.multitrack);
    }

    if (DEBUG_DRAW_TRAIN_TARGET_SEGMENTS)
    {
        for (let tid in this.trains)
        {
            let t = this.trains[tid];
            if (t.target_segment == null)
            {
                continue;
            }
            let c = get_stable_random_color(tid);
            let seg = this.multitrack.segments[Math.abs(t.target_segment)];
            if (seg === undefined)
            {
                continue;
            }
            rctx.polyline(seg.points, 70, c, null, -1000001);
        }
    }

    if (DEBUG_DRAW_ROUTE_RESERVATIONS)
    {
        for (let [block_no, train_no] of Object.entries(this.reservations))
        {
            for (let [segment_no, bid] of Object.entries(this.multitrack.blocks))
            {
                if (bid != block_no)
                {
                    continue;
                }

                let c = get_stable_random_color(train_no);
                let [seg_id, ignore] = split_signed_index(segment_no);
                let seg = this.multitrack.segments[seg_id + 1];
                rctx.polyline(seg.points, 25, c, null, -99);
            }
        }
    }
}
