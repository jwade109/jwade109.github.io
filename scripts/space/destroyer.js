// destroyer.js

const DESTROYER_MAX_HEALTH = 350;
const DESTROYER_MASS = 1;
const DESTROYER_MOMENT_INERTIA = 500;
const DESTROYER_EXPLOSION_RADIUS = 120;

class Destroyer
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

        this.mass = DESTROYER_MASS;
        this.j = DESTROYER_MOMENT_INERTIA;
        this.torpedo_reload = 0;
        this.side = true;
        this.health = DESTROYER_MAX_HEALTH;
        this.permanent = true;
        this.name = "MCRN \"" +
            NAMES[Math.floor(Math.random()*NAMES.length)] + "\"";

        this.width = 9;
        this.length = 31;
        this.radius = this.width/2;
        this.box = new Hitbox([[this.width/2, this.length/2],
                               [this.width/2, -this.length/2],
                               [-this.width/2, -this.length/2],
                               [-this.width/2, this.length/2]]);
        this.box.object = this;

        this.engine = new Thruster([0, -this.length/2], -Math.PI/2,
            this.mass, this.width);
        this.engine.drawbell = false;

        let range = [-Math.PI/2.2, Math.PI/2.2];
        this.pdcs =
            [new PointDefenseCannon(
                [-this.length/6, -this.width*0.5], Math.PI/2.5, this, range, 350),
             new PointDefenseCannon(
                [-this.length/6, this.width*0.5], -Math.PI/2.5, this, range, 350)];

        this.world = null;
        this.is_enemy = true;

        this.gray = "#606060";
        this.orange = "#8D3F32";
    }

    launchTorpedo()
    {
        let poff = rot2d([0, this.length/2], this.theta + Math.PI/2);
        let voff = rot2d([0, 100], this.theta + Math.PI/2);
        let tpos = this.pos.slice();
        let tvel = this.vel.slice();
        tpos[0] += poff[0];
        tpos[1] += poff[1];
        tvel[0] += voff[0];
        tvel[1] += voff[1];
        let torp = new Torpedo(tpos, tvel, this.theta, TORPEDO_THRUST, 7);
        torp.origin = this;
        torp.target = PLAYER_SHIP;
        torp.world = this.world;
        this.world.push(torp);
    }

    firePDC(target)
    {
        for (let pdc of this.pdcs)
        {
            pdc.intercept(target);
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

        // ctx.save();
        // if (LOCK_CAMERA) ctx.rotate(-PLAYER_SHIP.theta);
        // ctx.globalAlpha = 0.4;
        // ctx.strokeStyle = "red";
        // ctx.strokeRect(-this.length/2, -this.length/2,
        //                this.length, this.length);
        // ctx.restore();

        ctx.rotate(-this.theta);
        // EVERYTHING BELOW DRAWN IN VEHICLE REFERENCE FRAME

        let x0 = -0.50*this.length*PIXELS;
        let x1 = -0.40*this.length*PIXELS;
        let x2 = -0.37*this.length*PIXELS;
        let x3 = -0.32*this.length*PIXELS;
        let x4 = -0.25*this.length*PIXELS;
        let x5 = -0.10*this.length*PIXELS;
        let x6 =  0.10*this.length*PIXELS;
        let x7 =  0.20*this.length*PIXELS;
        let x8 =  0.25*this.length*PIXELS;
        let x9 =  0.3*this.length*PIXELS;
        let x10 = 0.50*this.length*PIXELS;
        let x11 = 0.65*this.length*PIXELS;

        let y0 = 0.05*this.width*PIXELS;
        let y1 = 0.15*this.width*PIXELS;
        let y2 = 0.25*this.width*PIXELS;
        let y3 = 0.35*this.width*PIXELS;
        let y4 = 0.50*this.width*PIXELS;

        ctx.globalAlpha = 1;
        ctx.strokeStyle = "black";
        ctx.fillStyle = this.gray;
        ctx.beginPath();
        ctx.moveTo(x0, y3);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x1, y3);
        ctx.lineTo(x3, y4);
        ctx.lineTo(x5, y4);
        ctx.lineTo(x6, y3);
        ctx.lineTo(x7, y4);
        ctx.lineTo(x10, y3);
        ctx.lineTo(x10, -y3);
        ctx.lineTo(x7, -y4);
        ctx.lineTo(x6, -y3);
        ctx.lineTo(x5, -y4);
        ctx.lineTo(x3, -y4);
        ctx.lineTo(x1, -y3);
        ctx.lineTo(x1, -y1);
        ctx.lineTo(x0, -y3);
        ctx.lineTo(x0, y3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.orange;
        ctx.beginPath();
        // ctx.rect(x5, y2, x4 - x2, y4 - y2);
        // ctx.rect(x5, -y2 - (y4 - y2), x4 - x2, y4 - y2);
        ctx.rect(-0.3*this.length*PIXELS, -0.15*this.width*PIXELS,
                        0.6*this.length*PIXELS, 0.3*this.width*PIXELS);
        ctx.rect(-0.3*this.length*PIXELS, -0.15*this.width*PIXELS,
                        0.6*this.length*PIXELS, 0.3*this.width*PIXELS);
        ctx.fill();
        ctx.stroke();

        ctx.moveTo(x10, y1);
        ctx.lineTo(x11, y1);
        ctx.stroke();


        ctx.rotate(-Math.PI/2);
        this.engine.draw(ctx);
        ctx.restore();
        if (DRAW_HITBOX) this.box.draw(ctx);
        for (let pdc of this.pdcs) pdc.draw(ctx);
    }

    step(dt)
    {
        if (PLAYER_SHIP.remove)
        {
            this.alpha = -this.omega;
            this.acc = this.b2g([10, 0]);

            this.vel[0] += this.acc[0]*dt;
            this.vel[1] += this.acc[1]*dt;
            this.pos[0] += this.vel[0]*dt;
            this.pos[1] += this.vel[1]*dt;
            this.omega += this.alpha*dt;
            this.theta += this.omega*dt;

            this.acc = [0, 0];
            this.alpha = 0;
            this.engine.firing = true;

            return;
        }

        let closest = null, min = Infinity;
        for (let obj of this.world)
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
        else if (TORPEDO_MIN_RANGE < dist && dist < world.render_distance)
        {
            this.launchTorpedo();
            this.torpedo_reload = Math.random()*4 + 2;
        }

        if (this.pdc_reload > 0) this.pdc_reload -= dt;
        else if (closest != null)
            this.firePDC(closest);
        else if (Math.random() < 0.5)
            this.firePDC(PLAYER_SHIP);

        let dx = PLAYER_SHIP.pos[0] - this.pos[0];
        let dy = PLAYER_SHIP.pos[1] - this.pos[1];
        let bodyacc = [-(TORPEDO_MIN_RANGE + 100 - dist)/10, 0];
        if (bodyacc[0] > 4) this.engine.firing = true;
        else this.engine.firing = false;
        this.acc = this.b2g(bodyacc);
        this.acc[0] += (PLAYER_SHIP.vel[0] - this.vel[0])/3;
        this.acc[1] += (PLAYER_SHIP.vel[1] - this.vel[1])/3;
        let theta = angle2d(this.pos, PLAYER_SHIP.pos) - this.theta;
        while (theta > Math.PI) theta -= Math.PI*2;
        while (theta < -Math.PI) theta += Math.PI*2;
        this.alpha = theta - this.omega;

        this.pos_prev = this.pos.slice();
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
    }

    explode()
    {
        if (this.remove) return;
        let num_debris = 15 + Math.random()*7;
        for (let i = 0; i < num_debris; ++i)
        {
            let pos = this.pos.slice();
            let vel = this.vel.slice();
            vel[0] += Math.random()*200 - 100;
            vel[1] += Math.random()*200 - 100;
            let size = Math.random()*this.width/2 + this.width/2;
            let deb = new Debris(pos, vel,
                this.theta, this.omega + Math.random()*5 - 2.5, size);
            deb.world = this.world;
            deb.name = this.name;
            deb.color = this.gray;
            if (Math.random() < 0.4) deb.color = this.orange;
            this.world.push(deb);
        }
        this.remove = true;
        world.push(new Explosion(this.pos.slice(), this.vel.slice(),
            DESTROYER_EXPLOSION_RADIUS));
        throwAlert(this.name + " (" + this.constructor.name +
            ") was destroyed.", ALERT_DISPLAY_TIME);
    }

    damage(d)
    {
        this.health -= d;
        if (this.health < 1) this.explode();
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

    b2g(v)
    {
        return rot2d(v, this.theta);
    }

    g2b(v)
    {
        return rot2d(v, -this.theta);
    }
}

function distance(p1, p2)
{
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}
