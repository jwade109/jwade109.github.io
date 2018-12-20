// torpedo-tube.js

const TORPEDO_KICK_VEL = 200;
const TORPEDO_COOLDOWN = 3;

function TorpedoTube(pos, theta, object)
{
    this.pos = pos.slice();
    this.theta = theta;
    this.object = object;
    this.cooldown = TORPEDO_COOLDOWN;
    this.lastFired = -Infinity;
    this.kickVelocity = TORPEDO_KICK_VEL;
}

TorpedoTube.prototype.globalPos = function()
{
    let pos = this.object.pos.slice();
    let off = rot2d(this.pos, this.object.theta);
    pos[0] += off[0];
    pos[1] += off[1];
    return pos;
}

TorpedoTube.prototype.canFire = function()
{
    return TIME - this.lastFired >= this.cooldown;
}

TorpedoTube.prototype.fire = function(target)
{
    if (!this.canFire()) return;
    this.lastFired = TIME;
    let vkick = rot2d([this.kickVelocity, 0], this.object.theta + this.theta);
    // let vspin = rot2d([0, -this.omega*this.length/2], this.theta);

    let torp = new Torpedo(this.globalPos(),
        add2d(vkick, this.object.vel),
        this.theta + this.object.theta, TORPEDO_THRUST);
    torp.target = target;
    torp.origin = this.object;
    torp.name = this.object.name;
    torp.faction = this.object.faction;
    WORLD.push(torp);
}

TorpedoTube.prototype.draw = function()
{
    if (!DRAW_FIRING_ARC) return;
    CTX.save();
    let pos = this.globalPos();
    CTX.translate(pos[0]*PIXELS, pos[1]*PIXELS);
    CTX.rotate(-this.object.theta - this.theta);

    CTX.strokeStyle = "green";
    CTX.fillStyle = "green";

    let percent = Math.min(1, (TIME - this.lastFired)/this.cooldown);
    CTX.globalAlpha = 0.2;
    CTX.fillRect(-TORPEDO_LENGTH*PIXELS, -TORPEDO_WIDTH*PIXELS,
        TORPEDO_LENGTH*2*PIXELS*percent, TORPEDO_WIDTH*2*PIXELS);
    CTX.globalAlpha = 1;
    CTX.strokeRect(-TORPEDO_LENGTH*PIXELS, -TORPEDO_WIDTH*PIXELS,
        TORPEDO_LENGTH*2*PIXELS, TORPEDO_WIDTH*2*PIXELS);

    CTX.restore();
}
