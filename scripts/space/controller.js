// controller.js

class Controller
{

static player(dt)
{
    if (this.torpedo_reload > 0) this.torpedo_reload -= dt;
    if (this.railgun_reload > 0) this.railgun_reload -= dt;
    for (let thruster of this.thrusters) thruster.firing = false;
}

static morrigan(dt)
{
    if (PLAYER_SHIP.remove)
    {
        this.alpha = -this.omega;
        this.acc = rot2d([300, 0], this.theta);
        this.engine.firing = true;
        return;
    }

    let dist = distance(PLAYER_SHIP.pos, this.pos);
    if (this.torpedo_reload > 0) this.torpedo_reload -= dt;
    else if (TORPEDO_MIN_RANGE < dist && dist < WORLD_RENDER_DISTANCE)
    {
        this.launchTorpedo();
        this.torpedo_reload = Math.random()*4 + 2;
    }

    if (this.pdc_reload > 0) this.pdc_reload -= dt;
    if (Math.random() < 0.5)
        this.firePDC(PLAYER_SHIP);

    let dx = PLAYER_SHIP.pos[0] - this.pos[0];
    let dy = PLAYER_SHIP.pos[1] - this.pos[1];
    let bodyacc = [-(TORPEDO_MIN_RANGE + 100 - dist)/10, 0];
    if (bodyacc[0] > 4) this.engine.firing = true;
    else this.engine.firing = false;
    this.acc = rot2d(bodyacc, this.theta);
    this.acc[0] += (PLAYER_SHIP.vel[0] - this.vel[0])/3;
    this.acc[1] += (PLAYER_SHIP.vel[1] - this.vel[1])/3;
    let theta = angle2d(this.pos, PLAYER_SHIP.pos) - this.theta;
    while (theta > Math.PI) theta -= Math.PI*2;
    while (theta < -Math.PI) theta += Math.PI*2;
    this.alpha = theta - this.omega;
}

static amunRaEnemy(dt)
{

}

}
