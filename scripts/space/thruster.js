class Thruster
{
    constructor(pos, theta, thrust, width)
    {
        this.pos = pos;
        this.theta = theta;
        this.width = width;
        this.thrust = thrust;
        this.firing = false;
        this.drawbell = true;
    }

    draw(ctx)
    {
        ctx.save();
        ctx.translate(-this.pos[0], this.pos[1]);
        ctx.rotate(-this.theta + Math.PI/2)

        if (this.drawbell)
        {
            ctx.fillStyle = "black";
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.moveTo(-this.width/2, this.width);
            ctx.lineTo(0, 0);
            ctx.lineTo(this.width/2, this.width);
            ctx.fill();
            ctx.translate(0, this.width);
        }

        if (this.firing)
        {
            ctx.fillStyle = "red";
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(-this.width/3, 0);
            ctx.lineTo(0, 2*this.width);
            ctx.lineTo(this.width/3, 0);
            ctx.fill();
        }

        ctx.restore();
    }
}
