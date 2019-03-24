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
        if (!this.firing) return;

        ctx.save();
        ctx.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
        ctx.rotate(-this.theta)

        ctx.fillStyle = "blue";
        ctx.globalAlpha = 0.25 + Math.random()*0.1;
        ctx.beginPath();
        ctx.moveTo(0, -this.width/2*PIXELS);
        ctx.lineTo(2*this.width*PIXELS*(Math.random()/3 + 2/3), 0);
        ctx.lineTo(0, this.width/2*PIXELS);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.globalAlpha = 0.1 + Math.random()*0.1;
        ctx.beginPath();
        ctx.moveTo(0, -this.width/2*PIXELS);
        ctx.lineTo(2*this.width*PIXELS*(Math.random()/3 + 1/3), 0);
        ctx.lineTo(0, this.width/2*PIXELS);
        ctx.fill();

        let radius = this.width*6*PIXELS;
        let grd = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        grd.addColorStop(0, "rgba(0, 0, 255, 0.15)");
        grd.addColorStop(1, "rgba(255, 255, 255, 0)");

        // Fill with gradient
        ctx.globalAlpha = 1;
        ctx.fillStyle = grd;
        ctx.fillRect(-radius, -radius, radius*2, radius*2);

        ctx.restore();
    }
}
