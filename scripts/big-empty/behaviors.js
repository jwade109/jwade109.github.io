// behaviors.js

class Behaviors
{

static playerControlled(self, dt)
{
    ON_RELEASE.set(32, function(duration)
    {
        if (TARGET_OBJECT === self)
            self.launchTorpedo(null);
        else self.launchTorpedo(TARGET_OBJECT);
    });

    if (!GAME_OVER)
    {
        if (KEYPRESSES.has(16) || KEYPRESSES.has(87)) // shift/w
        {
            PLAYER_SHIP.applyForce(rot2d([self.max_acc*
                self.mass, 0], self.theta));
        }
        if (KEYPRESSES.has(65)) // a
        {
            self.applyMoment(self.max_alpha*self.izz);
        }
        else if (KEYPRESSES.has(68)) // d
        {
            self.applyMoment(-self.max_alpha*self.izz);
        }
        else self.applyMoment(-self.omega*self.izz);
    }

    if (KEYPRESSES.has(0)) // left click
    {
        for (let pdc of self.pdcs)
        {
            if (TARGET_OBJECT == null)
                pdc.fireAt([MOUSEX, MOUSEY]);
            else if (isNaN(pdc.intercept(TARGET_OBJECT)))
                pdc.fireAt([MOUSEX, MOUSEY]);
        }
    }

    if (KEYPRESSES.has(1)) // middle click
    {
        if (self.hasOwnProperty("railguns"))
        {
            for (let rg of self.railguns)
            {
                let angle = angle2d([1, 0],
                    sub2d([MOUSEX, MOUSEY], rg.globalPos()));
                rg.seek(dt, angle);
                rg.fire()
            }
        }
    }

    if (self.hasOwnProperty("railguns"))
    {
        for (let rg of self.railguns)
        {
            let angle = angle2d([1, 0],
                sub2d([MOUSEX, MOUSEY], rg.globalPos()));
            rg.seek(dt, angle);
        }
    }
}

static genericEnemy(self, dt)
{
    if (!self.hasOwnProperty("prevForces"))
        self.prevForces = [0, 0];

    let candidates = [], friendlies = [];
    for (let obj of WORLD)
    {
        if (!obj.trackable || !obj.isShip || obj == self) continue;
        if (obj.faction == self.faction)
            friendlies.push(obj);
        else candidates.push(obj);
    }

    if (candidates.length == 0 && GAME_OVER &&
        self != TARGET_OBJECT && TARGET_OBJECT != null)
        candidates.push(TARGET_OBJECT);

    if (candidates.length == 0)
    {
        let sumForce = [0, 0];
        for (let friend of friendlies)
        {
            let d = distance(self.pos, friend.pos);
            if (d < 4000)
            {
                let sep = mult2d(unit2d(sub2d(self.pos, friend.pos)),
                    1000000/d*self.mass);
                sumForce = add2d(sumForce, sep);
                let damping = mult2d(sub2d(friend.vel, self.vel), self.mass*20);
                sumForce = add2d(sumForce, damping);
                let cohere = mult2d(sub2d(friend.pos, self.pos), self.mass*3);
                sumForce = add2d(sumForce, cohere);
            }
        }
        if (GAME_OVER)
        {
            let seek = mult2d(sub2d(
                [MOUSEX, MOUSEY], self.pos), self.mass*15);
            sumForce = add2d(sumForce, seek);
            let damping = mult2d(sub2d([0, 0], self.vel), self.mass*40);
            sumForce = add2d(sumForce, damping);
        }
        let forceDamping = 0.1;
        self.forces = self.prevForces.slice();
        self.forces = mult2d(sub2d(sumForce, self.prevForces), forceDamping);
        self.align(angle2d([1, 0], self.forces), self.izz*60, self.izz*40);
        return;
    }

    let dist = Infinity, target;
    for (let c of candidates)
    {
        let d = distance(c.pos, self.pos);
        if (d < dist)
        {
            dist = d;
            target = c;
        }
    }

    if (dist < WORLD_RENDER_DISTANCE/2 && Math.random() < dt/1.7)
        self.launchTorpedo(target);
    if (Math.random() < 0.5) self.firePDC(target);

    let kp = 6, kd = 22, ks = 5000000, kpf = 2, ksf = 500000;
    let sumForce = [0, 0];

    for (let friend of friendlies)
    {
        let d = distance(self.pos, friend.pos);
        let sep = mult2d(unit2d(sub2d(self.pos, friend.pos)),
            ksf/d*self.mass);
        sumForce = add2d(sumForce, sep);
        if (d < 1000)
        {
            let cohere = mult2d(sub2d(friend.pos, self.pos), self.mass*kpf);
            sumForce = add2d(sumForce, cohere);
        }
    }

    let separation = mult2d(unit2d(sub2d(self.pos, target.pos)),
        ks/dist*self.mass);
    let damping = mult2d(sub2d(target.vel, self.vel), self.mass*kd);
    let seek = mult2d(sub2d(target.pos, self.pos), self.mass*kp);
    sumForce = add2d(add2d(add2d(separation, seek), damping), sumForce);

    let forceDamping = 0.1;
    self.forces = self.prevForces.slice();
    self.forces = mult2d(sub2d(sumForce, self.prevForces), forceDamping);

    if (norm2d(self.forces)/self.mass > MAX_LATERAL_ACCEL)
        self.align(angle2d([1, 0], self.forces), self.izz*60, self.izz*25);
    else
    {
        let angle = angle2d([1, 0], sub2d(target.pos, self.pos));
        self.align(angle, self.izz, self.izz);
    }

    self.prevForces = self.forces.slice();
}

static genericAlly(self, dt)
{
    if (!self.hasOwnProperty("prevForces"))
        self.prevForces = [0, 0];

    let candidates = [], friendlies = [], torpedoes = [];
    for (let obj of WORLD)
    {
        if (obj instanceof Torpedo &&
            (obj.faction.name != self.faction.name ||
            obj.target == self))
            torpedoes.push(obj);
        else if (!obj.trackable || !obj.isShip || obj == self)
            continue;
        else if (obj.faction == self.faction)
            friendlies.push(obj);
        else candidates.push(obj);
    }

    let sumForce = [0, 0];
    for (let friend of friendlies)
    {
        let d = distance(self.pos, friend.pos);
        if (d < 4000)
        {
            let sep = mult2d(unit2d(sub2d(self.pos, friend.pos)),
                500000/d*self.mass);
            sumForce = add2d(sumForce, sep);
        }
    }
    let seek = mult2d(sub2d(PLAYER_SHIP.pos, self.pos), self.mass*2);
    sumForce = add2d(sumForce, seek);
    let damping = mult2d(sub2d(PLAYER_SHIP.vel, self.vel), self.mass*10);
    sumForce = add2d(sumForce, damping);

    let forceDamping = 0.1;
    self.forces = self.prevForces.slice();
    self.forces = mult2d(sub2d(sumForce, self.prevForces), forceDamping);
    self.align(angle2d([1, 0], self.forces), self.izz*60, self.izz*25);

    let dist = Infinity, target;
    for (let c of candidates)
    {
        let d = distance(c.pos, self.pos);
        if (d < dist)
        {
            dist = d;
            target = c;
        }
    }

    if (dist < WORLD_RENDER_DISTANCE/2 && Math.random() < dt/5)
        self.launchTorpedo(target);
    if (Math.random() < 0.5) self.firePDC(target);
}

static pdcDefense(self, dt)
{
    let torpedoes = [];
    for (let obj of WORLD)
    {
        if (obj instanceof Torpedo &&
            (obj.faction.name != self.faction.name ||
            obj.target == self))
            torpedoes.push(obj);
    }

    for (let pdc of self.pdcs)
    {
        let dist = Infinity, torpedo;
        for (let t of torpedoes)
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

static railgunTargetScirocco(self, dt)
{
    if (!self.hasOwnProperty("railguns")) return;

    let closest = null, dist = Infinity;
    for (let obj of WORLD)
    {
        if (obj.isShip && obj.faction.name != self.faction.name)
        {
            let d = distance(self.pos, obj.pos);
            if (d < dist)
            {
                closest = obj;
                dist = d;
            }
        }
    }
    if (closest == null) return;


    let rvel = sub2d(closest.vel, self.vel);
    for (let gun of self.railguns)
    {
        let theta_t = interceptSolution(gun.globalPos(),
            rvel, self.pos, RAILGUN_VEL);
        let theta = -theta_t[0];
        if (!isNaN(theta))
            gun.seek(dt, theta);
    }
}

static repairFriendlies(self, dt)
{
    for (let obj of WORLD)
    {
        if (obj.isShip && obj.faction.name == self.faction.name &&
            obj.health < obj.max_health &&
            distance(obj.pos, self.pos) < BASILISK_REPAIR_RADIUS)
        {
            if (obj === self) obj.repair(BASILISK_REGEN_RATE*dt/10);
            else obj.repair(BASILISK_REGEN_RATE*dt);
            if (Math.random() > dt*13) return;
            let health = new Debris(
                obj.box.getRandom(), add2d(obj.vel,
                    [Math.random()*150 - 75, Math.random()*150 - 75]),
                Math.random()*2*Math.PI,
                Math.random()*2 - 1, SMALL_DEBRIS/100);
            health.nocollide = true;
            health.skin = function()
            {
                let width = 7;
                CTX.save();
                CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
                CTX.globalAlpha = 0.3;
                CTX.fillStyle = "green";
                CTX.beginPath();
                CTX.rect(-width*PIXELS/6, -width*PIXELS/2,
                    width*PIXELS/3, width*PIXELS);
                CTX.rect(-width*PIXELS/2, -width*PIXELS/6,
                    width*PIXELS, width*PIXELS/3);
                CTX.fill();
                CTX.restore()
            }
            WORLD.push(health);
        }
    }
}

}
