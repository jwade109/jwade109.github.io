
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var left = false, right = false, up = false, down = false, space = false;
var akey = false, wkey = false, dkey = false, skey = false, xkey = false;

canvas.onmousemove = function(e)
{
    var rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
}

canvas.onmousedown = function(e)
{

}

document.addEventListener('keydown', function(event)
{
    switch (event.keyCode)
    {
        case 32: space = true; break;
        case 37: left = true; break;
        case 38: up = true; break;
        case 39: right = true; break;
        case 40: down = true; break;
        case 65: akey = true; break;
        case 87: wkey = true; break;
        case 68: dkey = true; break;
        case 83: skey = true; break;
        case 88: xkey = true; break;
        default:
            console.log('unhandled keycode: ' + event.keyCode);
    }
});

document.addEventListener('keyup', function(event)
{
    switch (event.keyCode)
    {
        case 32: space = false; break;
        case 37: left = false; break;
        case 38: up = false; break;
        case 39: right = false; break;
        case 40: down = false; break;
        case 65: akey = false; break;
        case 87: wkey = false; break;
        case 68: dkey = false; break;
        case 83: skey = false; break;
        case 88: xkey = false; break;
        default:
            console.log('unhandled keycode: ' + event.keyCode);
    }
});

function draw()
{
    var fps = 50;
    setTimeout(function()
    {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.canvas.width = document.body.clientWidth;
        ctx.canvas.height = document.body.scrollHeight;
        width = ctx.canvas.width;
        height = ctx.canvas.height;
        requestAnimationFrame(draw);

        ctx.save();
        ctx.translate(-ship.pos[0] + width/2, -ship.pos[1] + height/2);
        ship.draw(ctx);
        ship.step(1/fps);

        if (up)
        {
            ship.thrusters[5].firing = true;
            ship.thrusters[6].firing = true;
        }
        if (akey)
        {
            ship.thrusters[0].firing = true;
            ship.thrusters[7].firing = true;
        }
        if (dkey)
        {
            ship.thrusters[3].firing = true;
            ship.thrusters[4].firing = true;
        }
        if (down)
        {
            ship.thrusters[1].firing = true;
            ship.thrusters[2].firing = true;
        }
        if (left)
        {
            ship.thrusters[2].firing = true;
            ship.thrusters[6].firing = true;
            ship.thrusters[0].firing = true;
            ship.thrusters[4].firing = true;
        }
        if (right)
        {
            ship.thrusters[1].firing = true;
            ship.thrusters[5].firing = true;
            ship.thrusters[3].firing = true;
            ship.thrusters[7].firing = true;
        }
        if (skey)
        {
            ship.thrusters[8].firing = true;
        }

        ctx.strokeStyle = "gray";
        ctx.globalAlpha = 0.05;
        let grid = 200;
        let startx = (ship.pos[0] - width) - ((ship.pos[0] - width) % grid);
        let starty = (ship.pos[1] - height) - ((ship.pos[1] - height) % grid);
        for (let x = startx; x < ship.pos[0] + width; x += grid)
        {
            for (let y = starty; y < ship.pos[1] + height; y += grid)
            {
                ctx.strokeRect(x, y, grid, grid);
            }
        }

        ctx.restore();

        ctx.fillStyle = "gray";
        ctx.globalAlpha = 0.3;
        let fh = ship.fuel/ship.maxfuel*(height - 60);
        ctx.fillRect(10, (height - 50) - fh, 21, fh);

        ctx.save();
        ctx.translate(28, height - 53);
        ctx.rotate(-Math.PI/2);
        ctx.font = "20px Arial";
        ctx.fillStyle = "white";
        ctx.globalAlpha = 1;
        ctx.fillText("FUEL", 0, 0);
        ctx.restore();

        ctx.fillStyle = "gray";
        ctx.globalAlpha = 1;
        ctx.font = "14px Arial";
        let v = Math.sqrt(Math.pow(ship.vel[0], 2) + Math.pow(ship.vel[1], 2));
        ctx.fillText("1 Grid = 20 meters -- Velocity: " + Math.round(v/10) +
            " m/s", 10, height - 30);
        ctx.fillText("Control thrusters with Up, " +
            "Down, Left, Right, A, S, D", 10, height - 10);


    }, 1000/fps);
}

let width = document.body.clientWidth;
let height = document.body.scrollHeight;
let mx = width/2, my = height/2;
var ship = new Ship([width/2, height/2], Math.PI/2);


draw();
