// donnager.js

const DONNAGER_LENGTH = 475.5;
const DONNAGER_WIDTH = 150;
const DONNAGER_MAX_HEALTH = 10000;
const DONNAGER_EXPLOSION_RADIUS = 600;
const DONNAGER_MASS = 150000000;
const DONNAGER_PDC_RANGE = 900;

class Donnager
{
    constructor(pos, theta)
    {
        this.pos = pos.slice();
        this.pos_prev = pos.slice();
        this.theta = theta;
        this.omega = 0;
        this.vel = [50*Math.cos(theta), -50*Math.sin(theta)];

        this.length = DONNAGER_LENGTH;
        this.width = DONNAGER_WIDTH;
        this.health = DONNAGER_MAX_HEALTH;
        this.mass = DONNAGER_MASS;
        this.name = "MCRN \"" +
            NAMES[Math.floor(Math.random()*NAMES.length)] + "\"";
        this.type = "Donnager Class";

        this.box = new Hitbox([[this.length/2, this.width/6, ],
                               [this.length/2, -this.width/6, ],
                               [0, -this.width/6],
                               [-this.length/2, -this.width/2],
                               [-this.length/2, this.width/2],
                               [0, this.width/6]]);
        let range = [-Math.PI/2.2, Math.PI/2.2];
        this.pdcs =
            [new PointDefenseCannon(
                [this.length/4, this.width*0.36], -Math.PI/2.4,
                 this, range, DONNAGER_PDC_RANGE),
             new PointDefenseCannon(
                [this.length/4, -this.width*0.36], Math.PI/2.4,
                 this, range, DONNAGER_PDC_RANGE),
             new PointDefenseCannon(
                [-this.length/6, -this.width*0.44], Math.PI/2,
                 this, range, DONNAGER_PDC_RANGE),
             new PointDefenseCannon(
                [-this.length/6, this.width*0.44], -Math.PI/2,
                 this, range, DONNAGER_PDC_RANGE),
             new PointDefenseCannon(
                [-0, -this.width*0.4], Math.PI/2,
                 this, range, DONNAGER_PDC_RANGE),
             new PointDefenseCannon(
                [-0, this.width*0.4], -Math.PI/2,
                 this, range, DONNAGER_PDC_RANGE),
             new PointDefenseCannon(
                [this.length/2, 0], 0,
                 this, range, DONNAGER_PDC_RANGE),
             new PointDefenseCannon(
                [-this.length/2, 0], Math.PI,
                 this, range, DONNAGER_PDC_RANGE)];
        this.box.object = this;
        this.trackable = true;
        this.permanent = true;
    }

    step(dt)
    {
        let candidates = [];
        for (let obj of WORLD)
        {
            if (!(obj instanceof Torpedo)) continue;
            let dist = distance(this.pos, obj.pos);
            if (dist < 3000) candidates.push(obj);
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
            else pdc.intercept(PLAYER_SHIP);
        }

        this.pos_prev = this.pos.slice();
        this.pos[0] += this.vel[0]*dt;
        this.pos[1] += this.vel[1]*dt;
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
        ctx.save();
        ctx.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
        ctx.rotate(-this.theta - Math.PI/2);

        ctx.globalAlpha = 1;
        ctx.fillStyle = "brown";
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(this.width/3*PIXELS, this.length/2*PIXELS);
        ctx.lineTo(this.width/2*PIXELS, -this.length/2*PIXELS);
        ctx.lineTo(-this.width/2*PIXELS, -this.length/2*PIXELS);
        ctx.lineTo(-this.width/3*PIXELS, this.length/2*PIXELS);
        ctx.lineTo(this.width/3*PIXELS, this.lengh/2*PIXELS);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
        if (DRAW_HITBOX) this.box.draw(ctx);
        for (let pdc of this.pdcs) pdc.draw(ctx);
    }

    explode()
    {
        let num_debris = 25 + Math.random()*9;
        for (let i = 0; i < num_debris; ++i)
        {
            let pos = this.pos.slice();
            let roff = [this.length*Math.random() - this.length/2,
                        this.width*Math.random() - this.width/2];
            roff = rot2d(roff, this.theta);
            pos[0] += roff[0];
            pos[1] += roff[1];
            let vel = this.vel.slice();
            vel[0] += Math.random()*200 - 100;
            vel[1] += Math.random()*200 - 100;
            let size = Math.random()*this.width/8 + this.width/8;
            let deb = new Debris(pos, vel,
                this.theta,
                this.omega + Math.random()*5 - 2.5, size);
            deb.color = "brown";
            deb.name = this.name;
            WORLD.push(deb);

            if (Math.random() < 0.1)
                WORLD.push(new Explosion(pos.slice(), this.vel.slice(),
                DONNAGER_EXPLOSION_RADIUS*(Math.random()*0.5 + 0.5)));
        }
        this.remove = true;
        throwAlert(this.name + " (" + this.type +
            ") was destroyed.", ALERT_DISPLAY_TIME);
    }

    damage(d)
    {
        this.health -= d;
        if (this.health <= 0) this.explode();
        else if (Math.random() < 0.05*d)
        {
            let num_debris = 3 + Math.random()*3;
            let pos = this.box.getRandom();
            for (let i = 0; i < num_debris; ++i)
            {
                let vel = this.vel.slice();
                vel[0] += Math.random()*200 - 100;
                vel[1] += Math.random()*200 - 100;
                let size = Math.random()*4;
                let deb = new Debris(pos.slice(), vel,
                    this.theta,
                    this.omega + Math.random()*5 - 2.5, size);
                deb.name = this.name;
                deb.color = "#909090";
                if (Math.random() < 0.2)
                    deb.color = "#CCCCCC";
                WORLD.push(deb);
            }
        }
    }
}
