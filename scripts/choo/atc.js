"use strict"

function AutomaticTrainControl(trains, multitrack)
{
    this.trains = trains;
    this.multitrack = multitrack;
}

AutomaticTrainControl.prototype.step = function(dt)
{
    for (let i = 0; i < this.trains.length; ++i)
    {
        let t = this.trains[i];
        t.step(dt, this.multitrack);

        let n = this.multitrack.segments.length;

        if (t.tbd.length == 0 && t.vel < 2)
        {
            let dst = randint(-n, n + 1);
            this.send_train_to(dst, i)
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

AutomaticTrainControl.prototype.send_train_to = function(dst, train_no)
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
}

AutomaticTrainControl.prototype.occupied = function()
{

}
