// battleship.js

const BATTLESHIP_MAX_HEALTH = 10000;
const BATTLESHIP_EXPLOSION_RADIUS = 600;

class Battleship
{
    constructor(pos, theta)
    {
        this.pos = pos.slice();
        this.pos_prev = pos.slice();
        this.theta = theta;
        this.omega = 0;
        this.vel = [50*Math.cos(theta), -50*Math.sin(theta)];

        this.length = 475.5;
        this.width = 150;
        this.radius = 1;
        this.health = BATTLESHIP_MAX_HEALTH;
        this.pdc_reload = 0;
        this.name = "MCRN \"" +
            NAMES[Math.floor(Math.random()*NAMES.length)] + "\"";

        this.box = new Hitbox([[this.width/6, this.length/2],
                               [-this.width/6, this.length/2],
                               [-this.width/6, 0],
                               [-this.width/2, -this.length/2],
                               [this.width/2, -this.length/2],
                               [this.width/6, 0]]);
        let range = [-Math.PI/2.2, Math.PI/2.2];
        this.pdcs =
            [new PointDefenseCannon(
                [this.length/4, this.width*0.36], -Math.PI/2.4, this, range),
             new PointDefenseCannon(
                [this.length/4, -this.width*0.36], Math.PI/2.4, this, range),
             new PointDefenseCannon(
                [-this.length/6, -this.width*0.44], Math.PI/2, this, range),
             new PointDefenseCannon(
                [-this.length/6, this.width*0.44], -Math.PI/2, this, range)];
        this.box.object = this;
        this.world = null;
        this.permanent = true;
    }

    firePDC()
    {
        if (distance(PLAYER_SHIP.pos, this.pos) < PDC_MAX_RANGE*2)
            for (let pdc of this.pdcs) pdc.intercept(PLAYER_SHIP);
    }

    step(dt)
    {
        this.pdc_reload -= dt;
        if (distance(PLAYER_SHIP.pos, this.pos) < 400 && !GAME_OVER)
            this.firePDC();
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
        ctx.fillStyle = "gray";
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(this.width/3*PIXELS, this.length/2*PIXELS);
        ctx.lineTo(this.width/2*PIXELS, -this.length/2*PIXELS);
        ctx.lineTo(-this.width/2*PIXELS, -this.length/2*PIXELS);
        ctx.lineTo(-this.width/3*PIXELS, this.length/2*PIXELS);
        ctx.lineTo(this.width/3*PIXELS, this.lengh/2*PIXELS);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
        if (DRAW_HITBOX) this.box.draw(ctx);

        for (let pdc of this.pdcs) pdc.draw(ctx);
    }

        explode()
        {
            if (this.remove) return;
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
                deb.world = this.world;
                deb.color = "gray";
                this.world.push(deb);
            }
            this.remove = true;
            world.push(new Explosion(this.pos.slice(), this.vel.slice(),
                BATTLESHIP_EXPLOSION_RADIUS));
            throwAlert(this.name + " (" + this.constructor.name +
                ") was destroyed.", ALERT_DISPLAY_TIME);
        }

    damage(d)
    {
        this.health -= d;
        if (this.health <= 0) this.explode();
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
}
