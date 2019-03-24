// mine.js

const MINE_RADIUS = 10;
const MINE_MAX_HEALTH = 100;
const MINE_SMALL_EXPLOSION_RADIUS = 50;
const MINE_DANGER_RADIUS = 400;
const MINE_LARGE_EXPLOSION_RADIUS = MINE_DANGER_RADIUS*2;
const MINE_DAMAGE = 1000000;
const MINE_MASS = 600;
const MINE_IZZ = 3000;

function Mine()
{
    Collidable.call(this, MINE_RADIUS, MINE_RADIUS, MINE_MAX_HEALTH);
    this.mass = MINE_MASS;
    this.izz = 3000;
    this.arming_time = 4;
}

Mine.prototype = Object.create(Collidable.prototype);

Mine.prototype.control = function(dt)
{
    for (let obj of WORLD)
    {
        if (obj.is_enemy && this.time > this.arming_time &&
            distance(obj.pos, this.pos) < MINE_DANGER_RADIUS)
            this.explode();
    }
}

Mine.prototype.explode = function()
{
    this.remove = true;
    let explosion_size = MINE_SMALL_EXPLOSION_RADIUS;
    if (this.time > this.arming_time)
    {
        explosion_size = MINE_LARGE_EXPLOSION_RADIUS;
        for (let obj of WORLD)
        {
            if (distance(this.pos, obj.pos) < MINE_DANGER_RADIUS
                && typeof obj.damage === 'function' && !obj.remove)
            {
                obj.damage(MINE_DAMAGE);
            }
        }
    }
    WORLD.push(new Explosion(this.pos.slice(),
        this.vel.slice(), explosion_size));
}

Mine.prototype.skin = function()
{
    CTX.save();
    CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
    CTX.rotate(-this.theta);
    CTX.fillStyle = "gray";
    if (Math.floor(this.time) % 2 == 0) CTX.fillStyle = "red";
    CTX.strokeStyle = "black";
    CTX.globalAlpha = 1;
    CTX.beginPath();
    CTX.arc(0, 0, this.length*PIXELS/2, 0, Math.PI*2);
    CTX.closePath();
    CTX.fill();
    CTX.stroke();
    if (this.time > this.arming_time)
    {
        CTX.strokeStyle = "red";
        CTX.fillStyle = "red";
        CTX.setLineDash([20*PIXELS, 10*PIXELS]);
        CTX.beginPath();
        CTX.arc(0, 0, MINE_DANGER_RADIUS*PIXELS, 0, Math.PI*2);
        CTX.closePath();
        CTX.globalAlpha = 0.02;
        CTX.fill();
        CTX.globalAlpha = 0.6;
        CTX.stroke();
    }
    CTX.restore();
}
