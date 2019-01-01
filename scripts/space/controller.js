// controller.js

class Controller
{

static player(dt)
{

}

static morriganEnemy(dt)
{
    let candidates = [];
    for (let obj of WORLD)
    {
        if (obj instanceof Debris) continue;
        if (obj instanceof Torpedo) continue;
        if (!obj.trackable) continue;
        if (obj.faction == this.faction) continue;
        candidates.push(obj);
    }

    if (candidates.length == 0)
    {
        this.applyMoment(-this.theta*this.izz - this.omega*this.izz);
        this.applyForce([this.max_acc*this.mass, 0]);
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

    let bodyacc = [-(600 - dist)*10, 0];
    let theta = angle2d(this.pos, target.pos);
    while (theta > Math.PI) theta -= Math.PI*2;
    while (theta < -Math.PI) theta += Math.PI*2;
    // this.align(theta, this.izz*10, this.izz*6);

    let force = add2d(rot2d(mult2d(bodyacc, this.mass), theta),
                    [(target.vel[0] - this.vel[0])*this.mass*50,
                     (target.vel[1] - this.vel[1])*this.mass*50]);

    force = add2d(force, mult2d(target.acc, this.mass));
    this.applyForce(force);

    if (norm2d(target.acc) > MAX_LATERAL_ACCEL)
        this.align(target.theta, this.izz*10, this.izz*6);
    else if (norm2d(force)/this.mass > MAX_LATERAL_ACCEL)
        this.align(angle2d([1, 0], force), this.izz*10, this.izz*6);
    else
    {
        let angle = angle2d([1, 0], sub2d(target.pos, this.pos));
        this.align(angle, this.izz*10, this.izz*6);
    }
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

    // if (enemyShips.length == 0)
    // {
    //     this.applyMoment(-this.theta*this.izz - this.omega*this.izz);
    //     this.applyForce([this.max_acc*this.mass, 0]);
    //     return;
    // }
    //
    // let dist = Infinity, target;
    // for (let c of enemyShips)
    // {
    //     let d = distance(c.pos, this.pos);
    //     if (d < dist)
    //     {
    //         dist = d;
    //         target = c;
    //     }
    // }

    // if (dist < WORLD_RENDER_DISTANCE/2)
    //     this.launchTorpedo(target);

    // let bodyacc = [-(600 - dist)*10, 0];
    // let theta = angle2d(this.pos, target.pos);
    // while (theta > Math.PI) theta -= Math.PI*2;
    // while (theta < -Math.PI) theta += Math.PI*2;
    // // this.align(theta, this.izz*10, this.izz*6);
    //
    // let force = add2d(rot2d(mult2d(bodyacc, this.mass), theta),
    //                 [(target.vel[0] - this.vel[0])*this.mass*50,
    //                  (target.vel[1] - this.vel[1])*this.mass*50]);
    // this.applyForce(force);
    // if (norm2d(force)/this.mass > MAX_LATERAL_ACCEL/3)
    //     this.align(angle2d([1, 0], force), this.izz*10, this.izz*6);
    // else
    // {
    //     let angle = angle2d([1, 0], sub2d(target.pos, this.pos));
    //     this.align(angle, this.izz*10, this.izz*6);
    // }
}

}
