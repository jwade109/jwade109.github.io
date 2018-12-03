// canvas.js

const PI = Math.PI;
const RAD2DEG = 180/Math.PI;

var DRAW_TRACE = false;
var LOCK_CAMERA = false;
var MATCH_VELOCITY = false;
var SPAWN_ENEMIES = true;
var MAX_ENEMIES = 2;
var GAME_PAUSED = true;
var SLOW_TIME = false;
var SHOW_HELP = false;
var LAST_EVENT = null;
var GAME_OVER = false;
var SPAWN_TIMER = 10;
var PLAYER_SCORE = 0;

var PLAYER_POS = [0, 0];
var PLAYER_VEL = [0, 0];

var ENEMY_NO = 0;
var SPAWN_DEBRIS = true;
var RESPAWN_TIMER = 0;

var FPS = 60;
var NOMINAL_DT = 1/FPS;
var SLOW_DT = NOMINAL_DT/8;
var TIME = 0;

var CANVAS = document.getElementById("canvas");
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

var VIEW_RADIUS = 500;
var PIXELS = WIDTH/(2*VIEW_RADIUS); //  pixels per meter

var NEAREST_OBJECT = null;
var TARGET_OBJECT = null;

var world = [];
world.render_distance = 2500;

world.push(new Station([1300, -2100], 0));
var PLAYER_SHIP = new Ship([0, 0], Math.PI/2);
world.push(PLAYER_SHIP);
PLAYER_SHIP.world = world;

let bs = new Battleship([100, -400], Math.PI/6);
bs.world = world;
world.push(bs);

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

canvas.oncontextmenu = function(e)
{
    e.preventDefault();
};

document.addEventListener('mousewheel', function(event)
{
    if (event.deltaY > 0 && VIEW_RADIUS < 3000) zoom(VIEW_RADIUS*1.3);
    if (event.deltaY < 0 && VIEW_RADIUS > 50) zoom(VIEW_RADIUS/1.3);
});

document.addEventListener('mousemove', function(event)
{
    LAST_EVENT = event;
    updateMouse();
});

document.addEventListener('mousedown', function(event)
{
    switch (event.button)
    {
        case 0: leftClick = true;
                break;
        case 2: rightClick = true;
                if (TARGET_OBJECT != NEAREST_OBJECT &&
                    NEAREST_OBJECT != PLAYER_SHIP)
                    TARGET_OBJECT = NEAREST_OBJECT;
                else TARGET_OBJECT = null;
                break;
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
        case 9: event.preventDefault();
                TARGET_OBJECT = world[0];
                break;
        case 16: shift = true; break;
        case 27: GAME_PAUSED = !GAME_PAUSED;
                 SHOW_HELP = false;
                 break;
        case 32: if (GAME_OVER) location.reload();
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
        case 74: if (GAME_PAUSED) physics(-SLOW_DT);
                 break;
        case 75: if (GAME_PAUSED) physics(SLOW_DT);
                 break;
        case 81: qkey = true; break;
        case 82: SLOW_TIME = !SLOW_TIME; break;
        case 86: LOCK_CAMERA = !LOCK_CAMERA; break;
        case 87: wkey = true; break;
        case 68: dkey = true; break;
        case 83: skey = true; break;
        case 88: MATCH_VELOCITY = true; break;
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
        case 88: MATCH_VELOCITY = false; break;
        default:
            console.log('unhandled keycode: ' + event.keyCode);
    }
});

function zoom(radius)
{
    VIEW_RADIUS = radius;
    PIXELS = WIDTH/(2*VIEW_RADIUS); //  pixels per meter
}

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

    let min = Infinity;
    for (let obj of world)
    {
        // if (obj === PLAYER_SHIP) continue;
        let dx = obj.pos[0] - MOUSEX;
        let dy = obj.pos[1] - MOUSEY;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < min &&
            !(obj instanceof Bullet) &&
            !(obj instanceof Railgun))
        {
            min = dist;
            NEAREST_OBJECT = obj;
        }
    }
}

function collide(obj1, obj2)
{
    if (obj1 === obj2) return false;

    let dx = obj2.pos[0] - obj1.pos[0];
    let dy = obj2.pos[1] - obj1.pos[1];
    let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 1000) return false;

    if (typeof obj1.box == 'undefined' && typeof obj2.box == 'undefined')
    {
        return doIntersect(obj1.pos, obj1.pos_prev,
                           obj2.pos, obj2.pos_prev);
    }
    else if (typeof obj1.box == 'undefined')
    {
        return obj2.box.trace_intersect(obj1.pos, obj1.pos_prev);
    }
    else if (typeof obj2.box == 'undefined')
    {
        return obj1.box.trace_intersect(obj2.pos, obj2.pos_prev);
    }
    return obj1.box.intersects(obj2.box) ||
           obj1.box.trace_intersect(obj2.pos, obj2.pos_prev) ||
           obj2.box.trace_intersect(obj1.pos, obj1.pos_prev);
}

function handleCollision(obj1, obj2)
{
    function objectsAre(str1, str2)
    {
        if ((obj1.constructor.name == str1 &&
             obj2.constructor.name == str2)) return true;
        if ((obj2.constructor.name == str1 &&
             obj1.constructor.name == str2))
        {
            let temp = obj2;
            obj2 = obj1;
            obj1 = temp;
            return true;
        }
        return false;
    }

    if (obj1 === obj2) return;
    if (obj1.constructor.name == obj2.constructor.name) return;
    if (objectsAre("Ship", "Destroyer"))
    {
        obj1.damage(obj1.health);
        obj2.damage(obj2.health);
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
            PLAYER_SHIP.damage(DEBRIS_DAMAGE);
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
            ship.damage(TORPEDO_DAMAGE);
        }
        return;
    }
    if (objectsAre("Ship", "Bullet"))
    {
        if (obj2.origin !== obj1)
        {
            obj2.vel = obj1.vel.slice();
            obj2.explode();
            obj1.damage(PDC_DAMAGE);
        }
        return;
    }
    else if (objectsAre("Torpedo", "Debris"))
    {
        let debris = obj1, torpedo = obj2;
        if (obj2 instanceof Debris)
        {
            debris = obj2;
            torpedo = obj1;
        }
        if (debris.radius < SMALL_DEBRIS) return;
        torpedo.vel = debris.vel.slice();
        torpedo.explode();
        debris.damage(TORPEDO_DAMAGE);
        return;
    }
    else if (objectsAre("Bullet", "Debris"))
    {
        let debris = obj1, bullet = obj2;
        if (obj2 instanceof Debris)
        {
            debris = obj2;
            bullet = obj1;
        }
        bullet.vel = debris.vel.slice();
        bullet.explode();
        debris.damage(PDC_DAMAGE);
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
    else if (objectsAre("Railgun", "Destroyer"))
    {
        let destroyer = obj1;
        if (!(destroyer instanceof Destroyer))
        {
            destroyer = obj2;
        }
        destroyer.damage(200);
        return;
    }
    else if (objectsAre("Debris", "Destroyer"))
    {
        let debris = obj1, destroyer = obj2;
        if (!(debris instanceof Debris))
        {
            debris = obj2;
            destroyer = obj1;
        }
        if (debris.radius > LARGE_DEBRIS)
        {
            debris.vel = destroyer.vel.slice();
            debris.explode();
        }
        return;
    }
    else if (objectsAre("Bullet", "Destroyer"))
    {
        let destroyer = obj1, bullet = obj2;
        if (!(destroyer instanceof Destroyer))
        {
            destroyer = obj2;
            bullet = obj1;
        }
        if (bullet.origin !== destroyer)
        {
            bullet.explode();
            destroyer.damage(1);
        }
        return;
    }
    else if (objectsAre("Torpedo", "Destroyer"))
    {
        let destroyer = obj1, torpedo = obj2;
        if (!(destroyer instanceof Destroyer))
        {
            destroyer = obj2;
            torpedo = obj1;
        }
        if (torpedo.origin !== destroyer)
        {
            torpedo.vel = destroyer.vel.slice();
            destroyer.damage(100);
            torpedo.explode();
        }
        return;
    }
    else if (objectsAre("Station", "Debris"))
    {
        if (obj2.radius > LARGE_DEBRIS)
        {
            obj2.vel = obj1.vel.slice();
            obj2.explode();
        }
        return;
    }
    else if (objectsAre("Station", "Bullet"))
    {
        obj2.vel = obj1.vel.slice();
        obj2.explode();
        return;
    }
    else if (objectsAre("Station", "Ship"))
    {
        // obj2.vel = obj1.vel.slice();
        obj2.damage(obj2.health);
        return;
    }
    else if (objectsAre("Station", "Torpedo"))
    {
        obj2.vel = obj1.vel.slice();
        obj2.explode();
        return;
    }
    else if (objectsAre("Station", "Railgun"))
    {
        obj2.vel = obj1.vel.slice();
        obj2.explode();
        return;
    }
    else if (objectsAre("Station", "Destroyer"))
    {
        obj2.vel = obj1.vel.slice();
        obj2.explode();
        return;
    }
    else if (objectsAre("Battleship", "Ship"))
    {
        obj2.explode();
        obj1.damage(obj2.health);
        return;
    }
    else if (objectsAre("Battleship", "Debris"))
    {
        if (obj2.radius > LARGE_DEBRIS)
        {
            obj2.vel = obj1.vel.slice();
            obj2.explode();
            obj1.damage(DEBRIS_DAMAGE);
        }
        return;
    }
    else if (objectsAre("Battleship", "Torpedo"))
    {
        obj2.vel = obj1.vel.slice();
        obj2.explode();
        obj1.damage(TORPEDO_DAMAGE);
        return;
    }
    else if (objectsAre("Battleship", "Railgun"))
    {
        obj1.damage(RAILGUN_DAMAGE);
        return;
    }
    else if (objectsAre("Battleship", "Bullet"))
    {
        if (obj2.origin != obj1)
        {
            obj2.vel = obj1.vel.slice();
            obj2.explode();
            obj1.damage(PDC_DAMAGE);
        }
        return;
    }
    else if (objectsAre("Battleship", "Destroyer"))
    {
        obj2.vel = obj1.vel.slice();
        obj2.explode();
        obj1.damage(obj2.health);
        return;
    }

    console.log("unhandled collision between " +
                obj1.constructor.name + " and " +
                obj2.constructor.name);
}

function isOffScreen(coords)
{
    let corners = [[-WIDTH/(2*PIXELS), -HEIGHT/(2*PIXELS)],
                   [ WIDTH/(2*PIXELS), -HEIGHT/(2*PIXELS)],
                   [ WIDTH/(2*PIXELS),  HEIGHT/(2*PIXELS)],
                   [-WIDTH/(2*PIXELS),  HEIGHT/(2*PIXELS)]];
    let hitbox = new Hitbox(corners);
    hitbox.object = [];
    hitbox.object.pos = PLAYER_SHIP.pos.slice();
    hitbox.object.theta = -Math.PI/2;
    if (LOCK_CAMERA) hitbox.object.theta = PLAYER_SHIP.theta;
    return !hitbox.contains(coords);
}

function physics(dt)
{
    if (TARGET_OBJECT != null && TARGET_OBJECT.remove)
        TARGET_OBJECT = null;
    if (NEAREST_OBJECT != null && NEAREST_OBJECT.remove)
        NEAREST_OBJECT = null;

    let exploded = [];
    for (let obj1 of world)
    {
        if (obj1 instanceof Debris) continue;
        for (let obj2 of world)
            if (collide(obj1, obj2)) exploded.push([obj1, obj2]);
    }
    for (let obj of exploded) handleCollision(obj[0], obj[1]);

    for (let i = 0; i < world.length; ++i)
    {
        let dx = world[i].pos[0] - PLAYER_SHIP.pos[0];
        let dy = world[i].pos[1] - PLAYER_SHIP.pos[1];
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > world.render_distance &&
            (typeof world[i].permanent === 'undefined'))
                world[i].remove = true;
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
        let r = world.render_distance*2;
        let rot = Math.random()*Math.PI*2;
        let pos = [Math.cos(rot)*r + PLAYER_SHIP.pos[0],
                   Math.sin(rot)*r + PLAYER_SHIP.pos[1]];
        let vel = [PLAYER_SHIP.vel[0], PLAYER_SHIP.vel[1]];
        let destroyer = new Destroyer(pos, Math.random()*Math.PI*2);
        destroyer.world = world;
        destroyer.vel = vel;
        world.push(destroyer);
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
        if (MATCH_VELOCITY)
        {
            PLAYER_SHIP.matchVelocity(TARGET_OBJECT);
        }

        TIME += dt;
    }

    let pos = PLAYER_SHIP.pos.slice();
    let vel = PLAYER_SHIP.vel.slice();

    PLAYER_POS = sub2d(PLAYER_POS, pos);
    PLAYER_VEL = sub2d(PLAYER_VEL, pos);

    for (let obj of world)
    {
        obj.pos[0] -= pos[0];
        obj.pos[1] -= pos[1];
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

    if (NEAREST_OBJECT != null && (SLOW_TIME || GAME_PAUSED))
    {
        ctx.save();
        ctx.translate(NEAREST_OBJECT.pos[0]*PIXELS,
                      NEAREST_OBJECT.pos[1]*PIXELS);
        if (LOCK_CAMERA) ctx.rotate(-PLAYER_SHIP.theta + Math.PI/2);
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.globalAlpha = 0.6;
        ctx.arc(0, 0, 10*PIXELS, 0, Math.PI*2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.font = "15px Helvetica";
        ctx.textAlign = "center";
        ctx.fillText(NEAREST_OBJECT.constructor.name.toUpperCase(),
            0, -20*PIXELS);
        ctx.font = "10px Helvetica";
        if (typeof NEAREST_OBJECT.name != 'undefined')
            ctx.fillText(NEAREST_OBJECT.name, 0, -20*PIXELS - 15);
        ctx.restore();
    }
    if (TARGET_OBJECT != null)
    {
        if (!isOffScreen(TARGET_OBJECT.pos))
        {
            ctx.save();
            ctx.strokeStyle = "red";
            ctx.fillStyle = "red";
            ctx.translate(TARGET_OBJECT.pos[0]*PIXELS,
                          TARGET_OBJECT.pos[1]*PIXELS);
            if (LOCK_CAMERA) ctx.rotate(-PLAYER_SHIP.theta + Math.PI/2);
            ctx.globalAlpha = 0.6;
            ctx.strokeRect(-10*PIXELS, -10*PIXELS, 20*PIXELS, 20*PIXELS);
            ctx.globalAlpha = 1;
            ctx.font = "15px Helvetica";
            ctx.textAlign = "center";
            ctx.fillText(TARGET_OBJECT.constructor.name.toUpperCase(),
                0, -20*PIXELS);
            ctx.font = "10px Helvetica";
            if (typeof TARGET_OBJECT.name != 'undefined')
                ctx.fillText(TARGET_OBJECT.name, 0, -20*PIXELS - 15);
            ctx.restore();
        }
        else
        {
            ctx.save();
            let angle = -angle2d(PLAYER_SHIP.pos,
                                 TARGET_OBJECT.pos) + Math.PI/2;
            ctx.rotate(angle);
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = "red";
            ctx.lineWidth = 3*PIXELS;
            ctx.beginPath();
            ctx.moveTo(-10*PIXELS, -45*PIXELS);
            ctx.lineTo(0, -55*PIXELS);
            ctx.lineTo(10*PIXELS, -45*PIXELS);
            ctx.stroke();
            ctx.restore();
        }


        // ctx.save();
        // let rvel = sub2d(TARGET_OBJECT.vel, PLAYER_SHIP.vel);
        // let angle = angle2d([1, 0], rvel) + Math.PI/2;
        // ctx.rotate(-angle);
        // ctx.globalAlpha = 0.4;
        // ctx.strokeStyle = "green";
        // ctx.lineWidth = 3*PIXELS;
        // ctx.beginPath();
        // ctx.moveTo(-10*PIXELS, -45*PIXELS);
        // ctx.lineTo(0, -55*PIXELS);
        // ctx.lineTo(10*PIXELS, -45*PIXELS);
        // ctx.stroke();
        // ctx.restore();
    }

    ctx.restore();
    {
        let cw = 15;
        let border = 10;
        let spacing = 5;
        let hh = Math.max(0, PLAYER_SHIP.health)/
            PLAYER_MAX_HEALTH*(HEIGHT - 2*border);
        let rh = (HEIGHT - 2*border) - Math.max(0, PLAYER_SHIP.railgun_reload)/
            RAILGUN_COOLDOWN*(HEIGHT - 2*border);

        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "green";
        ctx.fillRect(border, (HEIGHT - border) - hh, cw, hh);
        ctx.fillStyle = "gray";
        ctx.fillRect(border + cw + spacing, (HEIGHT - border) - rh, cw, rh);

        ctx.textAlign = "left";
        ctx.font = "15px Consolas";
        ctx.fillStyle = "white";
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.translate(border + cw, HEIGHT - border);
        ctx.rotate(-Math.PI/2);
        let percent = Math.round(PLAYER_SHIP.health/PLAYER_MAX_HEALTH*100);
        ctx.fillText("HULL (" + percent + "%)", 0, -3);
        let railgun_status = "(READY TO FIRE)";
        if (PLAYER_SHIP.railgun_reload > 0) railgun_status = "(CHARGING)";
        ctx.fillText("RAILGUN " + railgun_status, 0, cw + spacing - 3);
        ctx.restore();
    }

    ctx.fillStyle = "gray";
    ctx.font = "12px Helvetica";
    let weapon = firemode ? "TORPEDOES" : "RAILGUN";
    ctx.fillText("FIRING MODE: " + weapon, 70, HEIGHT - 10);
    ctx.fillText("RADAR RANGE: " + Math.round(VIEW_RADIUS) + " METERS",
        270, HEIGHT - 10);
    if (GAME_PAUSED)
        ctx.fillText("PRESS [ESC] TO UNPAUSE", 500, HEIGHT - 10);
    else
        ctx.fillText("PRESS [ESC] TO PAUSE", 500, HEIGHT - 10);
    if (TARGET_OBJECT != null)
    {
        let dist = Math.round(distance(PLAYER_SHIP.pos, TARGET_OBJECT.pos));
        let rvel = Math.round(norm2d(
            sub2d(TARGET_OBJECT.vel, PLAYER_SHIP.vel)));
        ctx.fillText("TARGET LOCKED: " +
            TARGET_OBJECT.constructor.name.toUpperCase() + " (" +
            dist + " M, " + rvel + " M/S)", 800, HEIGHT - 10);
    }
    ctx.textAlign = "right";
    let ftime = (Math.round(TIME*100)/100).toLocaleString("en",
        {useGrouping: false,minimumFractionDigits: 2});
    ctx.fillText(ftime, WIDTH - 10, HEIGHT - 10);
    ctx.textAlign = "left";

    if (GAME_PAUSED && SHOW_HELP)
    {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "white";
        // ctx.fillRect(0, 0, width, height);
        ctx.font = "24px Helvetica";
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        let border = 40, line = 30;
        ctx.rect(0, 0, WIDTH, HEIGHT);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = "black";
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
    else if (GAME_PAUSED)
    {
        ctx.font = "100px Helvetica";
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "darkgray";
        ctx.fillText("PAUSED", WIDTH/2 + 20, HEIGHT/2 - 20);
        ctx.font = "25px Helvetica";
        ctx.fillText("PRESS [H] FOR HELP",
                     WIDTH/2 + 20, HEIGHT/2 + 30);
    }
    else if (SLOW_TIME)
    {
        ctx.font = "100px Helvetica";
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "darkgray";
        ctx.fillText("TARGET", WIDTH/2 + 20, HEIGHT/2 - 20);
    }
}

function start()
{
    setTimeout(function()
    {
        current = new Date().getTime();
        draw();
        let time_passed = 0;
        if (!GAME_PAUSED && !SLOW_TIME) physics(dt);
        else if (!GAME_PAUSED) physics(SLOW_DT);
        requestAnimationFrame(start);
        dt = (current - last)/1000;
        last = current;

        if (ONE_KEY && VIEW_RADIUS < 3000) zoom(VIEW_RADIUS + 10);
        if (TWO_KEY && VIEW_RADIUS > 50) zoom(VIEW_RADIUS - 10);

    }, 1000/FPS);
}

start();
