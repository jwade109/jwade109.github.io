function Person(pos)
{
    this.pos = pos;
    this.jump_height = 0;
    this.jump_vel = 0;
    this.vel = [0, 0];
    this.max_vel = rand(20, 40);
    this.stopped = false;
}

Person.prototype.step = function(dt)
{
    if (this.jump_height == 0 && rand() < 0.1)
    {
        this.jump_vel = rand() < 0.05 ? rand(11, 16) : rand(28, 34);
    }

    if (this.stopped && rand() < 0.7)
    {
        this.stopped = false;
    }
    else if (rand() < 0.01)
    {
        this.stopped = true;
    }

    if (this.stopped)
    {
        this.vel = [0, 0];
    }

    this.pos = add2d(this.pos, mult2d(this.vel, dt));

    this.jump_height += this.jump_vel * dt;
    this.jump_vel -= 400 * dt;

    if (this.jump_height < 0)
    {
        this.jump_height = 0;
        this.jump_vel = 0;
    }
}

Person.prototype.render = function(rctx)
{
    let p = add2d(this.pos, [0, this.jump_height])
    rctx.point(p, 1.3, "back").z_index = PERSON_Z_INDEX;
}

function Horde(count)
{
    this.people = [];
    for (let i = 0; i < count; ++i)
    {
        let p = new Person([rand(-3, 3), rand(-3, 3)]);
        this.people.push(p);
    }
}

function personal_space_force(people, index, scalar)
{
    let force = [0, 0];

    for (let i = 0; i < people.length; ++i)
    {
        if (i == index)
        {
            continue;
        }

        let delta = sub2d(people[index].pos, people[i].pos);
        let d = norm2d(delta);
        let u = unit2d(delta);
        if (d > 12)
        {
            continue;
        }

        force = add2d(force, mult2d(u, d < 1 ? 10 : 1 / d));
    }

    return mult2d(force, scalar);
}

function seek_position_force(people, index, position, scalar)
{
    let force = [0, 0];
    if (position == null)
    {
        return force;
    }

    for (let i = 0; i < people.length; ++i)
    {
        if (i == index)
        {
            continue;
        }

        let delta = sub2d(position, people[index].pos);
        let d = norm2d(delta);
        if (d < 14)
        {
            continue;
        }

        force = add2d(force, delta);
    }

    return mult2d(force, scalar);
}

Horde.prototype.step = function(dt, seek_pos)
{
    // let seek_pos = [0, 0];

    for (let i = 0; i < this.people.length; ++i)
    {
        let p = this.people[i];
    
        let acc = [0, 0];
        let c = 0.25;

        acc = add2d(acc, personal_space_force(this.people, i, 100 * c));
        acc = add2d(acc, seek_position_force(this.people, i, seek_pos, 0.01 * c));

        // cap velocity norm

        p.vel = add2d(p.vel, mult2d(acc, dt));

        if (norm2d(acc) < 1)
        {
            p.vel = [0, 0];
        }

        let vnorm = norm2d(p.vel);
        let vu = unit2d(p.vel);
        p.vel = mult2d(vu, Math.min(vnorm, p.max_vel));

        if (norm2d(p.vel) < 5)
        {
            p.vel = [0, 0];
        }

        p.step(dt);
    }

    // for (let i = 0; i < this.people.length; ++i)
    // {
    //     for (let j = i + 1; j < this.people.length; ++j)
    //     {
    //         let delta = sub2d(this.people[i].pos, this.people[j].pos)
    //         let d = norm2d(delta);
    //         if (d < 8)
    //         {
    //             let nudge = unit2d(delta);
    //             this.people[i].pos = add2d(this.people[i].pos, nudge);
    //             this.people[j].pos = sub2d(this.people[j].pos, nudge);
    //         }
    //     }
    // }

    // for (let p of this.people)
    // {
    //     let d = sub2d(seek_pos, p.pos);
    //     let u = unit2d(d);
    //     if (norm2d(d) > 5)
    //     {
    //         let ds = mult2d(u, Math.min(p.max_vel, norm2d(d)));
    //         p.pos = add2d(p.pos, mult2d(ds, dt));
    //     }
    // }
}

Horde.prototype.render = function(rctx)
{
    for (let p of this.people)
    {
        p.render(rctx);
    }
    let positions = this.people.map(p => p.pos);
    let aabb = aabb_from_points(positions);
    aabb.draw(rctx, "lightgrey", -1);
}
