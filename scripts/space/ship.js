// ship.js

const PLAYER_INVINCIBLE = false;
const PLAYER_MAX_HEALTH = 2000;
const PASSIVE_REGEN = 0; // PLAYER_MAX_HEALTH/(60*3);
const INFINITE_FUEL = true;
const INFINITE_AMMO = false;
const PLAYER_MAX_MISSILES = 30;
const PLAYER_MAX_RAILGUN = 40;
const PLAYER_SHIP_MASS = 1;
const PLAYER_SHIP_MOMENT_INERTIA = 350;

class Ship
{
    constructor(pos, theta)
    {
        this.pos = pos;
        this.pos_prev = pos;
        this.vel = [0, 0];
        this.acc = [0, 0];

        this.theta = theta;
        this.omega = 0;
        this.alpha = 0;

        this.mass = 1;
        this.j = 300;
        this.torpedo_reload = 0;
        this.railgun_reload = RAILGUN_COOLDOWN;
        this.health = PLAYER_MAX_HEALTH;
        this.name = "\"Rocinante\"";

        this.width = 11; // 40/1.5;
        this.length = 42; // 144/1.5;
        this.radius = this.width/2;
        this.box = new Hitbox([[this.width/3, this.length/2],
                               [this.width/2, -this.length/2],
                               [-this.width/2, -this.length/2],
                               [-this.width/3, this.length/2]]);
        this.box.object = this;

        let tx = this.width*0.45;
        let ty = this.width*0.7;

        let small_thrust = 30;
        let main_thrust = 200;
        let small_width = 3;
        this.thrusters = [
            new Thruster([tx, ty], 0, small_thrust, small_width),
            new Thruster([tx, ty], Math.PI/2, small_thrust, small_width),
            new Thruster([-tx, ty], Math.PI/2, small_thrust, small_width),
            new Thruster([-tx, ty], Math.PI, small_thrust, small_width),
            new Thruster([-tx, -ty], Math.PI, small_thrust, small_width),
            new Thruster([-tx, -ty], 3*Math.PI/2, small_thrust, small_width),
            new Thruster([tx, -ty], 3*Math.PI/2, small_thrust, small_width),
            new Thruster([tx, -ty], 0, small_thrust, small_width),
            new Thruster([0, -this.length/2],
                -Math.PI/2, main_thrust, this.width)];
        for (let t of this.thrusters) t.drawbell = false;

        let range = [-Math.PI/2.2, Math.PI/2.2];
        this.pdcs =
            [new PointDefenseCannon(
                [this.length/4, this.width*0.36], -Math.PI/2.4, this, range, 500),
             new PointDefenseCannon(
                [this.length/4, -this.width*0.36], Math.PI/2.4, this, range, 500),
             new PointDefenseCannon(
                [-this.length/6, -this.width*0.44], Math.PI/2, this, range, 500),
             new PointDefenseCannon(
                [-this.length/6, this.width*0.44], -Math.PI/2, this, range, 500)];

        this.world = null;
        this.gray = "#909090";
    }

    launchTorpedo()
    {
        if (TARGET_OBJECT == null)
        {
            throwAlert("Torpedoes require target lock.", ALERT_DISPLAY_TIME);
            return;
        }
        if (this.torpedo_reload > 0) return;
        this.torpedo_reload = 0.12;
        this.side = !this.side;

        if (distance(TARGET_OBJECT.pos, PLAYER_SHIP.pos) < TORPEDO_MIN_RANGE)
        {
            throwAlert("Cannot fire torpedo -- " +
                "Target closer than minimum tracking radius.",
                ALERT_DISPLAY_TIME);
            return;
        }

        let poff = rot2d([0, this.length/2], this.theta + Math.PI/2);
        let voff = rot2d([0, 100], this.theta + Math.PI/2);

        let tpos = this.pos.slice();
        let tvel = this.vel.slice();
        tpos[0] += poff[0];
        tpos[1] += poff[1];
        tvel[0] += voff[0];
        tvel[1] += voff[1];
        let torp = new Torpedo(tpos, tvel, this.theta,
            TORPEDO_THRUST);
        torp.target = TARGET_OBJECT;
        torp.origin = this;
        torp.world = this.world;
        this.world.push(torp);
    }

    fireRailgun()
    {
        if (this.railgun_reload > 0)
        {
            // throwAlert("Cannot fire railgun -- still charging",
            //     ALERT_DISPLAY_TIME);
            return;
        }
        this.railgun_reload = RAILGUN_COOLDOWN;
        let vel = rot2d([RAILGUN_VEL, 0], this.theta);
        let dv = rot2d([-60, 0], this.theta);
        vel[0] += this.vel[0];
        vel[1] += this.vel[1];
        let r = new Railgun(this.pos.slice(), vel, this.theta, 12);
        r.world = this.world;
        r.origin = this;
        world.push(r);
        this.vel[0] += dv[0];
        this.vel[1] += dv[1];
    }

    firePDC()
    {
        for (let pdc of this.pdcs)
        {
            if (TARGET_OBJECT == null) pdc.fireAt(MOUSEPOS);
            else pdc.intercept(TARGET_OBJECT);
        }
    }

    matchVelocity(target)
    {
        let norm = 0;
        let desired_angle = this.theta;
        if (target != null)
        {
            let rvel = sub2d(target.vel, PLAYER_SHIP.vel);
            norm = norm2d(rvel);
            desired_angle = angle2d([1, 0], rvel);
            if (norm < 2) desired_angle = this.theta;
        }
        let error = desired_angle - this.theta;
        while (error > Math.PI) error -= Math.PI*2;
        while (error < -Math.PI) error += Math.PI*2;
        let alpha = 10*error - 5*this.omega;
        if (alpha > 0.05)
        {
            PLAYER_SHIP.thrusters[2].firing = true;
            PLAYER_SHIP.thrusters[6].firing = true;
            PLAYER_SHIP.thrusters[0].firing = true;
            PLAYER_SHIP.thrusters[4].firing = true;
        }
        else if (alpha < -0.05)
        {
            PLAYER_SHIP.thrusters[1].firing = true;
            PLAYER_SHIP.thrusters[5].firing = true;
            PLAYER_SHIP.thrusters[3].firing = true;
            PLAYER_SHIP.thrusters[7].firing = true;
        }
        if (Math.abs(error) < 5/180*Math.PI &&
            Math.abs(this.omega) < 5/180*Math.PI)
        {
            if (norm > 50) this.thrusters[8].firing = true;
            else if (norm > 5)
            {
                this.thrusters[5].firing = true;
                this.thrusters[6].firing = true;
            }
        }

    }

    draw(ctx)
    {
        if (DRAW_TRACE)
        {
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.moveTo(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
            ctx.lineTo(this.pos_prev[0]*PIXELS, this.pos_prev[1]*PIXELS);
            ctx.stroke();
        }

        ctx.save(); // save global reference frame
        ctx.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);

        if (DRAW_FIRING_ARC)
        {
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.arc(0, 0, TORPEDO_MIN_RANGE*PIXELS, 0, Math.PI*2);
            ctx.stroke();
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = "black";
            ctx.beginPath();
            ctx.arc(0, 0, PDC_MAX_RANGE*PIXELS, 0, Math.PI*2);
            ctx.stroke();
        }

        ctx.rotate(-this.theta - Math.PI/2)
        // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE FRAME

        for (let t of this.thrusters)
        {
            if (this.fuel <= t.thrust) t.firing = false;
            t.world = this.world;
            t.draw(ctx);
        }

        ctx.save();
        ctx.rotate(Math.PI/2);

        if (!firemode)
        {
            ctx.save();
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = "red";
            if (this.railgun_reload > 0)
                ctx.setLineDash([10*PIXELS, 20*PIXELS]);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(1000*PIXELS, 0);
            ctx.stroke();
            ctx.restore();
        }

        let off = this.width/2;
        ctx.strokeStyle = "black";
        ctx.fillStyle = this.gray;

        ctx.globalAlpha = 1;
        ctx.beginPath();

        let y0 =  0.50*this.width*PIXELS;
        let y1 =  0.44*this.width*PIXELS;
        let y2 =  0.36*this.width*PIXELS;
        let y3 =  0.20*this.width*PIXELS;

        let x0 = -0.50*this.length*PIXELS;
        let x1 = -0.40*this.length*PIXELS;
        let x2 = -0.25*this.length*PIXELS;
        let x3 = -0.07*this.length*PIXELS;
        let x4 =  0.00;
        let x5 =  0.20*this.length*PIXELS;
        let x6 =  0.30*this.length*PIXELS;
        let x7 =  0.50*this.length*PIXELS;

        ctx.moveTo(x0, y2);
        ctx.lineTo(x1, y3);
        ctx.lineTo(x1, y0);
        ctx.lineTo(x2, y0);
        ctx.lineTo(x2, y1);
        ctx.lineTo(x3, y1);
        ctx.lineTo(x3, y2);
        ctx.lineTo(x4, y0);
        ctx.lineTo(x5, y0);
        ctx.lineTo(x5, y2);
        ctx.lineTo(x6, y2);
        ctx.lineTo(x7, y3);
        ctx.lineTo(x7, -y3);
        ctx.lineTo(x6, -y2);
        ctx.lineTo(x5, -y2);
        ctx.lineTo(x5, -y0);
        ctx.lineTo(x4, -y0);
        ctx.lineTo(x3, -y2);
        ctx.lineTo(x3, -y1);
        ctx.lineTo(x2, -y1);
        ctx.lineTo(x2, -y0);
        ctx.lineTo(x1, -y0);
        ctx.lineTo(x1, -y3);
        ctx.lineTo(x0, -y2);
        ctx.lineTo(x0, y2);

        ctx.moveTo(x1, y3);
        ctx.lineTo(x1, -y3);
        ctx.moveTo(x2, y3);
        ctx.lineTo(x2, -y3);
        ctx.moveTo(x3, y3);
        ctx.lineTo(x3, -y3);
        ctx.moveTo(x5, y3);
        ctx.lineTo(x5, -y3);

        ctx.moveTo(x7, y3);
        ctx.lineTo(x7 + this.width*0.3*PIXELS, y3);
        ctx.moveTo(x7, -y3);
        ctx.lineTo(x7 + this.width*0.4*PIXELS, -y3);
        ctx.moveTo(x7, -y3 + this.width*0.1*PIXELS);
        ctx.lineTo(x7 + this.width*0.2*PIXELS, -y3 + this.width*0.1*PIXELS);

        ctx.fill();
        ctx.fillStyle = "black";
        ctx.fillRect(-this.length*0.4*PIXELS, -this.width*0.15*PIXELS,
                      this.length*0.9*PIXELS, this.width*0.3*PIXELS);
        ctx.fillStyle = "#CCCCCC";
        ctx.fillRect(-this.length*0.4*PIXELS, -this.width*0.1*PIXELS,
                      this.length*0.9*PIXELS, this.width*0.2*PIXELS);
        ctx.stroke();

        ctx.restore();
        ctx.restore();

        if (DRAW_HITBOX) this.box.draw(ctx);

        for (let pdc of this.pdcs) pdc.draw(ctx);
    }

    step(dt)
    {
        this.pos_prev = this.pos.slice();
        if (this.torpedo_reload > 0) this.torpedo_reload -= dt;
        if (this.railgun_reload > 0) this.railgun_reload -= dt;
        if (this.pdc_reload > 0) this.pdc_reload -= dt;
        let bodyacc = [0, 0];
        let moment = 0;
        let dfuel = 0;
        for (let t of this.thrusters)
        {
            if (t.firing && (this.fuel >= t.thrust || INFINITE_FUEL))
            {
                if (!INFINITE_FUEL) this.fuel -= t.thrust;
                let thrustv = [-t.thrust*Math.sin(t.theta),
                               -t.thrust*Math.cos(t.theta)];
                bodyacc[0] += thrustv[0]/this.mass;
                bodyacc[1] += thrustv[1]/this.mass;

                moment += thrustv[0]*t.pos[0] - thrustv[1]*t.pos[1];
            }

            t.firing = false;
        }

        this.acc = this.b2g(bodyacc);
        this.alpha += moment/this.j;

        this.vel[0] += this.acc[0]*dt;
        this.vel[1] += this.acc[1]*dt;
        this.pos[0] += this.vel[0]*dt;
        this.pos[1] += this.vel[1]*dt;
        this.omega += this.alpha*dt;
        this.theta += this.omega*dt;

        this.acc = [0, 0];
        this.alpha = 0;

        this.box.pos = this.pos.slice();
        this.box.theta = this.theta;

        if (this.health < PLAYER_MAX_HEALTH)
            this.health += PASSIVE_REGEN*dt;
    }

    damage(d)
    {
        if (PLAYER_INVINCIBLE) return;
        this.health -= d;

        function transition(x, health)
        {
            return health/PLAYER_MAX_HEALTH <= x &&
                (health + d)/PLAYER_MAX_HEALTH > x && health > 0;
        }

        if (transition(0.3, this.health) || transition(0.1, this.health))
            throwAlert("Warning: hull integrity at " +
                Math.round(100*this.health/PLAYER_MAX_HEALTH) + "%",
                ALERT_DISPLAY_TIME);
        if (this.health < 0) this.explode();
        else if (Math.random() < 0.05*d)
        {
            let num_debris = 3 + Math.random()*3;
            for (let i = 0; i < num_debris; ++i)
            {
                let pos = this.pos.slice();
                let vel = this.vel.slice();
                vel[0] += Math.random()*200 - 100;
                vel[1] += Math.random()*200 - 100;
                let size = Math.random()*4;
                let deb = new Debris(pos, vel,
                    this.theta,
                    this.omega + Math.random()*5 - 2.5, size);
                deb.world = this.world;
                deb.name = this.name;
                deb.color = "#909090";
                if (Math.random() < 0.2)
                    deb.color = "#CCCCCC";
                this.world.push(deb);
            }
        }
    }

    explode()
    {
        let num_debris = 15 + Math.random()*7;
        for (let i = 0; i < num_debris; ++i)
        {
            let pos = this.pos.slice();
            let vel = this.vel.slice();
            vel[0] += Math.random()*200 - 100;
            vel[1] += Math.random()*200 - 100;
            let size = Math.random()*this.width/2 + this.width/2;
            let deb = new Debris(pos, vel,
                this.theta,
                this.omega + Math.random()*5 - 2.5, size);
            deb.world = this.world;
            deb.name = this.name;
            deb.color = "#909090";
            if (Math.random() < 0.2)
                deb.color = "#CCCCCC";
            this.world.push(deb);
        }
        this.acc = [0, 0];
        this.alpha = 0;
        this.omega = 0;
        this.health = -Infinity;
        this.remove = true;
        for (let t of this.thrusters) t.firing = false;
        GAME_OVER = true;
        throwAlert(this.name + " was lost with all hands.", Infinity);
    }

    b2g(v)
    {
        return rot2d(v, this.theta);
    }

    g2b(v)
    {
        return rot2d(v, -this.theta);
    }
}
