// canvas.js

const VERSION = "2019.1.1c";

var DRAW_TRACE = false;
var DRAW_ACCEL = false;
var SHOW_ALL_ALERTS = false;
var LOCK_CAMERA = false;
var SPAWN_ENEMIES = true;
var NUMBER_OF_ENEMIES = 0;
var GAME_PAUSED = true;
var PAUSE_TIME = 0;
var SLOW_TIME = false;
var GAME_OVER = false;
var PLAYER_SCORE = 0;
var SPAWN_DEBRIS = true;
var SHOW_OVERLAY = true;
const RESPAWN_DELAY = 15;
var RESPAWN_TIMER = 30;
var BETWEEN_WAVES = true;
const TARGETING_MAX = 8;
var TARGETING_STAMINA = TARGETING_MAX;
const PASSIVE_REGEN = 0.02; // percent per second
var TARGETING_LOCKOUT = false;

const FPS = 60;
const NOMINAL_DT = 1/FPS;
const SLOW_DT = NOMINAL_DT/8;
var TIME = 0;

const CANVAS = document.getElementById("canvas");
const CTX = CANVAS.getContext("2d");

var UNDERTRACK = new Audio("scripts/space/sounds/undertrack.wav");
var OVERTRACK = new Audio("scripts/space/sounds/overtrack.wav");
UNDERTRACK.volume = 0.15;
OVERTRACK.volume = 0;

var LEFT_KEY = false, RIGHT_KEY = false, UP_KEY = false, DOWN_KEY = false;
var SPACE_KEY = false, SHIFT_KEY = false, ENTER_KEY = false;
var A_KEY = false, D_KEY = false;
var LEFT_CLICK = false, RIGHT_CLICK = false, MOUSEBUTTON_DOWN = false;
var ONE_KEY = false, TWO_KEY = false;

var ALERTS = [];
const ALERT_DISPLAY_TIME = 6;
var PLAYER_WEAPON_SELECT = true; // true - missiles, false - railgun

var WIDTH = document.body.clientWidth;
var HEIGHT = document.body.scrollHeight;
var MOUSEX = 0, MOUSEY = 0;
var MOUSE_SCREEN_POS = [WIDTH/2, HEIGHT/2];

const MIN_ZOOM = 30;
const MAX_ZOOM = 3000;
var VIEW_RADIUS;

var NEAREST_OBJECT = null;
var TARGET_OBJECT = null;

var WORLD = [];
const WORLD_RENDER_DISTANCE = 4000;

let PLAYER_SHIP;
respawn(3);
zoom(1000);

function respawn(choice)
{
    let newship;
    switch (choice)
    {
        case 0: newship = new Morrigan([0, 0], 0);
                break;
        case 1: newship = new Corvette([0, 0], 0);
                break;
        case 2: newship = new Amun_Ra([0, 0], 0);
                break;
        case 3: newship = new Scirocco([0, 0], 0);
                break;
        case 4: newship = new Basilisk([0, 0], 0);
                break;
        case 5: newship = new Donnager([0, 0], 0);
                break;
    }

    newship.firePDC = function(target)
    {
        for (let pdc of this.pdcs)
        {
            if (target == null)
                pdc.fireAt([MOUSEX, MOUSEY]);
            else if (isNaN(pdc.intercept(target)))
                pdc.fireAt([MOUSEX, MOUSEY]);
        }
    }

    if (typeof newship.launchTorpedo !== 'function')
    {
        newship.launchTorpedo = function()
        {
            throwAlert("Torpedoes not equipped on this vessel.",
                ALERT_DISPLAY_TIME);
        }
    }

    if (typeof newship.fireRailgun !== 'function')
    {
        newship.fireRailgun = function()
        {
            throwAlert("Railgun not equipped on this vessel.",
                ALERT_DISPLAY_TIME);
        }
    }

    if (typeof PLAYER_SHIP !== 'undefined')
    {
        newship.theta = PLAYER_SHIP.theta;
        newship.omega = PLAYER_SHIP.omega;
        WORLD.splice(WORLD.indexOf(PLAYER_SHIP), 1);
    }

    newship.faction = UNN;
    // newship.control = Controller.pointDefenseAutomation
    // newship.health = newship.max_health = Infinity;
    PLAYER_SHIP = newship;
    WORLD.push(PLAYER_SHIP);
}

let CURRENT = new Date().getTime(), LAST = CURRENT, DT = 0;

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

document.addEventListener('visibilitychange', function(event)
{
    if (document.hidden) GAME_PAUSED = true;
    UNDERTRACK.ispaused = true;
    OVERTRACK.ispaused = true;
});

document.addEventListener('mousewheel', function(event)
{
    if (event.deltaY > 0) zoom(VIEW_RADIUS*1.3);
    if (event.deltaY < 0) zoom(VIEW_RADIUS/1.3);
},
{ capture: true, passive: true});

document.addEventListener('mousemove', function(event)
{
    MOUSE_SCREEN_POS = [event.clientX, event.clientY];
    updateMouse();
});

document.addEventListener('mousedown', function(event)
{
    switch (event.button)
    {
        case 0: LEFT_CLICK = true;
                break;
        case 2: RIGHT_CLICK = true;
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
        case 0: LEFT_CLICK = false; break;
        case 2: RIGHT_CLICK = false; break;
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
        case 16: SHIFT_KEY = true; break;
        case 27: GAME_PAUSED = !GAME_PAUSED;
                 SHOW_HELP = false;
                 break;
        case 32: if (GAME_OVER) location.reload();
                 else SPACE_KEY = true;
                 break;
        case 37: LEFT_KEY = true; break;
        case 38: UP_KEY = true; break;
        case 39: RIGHT_KEY = true; break;
        case 40: DOWN_KEY = true; break;
        case 49: ONE_KEY = true; break
        case 50: TWO_KEY = true; break;
        case 51: respawn(0); break;
        case 52: respawn(1); break;
        case 53: respawn(2); break;
        case 54: respawn(3); break;
        case 55: respawn(4); break;
        case 56: respawn(5); break;
        case 65: A_KEY = true; break;
        case 66: DRAW_FIRING_ARC = !DRAW_FIRING_ARC;
                 str = DRAW_FIRING_ARC ? "enabled." : "disabled."
                 throwAlert("DRAW_FIRING_ARC " + str, ALERT_DISPLAY_TIME);
                 break;
        case 68: D_KEY = true; break;
        case 70: PLAYER_WEAPON_SELECT = !PLAYER_WEAPON_SELECT;
                 str = PLAYER_WEAPON_SELECT ?
                     "Switched active weapon to torpedoes." :
                     "Switched active weapon to railgun.";
                 throwAlert(str, ALERT_DISPLAY_TIME);
                 break;
        case 71: SHOW_OVERLAY = !SHOW_OVERLAY;
                 str = SHOW_OVERLAY ? "enabled." : "disabled."
                 throwAlert("SHOW_OVERLAY " + str, ALERT_DISPLAY_TIME);
                 break;
        case 72: DRAW_ACCEL = !DRAW_ACCEL;
                 str = DRAW_ACCEL ? "enabled." : "disabled."
                 throwAlert("DRAW_ACCEL " + str, ALERT_DISPLAY_TIME);
                 break;
        case 74: if (GAME_PAUSED) physics(-SLOW_DT);
                 break;
        case 75: if (GAME_PAUSED) physics(SLOW_DT);
                 else if (BETWEEN_WAVES) RESPAWN_TIMER = 0;
                 break;
        case 76: DRAW_TORPEDO_TUBES = !DRAW_TORPEDO_TUBES;
                 str = DRAW_TORPEDO_TUBES ? "enabled." : "disabled."
                 throwAlert("DRAW_TORPEDO_TUBES " + str, ALERT_DISPLAY_TIME);
                 break;
        case 77: DRAW_TRACE = !DRAW_TRACE;
                 str = DRAW_TRACE ? "enabled." : "disabled."
                 throwAlert("DRAW_TRACE " + str, ALERT_DISPLAY_TIME);
                 break;
        case 78: DRAW_HITBOX = !DRAW_HITBOX;
                 str = DRAW_HITBOX ? "enabled." : "disabled."
                 throwAlert("DRAW_HITBOX " + str, ALERT_DISPLAY_TIME);
                 break;
        case 79: --PLAYER_SCORE; break;
        case 80: ++PLAYER_SCORE; break;
        case 82: if (!TARGETING_LOCKOUT) SLOW_TIME = !SLOW_TIME; break;
        case 85: SHOW_ALL_ALERTS = !SHOW_ALL_ALERTS;
                 str = SHOW_ALL_ALERTS ? "enabled." : "disabled."
                 throwAlert("SHOW_ALL_ALERTS " + str, ALERT_DISPLAY_TIME);
                 break;
        case 86: LOCK_CAMERA = !LOCK_CAMERA;
                 str = LOCK_CAMERA ?
                     "Locked camera enabled." :
                     "Locked camera disabled";
                 throwAlert(str, ALERT_DISPLAY_TIME);
                 break;
        case 191: if (NEAREST_OBJECT !== PLAYER_SHIP)
                      TARGET_OBJECT = NEAREST_OBJECT;
                  break;
    }
});

document.addEventListener('keyup', function(event)
{
    switch (event.keyCode)
    {
        case 16: SHIFT_KEY = false; break;
        case 13: ENTER_KEY = false;
                 break;
        case 32: SPACE_KEY = false; break;
        case 37: LEFT_KEY = false; break;
        case 38: UP_KEY = false; break;
        case 39: RIGHT_KEY = false; break;
        case 40: DOWN_KEY = false; break;
        case 49: ONE_KEY = false; break
        case 50: TWO_KEY = false; break;
        case 65: A_KEY = false; break;
        case 68: D_KEY = false; break;
    }
});

function throwAlert(msg, time)
{
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
    obj1.handleCollision(obj2);
    obj2.handleCollision(obj1);
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
    // if (DRAW_HITBOX) hitbox.draw(CTX);
    return !hitbox.contains(coords);
}

function physics(dt)
{
    if (TARGET_OBJECT != null && TARGET_OBJECT.remove)
        TARGET_OBJECT = null;
    if (NEAREST_OBJECT != null && NEAREST_OBJECT.remove)
        NEAREST_OBJECT = null;
    if (PLAYER_SHIP.remove) GAME_OVER = true;

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

    NUMBER_OF_ENEMIES = 0;
    for (let obj of WORLD)
    {
        if (obj.isShip && obj.faction.name != PLAYER_SHIP.faction.name)
            ++NUMBER_OF_ENEMIES;
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

    if (NUMBER_OF_ENEMIES == 0 && SPAWN_ENEMIES &&
        !GAME_OVER && RESPAWN_TIMER < 0)
    {
        BETWEEN_WAVES = false;
        ++PLAYER_SCORE;
        throwAlert("Enemy vessels incoming.", ALERT_DISPLAY_TIME*3);

        for (let i = 0; i < Math.sqrt(PLAYER_SCORE); ++i)
        {
            let r = WORLD_RENDER_DISTANCE*2;
            let rot = Math.random()*Math.PI*2;
            let pos = [Math.cos(rot)*r + PLAYER_SHIP.pos[0],
                       Math.sin(rot)*r + PLAYER_SHIP.pos[1]];
            let vel = [PLAYER_SHIP.vel[0], PLAYER_SHIP.vel[1]];
            let enemy = new Morrigan(pos, 0);
            enemy.control = Controller.morriganEnemy;
            if (PLAYER_SCORE > 2 && i == 0 || i == 5)
            {
                enemy = new Corvette(pos, 0);
                enemy.control = Controller.morriganEnemy;
            }
            enemy.vel = vel;
            enemy.faction = MCRN;
            WORLD.push(enemy);
        }
        RESPAWN_TIMER = RESPAWN_DELAY;
    }
    else if (NUMBER_OF_ENEMIES == 0)
    {
        BETWEEN_WAVES = true;
        RESPAWN_TIMER -= dt;
        if (RESPAWN_TIMER > 0)
        {
            PLAYER_SHIP.repair(PASSIVE_REGEN*dt*PLAYER_SHIP.max_health);
            // if (Math.random() < dt*13 &&
            //     PLAYER_SHIP.health < PLAYER_SHIP.max_health)
            // {
            //     let health = new Debris(
            //         PLAYER_SHIP.box.getRandom(), add2d(PLAYER_SHIP.vel,
            //             [Math.random()*150 - 75, Math.random()*150 - 75]),
            //         Math.random()*2*Math.PI,
            //         Math.random()*2 - 1, SMALL_DEBRIS/100);
            //     health.nocollide = true;
            //     health.skin = function()
            //     {
            //         let width = 7;
            //         CTX.save();
            //         CTX.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
            //         CTX.rotate(-this.theta);
            //         CTX.globalAlpha = 0.5;
            //         CTX.fillStyle = "green";
            //         CTX.beginPath();
            //         CTX.rect(-width*PIXELS/6, -width*PIXELS/2,
            //             width*PIXELS/3, width*PIXELS);
            //         CTX.rect(-width*PIXELS/2, -width*PIXELS/6,
            //             width*PIXELS, width*PIXELS/3);
            //         CTX.fill();
            //         CTX.restore()
            //     }
            //     WORLD.push(health);
            // }
        }
    }
    if (!GAME_OVER)
    {
        if (SHIFT_KEY)
        {
            PLAYER_SHIP.applyForce(rot2d([PLAYER_SHIP.max_acc*
                PLAYER_SHIP.mass, 0], PLAYER_SHIP.theta));
        }
        if (SPACE_KEY)
        {
            if (PLAYER_WEAPON_SELECT) PLAYER_SHIP.launchTorpedo(TARGET_OBJECT);
            else PLAYER_SHIP.fireRailgun();
            SPACE_KEY = false;
        }
        if (LEFT_CLICK || ENTER_KEY)
        {
            PLAYER_SHIP.firePDC(TARGET_OBJECT);
        }

        if (A_KEY)
        {
            PLAYER_SHIP.applyMoment(PLAYER_SHIP.max_alpha*PLAYER_SHIP.izz);
        }
        else if (D_KEY)
        {
            PLAYER_SHIP.applyMoment(-PLAYER_SHIP.max_alpha*PLAYER_SHIP.izz);
        }
        else PLAYER_SHIP.applyMoment(-PLAYER_SHIP.omega*PLAYER_SHIP.izz);

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
}

function draw()
{
    CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);
    CTX.canvas.width = document.body.clientWidth;
    CTX.canvas.height = document.body.scrollHeight;
    WIDTH = CTX.canvas.width;
    HEIGHT = CTX.canvas.height;
    updateMouse();

    CTX.save();
    CTX.translate(WIDTH/2, HEIGHT/2);
    if (LOCK_CAMERA) CTX.rotate(PLAYER_SHIP.theta - Math.PI/2);
    CTX.translate(-PLAYER_SHIP.pos[0]*PIXELS,
                  -PLAYER_SHIP.pos[1]*PIXELS);

    CTX.strokeStyle = "black";
    CTX.fillStyle = "black";
    let interval = Math.round(Math.max(WIDTH, HEIGHT)/(PIXELS*5000))*500;
    if (interval == 0) interval = 500;
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

    if (NEAREST_OBJECT != null && SLOW_TIME && !GAME_PAUSED)
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
        CTX.fillText(NEAREST_OBJECT.type.toUpperCase(),
            0, -20*PIXELS);
        CTX.font = "10px Helvetica";
        CTX.fillText(NEAREST_OBJECT.fullName(), 0, -20*PIXELS - 15);
        CTX.restore();
    }
    if (TARGET_OBJECT != null)
    {
        let radius = 0.7*Math.max(PLAYER_SHIP.length, PLAYER_SHIP.width);
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
            CTX.fillText(TARGET_OBJECT.type.toUpperCase(), 0, -20*PIXELS);
            CTX.font = "10px Helvetica";
            CTX.fillText(TARGET_OBJECT.fullName(), 0, -20*PIXELS - 15);

            let health_percent = Math.max(0, TARGET_OBJECT.health/
                TARGET_OBJECT.max_health);
            CTX.fillRect(-20, -20*PIXELS - 30,
                40*health_percent, 5);

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
            CTX.lineWidth = 4*PIXELS;
            CTX.beginPath();
            CTX.moveTo(-20*PIXELS, -(radius + 5)*PIXELS);
            CTX.lineTo(0*PIXELS, -(radius + 20)*PIXELS);
            CTX.lineTo(20*PIXELS, -(radius + 5)*PIXELS);
            CTX.stroke();
            CTX.restore();

            let pro = sub2d(PLAYER_SHIP.vel, TARGET_OBJECT.vel);
            pro = mult2d(unit2d(pro), radius);
            retro = mult2d(pro, -1);
        }
    }

    CTX.restore();
    {
        let cw = 15;
        let border = 10;
        let spacing = 5;
        let hh = Math.max(0, PLAYER_SHIP.health)/
            PLAYER_SHIP.max_health*(HEIGHT - 2*border);

        CTX.globalAlpha = 0.3;
        CTX.fillStyle = "green";
        CTX.fillRect(border, (HEIGHT - border) - hh, cw, hh);

        CTX.textAlign = "left";
        CTX.font = "15px Consolas";
        CTX.fillStyle = "white";
        CTX.globalAlpha = 1;
        CTX.save();
        CTX.translate(border + cw, HEIGHT - border);
        CTX.rotate(-Math.PI/2);
        let percent = Math.round(PLAYER_SHIP.health/
            PLAYER_SHIP.max_health*100);
        CTX.fillText("HULL (" + percent + "%)", 0, -3);
        CTX.restore();

        if (PLAYER_SHIP.hasOwnProperty("tubes"))
        {
            CTX.fillStyle = "gray";
            CTX.globalAlpha = 0.3;
            let num_tubes = PLAYER_SHIP.tubes.length;
            let height = (HEIGHT - 2*border -
                spacing*(num_tubes - 1))/num_tubes;
            for (let i = 0; i < num_tubes; ++i)
            {
                let tube = PLAYER_SHIP.tubes[i];
                let percent = Math.min(1, (TIME -
                    tube.lastFired)/tube.cooldown);
                CTX.fillRect(border + cw + spacing,
                    border + height*(i + 1 - percent) + spacing*i,
                    cw, height*percent);
            }
        }

        if (PLAYER_SHIP.hasOwnProperty("railguns"))
        {
            CTX.fillStyle = "gray";
            CTX.globalAlpha = 0.3;
            let num_guns = PLAYER_SHIP.railguns.length;
            let height = (HEIGHT - 2*border -
                spacing*(num_guns - 1))/num_guns;
            for (let i = 0; i < num_guns; ++i)
            {
                let gun = PLAYER_SHIP.railguns[i];
                let percent = Math.min(1, (TIME -
                    gun.lastFired)/gun.cooldown);
                CTX.fillRect(border + 2*cw + 2*spacing,
                    border + height*(i + 1 - percent) + spacing*i,
                    cw, height*percent);
            }
        }
    }

    CTX.globalAlpha = 1;
    CTX.fillStyle = "gray";
    CTX.font = "12px Helvetica";
    let weapon = PLAYER_WEAPON_SELECT ? "TORPEDOES" : "RAILGUN";
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
        let racc = norm2d(sub2d(PLAYER_SHIP.acc, TARGET_OBJECT.acc));

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
        let astr = (Math.round(racc/0.981)/10).toLocaleString("en",
                {useGrouping: false, minimumFractionDigits: 0}) + " G";

        CTX.fillText("TARGET LOCKED: " +
            TARGET_OBJECT.type.toUpperCase() + " (" +
            dstr + ", " + vstr + ", " + astr + ")", 680, HEIGHT - 10);
    }
    CTX.textAlign = "right";
    let ftime = (Math.round(TIME*100)/100).toLocaleString("en",
        {useGrouping: false, minimumFractionDigits: 2});
    CTX.fillText(ftime, WIDTH - 10, HEIGHT - 10);
    CTX.textAlign = "left";

    CTX.fillStyle = "black";
    CTX.font = "14px Helvetica";
    for (let i in ALERTS)
    {
        CTX.globalAlpha = Math.max(0, Math.min(1, ALERTS[i][1]));
        if (SHOW_ALL_ALERTS) CTX.globalAlpha = 1;
        CTX.fillText(ALERTS[i][0].toUpperCase(),
            70, 22 + 20*(ALERTS.length - i - 1));
    }

    CTX.fillStyle = "gray";
    CTX.globalAlpha = 1;
    CTX.font = "12px Helvetica";
    CTX.fillText("BUILD: " + VERSION.toUpperCase(), 70, HEIGHT - 30);

    if (SHOW_OVERLAY || GAME_PAUSED)
    {
        function drawKey(x, y, w, h, key, desc)
        {
            CTX.save();
            CTX.translate(x, y);
            CTX.lineWidth = 2;
            CTX.strokeStyle = "black";
            CTX.globalAlpha = 1;
            CTX.fillStyle = "white";
            CTX.fillRect(0, 0, w, h);
            CTX.globalAlpha = 0.5;
            if (desc == '') CTX.globalAlpha = 0.1;
            CTX.strokeRect(0, 0, w, h);
            CTX.font = "20px Helvetica";
            CTX.textAlign = "center";
            CTX.fillStyle = "black";
            CTX.fillText(key, w/2, 3*h/4);

            let mx = MOUSE_SCREEN_POS[0], my = MOUSE_SCREEN_POS[1];
            if (mx > x && mx < x + w && my > y && my < y + h &&
                (SLOW_TIME || GAME_PAUSED) && desc != "")
            {
                CTX.font = "16px Helvetica";
                CTX.beginPath();
                let len = y - (HEIGHT - 270);
                let width = CTX.measureText(desc.toUpperCase()).width;
                if (x < WIDTH/2)
                {
                    CTX.moveTo(w, 0);
                    CTX.lineTo(len/3 + w, -len);
                    CTX.lineTo(len/3 + w + width, -len);
                    CTX.stroke();
                    CTX.globalAlpha = 0.8;
                    CTX.textAlign = "left";
                    CTX.fillText(desc.toUpperCase(), len/3 + w, -len - 5);
                }
                else
                {
                    CTX.moveTo(0, 0);
                    CTX.lineTo(-len/3, -len);
                    CTX.lineTo(-len/3 - width, -len);
                    CTX.stroke();
                    CTX.globalAlpha = 0.8;
                    CTX.textAlign = "right";
                    CTX.fillText(desc.toUpperCase(), -len/3, -len - 5);
                }
                CTX.globalAlpha = 0.1;
                CTX.fillStyle = "black";
                CTX.fillRect(0, 0, w, h);
            }
            CTX.restore();
        }

        let beginx = 95, beginy = HEIGHT - 230, w = 30, h = 30;
        drawKey(beginx, beginy, w, h, '', '');
        drawKey(beginx + 35, beginy, w, h, '1', 'Zoom Out');
        drawKey(beginx + 70, beginy, w, h, '2', 'Zoom In');

        if (GAME_PAUSED)
        {
            drawKey(beginx + 105, beginy, w, h,
                '3', 'Spawn as: Morrigan Class');
            drawKey(beginx + 140, beginy, w, h,
                '4', 'Spawn as: Corvette Class');
            drawKey(beginx + 175, beginy, w, h,
                '5', 'Spawn as: Amun-Ra Class');
            drawKey(beginx + 210, beginy, w, h,
                '6', 'Spawn as: Scirocco Class');
            drawKey(beginx + 245, beginy, w, h,
                '7', 'Spawn as: Basilisk Class');
            drawKey(beginx + 280, beginy, w, h,
                '8', 'Spawn as: Donnager Class');
        }

        drawKey(beginx, beginy + 35, w*1.5, h, '', '');
        drawKey(beginx + w*1.5 + 5, beginy + 35, w, h, '', '');
        drawKey(beginx + w*2.5 + 10, beginy + 35, w, h, '', '');
        drawKey(beginx + w*3.5 + 15, beginy + 35, w, h, '', '');
        drawKey(beginx + w*4.5 + 20, beginy + 35, w, h,
            'R', 'Toggle targeting mode');

        if (GAME_PAUSED)
        {
            drawKey(beginx + w*5.5 + 25, beginy + 35, w, h, '', '');
            drawKey(beginx + w*6.5 + 30, beginy + 35, w, h, '', '');
            drawKey(beginx + w*7.5 + 35, beginy + 35, w, h,
                'U', 'Toggle display alerts (debug)');
            drawKey(beginx + w*8.5 + 40, beginy + 35, w, h, '', '');
            drawKey(beginx + w*9.5 + 45, beginy + 35, w, h,
                'O', 'Decrement wave (debug)');
            drawKey(beginx + w*10.5 + 50, beginy + 35, w, h,
                'P', 'Increment wave (debug)');
        }

        drawKey(beginx, beginy + 70, w*1.7, h, '', '');
        drawKey(beginx + w*1.7 + 5, beginy + 70, w, h, 'A', 'Turn left');
        drawKey(beginx + w*2.7 + 10, beginy + 70, w, h, '', '');
        drawKey(beginx + w*3.7 + 15, beginy + 70, w, h, 'D', 'Turn right');
        drawKey(beginx + w*4.7 + 20, beginy + 70, w, h, 'F', 'Toggle weapons');

        if (GAME_PAUSED)
        {
            drawKey(beginx + w*5.7 + 25, beginy + 70, w, h,
                'G', 'Toggle keyboard overlay');
            drawKey(beginx + w*6.7 + 30, beginy + 70, w, h,
                'H', 'Toggle draw acceleration (debug)');
            drawKey(beginx + w*7.7 + 35, beginy + 70, w, h,
                'J', 'Step backward (debug)');
            drawKey(beginx + w*8.7 + 40, beginy + 70, w, h,
                'K', 'Step forward (debug)');
            drawKey(beginx + w*9.7 + 45, beginy + 70, w, h,
                'L', 'Toggle draw torpedo tubes (debug)');
        }

        drawKey(beginx, beginy + 105, w*2.5, h, 'SHIFT', 'Accelerate');
        drawKey(beginx + w*2.5 + 5, beginy + 105, w, h, '', '');
        drawKey(beginx + w*3.5 + 10, beginy + 105, w, h, '', '');
        drawKey(beginx + w*4.5 + 15, beginy + 105, w, h, '', '');
        drawKey(beginx + w*5.5 + 20, beginy + 105, w, h,
            'V', 'Toggle locked camera');

        if (GAME_PAUSED)
        {
            drawKey(beginx + w*6.5 + 25, beginy + 105, w, h,
                'B', 'Toggle draw firing arcs (debug)');
            drawKey(beginx + w*7.5 + 30, beginy + 105, w, h,
                'N', 'Toggle draw hitboxes (debug)');
            drawKey(beginx + w*8.5 + 35, beginy + 105, w, h,
                'M', 'Toggle draw velocity (debug)');
        }

        drawKey(beginx + w*2.7 + 10, beginy + 140, w, h, '', '');
        drawKey(beginx + w*3.7 + 15, beginy + 140, w, h, '', '');
        drawKey(beginx + w*4.7 + 20, beginy + 140, w*5, h,
            'SPACE', 'Fire weapon');

        if (GAME_PAUSED)
        {
            let mbeginx = WIDTH - 150;
            let mw = 40;
            drawKey(mbeginx, beginy, mw, h,
                'L', 'Fire Point Defense Cannons');
            drawKey(mbeginx + mw + 5, beginy, mw, h,
                'R', 'Select target lock');
            drawKey(mbeginx, beginy + h + 5, 2*mw + 5, 100, '', '');
            drawKey(mbeginx + mw*0.9, beginy + h*0.6,
                mw*0.2 + 5, h*0.8 + 5, '', 'Zoom In/Out');

            CTX.font = "30px Helvetica";
            CTX.textAlign = "left";
            CTX.globalAlpha = 0.7;
            CTX.fillStyle = "darkgray";
            CTX.fillText("KEYBOARD", beginx, beginy - 100);
            CTX.textAlign = "right";
            CTX.fillText("MOUSE", mbeginx + 5 + 2*mw, beginy - 100);
        }
    }

    CTX.globalAlpha = 1;
    CTX.strokeStyle = "black";
    CTX.fillStyle = "lightgreen";
    if (TARGETING_LOCKOUT) CTX.fillStyle = "red";
    CTX.beginPath();
    CTX.arc(MOUSE_SCREEN_POS[0], MOUSE_SCREEN_POS[1], 4, 0, Math.PI*2);
    CTX.stroke();
    if (TARGETING_STAMINA < TARGETING_MAX && TARGETING_STAMINA > 0)
    {
        CTX.beginPath();
        CTX.arc(MOUSE_SCREEN_POS[0], MOUSE_SCREEN_POS[1], 8, -Math.PI/2,
            Math.PI*2*TARGETING_STAMINA/TARGETING_MAX - Math.PI/2, false);
        CTX.arc(MOUSE_SCREEN_POS[0], MOUSE_SCREEN_POS[1], 4,
            Math.PI*2*TARGETING_STAMINA/TARGETING_MAX - Math.PI/2,
            -Math.PI/2, true);
        CTX.lineTo(MOUSE_SCREEN_POS[0], MOUSE_SCREEN_POS[1] - 8);
        CTX.fill();
        CTX.stroke();
    }

    if (PLAYER_SHIP.remove)
    {
        CTX.textAlign = "left";
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
        CTX.textAlign = "left";
        CTX.font = "100px Helvetica";
        CTX.globalAlpha = 0.4;
        CTX.fillStyle = "darkgray";
        CTX.strokeStyle = "darkgray";
        CTX.fillText("PAUSED", WIDTH/2 + 20, HEIGHT/2 - 20);
        // CTX.font = "20px Helvetica";
        // CTX.globalAlpha = 0.8;
        // CTX.fillStyle = "white";
        // CTX.fillRect(WIDTH/2 + 30, HEIGHT/2 + 30, 500, 300);
        // CTX.globalAlpha = 1;
        // CTX.strokeRect(WIDTH/2 + 30, HEIGHT/2 + 30, 500, 300);
        // CTX.fillStyle = "black";
        // CTX.fillText("[SHIFT] TO ACCELERATE", WIDTH/2 + 50, HEIGHT/2 + 70);
        // CTX.fillText("[A/D] TO TURN", WIDTH/2 + 50, HEIGHT/2 + 100);
        // CTX.fillText("[SPACE] TO FIRE WEAPONS", WIDTH/2 + 50, HEIGHT/2 + 130);
        // CTX.fillText("[F] TO SWITCH WEAPONS", WIDTH/2 + 50, HEIGHT/2 + 160);
        // CTX.fillText("[R] TO SLOW DOWN TIME", WIDTH/2 + 50, HEIGHT/2 + 190);
        // CTX.fillText("[LEFT CLICK] TO FIRE ANTI-TORPEDO CANNONS",
        //     WIDTH/2 + 50, HEIGHT/2 + 220);
        // CTX.fillText("[RIGHT CLICK] TO TARGET LOCK",
        //     WIDTH/2 + 50, HEIGHT/2 + 250);
        // CTX.fillText("[1][2] TO ZOOM IN/OUT", WIDTH/2 + 50, HEIGHT/2 + 280);
        // CTX.fillText("[B][N][M] FOR DEBUG", WIDTH/2 + 50, HEIGHT/2 + 310);
    }

    if (TARGETING_STAMINA < TARGETING_MAX)
    {
        let grd = CTX.createRadialGradient(
            WIDTH/2, HEIGHT/2, Math.min(WIDTH, HEIGHT)*0.4,
            WIDTH/2, HEIGHT/2, Math.min(WIDTH, HEIGHT));
        grd.addColorStop(0, "rgba(0, 0, 0, 0)");
        grd.addColorStop(1, "black");
        CTX.fillStyle = grd;
        CTX.globalAlpha = (1 - TARGETING_STAMINA/TARGETING_MAX);
        CTX.fillRect(0, 0, WIDTH, HEIGHT);
    }
    if (BETWEEN_WAVES && RESPAWN_TIMER > 0 && !GAME_PAUSED && SPAWN_ENEMIES)
    {
        CTX.font = "30px Helvetica";
        CTX.globalAlpha = 0.4;
        CTX.fillStyle = "darkgray";
        CTX.textAlign = "left";
        let rtime = (Math.round(RESPAWN_TIMER*100)/100).toLocaleString("en",
            {useGrouping: false, minimumFractionDigits: 2});
        if (PLAYER_SCORE > 0)
        {
            CTX.textAlign = "right";
            CTX.fillText("WAVE " + PLAYER_SCORE + " CLEARED",
                WIDTH/2 - 20, HEIGHT/2 - 20);
            CTX.textAlign = "left";
        }
        CTX.fillText("WAVE " + (PLAYER_SCORE + 1) + " IN T-" + rtime + "s",
            WIDTH/2 + 20, HEIGHT/2 - 20);
        CTX.fillText("PRESS [K] to ADVANCE", WIDTH/2 + 20, HEIGHT/2 + 40);
    }
    CTX.font = "30px Helvetica";
    CTX.globalAlpha = 0.4;
    CTX.fillStyle = "darkgray";
    CTX.textAlign = "right";
    CTX.fillText("WAVE " + PLAYER_SCORE, WIDTH - 20, 40);
    CTX.font = "12px Helvetica";
    CTX.globalAlpha = 0.8;
    if (NUMBER_OF_ENEMIES == 1)
        CTX.fillText("1 ENEMY REMAINS", WIDTH - 20, 60);
    else
        CTX.fillText(NUMBER_OF_ENEMIES + " ENEMIES REMAIN", WIDTH - 20, 60);
    CTX.textAlign = "left";
}

function start()
{
    if (UNDERTRACK.volume == 0)
        UNDERTRACK.currentTime = OVERTRACK.currentTime;
    if (OVERTRACK.volume == 0)
        OVERTRACK.currentTime = UNDERTRACK.currentTime;

    for (let i in ALERTS)
    {
        ALERTS[i][1] -= DT;
    }

    if (UNDERTRACK.currentTime > UNDERTRACK.duration - 0.10)
    {
        console.log("https://i.ytimg.com/vi/XFFmw-HDiRE/maxresdefault.jpg");
        UNDERTRACK.currentTime = 1.45;
        OVERTRACK.currentTime = 1.45;
    }
    if (GAME_PAUSED)
    {
        UNDERTRACK.volume = BETWEEN_WAVES ? 0.05 : 0;
        OVERTRACK.volume = BETWEEN_WAVES ? 0 : 0.05;
    }
    else
    {
        if (!UNDERTRACK.ispaused) UNDERTRACK.play();
        if (!OVERTRACK.ispaused) OVERTRACK.play();
        UNDERTRACK.playbackRate = 1;
        OVERTRACK.playbackRate = 1;

        let fade = function(control, setpoint)
        {
            let dv = 0.05*DT;
            if (control > setpoint)
            {
                control -= dv;
                if (control < setpoint) return setpoint;
                return control;
            }
            else if (control < setpoint)
            {
                control += dv;
                if (control > setpoint) return setpoint;
                return control;
            }
            return setpoint;
        }

        if (BETWEEN_WAVES)
        {
            UNDERTRACK.volume = fade(UNDERTRACK.volume, 0.15);
            OVERTRACK.volume = fade(OVERTRACK.volume, 0);
        }
        else
        {
            UNDERTRACK.volume = fade(UNDERTRACK.volume, 0);
            OVERTRACK.volume = fade(OVERTRACK.volume, 0.25);
        }
    }

    CURRENT = new Date().getTime();
    draw();
    let time_passed = 0;
    if (!GAME_PAUSED && !SLOW_TIME && PAUSE_TIME <= 0)
    {
        physics(DT);
        TARGETING_STAMINA += DT*2;
        if (TARGETING_STAMINA > TARGETING_MAX)
        {
            TARGETING_STAMINA = TARGETING_MAX;
            TARGETING_LOCKOUT = false;
        }
    }
    else if (!GAME_PAUSED && PAUSE_TIME <= 0)
    {
        physics(SLOW_DT);
        TARGETING_STAMINA -= DT;
        if (TARGETING_STAMINA < 0) TARGETING_STAMINA = 0;
    }
    requestAnimationFrame(start);
    DT = (CURRENT - LAST)/1000;
    LAST = CURRENT;

    if (PAUSE_TIME > 0) PAUSE_TIME -= DT;

    if (ONE_KEY) zoom(VIEW_RADIUS + 50);
    if (TWO_KEY) zoom(VIEW_RADIUS - 50);

    let ds = 5;
    if (UP_KEY) MOUSE_SCREEN_POS[1] -= ds;
    if (DOWN_KEY) MOUSE_SCREEN_POS[1] += ds;
    if (LEFT_KEY) MOUSE_SCREEN_POS[0] -= ds;
    if (RIGHT_KEY) MOUSE_SCREEN_POS[0] += ds;

    if (TARGETING_STAMINA <= 0 && SLOW_TIME)
    {
        SLOW_TIME = false;
        TARGETING_LOCKOUT = true;
    }
}

start();
