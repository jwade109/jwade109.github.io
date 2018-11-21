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
        ctx.translate(-this.pos[0]*PIXELS, this.pos[1]*PIXELS);
        ctx.rotate(-this.theta + Math.PI/2)

        if (this.drawbell)
        {
            ctx.fillStyle = "black";
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.moveTo(-this.width/2*PIXELS, this.width*PIXELS);
            ctx.lineTo(0, 0);
            ctx.lineTo(this.width/2*PIXELS, this.width*PIXELS);
            ctx.fill();
            ctx.translate(0, this.width*PIXELS);
        }

        if (this.firing)
        {
            ctx.fillStyle = "gray";
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(-this.width/3*PIXELS, 0);
            ctx.lineTo(0, 2*this.width*PIXELS);
            ctx.lineTo(this.width/3*PIXELS, 0);
            ctx.fill();
        }

        ctx.restore();
    }
}
