
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let left = false, right = false, up = false, down = false, space = false,
    akey = false, wkey = false, dkey = false, skey = false, xkey = false,
    fkey = false, qkey = false, ekey = false, leftClick = false,
    rightClick = false, shift = false;

let firemode = true;
let large_radius = 40;
let small_radius = 12;

let width = document.body.clientWidth;
let height = document.body.scrollHeight;
let mx = 0, my = 0;
let mousepos = [mx, my];

let world = [];
world.render_distance = Math.max(width, height)*3;

let ship = new Ship([0, 0], Math.PI/2);
ship.world = world;
world.push(ship);
let corvette = new Corvette([200, 0], Math.PI/3);
corvette.world = world;
world.push(corvette);

let current = new Date().getTime(), last = current, dt = 0;

for (let i = 0; i < 20; ++i)
{
    let r = Math.random()*world.render_distance;
    let rot = Math.random()*Math.PI*2;
    let pos = [Math.cos(rot)*r + ship.pos[0],
               Math.sin(rot)*r + ship.pos[1]];
    let vel = [Math.random()*200 - 100 + ship.vel[0],
               Math.random()*200 - 100 + ship.vel[1]]
    let theta = Math.random()*Math.PI*2;
    let omega = Math.random()*10 - 5;
    let size = Math.random()*50 + 20;
    let deb = new Debris(pos, vel, theta, omega, size);
    deb.world = world;
    world.push(deb);
}

canvas.onmousemove = function(e)
{
    let rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left + ship.pos[0] - width/2;
    my = e.clientY - rect.top + ship.pos[1] - height/2;
    mousepos = [mx, my];
}

canvas.onmousedown = function(e)
{
    switch (e.button)
    {
        case 0: leftClick = true;
        case 2: rightClick = true;
    }
}

canvas.onmouseup = function(e)
{
    switch (e.button)
    {
        case 0: leftClick = false;
        case 2: rightClick = false;
    }
}

document.addEventListener('keydown', function(event)
{
    switch (event.keyCode)
    {
        case 16: shift = true; break;
        case 32: space = true; break;
        case 37: left = true; break;
        case 38: up = true; break;
        case 39: right = true; break;
        case 40: down = true; break;
        case 65: akey = true; break;
        case 69: ekey = true; break;
        case 70: fkey = true; firemode = !firemode; break;
        case 81: qkey = true; break;
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
        case 16: shift = false; break;
        case 32: space = false; break;
        case 37: left = false; break;
        case 38: up = false; break;
        case 39: right = false; break;
        case 40: down = false; break;
        case 65: akey = false; break;
        case 69: ekey = false; break;
        case 70: fkey = false; break;
        case 81: qkey = false; break;
        case 87: wkey = false; break;
        case 68: dkey = false; break;
        case 83: skey = false; break;
        case 88: xkey = false; break;
        default:
            console.log('unhandled keycode: ' + event.keyCode);
    }
});

function collide(obj1, obj2)
{
    if (obj1 === obj2) return false;
    let default_radius = 3;
    let dx = obj2.pos[0] - obj1.pos[0];
    let dy = obj2.pos[1] - obj1.pos[1];
    let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 500) return false;
    if (typeof obj1.radius == 'undefined' && typeof obj2.radius == 'undefined')
    {
        return dist <= default_radius;
    }
    else if (typeof obj1.radius == 'undefined')
    {
        return dist <= obj2.radius;
    }
    else if (typeof obj2.radius == 'undefined')
    {
        return dist <= obj1.radius;
    }
    return dist <= obj1.radius + obj2.radius;
}

function handleCollision(obj1, obj2)
{
    function objectsAre(str1, str2)
    {
        return (obj1.constructor.name == str1 &&
                obj2.constructor.name == str2) ||
               (obj1.constructor.name == str2 &&
                obj2.constructor.name == str1);
    }

    if (obj1 === obj2) return;
    if (obj1.constructor.name == obj2.constructor.name) return;
    if (objectsAre("Ship", "Debris"))
    {
        let debris = obj1;
        if (!(debris instanceof Debris))
        {
            debris = obj2;
        }
        if (debris.radius > large_radius) debris.explode();
        return;
    }
    if (objectsAre("Ship", "Torpedo"))
    {
        let ship = obj1, torpedo = obj2;
        if (!(ship instanceof Ship))
        {
            ship = obj2;
            torpedo = obj1;
        }
        if (torpedo.origin !== ship)
        {
            torpedo.vel = ship.vel.slice();
            ship.explode();
            torpedo.explode();
        }
        return;
    }
    if (objectsAre("Ship", "Bullet"))
    {
        return;
    }
    else if (objectsAre("Bullet", "Debris") || objectsAre("Torpedo", "Debris"))
    {
        if (obj1 instanceof Debris)
        {
            if (obj1.radius < small_radius && objectsAre("Torpedo", "Debris"))
                return;
            obj2.vel = obj1.vel.slice();
            if (obj1.radius > large_radius && objectsAre("Bullet", "Debris"))
            {
                obj2.explode();
                return;
            }
            obj1.explode();
            obj2.explode();
        }
        if (obj2 instanceof Debris)
        {
            if (obj2.radius < small_radius && objectsAre("Torpedo", "Debris"))
                return;
            obj1.vel = obj2.vel.slice();
            if (obj2.radius > large_radius && objectsAre("Bullet", "Debris"))
            {
                obj1.explode();
                return;
            }
            obj1.explode();
            obj2.explode();
        }
        return;
    }
    else if (objectsAre("Torpedo", "Bullet"))
    {
        obj1.explode();
        obj2.explode();
        return;
    }
    else if (objectsAre("Railgun", "Debris"))
    {
        let railgun = obj1, debris = obj2;
        if (railgun instanceof Debris)
        {
            railgun = obj2;
            debris = obj1;
        }
        debris.explode();
        return;
    }
    else if (objectsAre("Railgun", "Ship"))
    {
        return;
    }
    else if (objectsAre("Railgun", "Corvette"))
    {
        let corvette = obj1;
        if (!(corvette instanceof Corvette))
        {
            corvette = obj2;
        }
        corvette.damage(400);
        console.log("boom");
        return;
    }
    else if (objectsAre("Debris", "Corvette"))
    {
        let debris = obj1;
        if (!(debris instanceof Debris))
        {
            debris = obj2;
        }
        if (debris.radius > large_radius)
        {
            debris.explode();
        }
        return;
    }
    else if (objectsAre("Bullet", "Corvette"))
    {
        let corvette = obj1, bullet = obj2;
        if (!(corvette instanceof Corvette))
        {
            corvette = obj2;
            bullet = obj1;
        }
        // corvette.explode();
        bullet.explode();
        corvette.damage(1);
        return;
    }
    else if (objectsAre("Torpedo", "Corvette"))
    {
        let corvette = obj1, torpedo = obj2;
        if (!(corvette instanceof Corvette))
        {
            corvette = obj2;
            torpedo = obj1;
        }
        if (torpedo.origin !== corvette)
        {
            torpedo.vel = corvette.vel.slice();
            corvette.damage(100);
            torpedo.explode();
        }
        return;
    }
    console.log("unhandled collision between " +
                obj1.constructor.name + " and " +
                obj2.constructor.name);
}

function draw()
{
    let fps = 100;
    setTimeout(function()
    {
        current = new Date().getTime();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.canvas.width = document.body.clientWidth;
        ctx.canvas.height = document.body.scrollHeight;
        width = ctx.canvas.width;
        height = ctx.canvas.height;
        requestAnimationFrame(draw);
        world.render_distance = Math.max(width, height)*1.5;

        ctx.save();
        ctx.translate(-ship.pos[0] + width/2, -ship.pos[1] + height/2);

        ctx.fillRect(mx, my, 2, 2);

        let exploded = [];
        for (let i = 0; i < world.length; ++i)
        {
            for (let j = 0; j < world.length &&
                !(world[i] instanceof Debris); ++j)
            {
                if (collide(world[i], world[j]))
                {
                    if (exploded.length > -1)
                        exploded.push([world[i], world[j]]);
                }
            }
        }
        for (let obj of exploded)
        {
            handleCollision(obj[0], obj[1]);
        }

        // WORLD ELEMENTS
        for (let i = 0; i < world.length; ++i)
        {
            let dx = world[i].pos[0] - ship.pos[0];
            let dy = world[i].pos[1] - ship.pos[1];
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > world.render_distance)
            {
                world[i].remove = true;
            }
            world[i].draw(ctx);
            world[i].step(dt);
        }
        for (let i = 0; i < world.length; ++i)
            if (world[i].remove == true) world.splice(i, 1);

        mx += ship.vel[0]*dt;
        my += ship.vel[1]*dt;
        mousepos = [mx, my];

        while (world.length < 100)
        {
            let r = Math.max(width, height) + Math.random()*200;
            let rot = Math.random()*Math.PI*2;
            let pos = [Math.cos(rot)*r + ship.pos[0],
                       Math.sin(rot)*r + ship.pos[1]];
            let vel = [Math.random()*200 - 100 + ship.vel[0],
                       Math.random()*200 - 100 + ship.vel[1]]
            let theta = Math.random()*Math.PI*2;
            let omega = Math.random()*10 - 5;
            let size = Math.random()*50 + 20;
            let deb = new Debris(pos, vel, theta, omega, size);
            deb.world = world;
            world.push(deb);
        }

        // if (corvette.remove)
        // {
        //     let donut = world.render_distance - Math.max(width, height);
        //     let r = world.render_distance - Math.random()*donut;
        //     let rot = Math.random()*Math.PI*2;
        //     let pos = [Math.cos(rot)*r + ship.pos[0],
        //                Math.sin(rot)*r + ship.pos[1]];
        //     let vel = [Math.random()*200 - 100 + ship.vel[0],
        //                Math.random()*200 - 100 + ship.vel[1]]
        //     corvette = new Corvette(pos, Math.random()*Math.PI*2);
        //     corvette.world = world;
        //     corvette.vel = vel;
        //     world.push(corvette);
        // }

        if (wkey)
        {
            ship.thrusters[5].firing = true;
            ship.thrusters[6].firing = true;
        }
        if (qkey)
        {
            ship.thrusters[0].firing = true;
            ship.thrusters[7].firing = true;
        }
        if (ekey)
        {
            ship.thrusters[3].firing = true;
            ship.thrusters[4].firing = true;
        }
        if (skey || down)
        {
            ship.thrusters[1].firing = true;
            ship.thrusters[2].firing = true;
        }
        if (akey || left)
        {
            ship.thrusters[2].firing = true;
            ship.thrusters[6].firing = true;
            ship.thrusters[0].firing = true;
            ship.thrusters[4].firing = true;
        }
        if (dkey || right)
        {
            ship.thrusters[1].firing = true;
            ship.thrusters[5].firing = true;
            ship.thrusters[3].firing = true;
            ship.thrusters[7].firing = true;
        }
        if (shift || up)
        {
            ship.thrusters[8].firing = true;
        }
        if (space)
        {
            if (firemode) ship.launchTorpedo();
            else ship.fireRailgun();
        }
        if (leftClick)
        {
            ship.firePDC();
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
        let weapon = firemode ? "torpedoes" : "railgun";
        ctx.fillText(world.length + " " +
            Math.round(1000/(current - last)), 10, height - 30);
        ctx.fillText("Control thrusters with [W], [A], [S], [D], [Q], " +
            "[E], [SHIFT]; launch torpedoes/railgun with [SPACE]; " +
            "toggle firing mode with [F] (current mode: " + weapon + ")",
            10, height - 10);

        dt = (current - last)/1000;
        last = current;

    }, 1000/fps);
}

draw();
