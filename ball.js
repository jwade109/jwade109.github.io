class Ball
{
    constructor(x, y, r, g, vx, vy, damp)
    {
        this.x = x;
        this.y = y;
        this.r = r;
        this.g = g;

        this.vx = vx;
        this.vy = vy;
        this.damp = damp;
        this.colors = [];

        this.theta = 0;
        this.omega = Math.random()*4 - 2;
    }

    draw(canvas)
    {
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r,
            this.theta, 2*Math.PI+this.theta);
        ctx.globalAlpha=0.8;
        ctx.fillStyle="black";
        ctx.stroke();

        ctx.globalAlpha=0.3;
        var arclength = 2*Math.PI/this.colors.length;

        for (var i = 0; i < this.colors.length; ++i)
        {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r,
                this.theta+(arclength*i),
                this.theta+(arclength*(i+1)));
            ctx.lineTo(this.x, this.y);
            ctx.fillStyle=this.colors[i];
            ctx.fill();
        }

        if (this.colors.length == 0)
        {
            ctx.fillStyle="gray";
            ctx.fill();
        }
    }

    addColor(color)
    {
        this.colors.push(color);
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
        this.theta += this.omega*dt;

        if (this.x + this.r >= canvas.width)
        {
            this.vx = -Math.abs(this.vx)*this.damp;
            this.vy *= this.damp;
        }
        if (this.x - this.r <= 0)
        {
            this.vx = Math.abs(this.vx)*this.damp;
            this.vy *= this.damp;
        }
        if (this.y + this.r >= canvas.height)
        {
            this.vy = -Math.abs(this.vy)*this.damp;
            this.vx *= this.damp;
        }
        if (this.y - this.r <= 0)
        {
            this.vy = Math.abs(this.vy)*this.damp;
            this.vx *= this.damp;
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

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function ballot2ball(ballot)
{
    var b = new Ball(0, 0, 0, 0, 0, 0, 0, 0);
    b.r = ballot.weight;
    for (var c in ballot.candidates)
        b.addColor(str2color(ballot.candidates[c]));
    return b;
}

var fps = 50;

canvas = document.getElementById("canvas");
width = document.body.clientWidth;
height = document.body.clientHeight;
var balls = [];

// for (var i = 0; i < 100; ++i)
// {
    // balls.push(new Ball(

    // for (var j = 0; j < Math.random()*8; ++j)
    // {
        // balls[i].addColor(getRandomColor());
    // }
// }

function draw()
{
    setTimeout(function()
    {
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.canvas.width  = document.body.clientWidth;
        ctx.canvas.height = document.body.scrollHeight;
        requestAnimationFrame(draw);
        for (var b in balls)
        {
            balls[b].update(1/fps, canvas);
            balls[b].draw(canvas);
        }
    }, 1000/fps);
}

draw();