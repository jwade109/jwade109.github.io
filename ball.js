class Ball
{
    constructor(x, y, r, g, vx, vy)
    {
        this.x = x;
        this.y = y;
        this.r = r;
        this.g = g;
        
        this.vx = vx;
        this.vy = vy;
        this.collide = false;
    }
    
    draw(canvas)
    {
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI);
        ctx.globalAlpha=1;
        ctx.fillStyle="black";
        ctx.stroke();
        // ctx.globalAlpha=0.2;
        // ctx.fillStyle="gray";
        // ctx.fill();
    }
    
    erase(canvas)
    {
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI);
        ctx.stroke();
    }
    
    update(dt, canvas)
    {
        if (this.x + this.r >= canvas.width && !this.collide)
        {
            this.vx = Math.abs(this.vx)*-0.95;
        }
        if (this.x - this.r <= 0 && !this.collide)
        {
            this.vx = Math.abs(this.vx)*0.95;
        }
        if (this.y + this.r >= canvas.height && !this.collide)
        {
            this.vy = -Math.abs(this.vy)*0.8;
            this.vx *= 0.95;
        }
        
        this.x += this.vx*dt;
        if (this.x + this.r > canvas.width)
            this.x = canvas.width - this.r;
        this.y += this.vy*dt;
        if (this.y + this.r > canvas.height)
            this.y = canvas.height - this.r;
        if (this.y + this.r < canvas.height)
            this.vy += this.g*dt;
        
        if (Math.abs(this.y + this.r - canvas.height) < 10 &&
            Math.abs(this.vy) < 50)
        {
            this.y = canvas.height - this.r;
            this.vy = 0;
        }
    }
}

var fps = 50;

canvas = document.getElementById("canvas");
width = canvas.width;
height = canvas.height;
var balls = [];
for (var i = 0; i < 200; ++i)
{
    balls.push(new Ball(Math.random()*width/2 + width/4,
                        Math.random()*height/2 + height/4,
                        Math.random()*10 + 20,
                        900+Math.random()*500,
                        Math.random()*1000-500,
                        -Math.random()*500));
}
 
function draw() {
    setTimeout(function()
    {
        canvas.getContext("2d")
            .clearRect(0, 0, canvas.width, canvas.height);
        requestAnimationFrame(draw);
        for (var b in balls)
        {
            balls[b].update(1/fps, canvas);
            balls[b].draw(canvas);
        }
    }, 1000/fps);
}
 
draw();