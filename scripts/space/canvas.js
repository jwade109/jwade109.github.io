// canvas.js

const VERSION = "2018.12.16a Lego"

const PI = Math.PI;
const RAD2DEG = 180/Math.PI;

var DRAW_TRACE = true;
var LOCK_CAMERA = false;
var CAMERA_INERTIA = 1;
var MATCH_VELOCITY = false;
var SPAWN_ENEMIES = true;
var MAX_ENEMIES = 3;
var GAME_PAUSED = true;
var PAUSE_TIME = 0;
var SLOW_TIME = false;
var SHOW_HELP = false;
var GAME_OVER = false;
var PLAYER_SCORE = 0;
var DOCKING_MODE = false;

var PLAYER_VEL = [0, 0];

var SPAWN_DEBRIS = true;
var RESPAWN_DELAY = 10;
var RESPAWN_TIMER = 25;
var BETWEEN_WAVES = true;

var PAN = [0, 0];

var FPS = 60;
var NOMINAL_DT = 1/FPS;
var SLOW_DT = NOMINAL_DT/8;
var TIME = 0;

var CANVAS = document.getElementById("canvas");
var CTX = CANVAS.getContext("2d");

var AUDIO = new Audio("scripts/space/sounds/Wii Shop Channel Music.mp3");
console.log(AUDIO);
AUDIO.volume = 0.05;

var LEFT_KEY = false, RIGHT_KEY = false, UP_KEY = false, DOWN_KEY = false,
    space = false,
    akey = false, wkey = false, dkey = false, skey = false, xkey = false,
    fkey = false, qkey = false, ekey = false, leftClick = false,
    rightClick = false, shift = false, MOUSEBUTTON_DOWN = false;
    ENTER_KEY = false;

var ONE_KEY = false, TWO_KEY = false;

var ALERTS = [];
var ALERT_DISPLAY_TIME = 3;
var firemode = true;

var WIDTH = document.body.clientWidth;
var HEIGHT = document.body.scrollHeight;
var MOUSEX = 0, MOUSEY = 0;
var MOUSE_SCREEN_POS = [0, 0];

var VIEW_RADIUS = 800;
var PIXELS = WIDTH/(2*VIEW_RADIUS); //  pixels per meter

var NEAREST_OBJECT = null;
var TARGET_OBJECT = null;

var WORLD = [];
const WORLD_RENDER_DISTANCE = 4000;
const MIN_ZOOM = 30;
const MAX_ZOOM = 3000;

var PLAYER_SHIP = new Corvette([0, 0], Math.PI/2);
WORLD.push(PLAYER_SHIP);

WORLD.push(new Donnager([0, -2000], -Math.PI/6));

let current = new Date().getTime(), last = current, dt = 0;

for (let i = 0; i < 20 && SPAWN_DEBRIS; ++i)
{
    let r = Math.random()*WORLD_RENDER_DISTANCE/2 + 200;
    let rot = Math.random()*Math.PI*2;
    let pos = [Math.cos(rot)*r + PLAYER_SHIP.pos[0],
               Math.sin(rot)*r + PLAYER_SHIP.pos[1]];
    let vel = [Math.random()*200 - 100 + PLAYER_SHIP.vel[0],
               Math.random()*200 - 100 + PLAYER_SHIP.vel[1]]
    let theta = Math.random()*Math.PI*2;
    let omega = Math.random()*10 - 5;
    let size = Math.random()*25 + 10;
    let deb = new Debris(pos, vel, theta, omega, size);
    WORLD.push(deb);
}

canvas.oncontextmenu = function(e)
{
    e.preventDefault();
};

document.addEventListener('mousewheel', function(event)
{
    if (event.deltaY > 0) zoom(VIEW_RADIUS*1.3);
    if (event.deltaY < 0) zoom(VIEW_RADIUS/1.3);
},
{ capture: true, passive: true});

document.addEventListener('mousemove', function(event)
{
    // if (!AUDIO.ispaused && AUDIO.readyState > 0) AUDIO.play();
    MOUSE_SCREEN_POS = [event.clientX, event.clientY];
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
        case 1: MOUSEBUTTON_DOWN = true; break;
    }
});

document.addEventListener('mouseup', function(event)
{
    switch (event.button)
    {
        case 0: leftClick = false; break;
        case 2: rightClick = false; break;
        case 1: MOUSEBUTTON_DOWN = false; break;
    }
});

document.addEventListener('keydown', function(event)
{
    let str = "";
    switch (event.keyCode)
    {
        case 9:  break;
        case 13: ENTER_KEY = true;
                 break;
        case 16: shift = true; break;
        case 27: GAME_PAUSED = !GAME_PAUSED;
                 SHOW_HELP = false;
                 break;
        case 32: if (GAME_OVER) location.reload();
                 else space = true;
                 break;
        case 37: LEFT_KEY = true; break;
        case 38: UP_KEY = true; break;
        case 39: RIGHT_KEY = true; break;
        case 40: DOWN_KEY = true; break;
        case 49: ONE_KEY = true; break
        case 50: TWO_KEY = true; break;
        case 65: akey = true; break;
        case 66: DRAW_FIRING_ARC = !DRAW_FIRING_ARC; break;
        case 69: ekey = true; break;
        case 70: firemode = !firemode;
                 str = firemode ?
                     "Switched active weapon to torpedoes." :
                     "Switched active weapon to railgun.";
                 throwAlert(str, ALERT_DISPLAY_TIME);
                 break;
        case 72: SHOW_HELP = !SHOW_HELP;
                 if (SHOW_HELP) GAME_PAUSED = true;
                 break;
        case 74: if (GAME_PAUSED) physics(-SLOW_DT);
                 break;
        case 75: if (GAME_PAUSED) physics(SLOW_DT);
                 break;
        case 77: DRAW_TRACE = !DRAW_TRACE;
                 str = DRAW_TRACE ? "enabled." : "disabled."
                 throwAlert("DRAW_TRACE " + str, ALERT_DISPLAY_TIME);
                 break;
        case 78: DRAW_HITBOX = !DRAW_HITBOX;
                 str = DRAW_HITBOX ? "enabled." : "disabled."
                 throwAlert("DRAW_HITBOX " + str, ALERT_DISPLAY_TIME);
                 break;
        case 80: DOCKING_MODE = !DOCKING_MODE;
                 str = DOCKING_MODE ? "enabled." : "disabled."
                 throwAlert("Docking mode " + str, ALERT_DISPLAY_TIME);
                 break;
        case 81: qkey = true; break;
        case 82: SLOW_TIME = !SLOW_TIME; break;
        case 86: LOCK_CAMERA = !LOCK_CAMERA;
                 str = LOCK_CAMERA ?
                     "Locked camera enabled." :
                     "Locked camera disabled";
                 throwAlert(str, ALERT_DISPLAY_TIME);
                 break;
        case 87: wkey = true; break;
        case 68: dkey = true; break;
        case 83: skey = true; break;
        case 88: MATCH_VELOCITY = true; break;
        case 191: if (NEAREST_OBJECT !== PLAYER_SHIP)
                      TARGET_OBJECT = NEAREST_OBJECT;
                  break;
        default:
            console.log('unhandled keycode: ' + event.keyCode);
    }
});

document.addEventListener('keyup', function(event)
{
    switch (event.keyCode)
    {
        case 16: shift = false; break;
        case 13: ENTER_KEY = false;
                 break;
        case 27: /* ESCAPE_KEY */ break;
        case 32: space = false; break;
        case 37: LEFT_KEY = false; break;
        case 38: UP_KEY = false; break;
        case 39: RIGHT_KEY = false; break;
        case 40: DOWN_KEY = false; break;
        case 49: ONE_KEY = false; break
        case 50: TWO_KEY = false; break;
        case 65: akey = false; break;
        case 66: /* BKEY */ break;
        case 69: ekey = false; break;
        case 70: fkey = false; break;
        case 72: /* HKEY */ break;
        case 74: /* JKEY */ break;
        case 75: /* KKEY */ break;
        case 77: /* MKEY */ break;
        case 78: /* NKEY */ break;
        case 80: /* PKEY */ break;
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

function throwAlert(msg, time)
{
    // for (let m of ALERTS)
    if (ALERTS.length > 0 && ALERTS[ALERTS.length - 1][0] == msg) return;
    ALERTS.push([msg, time]);
}

function zoom(radius)
{
    VIEW_RADIUS = Math.max(MIN_ZOOM, Math.min(radius, MAX_ZOOM));
    PIXELS = WIDTH/(2*VIEW_RADIUS); //  pixels per meter
}

function updateMouse()
{
    let rect = CANVAS.getBoundingClientRect();
    MOUSEX = (MOUSE_SCREEN_POS[0] - rect.left +
        PLAYER_SHIP.pos[0]*PIXELS - WIDTH/2)/PIXELS;
    MOUSEY = (MOUSE_SCREEN_POS[1] - rect.top +
        PLAYER_SHIP.pos[1]*PIXELS - HEIGHT/2)/PIXELS;
    if (LOCK_CAMERA)
    {
        let mp = rot2d([MOUSEX - PLAYER_SHIP.pos[0],
                        MOUSEY - PLAYER_SHIP.pos[1]],
                       PLAYER_SHIP.theta - Math.PI/2);
        MOUSEX = (PLAYER_SHIP.pos[0] + mp[0]);
        MOUSEY = (PLAYER_SHIP.pos[1] + mp[1]);
    }

    let min = Infinity;
    for (let obj of WORLD)
    {
        // if (obj === PLAYER_SHIP) continue;
        let dx = obj.pos[0] - MOUSEX;
        let dy = obj.pos[1] - MOUSEY;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < min && obj.trackable)
        {
            min = dist;
            NEAREST_OBJECT = obj;
        }
    }
}

function collide(obj1, obj2)
{
    if (obj1 === obj2) return false;
    if (obj1.nocollide || obj2.nocollide) return false;
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
    if (typeof obj1.handleCollision === 'function')
    {
        obj1.handleCollision(obj2);
    }
    if (typeof obj2.handleCollision === 'function')
    {
        obj2.handleCollision(obj1);
    }
}

function isOffScreen(coords)
{
    let corners = [[-WIDTH/(2*PIXELS) + 5/PIXELS, -HEIGHT/(2*PIXELS) + 5/PIXELS],
                   [ WIDTH/(2*PIXELS) - 5/PIXELS, -HEIGHT/(2*PIXELS) + 5/PIXELS],
                   [ WIDTH/(2*PIXELS) - 5/PIXELS,  HEIGHT/(2*PIXELS) - 5/PIXELS],
                   [-WIDTH/(2*PIXELS) + 5/PIXELS,  HEIGHT/(2*PIXELS) - 5/PIXELS]];
    let hitbox = new Hitbox(corners);
    hitbox.object = [];
    hitbox.object.pos = PLAYER_SHIP.pos.slice();
    hitbox.object.theta = 0;
    if (LOCK_CAMERA) hitbox.object.theta = PLAYER_SHIP.theta + Math.PI/2;
    if (DRAW_HITBOX) hitbox.draw(CTX);
    return !hitbox.contains(coords);
}

function physics(dt)
{
    if (TARGET_OBJECT != null && TARGET_OBJECT.remove)
        TARGET_OBJECT = null;
    if (NEAREST_OBJECT != null && NEAREST_OBJECT.remove)
        NEAREST_OBJECT = null;

    let collided = [];
    for (let obj1 of WORLD)
    {
        if (obj1 instanceof Debris) continue;
        for (let obj2 of WORLD)
            if (collide(obj1, obj2) &&
                !collided.some(e => e[0] == obj2 && e[1] == obj1))
                    collided.push([obj1, obj2]);
    }
    for (let obj of collided) handleCollision(obj[0], obj[1]);

    for (let i = 0; i < WORLD.length; ++i)
    {
        let dx = WORLD[i].pos[0] - PLAYER_SHIP.pos[0];
        let dy = WORLD[i].pos[1] - PLAYER_SHIP.pos[1];
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > WORLD_RENDER_DISTANCE && !WORLD[i].permanent)
            WORLD[i].remove = true;
        if (WORLD[i].remove == true) WORLD.splice(i, 1);
    }

    let enemy_count = 0;
    for (let obj of WORLD)
    {
        if (obj.is_enemy) ++enemy_count;
        obj.step(dt);
    }

    while (WORLD.length < 100 && SPAWN_DEBRIS)
    {
        let r = WORLD_RENDER_DISTANCE - 100;
        let rot = Math.random()*Math.PI*2;
        let pos = [Math.cos(rot)*r + PLAYER_SHIP.pos[0],
                   Math.sin(rot)*r + PLAYER_SHIP.pos[1]];
        let vel = [Math.random()*200 - 100, //  + PLAYER_SHIP.vel[0],
                   Math.random()*200 - 100]; //  + PLAYER_SHIP.vel[1]]
        let theta = Math.random()*Math.PI*2;
        let omega = Math.random()*10 - 5;
        let size = Math.random()*20 + 10;
        if (Math.random() < 0.01)
        {
            size *= 5;
            omega /= 10;
        }
        let deb = new Debris(pos, vel, theta, omega, size);
        WORLD.push(deb);
    }

    if (enemy_count == 0 && SPAWN_ENEMIES && !GAME_OVER && RESPAWN_TIMER < 0)
    {
        BETWEEN_WAVES = false;
        ++PLAYER_SCORE;
        throwAlert("Enemy vessels incoming.", ALERT_DISPLAY_TIME*3);
        for (let i = 0; i < PLAYER_SCORE; ++i)
        {
            let r = WORLD_RENDER_DISTANCE*2;
            let rot = Math.random()*Math.PI*2;
            let pos = [Math.cos(rot)*r + PLAYER_SHIP.pos[0],
                       Math.sin(rot)*r + PLAYER_SHIP.pos[1]];
            let vel = [PLAYER_SHIP.vel[0], PLAYER_SHIP.vel[1]];
            let enemy = new Morrigan(pos, 0);
            if (PLAYER_SCORE > 2 && i == 0 || i == 5)
                enemy = new Amun_Ra(pos, 0);
            enemy.vel = vel;
            WORLD.push(enemy);
        }
        RESPAWN_TIMER = RESPAWN_DELAY;
    }
    else if (enemy_count == 0)
    {
        BETWEEN_WAVES = true;
        if (RESPAWN_TIMER == RESPAWN_DELAY)
            throwAlert("Enemy vessels inbound in " + RESPAWN_DELAY +
                " seconds.", RESPAWN_DELAY);
        RESPAWN_TIMER -= dt;
        if (RESPAWN_TIMER > 0)
        {
            PLAYER_SHIP.health += PASSIVE_REGEN*dt;
            PLAYER_SHIP.health =
                Math.min(PLAYER_SHIP.health, CORVETTE_MAX_HEALTH);
        }
    }
    if (!GAME_OVER)
    {
        if (wkey)
        {
            // PLAYER_SHIP.thrusters[5].firing = true;
            // PLAYER_SHIP.thrusters[6].firing = true;
        }
        if (qkey)
        {
            // PLAYER_SHIP.thrusters[0].firing = true;
            // PLAYER_SHIP.thrusters[7].firing = true;
        }
        if (ekey)
        {
            // PLAYER_SHIP.thrusters[3].firing = true;
            // PLAYER_SHIP.thrusters[4].firing = true;
        }
        if (skey)
        {
            // PLAYER_SHIP.thrusters[1].firing = true;
            // PLAYER_SHIP.thrusters[2].firing = true;
        }
        if (akey)
        {
            // PLAYER_SHIP.thrusters[2].firing = true;
            // PLAYER_SHIP.thrusters[6].firing = true;
            // PLAYER_SHIP.thrusters[0].firing = true;
            // PLAYER_SHIP.thrusters[4].firing = true;
            PLAYER_SHIP.applyMoment(50000000);
        }
        if (dkey)
        {
            // PLAYER_SHIP.thrusters[1].firing = true;
            // PLAYER_SHIP.thrusters[5].firing = true;
            // PLAYER_SHIP.thrusters[3].firing = true;
            // PLAYER_SHIP.thrusters[7].firing = true;
            PLAYER_SHIP.applyMoment(-50000000);
        }
        if (shift)
        {
            // PLAYER_SHIP.thrusters[8].firing = true;
            PLAYER_SHIP.applyForce(rot2d([CORVETTE_MAIN_THRUST, 0],
                PLAYER_SHIP.theta));
        }
        if (space)
        {
            if (firemode) PLAYER_SHIP.launchTorpedo();
            else PLAYER_SHIP.fireRailgun();
            space = false;
        }
        if (leftClick || ENTER_KEY)
        {
            PLAYER_SHIP.firePDC();
        }
        if (MATCH_VELOCITY)
        {
            // PLAYER_SHIP.matchVelocity(TARGET_OBJECT);
        }
        // PLAYER_SHIP.applyMoment(-PLAYER_SHIP.omega*CORVETTE_MOMENT_INERTIA);

        TIME += dt;
    }

    let pos = PLAYER_SHIP.pos.slice();
    let vel = PLAYER_SHIP.vel.slice();
    for (let obj of WORLD)
    {
        obj.pos[0] -= pos[0];
        obj.pos[1] -= pos[1];
        obj.vel[0] -= vel[0];
        obj.vel[1] -= vel[1];
    }

    for (let i in ALERTS)
    {
        ALERTS[i][1] -= dt;
        if (ALERTS[i][1] < 0) ALERTS.splice(i, 1);
    }
}

function draw()
{
    CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);
    CTX.canvas.width = document.body.clientWidth;
    CTX.canvas.height = document.body.scrollHeight;
    WIDTH = CTX.canvas.width;
    HEIGHT = CTX.canvas.height;
    updateMouse();

    // CTX.fillStyle = "#222222";
    // CTX.globalAlpha = 1;
    // CTX.fillRect(0, 0, WIDTH, HEIGHT);

    CTX.save();
    CTX.translate(WIDTH/2, HEIGHT/2);
    if (LOCK_CAMERA) CTX.rotate(PLAYER_SHIP.theta - Math.PI/2);
    CTX.translate(-PLAYER_SHIP.pos[0]*PIXELS,
                  -PLAYER_SHIP.pos[1]*PIXELS);

    CTX.strokeStyle = "black";
    CTX.fillStyle = "black";
    let interval = 500;
    for (let i = 0; interval*(i + 1)*PIXELS < Math.max(WIDTH, HEIGHT); ++i)
    {
        CTX.beginPath();
        CTX.arc(PLAYER_SHIP.pos[0]*PIXELS, PLAYER_SHIP.pos[1]*PIXELS,
                interval*(i + 1)*PIXELS, 0, Math.PI*2);
        CTX.globalAlpha = 0.06;
        CTX.stroke();
        CTX.globalAlpha = 0.2;
        CTX.fillText(interval*(i + 1) + " m",
            (PLAYER_SHIP.pos[0] + interval*(i + 1))*PIXELS + 3,
            PLAYER_SHIP.pos[1]*PIXELS - 3);
    }

    CTX.save();
    CTX.globalAlpha = 0.4;
    CTX.moveTo(PLAYER_SHIP.pos[0]*PIXELS, PLAYER_SHIP.pos[1]*PIXELS);
    CTX.textAlign = "center";
    CTX.beginPath();
    CTX.strokeStyle = CTX.fillStyle = "orange";
    CTX.setLineDash([20*PIXELS, 30*PIXELS]);
    CTX.arc(0, 0, CORVETTE_PDC_RANGE*PIXELS, 0, Math.PI*2);
    CTX.stroke();
    CTX.fillText("PDC MAX RANGE", 0, -CORVETTE_PDC_RANGE*PIXELS - 2);
    CTX.restore();

    CTX.globalAlpha = 0.06;
    CTX.moveTo(PLAYER_SHIP.pos[0]*PIXELS,
               PLAYER_SHIP.pos[1]*PIXELS - Math.max(WIDTH, HEIGHT));
    CTX.lineTo(PLAYER_SHIP.pos[0]*PIXELS,
               PLAYER_SHIP.pos[1]*PIXELS + Math.max(WIDTH, HEIGHT));
    CTX.moveTo(PLAYER_SHIP.pos[0]*PIXELS - Math.max(WIDTH, HEIGHT),
               PLAYER_SHIP.pos[1]*PIXELS);
    CTX.lineTo(PLAYER_SHIP.pos[0]*PIXELS + Math.max(WIDTH, HEIGHT),
               PLAYER_SHIP.pos[1]*PIXELS);
    CTX.stroke();

    CTX.beginPath();
    CTX.arc(PLAYER_SHIP.pos[0]*PIXELS, PLAYER_SHIP.pos[1]*PIXELS,
            WORLD_RENDER_DISTANCE*PIXELS, 0, Math.PI*2);
    CTX.globalAlpha = 0.2;
    CTX.strokeStyle = "black";
    CTX.stroke();

    for (let obj of WORLD) obj.draw(CTX);
    CTX.globalAlpha = 1;
    CTX.strokeStyle = "black";
    CTX.beginPath();
    CTX.arc(MOUSEX*PIXELS, MOUSEY*PIXELS, 4, 0, Math.PI*2);
    CTX.stroke();

    if (NEAREST_OBJECT != null && (SLOW_TIME || GAME_PAUSED))
    {
        CTX.save();
        CTX.translate(NEAREST_OBJECT.pos[0]*PIXELS,
                      NEAREST_OBJECT.pos[1]*PIXELS);
        if (LOCK_CAMERA) CTX.rotate(-PLAYER_SHIP.theta + Math.PI/2);
        CTX.strokeStyle = "black";
        CTX.fillStyle = "black";
        CTX.beginPath();
        CTX.globalAlpha = 0.6;
        CTX.arc(0, 0, 10*PIXELS, 0, Math.PI*2);
        CTX.stroke();
        CTX.globalAlpha = 1;
        CTX.font = "15px Helvetica";
        CTX.textAlign = "center";
        if (typeof NEAREST_OBJECT.type != "undefined")
            CTX.fillText(NEAREST_OBJECT.type.toUpperCase(),
                0, -20*PIXELS);
        else
            CTX.fillText(NEAREST_OBJECT.constructor.name.toUpperCase(),
                0, -20*PIXELS);
        CTX.font = "10px Helvetica";
        if (typeof NEAREST_OBJECT.name != 'undefined')
            CTX.fillText(NEAREST_OBJECT.name, 0, -20*PIXELS - 15);
        CTX.restore();
    }
    if (TARGET_OBJECT != null)
    {
        if (!isOffScreen(TARGET_OBJECT.pos))
        {
            CTX.save();
            CTX.strokeStyle = "red";
            CTX.fillStyle = "red";
            CTX.translate(TARGET_OBJECT.pos[0]*PIXELS,
                          TARGET_OBJECT.pos[1]*PIXELS);
            if (LOCK_CAMERA) CTX.rotate(-PLAYER_SHIP.theta + Math.PI/2);
            CTX.globalAlpha = 0.6;
            CTX.strokeRect(-10*PIXELS, -10*PIXELS, 20*PIXELS, 20*PIXELS);
            CTX.globalAlpha = 1;
            CTX.font = "15px Helvetica";
            CTX.textAlign = "center";
            if (typeof TARGET_OBJECT.type != "undefined")
                CTX.fillText(TARGET_OBJECT.type.toUpperCase(), 0, -20*PIXELS);
            else
                CTX.fillText(TARGET_OBJECT.constructor.name.toUpperCase(),
                    0, -20*PIXELS);
            CTX.font = "10px Helvetica";
            if (typeof TARGET_OBJECT.name != 'undefined')
                CTX.fillText(TARGET_OBJECT.name, 0, -20*PIXELS - 15);
            CTX.restore();
        }
        else
        {
            CTX.save();
            let angle = -angle2d(PLAYER_SHIP.pos,
                                 TARGET_OBJECT.pos) + Math.PI/2;
            CTX.rotate(angle);
            CTX.globalAlpha = 0.4;
            CTX.strokeStyle = "red";
            CTX.lineWidth = 3*PIXELS;
            CTX.beginPath();
            CTX.moveTo(-10*PIXELS, -45*PIXELS);
            CTX.lineTo(0, -55*PIXELS);
            CTX.lineTo(10*PIXELS, -45*PIXELS);
            CTX.stroke();
            CTX.restore();
        }


        // CTX.save();
        // let rvel = sub2d(TARGET_OBJECT.vel, PLAYER_SHIP.vel);
        // let angle = angle2d([1, 0], rvel) + Math.PI/2;
        // CTX.rotate(-angle);
        // CTX.globalAlpha = 0.4;
        // CTX.strokeStyle = "green";
        // CTX.lineWidth = 3*PIXELS;
        // CTX.beginPath();
        // CTX.moveTo(-10*PIXELS, -45*PIXELS);
        // CTX.lineTo(0, -55*PIXELS);
        // CTX.lineTo(10*PIXELS, -45*PIXELS);
        // CTX.stroke();
        // CTX.restore();
    }

    CTX.restore();
    {
        let cw = 15;
        let border = 10;
        let spacing = 5;
        let hh = Math.max(0, PLAYER_SHIP.health)/
            CORVETTE_MAX_HEALTH*(HEIGHT - 2*border);
        let rh = (HEIGHT - 2*border) - Math.max(0, PLAYER_SHIP.railgun_reload)/
            RAILGUN_COOLDOWN*(HEIGHT - 2*border);

        CTX.globalAlpha = 0.3;
        CTX.fillStyle = "green";
        CTX.fillRect(border, (HEIGHT - border) - hh, cw, hh);
        CTX.fillStyle = "gray";
        CTX.fillRect(border + cw + spacing, (HEIGHT - border) - rh, cw, rh);

        CTX.textAlign = "left";
        CTX.font = "15px Consolas";
        CTX.fillStyle = "white";
        CTX.globalAlpha = 1;
        CTX.save();
        CTX.translate(border + cw, HEIGHT - border);
        CTX.rotate(-Math.PI/2);
        let percent = Math.round(PLAYER_SHIP.health/CORVETTE_MAX_HEALTH*100);
        CTX.fillText("HULL (" + percent + "%)", 0, -3);
        let railgun_status = "(READY TO FIRE)";
        if (PLAYER_SHIP.railgun_reload > 0) railgun_status = "(CHARGING)";
        CTX.fillText("RAILGUN " + railgun_status, 0, cw + spacing - 3);
        CTX.restore();
    }

    CTX.fillStyle = "gray";
    CTX.font = "12px Helvetica";
    let weapon = firemode ? "TORPEDOES" : "RAILGUN";
    CTX.fillText("FIRING MODE: " + weapon, 70, HEIGHT - 10);
    CTX.fillText("RADAR RANGE: " + Math.round(VIEW_RADIUS) + " METERS",
        270, HEIGHT - 10);
    if (GAME_PAUSED)
        CTX.fillText("PRESS [ESC] TO UNPAUSE", 500, HEIGHT - 10);
    else
        CTX.fillText("PRESS [ESC] TO PAUSE", 500, HEIGHT - 10);
    if (TARGET_OBJECT != null)
    {
        let dist = Math.round(distance(PLAYER_SHIP.pos, TARGET_OBJECT.pos));
        let rvel = Math.round(norm2d(
            sub2d(TARGET_OBJECT.vel, PLAYER_SHIP.vel)));

        let dstr = Math.round(dist).toLocaleString("en",
            {useGrouping: false, minimumFractionDigits: 0}) + " M";
        if (dist >= 1000)
            dstr = (Math.round(dist/100)/10).toLocaleString("en",
                {useGrouping: false, minimumFractionDigits: 1}) + " KM";
        let vstr = Math.round(rvel).toLocaleString("en",
            {useGrouping: false, minimumFractionDigits: 0}) + " M/S";
        if (rvel >= 1000)
            vstr = (Math.round(rvel/100)/10).toLocaleString("en",
                {useGrouping: false, minimumFractionDigits: 1}) + " KM/S";

        if (typeof TARGET_OBJECT.type != "undefined")
            CTX.fillText("TARGET LOCKED: " +
                TARGET_OBJECT.type.toUpperCase() + " (" +
                dstr + ", " + vstr + ")", 800, HEIGHT - 10);
        else
            CTX.fillText("TARGET LOCKED: " +
                TARGET_OBJECT.constructor.name.toUpperCase() + " (" +
                dstr + ", " + vstr + ")", 800, HEIGHT - 10);
    }
    CTX.textAlign = "right";
    let ftime = (Math.round(TIME*100)/100).toLocaleString("en",
        {useGrouping: false, minimumFractionDigits: 2});
    CTX.fillText(ftime, WIDTH - 10, HEIGHT - 10);
    CTX.textAlign = "left";

    CTX.fillStyle = "black";
    for (let i in ALERTS)
    {
        let opacity = Math.min(2/3, 1);
        CTX.globalAlpha = 1;
        CTX.fillText(ALERTS[i][0].toUpperCase(),
            70, 30 + 20*(ALERTS.length - i - 1));
    }


    CTX.fillStyle = "gray";
    CTX.font = "12px Helvetica";
    CTX.fillText("BUILD: " + VERSION.toUpperCase(), 720, HEIGHT - 10);

    if (GAME_PAUSED && SHOW_HELP)
    {
        CTX.globalAlpha = 0.9;
        CTX.fillStyle = "white";
        // CTX.fillRect(0, 0, width, height);
        CTX.font = "24px Helvetica";
        CTX.globalAlpha = 0.6;
        CTX.beginPath();
        let border = 40, line = 30;
        CTX.rect(0, 0, WIDTH, HEIGHT);
        CTX.fill();
        CTX.globalAlpha = 1;
        CTX.fillStyle = "black";
        CTX.fillText("You are the captain of a stolen Martian corvette.",
            1.3*border, 1.5*border);
        CTX.fillText("(\"It's legitimate salvage!\", you insist " +
            "every chance you get.)", 1.3*border, 1.5*border + line);
        CTX.fillText("Destroy all the destroyers before " +
            "they destroy you.", 1.3*border, 1.5*border + 3*line);
        CTX.fillText("You can zoom out and in with keys [1] and [2].",
            1.3*border, 1.5*border + 4*line);
        CTX.fillText("To fire the MAIN ENGINE, just press the [SHIFT] key;",
            1.3*border, 1.5*border + 6*line);
        CTX.fillText("Fire MANEUVERING THRUSTERS with " +
            "[W], [A], [S], [D], [Q], and [E].",
            1.3*border, 1.5*border + 7*line);
        CTX.fillText("Hit [SPACE] to fire your PRIMARY WEAPON;",
            1.3*border, 1.5*border + 9*line);
        CTX.fillText("Use [F] to switch between TORPEDOES and RAILGUN.",
            1.3*border, 1.5*border + 10*line);
        CTX.fillText("Fire POINT DEFENSE CANNONS with just a MOUSE CLICK;",
            1.3*border, 1.5*border + 12*line);
        CTX.fillText("You can shoot down enemy torpedoes if you're quick!",
            1.3*border, 1.5*border + 13*line);
        CTX.fillText("If you need HELP again, press [H] for some tips,",
            1.3*border, 1.5*border + 15*line);
        CTX.fillText("or press [ESC] to PAUSE, so you can eat chips.",
            1.3*border, 1.5*border + 16*line);
        CTX.fillText("Please send any bug reports to my fax machine.",
            1.3*border, 1.5*border + 18*line);
    }
    else if (PLAYER_SHIP.remove)
    {
        CTX.font = "100px Helvetica";
        CTX.globalAlpha = 1;
        CTX.fillStyle = "darkgray";
        CTX.fillText("YOU DIED", WIDTH/2 + 20, HEIGHT/2 - 20);
        CTX.font = "25px Helvetica";
        CTX.fillText("PRESS [SPACE] TO RESPAWN",
                     WIDTH/2 + 20, HEIGHT/2 + 30);
    }
    else if (GAME_PAUSED)
    {
        CTX.font = "100px Helvetica";
        CTX.globalAlpha = 0.4;
        CTX.fillStyle = "darkgray";
        CTX.fillText("PAUSED", WIDTH/2 + 20, HEIGHT/2 - 20);
        CTX.font = "25px Helvetica";
        CTX.fillText("PRESS [H] FOR HELP",
                     WIDTH/2 + 20, HEIGHT/2 + 30);
    }
    else if (SLOW_TIME)
    {
        CTX.font = "100px Helvetica";
        CTX.globalAlpha = 0.4;
        CTX.fillStyle = "darkgray";
        CTX.fillText("TARGET", WIDTH/2 + 20, HEIGHT/2 - 20);
    }
    else if (BETWEEN_WAVES && RESPAWN_TIMER > 0)
    {
        CTX.font = "30px Helvetica";
        CTX.globalAlpha = 0.4;
        CTX.fillStyle = "darkgray";
        let rtime = (Math.round(RESPAWN_TIMER*100)/100).toLocaleString("en",
            {useGrouping: false, minimumFractionDigits: 2});
        CTX.fillText("WAVE " + (PLAYER_SCORE + 1) + " IN",
            WIDTH/2 + 20, HEIGHT/2 - 60);
        CTX.fillText("T-" + rtime + "s", WIDTH/2 + 20, HEIGHT/2 - 20);
    }
    CTX.font = "30px Helvetica";
    CTX.globalAlpha = 0.4;
    CTX.fillStyle = "darkgray";
    CTX.fillText("WAVE " + PLAYER_SCORE, WIDTH - 200, HEIGHT - 10);
}

function start()
{
    if (GAME_PAUSED) AUDIO.playbackRate = 0;
    else if (SLOW_TIME)
    {
        AUDIO.playbackRate = 1;
        AUDIO.volume = 0.015;
    }
    else
    {
        if (!AUDIO.ispaused) AUDIO.play();
        AUDIO.playbackRate = 1;
        AUDIO.volume = 0.03;
    }


    current = new Date().getTime();
    draw();
    let time_passed = 0;
    if (!GAME_PAUSED && !SLOW_TIME && PAUSE_TIME <= 0) physics(dt);
    else if (!GAME_PAUSED && PAUSE_TIME <= 0) physics(SLOW_DT);
    requestAnimationFrame(start);
    dt = (current - last)/1000;
    last = current;

    if (PAUSE_TIME > 0) PAUSE_TIME -= dt;

    if (ONE_KEY) zoom(VIEW_RADIUS + 50);
    if (TWO_KEY) zoom(VIEW_RADIUS - 50);

    let ds = 5;
    if (UP_KEY) MOUSE_SCREEN_POS[1] -= ds;
    if (DOWN_KEY) MOUSE_SCREEN_POS[1] += ds;
    if (LEFT_KEY) MOUSE_SCREEN_POS[0] -= ds;
    if (RIGHT_KEY) MOUSE_SCREEN_POS[0] += ds;
}

start();
