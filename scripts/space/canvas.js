var PI = Math.PI;

var PIXELS = 1.7; //  pixels per meter
var DRAW_HITBOX = false;
var DRAW_TRACE = false;
var LOCK_CAMERA = false;
var SPAWN_ENEMIES = true;
var MAX_ENEMIES = 1;
var GAME_PAUSED = true;
var SHOW_HELP = false;
var LAST_EVENT = null;
var PLAYER_INVINCIBLE = false;
var INFINITE_FUEL = true;
var PLAYER_MAX_HEALTH = 1000;
var PASSIVE_REGEN = PLAYER_MAX_HEALTH/(60*3);
var PDC_LENGTH = 4;
var PDC_SPREAD = 3*PI/180;
var RAILGUN_VEL = 20000;
var INFINITE_AMMO = false;
var PLAYER_MAX_MISSILES = 30;
var PLAYER_MAX_RAILGUN = 40;
var GAME_OVER = false;

var ENEMY_NO = 0;
let SPAWN_DEBRIS = true;
let LARGE_DEBRIS = 25;
let SMALL_DEBRIS = 6;
var TORPEDO_THRUST = 2500;
var RESPAWN_TIMER = 0;

var FPS = 60;
var NOMINAL_DT = 1/FPS;

let CANVAS = document.getElementById("canvas");
let ctx = CANVAS.getContext("2d");

var left = false, right = false, up = false, down = false, space = false,
    akey = false, wkey = false, dkey = false, skey = false, xkey = false,
    fkey = false, qkey = false, ekey = false, leftClick = false,
    rightClick = false, shift = false;

var ONE_KEY = false, TWO_KEY = false;

var firemode = true;

var WIDTH = document.body.clientWidth;
var HEIGHT = document.body.scrollHeight;
var MOUSEX = 0, MOUSEY = 0, MOUSEPOS = [MOUSEX, MOUSEY];

var world = [];
world.render_distance = 2500;

var PLAYER_SHIP = new Ship([0, 0], Math.PI/2);
world.push(PLAYER_SHIP);
PLAYER_SHIP.world = world;

function respawn()
{
    PLAYER_SHIP = new Ship([0, 0], Math.PI/2);
    PLAYER_SHIP.world = world;
    world.push(PLAYER_SHIP);
    GAME_OVER = false;
}

let current = new Date().getTime(), last = current, dt = 0;

for (let i = 0; i < 20 && SPAWN_DEBRIS; ++i)
{
    let r = Math.random()*world.render_distance/2 + 200;
    let rot = Math.random()*Math.PI*2;
    let pos = [Math.cos(rot)*r + PLAYER_SHIP.pos[0],
               Math.sin(rot)*r + PLAYER_SHIP.pos[1]];
    let vel = [Math.random()*200 - 100 + PLAYER_SHIP.vel[0],
               Math.random()*200 - 100 + PLAYER_SHIP.vel[1]]
    let theta = Math.random()*Math.PI*2;
    let omega = Math.random()*10 - 5;
    let size = Math.random()*25 + 10;
    let deb = new Debris(pos, vel, theta, omega, size);
    deb.world = world;
    world.push(deb);
}

document.addEventListener('mousemove', function(event)
{
    LAST_EVENT = event;
    updateMouse();
});

document.addEventListener('mousedown', function(event)
{
    switch (event.button)
    {
        case 0: leftClick = true; break;
        case 2: rightClick = true; break;
        case 1: console.log("middle click down");
    }
});

document.addEventListener('mouseup', function(event)
{
    switch (event.button)
    {
        case 0: leftClick = false; break;
        case 2: rightClick = false; break;
        case 1: console.log("middle click up");
    }
});

document.addEventListener('keydown', function(event)
{
    switch (event.keyCode)
    {
        case 16: shift = true; break;
        case 27: GAME_PAUSED = !GAME_PAUSED;
                 SHOW_HELP = false;
                 break;
        case 32: if (GAME_OVER) respawn();
                 else space = true;
                 break;
        case 37: left = true; break;
        case 38: up = true; break;
        case 39: right = true; break;
        case 40: down = true; break;
        case 49: ONE_KEY = true; break
        case 50: TWO_KEY = true; break;
        case 65: akey = true; break;
        case 69: ekey = true; break;
        case 70: fkey = true; firemode = !firemode; break;
        case 72: SHOW_HELP = !SHOW_HELP;
                 if (SHOW_HELP) GAME_PAUSED = true;
                 break;
        case 74: if (GAME_PAUSED) physics(-NOMINAL_DT);
                 break;
        case 75: if (GAME_PAUSED) physics(NOMINAL_DT);
                 break;
        case 81: qkey = true; break;
        case 86: LOCK_CAMERA = !LOCK_CAMERA; break;
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
        case 27: /* ESCAPE_KEY */ break;
        case 32: space = false; break;
        case 37: left = false; break;
        case 38: up = false; break;
        case 39: right = false; break;
        case 40: down = false; break;
        case 49: ONE_KEY = false; break
        case 50: TWO_KEY = false; break;
        case 65: akey = false; break;
        case 69: ekey = false; break;
        case 70: fkey = false; break;
        case 72: /* HKEY */ break;
        case 74: /* JKEY */ break;
        case 75: /* KKEY */ break;
        case 81: qkey = false; break;
        case 86: /* VKEY */ break;
        case 87: wkey = false; break;
        case 68: dkey = false; break;
        case 83: skey = false; break;
        case 88: xkey = false; break;
        default:
            console.log('unhandled keycode: ' + event.keyCode);
    }
});

function updateMouse()
{
    if (LAST_EVENT == null) return;
    let rect = CANVAS.getBoundingClientRect();
    MOUSEX = (LAST_EVENT.clientX - rect.left +
        PLAYER_SHIP.pos[0]*PIXELS - WIDTH/2)/PIXELS;
    MOUSEY = (LAST_EVENT.clientY - rect.top +
        PLAYER_SHIP.pos[1]*PIXELS - HEIGHT/2)/PIXELS;
    if (LOCK_CAMERA)
    {
        let mp = rot2d([MOUSEX - PLAYER_SHIP.pos[0],
                        MOUSEY - PLAYER_SHIP.pos[1]],
                       PLAYER_SHIP.theta - Math.PI/2);
        MOUSEX = (PLAYER_SHIP.pos[0] + mp[0]);
        MOUSEY = (PLAYER_SHIP.pos[1] + mp[1]);
    }
    MOUSEPOS[0] = MOUSEX;
    MOUSEPOS[1] = MOUSEY;
}

function collide(obj1, obj2)
{
    if (obj1 === obj2) return false;
    let default_radius = 3;
    let dx = obj2.pos[0] - obj1.pos[0];
    let dy = obj2.pos[1] - obj1.pos[1];
    let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 500) return false;
    if (typeof obj1.box == 'undefined' && typeof obj2.box == 'undefined')
    {
        return false;
    }
    else if (typeof obj1.box == 'undefined')
    {
        return obj2.box.contains(obj1.pos);
    }
    else if (typeof obj2.box == 'undefined')
    {
        return obj1.box.contains(obj2.pos);
    }
    return false; // obj1.box.intersects(obj2.box);
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
    if (objectsAre("Ship", "Corvette"))
    {
        PLAYER_SHIP.damage(PLAYER_SHIP.health);
        let corvette = obj1;
        if (!(corvette instanceof Corvette))
        {
            corvette = obj2;
        }
        corvette.damage(corvette.health);
        return;
    }
    if (objectsAre("Ship", "Debris"))
    {
        let debris = obj1;
        if (!(debris instanceof Debris))
        {
            debris = obj2;
        }
        if (debris.radius > LARGE_DEBRIS)
        {
            let vel = [(PLAYER_SHIP.vel[0] + debris.vel[0])/2,
                       (PLAYER_SHIP.vel[1] + debris.vel[1])/2];
            let domega = Math.random()*3 - 1.5;
            debris.vel = vel;
            debris.explode();
            PLAYER_SHIP.vel = vel;
            PLAYER_SHIP.omega += domega;
            PLAYER_SHIP.damage(50);
        }
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
            torpedo.explode();
            ship.damage(200);
        }
        return;
    }
    if (objectsAre("Ship", "Bullet"))
    {
        let ship = obj1, bullet = obj2;
        if (!(ship instanceof Ship))
        {
            ship = obj2;
            bullet = obj1;
        }
        if (bullet.origin !== ship)
        {
            bullet.vel = ship.vel.slice();
            bullet.explode();
            ship.damage(1);
        }
        return;
    }
    else if (objectsAre("Bullet", "Debris") || objectsAre("Torpedo", "Debris"))
    {
        if (obj1 instanceof Debris)
        {
            if (obj1.radius < SMALL_DEBRIS && objectsAre("Torpedo", "Debris"))
                return;
            obj2.vel = obj1.vel.slice();
            if (obj1.radius > LARGE_DEBRIS && objectsAre("Bullet", "Debris"))
            {
                obj2.explode();
                return;
            }
            obj1.explode();
            obj2.explode();
        }
        if (obj2 instanceof Debris)
        {
            if (obj2.radius < SMALL_DEBRIS && objectsAre("Torpedo", "Debris"))
                return;
            obj1.vel = obj2.vel.slice();
            if (obj2.radius > LARGE_DEBRIS && objectsAre("Bullet", "Debris"))
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
    else if (objectsAre("Railgun", "Torpedo"))
    {
        let torpedo = obj1;
        if (!(torpedo instanceof Torpedo))
        {
            torpedo = obj2;
        }
        if (Math.random() < 0.2) torpedo.explode();
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
        corvette.damage(200);
        return;
    }
    else if (objectsAre("Debris", "Corvette"))
    {
        let debris = obj1, corvette = obj2;
        if (!(debris instanceof Debris))
        {
            debris = obj2;
            corvette = obj1;
        }
        if (debris.radius > LARGE_DEBRIS)
        {
            debris.vel = corvette.vel.slice();
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
        if (bullet.origin !== corvette)
        {
            bullet.explode();
            corvette.damage(1);
        }
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

function physics(dt)
{
    let exploded = [];
    for (let obj1 of world)
    {
        if (obj1 instanceof Debris) continue;
        for (let obj2 of world)
        {
            if (collide(obj1, obj2))
            {
                if (exploded.length > -1)
                    exploded.push([obj1, obj2]);
            }
        }
    }
    for (let obj of exploded) handleCollision(obj[0], obj[1]);

    // WORLD ELEMENTS
    for (let i = 0; i < world.length; ++i)
    {
        let dx = world[i].pos[0] - PLAYER_SHIP.pos[0];
        let dy = world[i].pos[1] - PLAYER_SHIP.pos[1];
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > world.render_distance) world[i].remove = true;
        if (world[i].remove == true) world.splice(i, 1);
    }

    let enemy_count = 0;
    for (let obj of world)
    {
        if (obj.is_enemy) ++enemy_count;
        obj.step(dt);
    }

    while (world.length < 100 && SPAWN_DEBRIS)
    {
        let r = world.render_distance - 100;
            // Math.max(WIDTH, HEIGHT) +
            // Math.random()*(world.render_distance - Math.max(WIDTH, HEIGHT));
        let rot = Math.random()*Math.PI*2;
        let pos = [Math.cos(rot)*r + PLAYER_SHIP.pos[0],
                   Math.sin(rot)*r + PLAYER_SHIP.pos[1]];
        let vel = [Math.random()*200 - 100, //  + PLAYER_SHIP.vel[0],
                   Math.random()*200 - 100]; //  + PLAYER_SHIP.vel[1]]
        let theta = Math.random()*Math.PI*2;
        let omega = Math.random()*10 - 5;
        let size = Math.random()*20 + 10;
        let deb = new Debris(pos, vel, theta, omega, size);
        deb.world = world;
        world.push(deb);
    }

    if (enemy_count < MAX_ENEMIES && SPAWN_ENEMIES && !GAME_OVER)
    {
        let donut = world.render_distance - Math.max(WIDTH, HEIGHT);
        let r = world.render_distance - Math.random()*donut;
        let rot = Math.random()*Math.PI*2;
        let pos = [Math.cos(rot)*r + PLAYER_SHIP.pos[0],
                   Math.sin(rot)*r + PLAYER_SHIP.pos[1]];
        let vel = [PLAYER_SHIP.vel[0], PLAYER_SHIP.vel[1]];
        let corvette = new Corvette(pos, Math.random()*Math.PI*2);
        corvette.world = world;
        corvette.vel = vel;
        world.push(corvette);
    }

    if (!GAME_OVER)
    {
        if (wkey)
        {
            PLAYER_SHIP.thrusters[5].firing = true;
            PLAYER_SHIP.thrusters[6].firing = true;
        }
        if (qkey)
        {
            PLAYER_SHIP.thrusters[0].firing = true;
            PLAYER_SHIP.thrusters[7].firing = true;
        }
        if (ekey)
        {
            PLAYER_SHIP.thrusters[3].firing = true;
            PLAYER_SHIP.thrusters[4].firing = true;
        }
        if (skey || down)
        {
            PLAYER_SHIP.thrusters[1].firing = true;
            PLAYER_SHIP.thrusters[2].firing = true;
        }
        if (akey || left)
        {
            PLAYER_SHIP.thrusters[2].firing = true;
            PLAYER_SHIP.thrusters[6].firing = true;
            PLAYER_SHIP.thrusters[0].firing = true;
            PLAYER_SHIP.thrusters[4].firing = true;
        }
        if (dkey || right)
        {
            PLAYER_SHIP.thrusters[1].firing = true;
            PLAYER_SHIP.thrusters[5].firing = true;
            PLAYER_SHIP.thrusters[3].firing = true;
            PLAYER_SHIP.thrusters[7].firing = true;
        }
        if (shift || up)
        {
            PLAYER_SHIP.thrusters[8].firing = true;
        }
        if (space)
        {
            if (firemode) PLAYER_SHIP.launchTorpedo();
            else PLAYER_SHIP.fireRailgun();
        }
        if (leftClick)
        {
            PLAYER_SHIP.firePDC();
        }
    }

    let vel = PLAYER_SHIP.vel.slice();
    for (let obj of world)
    {
        obj.vel[0] -= vel[0];
        obj.vel[1] -= vel[1];
    }
}

function draw()
{
    ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
    ctx.canvas.width = document.body.clientWidth;
    ctx.canvas.height = document.body.scrollHeight;
    WIDTH = ctx.canvas.width;
    HEIGHT = ctx.canvas.height;
    updateMouse();

    ctx.save();
    ctx.translate(WIDTH/2, HEIGHT/2);
    if (LOCK_CAMERA) ctx.rotate(PLAYER_SHIP.theta - Math.PI/2);
    ctx.translate(-PLAYER_SHIP.pos[0]*PIXELS,
                  -PLAYER_SHIP.pos[1]*PIXELS);

    ctx.strokeStyle = "black";
    ctx.fillStyle = "black";
    let interval = 500;
    for (let i = 0; interval*(i + 1)*PIXELS < Math.max(WIDTH, HEIGHT); ++i)
    {
        ctx.beginPath();
        ctx.arc(PLAYER_SHIP.pos[0]*PIXELS, PLAYER_SHIP.pos[1]*PIXELS,
                interval*(i + 1)*PIXELS, 0, Math.PI*2);
        ctx.globalAlpha = 0.06;
        ctx.stroke();
        ctx.globalAlpha = 0.2;
        ctx.fillText(interval*(i + 1) + " m",
            (PLAYER_SHIP.pos[0] + interval*(i + 1))*PIXELS + 3,
            PLAYER_SHIP.pos[1]*PIXELS - 3);
    }

    ctx.globalAlpha = 0.06;
    ctx.moveTo(PLAYER_SHIP.pos[0]*PIXELS,
               PLAYER_SHIP.pos[1]*PIXELS - Math.max(WIDTH, HEIGHT));
    ctx.lineTo(PLAYER_SHIP.pos[0]*PIXELS,
               PLAYER_SHIP.pos[1]*PIXELS + Math.max(WIDTH, HEIGHT));
    ctx.moveTo(PLAYER_SHIP.pos[0]*PIXELS - Math.max(WIDTH, HEIGHT),
               PLAYER_SHIP.pos[1]*PIXELS);
    ctx.lineTo(PLAYER_SHIP.pos[0]*PIXELS + Math.max(WIDTH, HEIGHT),
               PLAYER_SHIP.pos[1]*PIXELS);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(PLAYER_SHIP.pos[0]*PIXELS, PLAYER_SHIP.pos[1]*PIXELS,
            world.render_distance*PIXELS, 0, Math.PI*2);
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = "black";
    ctx.stroke();

    for (let obj of world) obj.draw(ctx);
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(MOUSEX*PIXELS, MOUSEY*PIXELS, 1, 0, Math.PI*2);
    ctx.fill();

    ctx.restore();
    {
        let cw = 15;
        let border = 10;
        let spacing = 5;
        let fh = PLAYER_SHIP.fuel/PLAYER_SHIP.maxfuel*(HEIGHT - 2*border);
        let hh = Math.max(0, PLAYER_SHIP.health)/1000*(HEIGHT - 2*border);
        // let ch = Math.max(0, corvette.health)/1000*(height - 2*border);

        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "black";
        ctx.fillRect(border, (HEIGHT - border) - fh, cw, fh);
        ctx.fillStyle = "green";
        ctx.fillRect(border + cw + spacing, (HEIGHT - border) - hh, cw, hh);
        // ctx.fillStyle = "red";
        // ctx.fillRect(border + 2*(cw + spacing), (height - border) - ch, cw, ch);

        ctx.textAlign = "left";
        ctx.font = "15px Helvetica";
        ctx.fillStyle = "white";
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.translate(border + cw, HEIGHT - border);
        ctx.rotate(-Math.PI/2);
        ctx.fillText("FUEL", 0, -2);
        ctx.fillText("HULL", 0, cw + spacing - 2);
        // ctx.fillText("ENEMY #" + ENEMY_NO, 0, 2*(cw + spacing) - 2);
        ctx.restore();
    }

    ctx.fillStyle = "gray";
    ctx.font = "12px Helvetica";
    let weapon = firemode ? "TORPEDOES" : "RAILGUN";
    ctx.fillText("FIRING MODE: " + weapon, 70, HEIGHT - 10);
    ctx.fillText("SCALE: " + Math.round(PIXELS*10)/10 +
                 " PIXELS/METER", 270, HEIGHT - 10);
    ctx.fillText("PRESS [H] FOR HELP", 470, HEIGHT - 10);
    if (GAME_PAUSED)
        ctx.fillText("PRESS [ESC] TO UNPAUSE", 650, HEIGHT - 10);
    else
        ctx.fillText("PRESS [ESC] TO PAUSE", 650, HEIGHT - 10);

    if (GAME_PAUSED && SHOW_HELP)
    {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "white";
        // ctx.fillRect(0, 0, width, height);
        ctx.font = "24px Courier New";
        ctx.fillStyle = "#666666";
        ctx.globalAlpha = 1;
        ctx.beginPath();
        let border = 75, line = 30;
        // ctx.rect(border, border, width - 2*border, height - 2*border);
        // ctx.fill();
        // ctx.stroke();
        ctx.fillText("You are the captain of a stolen Martian corvette.",
            1.3*border, 1.5*border);
        ctx.fillText("(\"It's legitimate salvage!\", you insist " +
            "every chance you get.)", 1.3*border, 1.5*border + line);
        ctx.fillText("Destroy all the destroyers before " +
            "they destroy you.", 1.3*border, 1.5*border + 3*line);
        ctx.fillText("You can zoom out and in with keys [1] and [2].",
            1.3*border, 1.5*border + 4*line);
        ctx.fillText("To fire the MAIN ENGINE, just press the [SHIFT] key;",
            1.3*border, 1.5*border + 6*line);
        ctx.fillText("Fire MANEUVERING THRUSTERS with " +
            "[W], [A], [S], [D], [Q], and [E].",
            1.3*border, 1.5*border + 7*line);
        ctx.fillText("Hit [SPACE] to fire your PRIMARY WEAPON;",
            1.3*border, 1.5*border + 9*line);
        ctx.fillText("Use [F] to switch between TORPEDOES and RAILGUN.",
            1.3*border, 1.5*border + 10*line);
        ctx.fillText("Fire POINT DEFENSE CANNONS with just a MOUSE CLICK;",
            1.3*border, 1.5*border + 12*line);
        ctx.fillText("You can shoot down enemy torpedoes if you're quick!",
            1.3*border, 1.5*border + 13*line);
        ctx.fillText("If you need HELP again, press [H] for some tips,",
            1.3*border, 1.5*border + 15*line);
        ctx.fillText("or press [ESC] to PAUSE, so you can eat chips.",
            1.3*border, 1.5*border + 16*line);
        ctx.fillText("Please send any bug reports to my fax machine.",
            1.3*border, 1.5*border + 18*line);
    }
    else if (GAME_PAUSED)
    {
        ctx.font = "100px Helvetica";
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "darkgray";
        ctx.fillText("PAUSED", WIDTH/2 + 20, HEIGHT/2 - 20);
    }
    else if (PLAYER_SHIP.remove)
    {
        ctx.font = "100px Helvetica";
        ctx.globalAlpha = 1;
        ctx.fillStyle = "darkgray";
        ctx.fillText("YOU DIED", WIDTH/2 + 20, HEIGHT/2 - 20);
        ctx.font = "25px Helvetica";
        ctx.fillText("PRESS [SPACE] TO RESPAWN",
                     WIDTH/2 + 20, HEIGHT/2 + 30);
    }
}

function start()
{
    setTimeout(function()
    {
        current = new Date().getTime();
        draw();
        let time_passed = 0;
        if (!GAME_PAUSED) physics(dt);
        requestAnimationFrame(start);
        dt = (current - last)/1000;
        last = current;

        if (ONE_KEY && PIXELS > 0.3) PIXELS -= 0.05;
        if (TWO_KEY && PIXELS < 10) PIXELS += 0.05;

    }, 1000/FPS);
}

start();
