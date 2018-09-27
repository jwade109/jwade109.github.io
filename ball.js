class Ball
{
    constructor(x, y, vx, vy)
    {
        this.x = x;
        this.y = y;
        this.r = 1;

        this.vx = vx;
        this.vy = vy;

        this.theta = 0;
        this.omega = Math.random()*4 - 2;
    }

    kinematics(dt, width, height)
    {
        this.theta += this.omega*dt;

        if (this.x + this.r >= width)
            this.vx = -Math.abs(this.vx);
        if (this.x - this.r <= 0)
            this.vx = Math.abs(this.vx);
        if (this.y + this.r >= height)
            this.vy = -Math.abs(this.vy);
        if (this.y - this.r <= 0) 
            this.vy = Math.abs(this.vy);

        this.x += this.vx*dt;
        if (this.x + this.r > width)
            this.x = width - this.r;
        if (this.x - this.r < 0)
            this.x = this.r;

        this.y += this.vy*dt;
        if (this.y + this.r > height)
            this.y = height - this.r;
        if (this.y - this.r < 0)
            this.y = this.r;
    }
}
