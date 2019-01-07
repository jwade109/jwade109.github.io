// controller.js

class Controller
{

static player(dt)
{

}

static morriganEnemy(dt)
{
    if (!this.hasOwnProperty("prevForces"))
        this.prevForces = [0, 0];

    let candidates = [], friendlies = [];
    for (let obj of WORLD)
    {
        if (!obj.trackable || !obj.isShip || obj == this) continue;
        if (obj.faction == this.faction)
            friendlies.push(obj);
        else candidates.push(obj);
    }

    if (candidates.length == 0)
    {
        let sumForce = [0, 0];
        for (let friend of friendlies)
        {
            let d = distance(this.pos, friend.pos);
            if (d < 4000)
            {
                let sep = mult2d(unit2d(sub2d(this.pos, friend.pos)),
                    1000000/d*this.mass);
                sumForce = add2d(sumForce, sep);
                let damping = mult2d(sub2d(friend.vel, this.vel), this.mass*20);
                sumForce = add2d(sumForce, damping);
                let cohere = mult2d(sub2d(friend.pos, this.pos), this.mass*3);
                sumForce = add2d(sumForce, cohere);
            }
            if (GAME_OVER)
            {
                let seek = mult2d(sub2d(
                    [MOUSEX, MOUSEY], this.pos), this.mass*10);
                sumForce = add2d(sumForce, seek);
                let damping = mult2d(sub2d([0, 0], this.vel), this.mass*30);
                sumForce = add2d(sumForce, damping);
            }
        }
        let forceDamping = 0.1;
        this.forces = this.prevForces.slice();
        this.forces = mult2d(sub2d(sumForce, this.prevForces), forceDamping);
        this.align(angle2d([1, 0], this.forces), this.izz*60, this.izz*25);
        return;
    }

    let dist = Infinity, target;
    for (let c of candidates)
    {
        let d = distance(c.pos, this.pos);
        if (d < dist)
        {
            dist = d;
            target = c;
        }
    }

    if (dist < WORLD_RENDER_DISTANCE/2 && Math.random() < dt/1.7)
        this.launchTorpedo(target);
    if (Math.random() < 0.5) this.firePDC(target);

    let kp = 6, kd = 22, ks = 5000000, kpf = 2, ksf = 500000;
    let sumForce = [0, 0];

    for (let friend of friendlies)
    {
        let d = distance(this.pos, friend.pos);
        let sep = mult2d(unit2d(sub2d(this.pos, friend.pos)),
            ksf/d*this.mass);
        sumForce = add2d(sumForce, sep);
        if (d < 1000)
        {
            let cohere = mult2d(sub2d(friend.pos, this.pos), this.mass*kpf);
            sumForce = add2d(sumForce, cohere);
        }
    }

    let separation = mult2d(unit2d(sub2d(this.pos, target.pos)),
        ks/dist*this.mass);
    let damping = mult2d(sub2d(target.vel, this.vel), this.mass*kd);
    let seek = mult2d(sub2d(target.pos, this.pos), this.mass*kp);
    sumForce = add2d(add2d(add2d(separation, seek), damping), sumForce);

    let forceDamping = 0.1;
    this.forces = this.prevForces.slice();
    this.forces = mult2d(sub2d(sumForce, this.prevForces), forceDamping);

    if (norm2d(this.forces)/this.mass > MAX_LATERAL_ACCEL)
        this.align(angle2d([1, 0], this.forces), this.izz*60, this.izz*25);
    else
    {
        let angle = angle2d([1, 0], sub2d(target.pos, this.pos));
        this.align(angle, this.izz, this.izz);
    }

    this.prevForces = this.forces.slice();
}

static morriganAlly(dt)
{
    if (!this.hasOwnProperty("prevForces"))
        this.prevForces = [0, 0];

    let candidates = [], friendlies = [];
    for (let obj of WORLD)
    {
        if (!obj.trackable || !obj.isShip || obj == this) continue;
        if (obj.faction == this.faction)
            friendlies.push(obj);
        else candidates.push(obj);
    }

    let sumForce = [0, 0];
    for (let friend of friendlies)
    {
        let d = distance(this.pos, friend.pos);
        if (d < 4000)
        {
            let sep = mult2d(unit2d(sub2d(this.pos, friend.pos)),
                1000000/d*this.mass);
            sumForce = add2d(sumForce, sep);
            let damping = mult2d(sub2d(friend.vel, this.vel), this.mass*20);
            sumForce = add2d(sumForce, damping);
            let cohere = mult2d(sub2d(friend.pos, this.pos), this.mass*3);
            sumForce = add2d(sumForce, cohere);
        }
        // if (GAME_OVER)
        // {
        //     let seek = mult2d(sub2d(
        //         [MOUSEX, MOUSEY], this.pos), this.mass*4);
        //     sumForce = add2d(sumForce, seek);
        //     let damping = mult2d(sub2d([0, 0], this.vel), this.mass*20);
        //     sumForce = add2d(sumForce, damping);
        // }
    }
    let forceDamping = 0.1;
    this.forces = this.prevForces.slice();
    this.forces = mult2d(sub2d(sumForce, this.prevForces), forceDamping);
    this.align(angle2d([1, 0], this.forces), this.izz*60, this.izz*25);

    let dist = Infinity, target;
    for (let c of candidates)
    {
        let d = distance(c.pos, this.pos);
        if (d < dist)
        {
            dist = d;
            target = c;
        }
    }

    if (dist < WORLD_RENDER_DISTANCE/2 && Math.random() < dt/1.7)
        this.launchTorpedo(target);
    if (Math.random() < 0.5) this.firePDC(target);
}

static amunRaEnemy(dt)
{
    if (PLAYER_SHIP.remove)
    {
        this.applyMoment(-this.omega*this.izz);
        this.applyForce(rot2d([this.max_acc*this.mass, 0], this.theta));
        return;
    }

    let closest = null, min = Infinity;
    for (let obj of WORLD)
    {
        if (obj instanceof Torpedo && obj.target == this)
        {
            let dist = distance(this.pos, obj.pos);
            if (dist < min)
            {
                min = dist;
                closest = obj;
            }
        }
    }

    let dist = distance(PLAYER_SHIP.pos, this.pos);
    if (this.torpedo_reload > 0) this.torpedo_reload -= dt;
    else if (dist > AMUN_RA_PDC_RANGE && dist < WORLD_RENDER_DISTANCE)
    {
        this.launchTorpedo(PLAYER_SHIP);
        this.torpedo_reload = Math.random()*1.2;
        if (Math.random() < 0.4)
            this.torpedo_reload = Math.random()*4 + 8;
    }

    if (this.pdc_reload > 0) this.pdc_reload -= dt;
    else if (closest != null)
        this.firePDC(closest);
    else if (Math.random() < 0.5)
        this.firePDC(PLAYER_SHIP);

    let dx = PLAYER_SHIP.pos[0] - this.pos[0];
    let dy = PLAYER_SHIP.pos[1] - this.pos[1];
    let bodyacc = [-(1800 - dist)/10, 0];
    this.forces = rot2d(mult2d(bodyacc, this.mass), this.theta);
    this.forces[0] += (PLAYER_SHIP.vel[0] - this.vel[0])/3*this.mass;
    this.forces[1] += (PLAYER_SHIP.vel[1] - this.vel[1])/3*this.mass;
    let theta = angle2d(this.pos, PLAYER_SHIP.pos) - this.theta;
    while (theta > Math.PI) theta -= Math.PI*2;
    while (theta < -Math.PI) theta += Math.PI*2;
    this.moments = (theta - this.omega)*this.izz;

    this.box.pos = this.pos.slice();
    this.box.theta = this.theta;

    dist = distance(this.pos, PLAYER_SHIP.pos);
    let opacity = Math.max(0, Math.min(1 - (dist - 750)/100, 1));
    if (this === TARGET_OBJECT && opacity == 0 && Math.random() < dt)
    {
        TARGET_OBJECT = null;
        throwAlert("Cannot maintain lock on cloaked vessel.",
            ALERT_DISPLAY_TIME);
    }
}

static donnagerEnemy(dt)
{
    let candidates = [];
    for (let obj of WORLD)
    {
        if (obj instanceof Debris) continue;
        if (!obj.trackable) continue;
        if (obj.faction == this.faction) continue;
        candidates.push(obj);
    }

    for (let pdc of this.pdcs)
    {
        let best = null, min = Infinity;
        for (let obj of candidates)
        {
            let dist = distance(obj.pos, pdc.globalPos());
            if (dist < min)
            {
                best = obj;
                min = dist;
            }
        }
        if (best != null) pdc.intercept(best);
    }

    this.applyForce(rot2d([9.81*this.mass, 0], this.theta));
}

static pointDefenseAutomation(dt)
{
    let enemyShips = [], incomingTorpedoes = [];
    for (let obj of WORLD)
    {
        if (obj instanceof Debris) continue;
        else if (obj instanceof Torpedo && obj.target == this)
            incomingTorpedoes.push(obj);
        else if (!obj.trackable) continue;
        else if (obj.faction == this.faction) continue;
        else if (obj.isShip) enemyShips.push(obj);
    }

    for (let pdc of this.pdcs)
    {
        let dist = Infinity, torpedo;
        for (let t of incomingTorpedoes)
        {
            let d = distance(t.pos, pdc.globalPos())
            if (d < dist)
            {
                dist = d;
                torpedo = t;
            }
        }
        pdc.intercept(torpedo);
    }
}

}
