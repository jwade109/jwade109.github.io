// canvas.js

var DRAW_TRACE;
var DRAW_ACCEL;
var SHOW_ALL_ALERTS;
var SHOW_BEHAVIORS;
var SHOW_OVERLAY;
// var TUTORIAL = true;

var LOCK_CAMERA;
var SPAWN_ENEMIES;
var SPAWN_DEBRIS;
var NUMBER_OF_ENEMIES;
var NUMBER_OF_ALLIES;

var GAME_PAUSED;
var SLOW_TIME;
var GAME_OVER;
var CURRENT_WAVE = 0;
var WAVE_START;

const RESPAWN_DELAY = 30;
var RESPAWN_TIMER;
var BETWEEN_WAVES;
const PASSIVE_REGEN = 0.02; // percent per second

const TARGETING_MAX = 14;
var TARGETING_STAMINA;
var TARGETING_LOCKOUT;

var PLAYER_FACTION = UNN;

var PLAYER_SCORE;
var TIME_BONUS;
var ALLY_BONUS;

const FPS = 60;
const NOMINAL_DT = 1/FPS;
const SLOW_DT = NOMINAL_DT/30;
var CURRENT_DT;
var TIME;

const CANVAS = document.getElementById("canvas");
const CTX = CANVAS.getContext("2d");

const UNDERTRACK = new Audio("scripts/space/sounds/undertrack.mp3");
const OVERTRACK = new Audio("scripts/space/sounds/overtrack.mp3");

var LEFT_KEY = false, RIGHT_KEY = false, UP_KEY = false, DOWN_KEY = false;
var SPACE_KEY = false, SHIFT_KEY = false, ENTER_KEY = false;
var A_KEY = false, D_KEY = false;
var LEFT_CLICK = false, RIGHT_CLICK = false, MOUSEBUTTON_DOWN = false;
var ONE_KEY = false, TWO_KEY = false, CTRL_KEY = false;

var ALERTS;
const ALERT_DISPLAY_TIME = 6;
var PLAYER_WEAPON_SELECT; // true - missiles, false - railgun

var WIDTH, HEIGHT;
var MOUSEX, MOUSEY;
var MOUSE_SCREEN_POS;

const MIN_ZOOM = 30;
const MAX_ZOOM = 14000*2;
var VIEW_RADIUS, TARGET_ZOOM;

var NEAREST_OBJECT;
var TARGET_OBJECT;

var WORLD;
const WORLD_RENDER_DISTANCE = 10000;
var STARFIELD;

var PLAYER_SHIP, CAMERA_TRACK_TARGET;
var CAMERA_POS, CAMERA_THETA;

initialize();
start();

function initialize()
{
    DRAW_TRACE = true;
    DRAW_ACCEL = false;
    SHOW_ALL_ALERTS = false;
    SHOW_BEHAVIORS = false;
    LOCK_CAMERA = false;
    SPAWN_ENEMIES = true;
    NUMBER_OF_ENEMIES = 0;
    NUMBER_OF_ALLIES = 0;
    SLOW_TIME = false;
    if (GAME_OVER) GAME_PAUSED = false;
    else
    {
        GAME_PAUSED = true;
        UNDERTRACK.volume = 0.15;
        OVERTRACK.volume = 0;
    }
    GAME_OVER = false;
    WAVE_START = 0;
    SPAWN_DEBRIS = true;
    SHOW_OVERLAY = true;
    RESPAWN_TIMER = 30;
    BETWEEN_WAVES = true;
    TARGETING_STAMINA = TARGETING_MAX;
    TARGETING_LOCKOUT = false;

    PLAYER_SCORE = 0;
    TIME_BONUS = ALLY_BONUS = 0;

    CURRENT_DT = NOMINAL_DT;
    TIME = 0;

    ALERTS = [];
    PLAYER_WEAPON_SELECT = true; // true - missiles, false - railgun

    WIDTH = document.body.clientWidth;
    HEIGHT = document.body.scrollHeight;
    MOUSEX = 0, MOUSEY = 0;
    MOUSE_SCREEN_POS = [WIDTH/2, HEIGHT/2];

    VIEW_RADIUS = TARGET_ZOOM = 2000;
    zoom();

    NEAREST_OBJECT = null;
    TARGET_OBJECT = null;

    WORLD = [];
    STARFIELD = [];
    respawn(1);
    CAMERA_TRACK_TARGET = PLAYER_SHIP;
    CAMERA_POS = CAMERA_TRACK_TARGET.pos.slice();
    CAMERA_THETA = Math.PI/2;

    CURRENT = new Date().getTime(), LAST = CURRENT, DT = 0;

    for (let i = 0; i < Math.pow(WORLD_RENDER_DISTANCE, 2)/1E6
        && SPAWN_DEBRIS; ++i)
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

    for (let i = 0; i < 200; ++i)
    {
        STARFIELD.push(new Star([Math.random()*50000 - 25000,
            Math.random()*50000 - 25000]));
    }

    for (let i = 0; i < CURRENT_WAVE; ++i)
    {
        let pos = rot2d([WORLD_RENDER_DISTANCE, 0],
            Math.PI*2*Math.random());
        pos = add2d(pos, PLAYER_SHIP.pos);
        let ally = new Morrigan(pos, 0);
        if (Math.random() < 0.3) ally = new Corvette(pos, 0);
        if (i == 5) ally = new Scirocco(pos, 0);
        ally.faction = PLAYER_FACTION;
        ally.behaviors = [Behaviors.genericAlly,
            Behaviors.pdcDefense];
        WORLD.push(ally);
    }
    if (CURRENT_WAVE > 0) --CURRENT_WAVE;
}

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

    if (typeof PLAYER_SHIP !== 'undefined')
    {
        newship.theta = PLAYER_SHIP.theta;
        newship.omega = PLAYER_SHIP.omega;
        newship.pos = PLAYER_SHIP.pos.slice();
        newship.vel = PLAYER_SHIP.vel.slice();
        WORLD.splice(WORLD.indexOf(PLAYER_SHIP), 1);
        PLAYER_SHIP.remove = true;
    }

    newship.faction = PLAYER_FACTION;
    newship.behaviors = [Behaviors.playerControlled];
    if (newship instanceof Basilisk)
        newship.behaviors.push(Behaviors.repairFriendlies);
    PLAYER_SHIP = newship;
    WORLD.push(PLAYER_SHIP);
    GAME_OVER = false;
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
    UNDERTRACK.play().catch(function(error) { });
    OVERTRACK.play().catch(function(error) { });

    if (window.pageYOffset == 0)
    {
        event.preventDefault();
        if (event.deltaY > 0) TARGET_ZOOM = TARGET_ZOOM*1.3;
        if (event.deltaY < 0) TARGET_ZOOM = TARGET_ZOOM/1.3;
    }
},
{ capture: true, passive: false});

document.addEventListener('mousemove', function(event)
{
    var box = canvas.getBoundingClientRect();
    MOUSE_SCREEN_POS = [event.clientX - box.left, event.clientY - box.top];
    updateMouse();
    UNDERTRACK.play().catch(function(error) { });
    OVERTRACK.play().catch(function(error) { });
});

document.addEventListener('mousedown', function(event)
{
    switch (event.button)
    {
        case 0: LEFT_CLICK = true;
                break;
        case 2: RIGHT_CLICK = true;
                if (TARGET_OBJECT != NEAREST_OBJECT)
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
        case 32: if (GAME_OVER) initialize();
                 else SPACE_KEY = true;
                 if (!GAME_PAUSED)
                    event.preventDefault();
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
        case 57: if (PLAYER_FACTION.name == "MCRN")
                     PLAYER_FACTION = UNN;
                 else if (PLAYER_FACTION.name == "UNN")
                     PLAYER_FACTION = MCRN;
                 PLAYER_SHIP.faction = PLAYER_FACTION;
                 break;
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
        case 79: --CURRENT_WAVE; break;
        case 80: ++CURRENT_WAVE; break;
        case 82: if (!TARGETING_LOCKOUT) SLOW_TIME = !SLOW_TIME; break;
        case 84: if (TARGET_OBJECT != null &&
                     TARGET_OBJECT != CAMERA_TRACK_TARGET)
                     CAMERA_TRACK_TARGET = TARGET_OBJECT;
                 else
                     CAMERA_TRACK_TARGET = PLAYER_SHIP;
                 break;
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
        case 89: SHOW_BEHAVIORS = !SHOW_BEHAVIORS;
                 str = SHOW_BEHAVIORS ?
                     "SHOW_BEHAVIORS enabled." :
                     "SHOW_BEHAVIORS disabled";
                 throwAlert(str, ALERT_DISPLAY_TIME);
                 break;
        case 90: takeControl(TARGET_OBJECT);
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

function zoom()
{
    TARGET_ZOOM = Math.max(MIN_ZOOM, Math.min(TARGET_ZOOM, MAX_ZOOM));
    VIEW_RADIUS += (TARGET_ZOOM - VIEW_RADIUS)*0.2;
    VIEW_RADIUS = Math.max(MIN_ZOOM, Math.min(VIEW_RADIUS, MAX_ZOOM));
    PIXELS = WIDTH/(2*VIEW_RADIUS); //  pixels per meter
}

function updateMouse()
{
    // if (CAMERA_TRACK_TARGET == null)
        // CAMERA_TRACK_TARGET = PLAYER_SHIP;
    let rect = CANVAS.getBoundingClientRect();
    MOUSEX = (MOUSE_SCREEN_POS[0] +
        CAMERA_POS[0]*PIXELS - WIDTH/2)/PIXELS;
    MOUSEY = (MOUSE_SCREEN_POS[1] +
        CAMERA_POS[1]*PIXELS - HEIGHT/2)/PIXELS;
    let mp = rot2d([MOUSEX - CAMERA_POS[0],
                    MOUSEY - CAMERA_POS[1]],
                   CAMERA_THETA - Math.PI/2);
    MOUSEX = (CAMERA_POS[0] + mp[0]);
    MOUSEY = (CAMERA_POS[1] + mp[1]);

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
    let initial1 = obj1.remove;
    let initial2 = obj2.remove;

    obj1.handleCollision(obj2);
    obj2.handleCollision(obj1);

    if (obj1.remove && obj1.isShip && !initial1 &&
        obj2.origin == PLAYER_SHIP)
    {
        playerKill(obj1);
    }
    else if (obj2.remove && obj2.isShip && !initial2 &&
        obj1.origin == PLAYER_SHIP)
    {
        playerKill(obj2);
    }
}

function playerKill(ship)
{
    // console.log("player killed " + ship.fullName() +
    //     "(" + ship.type + ") for " + ship.basePoints);
    PLAYER_SCORE += Math.floor(ship.basePoints);
}

function isOffScreen(coords)
{
    let corners = [[-WIDTH/(2*PIXELS) + 5/PIXELS, -HEIGHT/(2*PIXELS) + 5/PIXELS],
                   [ WIDTH/(2*PIXELS) - 5/PIXELS, -HEIGHT/(2*PIXELS) + 5/PIXELS],
                   [ WIDTH/(2*PIXELS) - 5/PIXELS,  HEIGHT/(2*PIXELS) - 5/PIXELS],
                   [-WIDTH/(2*PIXELS) + 5/PIXELS,  HEIGHT/(2*PIXELS) - 5/PIXELS]];
    let hitbox = new Hitbox(corners);
    hitbox.object = [];
    hitbox.object.pos = CAMERA_POS.slice();
    hitbox.object.theta = 0;
    hitbox.object.theta = CAMERA_THETA + Math.PI/2;
    if (DRAW_HITBOX) hitbox.draw(CTX);
    return !hitbox.contains(coords);
}

function takeControl(friendlyShip)
{
    if (friendlyShip == null || !friendlyShip.isShip ||
        friendlyShip.faction.name != PLAYER_SHIP.faction.name ||
        friendlyShip == PLAYER_SHIP) return;
    let oldPlayer = PLAYER_SHIP;
    PLAYER_SHIP = friendlyShip;
    let oldControl = oldPlayer.behaviors;
    oldPlayer.behaviors = friendlyShip.behaviors;
    friendlyShip.behaviors = oldControl;
    CAMERA_TRACK_TARGET = PLAYER_SHIP;
}

function physics(dt)
{
    if (TARGET_OBJECT != null && TARGET_OBJECT.remove)
        TARGET_OBJECT = null;
    if (NEAREST_OBJECT != null && NEAREST_OBJECT.remove)
        NEAREST_OBJECT = null;
    if (PLAYER_SHIP.remove)
    {
        let dist = Infinity, nearest = null;
        for (let obj of WORLD)
        {
            if (obj.isShip && obj.faction.name == PLAYER_SHIP.faction.name)
            {
                let d = distance(obj.pos, PLAYER_SHIP.pos);
                if (d < dist)
                {
                    nearest = obj;
                    dist = d;
                }
            }
        }
        if (nearest == null)
            GAME_OVER = true;
        else
            takeControl(nearest);
    }

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

    NUMBER_OF_ENEMIES = NUMBER_OF_ALLIES = 0;
    for (let obj of WORLD)
    {
        if (obj.isShip)
        {
            if (obj.faction.name != PLAYER_SHIP.faction.name)
                ++NUMBER_OF_ENEMIES;
            else if (obj != PLAYER_SHIP) ++NUMBER_OF_ALLIES;
        }
        obj.step(dt);
    }

    if (WORLD.length < 100 && SPAWN_DEBRIS)
    {
        let r = WORLD_RENDER_DISTANCE - 5;
        let rot = Math.random()*Math.PI*2;
        let pos = [Math.cos(rot)*r, -Math.sin(rot)*r];
        pos = add2d(pos, CAMERA_POS);
        let vel = [-Math.cos(rot + (Math.random() - 0.5)
                *Math.PI)*Math.random()*500,
            Math.sin(rot + (Math.random() - 0.5)
                *Math.PI)*Math.random()*500]
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
        WAVE_START = TIME;
        ++CURRENT_WAVE;
        throwAlert("Enemy vessels incoming.", ALERT_DISPLAY_TIME*3);

        let randomPos = rot2d([1.2*WORLD_RENDER_DISTANCE, 0],
            Math.random()*Math.PI*2);
        randomPos = add2d(randomPos, CAMERA_POS);
        for (let i = 0; i < CURRENT_WAVE; ++i)
        {
            if (Math.random() < 0.8 && i % 3 == 0)
                randomPos = rot2d([1.2*WORLD_RENDER_DISTANCE, 0],
                    Math.random()*Math.PI*2);
            let r = 1000*Math.random() + 200;
            let rot = Math.random()*Math.PI*2;
            let pos = [Math.cos(rot)*r + randomPos[0],
                       Math.sin(rot)*r + randomPos[1]];
            let vel = [PLAYER_SHIP.vel[0], PLAYER_SHIP.vel[1]];
            let enemy = new Morrigan(pos, 0);
            if (CURRENT_WAVE > 2 && i % 5 == 0)
                enemy = new Corvette(pos, 0);
            if (CURRENT_WAVE > 5 && i == 1)
                enemy = new Scirocco(pos, 0);
            enemy.behaviors = [Behaviors.genericEnemy,
                Behaviors.railgunTargetScirocco];
            enemy.vel = vel;
            enemy.faction = MCRN;
            WORLD.push(enemy);
        }
        RESPAWN_TIMER = RESPAWN_DELAY;
    }
    else if (NUMBER_OF_ENEMIES == 0)
    {
        if (!BETWEEN_WAVES)
        {
            TIME_BONUS = Math.floor(60 - (TIME - WAVE_START));
            ALLY_BONUS = NUMBER_OF_ALLIES*20;
            PLAYER_SCORE += TIME_BONUS + ALLY_BONUS;

            let pos = rot2d([WORLD_RENDER_DISTANCE, 0],
                Math.PI*2*Math.random());
            let ally = new Morrigan(pos, 0);
            if (Math.random() < 0.3) ally = new Corvette(pos, 0);
            if (CURRENT_WAVE == 5) ally = new Scirocco(pos, 0);
            ally.faction = PLAYER_FACTION;
            ally.behaviors = [Behaviors.genericAlly,
                Behaviors.pdcDefense,
                Behaviors.railgunTargetScirocco];
            ally.vel = mult2d(sub2d(PLAYER_SHIP.pos, ally.pos), 0.1);
            WORLD.push(ally);
            throwAlert("A friendly vessel has arrived!",
                2*ALERT_DISPLAY_TIME);
        }
        BETWEEN_WAVES = true;
        RESPAWN_TIMER -= dt;
    }
    TIME += dt;

    // let pos = PLAYER_SHIP.pos.slice();
    // let vel = PLAYER_SHIP.vel.slice();
    // for (let obj of WORLD)
    // {
    //     obj.pos[0] -= pos[0];
    //     obj.pos[1] -= pos[1];
    //     obj.vel[0] -= vel[0];
    //     obj.vel[1] -= vel[1];
    // }
}

function draw()
{
    CTX.canvas.width = document.body.clientWidth;
    CTX.canvas.height = document.body.clientHeight;
    WIDTH = CTX.canvas.width;
    HEIGHT = CTX.canvas.height;
    CTX.clearRect(0, 0, WIDTH, HEIGHT);
    updateMouse();

    CTX.save();
    CTX.translate(WIDTH/2, HEIGHT/2);
    if (CAMERA_TRACK_TARGET == null || CAMERA_TRACK_TARGET.remove)
        CAMERA_TRACK_TARGET = PLAYER_SHIP;
    CTX.rotate(CAMERA_THETA - Math.PI/2);

    CTX.translate(-CAMERA_POS[0]*PIXELS,
                  -CAMERA_POS[1]*PIXELS);

    for (let star of STARFIELD) star.draw();

    CTX.strokeStyle = "black";
    CTX.fillStyle = "black";
    CTX.lineWidth = 1;
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

    // CTX.beginPath();
    // CTX.arc(PLAYER_SHIP.pos[0]*PIXELS, PLAYER_SHIP.pos[1]*PIXELS,
    //         WORLD_RENDER_DISTANCE*PIXELS, 0, Math.PI*2);
    // CTX.globalAlpha = 0.2;
    // CTX.strokeStyle = "black";
    // CTX.stroke();

    for (let obj of WORLD) obj.draw(CTX);


    // let drawHint = function(pos, color, str, dir)
    // {
    //     CTX.save();
    //     CTX.translate(pos[0]*PIXELS, pos[1]*PIXELS);
    //     CTX.globalAlpha = 0.4;
    //     CTX.strokeStyle = CTX.fillStyle = color;
    //     CTX.lineWidth = 2;
    //     CTX.font = "24px Helvetica";
    //     let width = CTX.measureText(str).width;
    //     CTX.beginPath();
    //     CTX.moveTo(0, 0);
    //     CTX.lineTo(50, -50);
    //     CTX.lineTo(50 + width, -50);
    //     CTX.stroke();
    //     CTX.fillText(str, 50, -55);
    //     CTX.restore();
    // }
    //
    // if (TUTORIAL && !GAME_OVER && CURRENT_WAVE < 2)
    // {
    //     drawHint(PLAYER_SHIP.pos, "black", "THIS IS YOU");
    //     if (TARGET_OBJECT != null)
    //         drawHint(TARGET_OBJECT.pos, "red", "THIS IS YOUR TARGET");
    // }

    if (NEAREST_OBJECT != null && NEAREST_OBJECT != TARGET_OBJECT &&
        SLOW_TIME && !GAME_PAUSED)
    {
        CTX.save();
        CTX.translate(NEAREST_OBJECT.pos[0]*PIXELS,
                      NEAREST_OBJECT.pos[1]*PIXELS);
        CTX.rotate(-CAMERA_THETA + Math.PI/2);
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
            CTX.rotate(-CAMERA_THETA + Math.PI/2);
            CTX.globalAlpha = 0.6;

            CTX.strokeRect(-10*PIXELS, -10*PIXELS, 20*PIXELS, 20*PIXELS);
            CTX.globalAlpha = 1;
            CTX.font = "15px Helvetica";
            CTX.textAlign = "center";
            CTX.fillText(TARGET_OBJECT.type.toUpperCase(), 0, -20*PIXELS);
            CTX.font = "10px Helvetica";
            CTX.fillText(TARGET_OBJECT.fullName(), 0, -20*PIXELS - 17);

            if (TARGET_OBJECT.health < Infinity)
            {
                let health_percent = Math.max(0, TARGET_OBJECT.health/
                    TARGET_OBJECT.max_health);
                CTX.fillRect(-20, -20*PIXELS - 35,
                    40*health_percent, 5);
                CTX.fillText(Math.round(TARGET_OBJECT.health) + "/" +
                    Math.round(TARGET_OBJECT.max_health), 0, -20*PIXELS - 40)
            }

            if (SHOW_BEHAVIORS)
            {
                for (let i = 0; i < TARGET_OBJECT.behaviors.length; ++i)
                    CTX.fillText(TARGET_OBJECT.behaviors[i].name,
                        0, -20*PIXELS - 55 - i*15)
            }

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
        CTX.fillText("HULL (" + Math.round(PLAYER_SHIP.health) + "/" +
            Math.round(PLAYER_SHIP.max_health) + ")", 0, -3);
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
        let rvel = Math.round(norm2d(TARGET_OBJECT.vel));
        let racc = norm2d(TARGET_OBJECT.acc);

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

    CTX.fillStyle = "gray";
    CTX.font = "14px Helvetica";
    for (let i in ALERTS)
    {
        CTX.globalAlpha = Math.max(0, Math.min(0.8, ALERTS[i][1]));
        if (SHOW_ALL_ALERTS) CTX.globalAlpha = 0.8;
        CTX.fillText(ALERTS[i][0].toUpperCase(),
            70, 22 + 20*(ALERTS.length - i - 1));
    }

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
            drawKey(beginx + 315, beginy, w, h,
                '9', 'Switch factions (UNN/MCRN)');
        }

        drawKey(beginx, beginy + 35, w*1.5, h, '', '');
        drawKey(beginx + w*1.5 + 5, beginy + 35, w, h, '', '');
        drawKey(beginx + w*2.5 + 10, beginy + 35, w, h, '', '');
        drawKey(beginx + w*3.5 + 15, beginy + 35, w, h, '', '');
        drawKey(beginx + w*4.5 + 20, beginy + 35, w, h,
            'R', 'Toggle targeting mode');

        if (GAME_PAUSED)
        {
            drawKey(beginx + w*5.5 + 25, beginy + 35, w, h,
                'T', 'Center camera on object (debug)');
            drawKey(beginx + w*6.5 + 30, beginy + 35, w, h,
                'Y', 'Toggle show behaviors (debug)');
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
    CTX.lineWidth = 1;
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
        CTX.fillText("PRESS [SPACE] TO RETRY WAVE " + CURRENT_WAVE,
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
    if (BETWEEN_WAVES && RESPAWN_TIMER > 0 && !GAME_PAUSED
        && SPAWN_ENEMIES && !GAME_OVER)
    {
        CTX.font = "30px Helvetica";
        CTX.globalAlpha = 0.4;
        CTX.fillStyle = "darkgray";
        CTX.textAlign = "left";
        let rtime = (Math.round(RESPAWN_TIMER*100)/100).toLocaleString("en",
            {useGrouping: false, minimumFractionDigits: 2});
        if (CURRENT_WAVE > 0)
        {
            CTX.textAlign = "right";
            CTX.fillText("WAVE " + CURRENT_WAVE + " CLEARED",
                WIDTH/2 - 20, HEIGHT/2 - 20);
            CTX.textAlign = "left";
        }
        CTX.fillText("WAVE " + (CURRENT_WAVE + 1) + " IN T-" + rtime + "s",
            WIDTH/2 + 20, HEIGHT/2 - 20);
        if (TIME_BONUS > 0 || ALLY_BONUS > 0)
        {
            CTX.fillText("TIME BONUS: " + TIME_BONUS + " POINTS",
                WIDTH/2 + 20, HEIGHT/2 + 40);
            CTX.fillText("ALLY BONUS: " + ALLY_BONUS + " POINTS",
                WIDTH/2 + 20, HEIGHT/2 + 80);
            CTX.fillText("PRESS [K] TO ADVANCE", WIDTH/2 + 20, HEIGHT/2 + 120);
        }
        else
            CTX.fillText("PRESS [K] TO ADVANCE", WIDTH/2 + 20, HEIGHT/2 + 40);
    }
    CTX.font = "30px Helvetica";
    CTX.globalAlpha = 0.4;
    CTX.fillStyle = "darkgray";
    CTX.textAlign = "center";
    // CTX.fillText(PLAYER_SCORE, WIDTH/2, 40);
    CTX.textAlign = "right";
    CTX.fillText("WAVE " + CURRENT_WAVE, WIDTH - 20, 40);
    CTX.font = "12px Helvetica";
    CTX.globalAlpha = 0.8;
    if (NUMBER_OF_ENEMIES == 1)
        CTX.fillText("1 ENEMY REMAINS", WIDTH - 20, 60);
    else
        CTX.fillText(NUMBER_OF_ENEMIES + " ENEMIES REMAIN", WIDTH - 20, 60);
    if (NUMBER_OF_ALLIES == 1)
        CTX.fillText("1 ALLY REMAINS", WIDTH - 20, 75);
    else
        CTX.fillText(NUMBER_OF_ALLIES + " ALLIES REMAIN", WIDTH - 20, 75);

    // CTX.textAlign = "right";
    // CTX.strokeStyle = "black";
    // CTX.globalAlpha = 0.4;
    // CTX.fillStyle = UNN.radar;
    // CTX.font = "15px Helvetica";
    // CTX.fillRect(WIDTH - 130, 100, 15, 15);
    // CTX.fillText("FRIENDLIES", WIDTH - 110, 113);
    // CTX.fillStyle = MCRN.radar;
    // CTX.fillRect(WIDTH - 130, 120, 15, 15);
    // CTX.fillText("ENEMIES", WIDTH - 110, 133);
}

function start()
{
    for (let i in ALERTS) ALERTS[i][1] -= DT;

    CAMERA_POS[0] += (CAMERA_TRACK_TARGET.pos[0] - CAMERA_POS[0])*0.09;
    CAMERA_POS[1] += (CAMERA_TRACK_TARGET.pos[1] - CAMERA_POS[1])*0.09;

    let targetTheta = CAMERA_TRACK_TARGET.theta;
    if (!LOCK_CAMERA) targetTheta = Math.PI/2;
    while (targetTheta - CAMERA_THETA < -Math.PI) targetTheta += Math.PI*2;
    while (targetTheta - CAMERA_THETA > Math.PI) targetTheta -= Math.PI*2;
    CAMERA_THETA += (targetTheta - CAMERA_THETA)*0.2;

    if (UNDERTRACK.currentTime > UNDERTRACK.duration - 0.10)
    {
        console.log("https://i.ytimg.com/vi/XFFmw-HDiRE/maxresdefault.jpg");
        UNDERTRACK.currentTime = 25.821;
        OVERTRACK.currentTime = 25.821;
    }
    else if (GAME_PAUSED)
    {
        UNDERTRACK.volume = BETWEEN_WAVES ? 0.05 : 0;
        OVERTRACK.volume = BETWEEN_WAVES ? 0 : 0.05;
    }
    else
    {
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

        if (NUMBER_OF_ENEMIES == 0)
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
    if (!GAME_PAUSED && !SLOW_TIME)
    {
        CURRENT_DT += (NOMINAL_DT - CURRENT_DT)*0.1;
        TARGETING_STAMINA += DT*2;
        if (TARGETING_STAMINA > TARGETING_MAX)
        {
            TARGETING_STAMINA = TARGETING_MAX;
            TARGETING_LOCKOUT = false;
        }
    }
    else if (!GAME_PAUSED)
    {
        CURRENT_DT += (SLOW_DT - CURRENT_DT)*0.1;
        TARGETING_STAMINA -= DT;
        if (TARGETING_STAMINA < 0) TARGETING_STAMINA = 0;
    }
    if (!GAME_PAUSED) physics(CURRENT_DT);
    requestAnimationFrame(start);
    DT = (CURRENT - LAST)/1000;
    LAST = CURRENT;

    if (ONE_KEY) TARGET_ZOOM += 120;
    if (TWO_KEY) TARGET_ZOOM -= 120;
    zoom();

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
