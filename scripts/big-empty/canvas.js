// canvas.js

var PLAYER_INVINCIBLE = false;
var PIXELS = 1;
var DRAW_TRACE;
var DRAW_ACCEL;
var SHOW_ALL_ALERTS;
var SHOW_BEHAVIORS;

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

const TARGETING_MAX = 0.2;
var TARGETING_STAMINA;
var TARGETING_LOCKOUT;

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

const UNDERTRACK = new Audio("scripts/big-empty/sounds/strobotone-undertrack.mp3");
const OVERTRACK = new Audio("scripts/big-empty/sounds/strobotone-overtrack.mp3");
var MUSIC_MUTED = false;

var ALERTS;
const ALERT_DISPLAY_TIME = 6;

var WIDTH, HEIGHT;
var MOUSEX, MOUSEY;
var MOUSE_SCREEN_POS;

var WORLD;
const WORLD_RENDER_DISTANCE = 10000;

const MIN_ZOOM = 30;
const MAX_ZOOM = WORLD_RENDER_DISTANCE + 1000;
var VIEW_RADIUS, TARGET_ZOOM;

var NEAREST_OBJECT;
var TARGET_OBJECT;
var WAYPOINTS;

var PLAYER_SHIP, CAMERA_TRACK_TARGET;
var CAMERA_POS, CAMERA_THETA, CAMERA_VEL;

initialize();
start();

function initialize()
{
    DRAW_TRACE = false;
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
    RESPAWN_TIMER = 0;
    BETWEEN_WAVES = true;
    TARGETING_STAMINA = TARGETING_MAX;
    TARGETING_LOCKOUT = false;

    PLAYER_SCORE = 0;
    TIME_BONUS = ALLY_BONUS = 0;

    CURRENT_DT = 0;
    TIME = 0;

    ALERTS = [];

    WIDTH = document.body.clientWidth;
    HEIGHT = document.body.scrollHeight;
    MOUSEX = 0, MOUSEY = 0;
    MOUSE_SCREEN_POS = [WIDTH/2, HEIGHT/2];

    VIEW_RADIUS = TARGET_ZOOM = 2000;
    zoom();

    NEAREST_OBJECT = null;
    TARGET_OBJECT = null;
    WAYPOINTS = [];

    WORLD = [];
    respawn(1);
    CAMERA_TRACK_TARGET = PLAYER_SHIP;
    CAMERA_POS = CAMERA_TRACK_TARGET.pos.slice();
    CAMERA_VEL = CAMERA_TRACK_TARGET.vel.slice();
    CAMERA_THETA = Math.PI/2;

    CURRENT = new Date().getTime(), LAST = CURRENT, DT = 0;

    for (let i = 0; i < Math.pow(WORLD_RENDER_DISTANCE, 2)/1E6
        && SPAWN_DEBRIS; ++i)
    {
        let r = Math.random()*WORLD_RENDER_DISTANCE/2 + 200;
        let rot = Math.random()*Math.PI*2;
        let pos = [Math.cos(rot)*r + CAMERA_POS[0],
                   Math.sin(rot)*r + CAMERA_POS[1]];
        let vel = [Math.random()*200 - 100,
                   Math.random()*200 - 100]
        let theta = Math.random()*Math.PI*2;
        let omega = Math.random()*10 - 5;
        let size = Math.random()*25 + 10;
        let deb = new Debris(pos, vel, theta, omega, size);
        WORLD.push(deb);
    }

    for (let i = 0; i < CURRENT_WAVE; ++i)
    {
        let pos = rot2d([WORLD_RENDER_DISTANCE, 0],
            Math.PI*2*Math.random());
        pos = add2d(pos, PLAYER_SHIP.pos);
        let ally = new Morrigan(pos, 0);
        if (Math.random() < 0.3) ally = new Corvette(pos, 0);
        if (i == 5) ally = new Scirocco(pos, 0);
        ally.faction = PLAYER_SHIP.faction;
        ally.behaviors = [Behaviors.genericAlly,
            Behaviors.pdcDefense];
        ally.vel = PLAYER_SHIP.vel.slice();
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
                throwAlert("Spawned as Morrigan class vessel.", ALERT_DISPLAY_TIME);
                break;
        case 1: newship = new Corvette([0, 0], 0);
                throwAlert("Spawned as Corvette class vessel.", ALERT_DISPLAY_TIME);
                break;
        case 2: newship = new Amun_Ra([0, 0], 0);
                throwAlert("Spawned as Amun-Ra class vessel.", ALERT_DISPLAY_TIME);
                break;
        case 3: newship = new Scirocco([0, 0], 0);
                throwAlert("Spawned as Scirocco class vessel.", ALERT_DISPLAY_TIME);
                break;
        case 4: newship = new Basilisk([0, 0], 0);
                throwAlert("Spawned as Basilisk class vessel.", ALERT_DISPLAY_TIME);
                break;
        case 5: newship = new Donnager([0, 0], 0);
                throwAlert("Spawned as Donnager class vessel.", ALERT_DISPLAY_TIME);
                break;
    }

    newship.behaviors = [Behaviors.playerControlled];
    if (newship instanceof Basilisk)
        newship.behaviors.push(Behaviors.repairFriendlies);
    if (typeof PLAYER_SHIP !== 'undefined')
    {
        newship.theta = PLAYER_SHIP.theta;
        newship.omega = PLAYER_SHIP.omega;
        newship.pos = PLAYER_SHIP.pos.slice();
        newship.vel = PLAYER_SHIP.vel.slice();
        newship.faction = PLAYER_SHIP.faction;
        WORLD.splice(WORLD.indexOf(PLAYER_SHIP), 1);
        PLAYER_SHIP.remove = true;
    }
    else
    {
        newship.faction = UNN;
    }

    PLAYER_SHIP = newship;
    WORLD.push(PLAYER_SHIP);
    GAME_OVER = false;
}

canvas.oncontextmenu = function(e)
{
    e.preventDefault();
};

function throwAlert(msg, time)
{
    if (ALERTS.length > 0 && ALERTS[ALERTS.length - 1][0] == msg)
    {
        ALERTS[ALERTS.length - 1][1] = time;
        return;
    }
    ALERTS.push([msg, time]);
}

function zoom()
{
    TARGET_ZOOM = Math.max(MIN_ZOOM, Math.min(TARGET_ZOOM, MAX_ZOOM));
    VIEW_RADIUS += (TARGET_ZOOM - VIEW_RADIUS)*0.2;
    VIEW_RADIUS = Math.max(MIN_ZOOM, Math.min(VIEW_RADIUS, MAX_ZOOM));
    PIXELS = Math.min(WIDTH, HEIGHT)/(2*VIEW_RADIUS); //  pixels per meter
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
        let dx = WORLD[i].pos[0] - CAMERA_POS[0];
        let dy = WORLD[i].pos[1] - CAMERA_POS[1];
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
        if (Math.random() < 0.02)
        {
            size *= 8;
            omega /= 15;
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
            pos = add2d(pos, PLAYER_SHIP.pos);
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
            enemy.is_enemy = true;
            WORLD.push(enemy);
        }
        RESPAWN_TIMER = RESPAWN_DELAY;
    }
    else if (NUMBER_OF_ENEMIES == 0)
    {
        if (!BETWEEN_WAVES)
        {
            TIME_BONUS = Math.max(Math.floor(60 - (TIME - WAVE_START)), 0);
            ALLY_BONUS = NUMBER_OF_ALLIES*20;
            PLAYER_SCORE += TIME_BONUS + ALLY_BONUS;

            let pos = rot2d([WORLD_RENDER_DISTANCE, 0],
                Math.PI*2*Math.random());
            pos = add2d(PLAYER_SHIP.pos, pos);
            let ally = new Morrigan(pos, 0);
            if (Math.random() < 0.3) ally = new Corvette(pos, 0);
            if (CURRENT_WAVE % 5 == 0) ally = new Scirocco(pos, 0);
            ally.faction = PLAYER_SHIP.faction;
            ally.behaviors = [Behaviors.genericAlly,
                Behaviors.pdcDefense,
                Behaviors.railgunTargetScirocco];
            ally.vel = mult2d(sub2d(PLAYER_SHIP.pos, ally.pos), 0.1);
            ally.vel = add2d(ally.vel, PLAYER_SHIP.vel);
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

    const STAR_TILE_SIZE = 2000;
    function drawStarTile(xoff, yoff, layer)
    {
        function mix(a, b, c)
        {
            a=a-b;  a=a-c;  a=a^(c >>> 13);
            b=b-c;  b=b-a;  b=b^(a << 8);
            c=c-a;  c=c-b;  c=c^(b >>> 13);
            a=a-b;  a=a-c;  a=a^(c >>> 12);
            b=b-c;  b=b-a;  b=b^(a << 16);
            c=c-a;  c=c-b;  c=c^(b >>> 5);
            a=a-b;  a=a-c;  a=a^(c >>> 3);
            b=b-c;  b=b-a;  b=b^(a << 10);
            c=c-a;  c=c-b;  c=c^(b >>> 15);
            return c;
        }

        const STARS_PER_TILE = 2;
        const STAR_SEED = 0x9c2c9188;

        CTX.fillStyle = "black";
        CTX.globalAlpha = layer*0.3 + 0.4;

        let offset = mult2d(CAMERA_POS, 1 - layer);
        let parallax = add2d([xoff, yoff], offset);
        let salt = STAR_SEED*(STAR_SEED + layer);

        let hash = Math.abs(mix(STAR_SEED, xoff + salt, yoff + salt));
        for (let n = 0; n < STARS_PER_TILE; n++) {
            let px = hash % STAR_TILE_SIZE + parallax[0];
            hash >>= 3;
            let py = hash % STAR_TILE_SIZE + parallax[1];
            hash >>= 3;
            CTX.beginPath();
            CTX.arc(px*PIXELS, py*PIXELS, 9*PIXELS*(layer*0.4 + 0.3), 0, Math.PI*2);
            CTX.fill();
        }

        // CTX.fillStyle = "black";
        // CTX.globalAlpha = 0.05;
        // CTX.fillRect(parallax[0]*PIXELS, parallax[1]*PIXELS,
        //     STAR_TILE_SIZE*PIXELS - 3, STAR_TILE_SIZE*PIXELS - 3);
        // CTX.globalAlpha = 0.6;
        // CTX.strokeRect(parallax[0]*PIXELS, parallax[1]*PIXELS,
        //     STAR_TILE_SIZE*PIXELS - 3, STAR_TILE_SIZE*PIXELS - 3);
    }

    if (!DRAW_HITBOX)
    {
        for (let layer of [0.9, 0.6, 0.3, 0.01])
        {
            let xBegin = CAMERA_POS[0]*layer - WIDTH/2/PIXELS;
            xBegin = xBegin - (xBegin % STAR_TILE_SIZE) - STAR_TILE_SIZE;
            let yBegin = CAMERA_POS[1]*layer - HEIGHT/2/PIXELS;
            yBegin = yBegin - (yBegin % STAR_TILE_SIZE) - STAR_TILE_SIZE;

            let xEnd = CAMERA_POS[0]*layer + WIDTH/2/PIXELS;
            xEnd = xEnd - (xEnd % STAR_TILE_SIZE) + STAR_TILE_SIZE;
            let yEnd = CAMERA_POS[1]*layer + HEIGHT/2/PIXELS;
            yEnd = yEnd - (yEnd % STAR_TILE_SIZE) + STAR_TILE_SIZE;

            for (let i = xBegin; i < xEnd; i += STAR_TILE_SIZE)
            {
                for (let j = yBegin; j < yEnd; j += STAR_TILE_SIZE)
                {
                    drawStarTile(i, j, layer);
                }
            }
        }
    }

    // if (PLAYER_SHIP != null)
    // {
    //     CTX.save();
    //     CTX.globalAlpha = 0.3;
    //     CTX.strokeStyle = "black";
    //     CTX.setLineDash([40*PIXELS, 15*PIXELS]);
    //     CTX.beginPath();
    //     for (let i = Math.max(1, PLAYER_SHIP.pos_history.length - 25);
    //         i < PLAYER_SHIP.pos_history.length; ++i)
    //     {
    //         CTX.lineTo(PLAYER_SHIP.pos_history[i][0]*PIXELS,
    //                    PLAYER_SHIP.pos_history[i][1]*PIXELS);
    //     }
    //     CTX.stroke();
    //     CTX.restore();
    // }

    if (PLAYER_SHIP != null && TARGET_OBJECT != null && SLOW_TIME)
    {
        CTX.globalAlpha = 0.2;
        CTX.lineWidth = 1;
        // CTX.setLineDash([5, 30]);

        let firing_solution_exists = false
        let label_pos = [0, 0];

        for (let pdc of PLAYER_SHIP.pdcs)
        {
            let theta_t = pdc.computeFiringSolution(TARGET_OBJECT);
            let theta = theta_t[0];
            let t = theta_t[1];
            if (isNaN(theta))
            {
                continue;
            }

            pdc.gamma = theta - pdc.theta - pdc.object.theta;
            let pos = add2d(PLAYER_SHIP.pos, rot2d(pdc.pos, PLAYER_SHIP.theta));
            let rvel = rot2d([PDC_VELOCITY, 0], theta);
            let p_intercept = add2d(pos, mult2d(rvel, t))
            if (!firing_solution_exists)
            {
                firing_solution_exists = true;
                label_pos = add2d(pos, mult2d(rvel, t/2))
            }

            CTX.fillStyle = CTX.strokeStyle = "red";
            CTX.beginPath();
            CTX.moveTo(pos[0]*PIXELS, pos[1]*PIXELS);
            CTX.lineTo(p_intercept[0]*PIXELS, p_intercept[1]*PIXELS);
            CTX.closePath();
            CTX.stroke();

            CTX.fillStyle = CTX.strokeStyle = "blue";
            CTX.beginPath();
            CTX.moveTo(TARGET_OBJECT.pos[0]*PIXELS, TARGET_OBJECT.pos[1]*PIXELS);
            CTX.lineTo(p_intercept[0]*PIXELS, p_intercept[1]*PIXELS);
            CTX.closePath();
            CTX.stroke();
        }

        if (firing_solution_exists)
        {
            CTX.globalAlpha = 0.5;
            CTX.font = "11px Helvetica";
            CTX.textAlign = "center";
            CTX.fillStyle = "red";
            CTX.fillText("[TARGET: " + TARGET_OBJECT.fullName().toUpperCase(),
                label_pos[0]*PIXELS, label_pos[1]*PIXELS - 12);
            CTX.fillText("PDC FIRING SOLUTION AVAILABLE]",
                label_pos[0]*PIXELS, label_pos[1]*PIXELS);
        }
    }

    CTX.strokeStyle = "black";
    CTX.fillStyle = "black";
    CTX.lineWidth = 1;
    let max = Math.round(Math.max(WIDTH, HEIGHT)/(PIXELS*10));
    let interval = 500;
    while (interval < max) interval *= 2;
    for (let i = 0; interval*(i + 1)*PIXELS < Math.max(WIDTH, HEIGHT); ++i)
    {
        CTX.beginPath();
        CTX.arc(CAMERA_TRACK_TARGET.pos[0]*PIXELS, CAMERA_TRACK_TARGET.pos[1]*PIXELS,
                interval*(i + 1)*PIXELS, 0, Math.PI*2);
        CTX.globalAlpha = 0.06;
        CTX.stroke();
        CTX.globalAlpha = 0.2;
        CTX.fillText(interval*(i + 1) + " m",
            (CAMERA_TRACK_TARGET.pos[0] + interval*(i + 1))*PIXELS + 3,
            CAMERA_TRACK_TARGET.pos[1]*PIXELS - 3);
    }

    CTX.globalAlpha = 0.06;
    CTX.moveTo(CAMERA_TRACK_TARGET.pos[0]*PIXELS,
               CAMERA_TRACK_TARGET.pos[1]*PIXELS - Math.max(WIDTH, HEIGHT));
    CTX.lineTo(CAMERA_TRACK_TARGET.pos[0]*PIXELS,
               CAMERA_TRACK_TARGET.pos[1]*PIXELS + Math.max(WIDTH, HEIGHT));
    CTX.moveTo(CAMERA_TRACK_TARGET.pos[0]*PIXELS - Math.max(WIDTH, HEIGHT),
               CAMERA_TRACK_TARGET.pos[1]*PIXELS);
    CTX.lineTo(CAMERA_TRACK_TARGET.pos[0]*PIXELS + Math.max(WIDTH, HEIGHT),
               CAMERA_TRACK_TARGET.pos[1]*PIXELS);
    CTX.stroke();

    CTX.save();
    CTX.globalAlpha = Math.max(0, (VIEW_RADIUS - 1000)/MAX_ZOOM*0.1);
    CTX.strokeStyle = "blue";
    CTX.translate(CAMERA_TRACK_TARGET.pos[0]*PIXELS,
        CAMERA_TRACK_TARGET.pos[1]*PIXELS);
    CTX.rotate(-TIME/3);
    gradient = CTX.createLinearGradient(0, 0, 1000, 0);
    gradient.addColorStop(0, "blue");
    gradient.addColorStop(1, "blue");
    CTX.strokeStyle = gradient; // grd;
    CTX.lineWidth = WORLD_RENDER_DISTANCE*PIXELS;
    CTX.beginPath();
    CTX.arc(0, 0, WORLD_RENDER_DISTANCE*PIXELS/2, 0, Math.PI/100);
    CTX.stroke();
    CTX.restore();

    for (let obj of WORLD) obj.draw(CTX);

    {
        CTX.save();
        CTX.translate(CAMERA_POS[0]*PIXELS - WIDTH/2,
            CAMERA_POS[1]*PIXELS - HEIGHT/2);
        let grd = CTX.createRadialGradient(
            WIDTH/2, HEIGHT/2, WORLD_RENDER_DISTANCE*0.9*PIXELS,
            WIDTH/2, HEIGHT/2, WORLD_RENDER_DISTANCE*1*PIXELS);
        grd.addColorStop(0, "rgba(255, 255, 255, 0)");
        grd.addColorStop(1, "rgba(255, 255, 255, 1)");
        CTX.fillStyle = grd;
        CTX.globalAlpha = 1;
        CTX.fillRect(0, 0, WIDTH, HEIGHT);
        CTX.translate(WIDTH/2, HEIGHT/2);
        CTX.beginPath();
        CTX.setLineDash([500*PIXELS, 500*PIXELS]);
        CTX.arc(0, 0, WORLD_RENDER_DISTANCE*PIXELS, 0, Math.PI*2);
        CTX.strokeStyle = "lightgray";
        CTX.stroke();
        CTX.restore();
    }

    let drawHint = function(pos, color, str, dir)
    {
        CTX.save();
        CTX.translate(pos[0]*PIXELS, pos[1]*PIXELS);
        if (LOCK_CAMERA) CTX.rotate(-CAMERA_THETA + Math.PI/2);
        CTX.globalAlpha = 0.4;
        CTX.strokeStyle = CTX.fillStyle = color;
        CTX.lineWidth = 2;
        CTX.font = "24px Helvetica";
        let width = CTX.measureText(str).width;
        CTX.beginPath();
        CTX.moveTo(0, 0);
        CTX.lineTo(50, -50);
        CTX.lineTo(50 + width, -50);
        CTX.stroke();
        CTX.fillText(str, 50, -55);
        CTX.restore();
    }

    if (CAMERA_TRACK_TARGET != PLAYER_SHIP && !PLAYER_SHIP.remove)
        drawHint(PLAYER_SHIP.pos, "black", "THIS IS YOU");

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
            CTX.lineWidth = 3;
            CTX.strokeRect(-7, -7, 14, 14);
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
            CTX.translate(PLAYER_SHIP.pos[0]*PIXELS,
                PLAYER_SHIP.pos[1]*PIXELS);
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


    for (let i = 0; i < WAYPOINTS.length; ++i)
    {
        let waypoint = WAYPOINTS[i];
        if (!isOffScreen(waypoint))
        {
            CTX.save();
            CTX.strokeStyle = "green";
            CTX.fillStyle = "green";
            CTX.translate(waypoint[0]*PIXELS, waypoint[1]*PIXELS);
            CTX.rotate(-CAMERA_THETA + Math.PI/2);
            CTX.globalAlpha = 0.6;

            CTX.lineWidth = 3;
            CTX.beginPath();
            CTX.moveTo(0, -6);
            CTX.lineTo(-6, 6);
            CTX.lineTo(6, 6);
            CTX.closePath();
            CTX.stroke();
            CTX.restore();
        }
        else
        {
            CTX.save();
            CTX.translate(PLAYER_SHIP.pos[0]*PIXELS,
                PLAYER_SHIP.pos[1]*PIXELS);
            let angle = -angle2d(PLAYER_SHIP.pos, waypoint) + Math.PI/2;
            CTX.rotate(angle);
            let radius = 1.1*Math.max(PLAYER_SHIP.length, PLAYER_SHIP.width);
            CTX.globalAlpha = 0.4;
            CTX.strokeStyle = "green";
            CTX.lineWidth = 4*PIXELS;
            CTX.beginPath();
            CTX.moveTo(-20*PIXELS, -(radius + 5)*PIXELS);
            CTX.lineTo(0*PIXELS, -(radius + 20)*PIXELS);
            CTX.lineTo(20*PIXELS, -(radius + 5)*PIXELS);
            CTX.stroke();
            CTX.restore();
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
            CTX.globalAlpha = 0.3;
            let num_tubes = PLAYER_SHIP.tubes.length;
            let height = (HEIGHT - 2*border -
                spacing*(num_tubes - 1))/num_tubes;
            for (let i = 0; i < num_tubes; ++i)
            {
                let tube = PLAYER_SHIP.tubes[i];
                let percent = Math.min(1, (TIME -
                    tube.lastFired)/tube.cooldown);
                CTX.fillStyle = "rgb(100, 100, 255, 1)";
                if (percent < 1)
                {
                    CTX.fillStyle = "grey";
                }
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
    if (GAME_PAUSED)
        CTX.fillText("PRESS [ESC] TO UNPAUSE", 70, HEIGHT - 10);
    else
        CTX.fillText("PRESS [ESC] TO PAUSE", 70, HEIGHT - 10);

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

        CTX.font = "14px Helvetica";
        CTX.textAlign = "center";
        CTX.fillText("TARGET LOCKED: " +
            TARGET_OBJECT.fullName().toUpperCase() + ": " +
            TARGET_OBJECT.type.toUpperCase() + " (" +
            dstr + ", " + vstr + ", " + astr + ")", WIDTH/2, HEIGHT - 10);
    }
    else
    {
        CTX.textAlign = "center";
        CTX.fillText("RIGHT CLICK TO TARGET", WIDTH/2, HEIGHT - 10);
    }

    if (!SLOW_TIME)
    {
        CTX.font = "12px Helvetica";
        CTX.textAlign = "center";
        CTX.fillText("PRESS [E] TO ENTER TARGETING MODE", WIDTH/2, HEIGHT - 30);
    }

    CTX.textAlign = "right";
    let ftime = (Math.round(TIME*100)/100).toLocaleString("en",
        {useGrouping: false, minimumFractionDigits: 2});
    let dilation = (Math.round(CURRENT_DT/DT*10)/10).toLocaleString("en",
        {useGrouping: false, minimumFractionDigits: 1});
    CTX.fillText(dilation, WIDTH - 10, HEIGHT - 30);
    CTX.fillText(ftime, WIDTH - 10, HEIGHT - 10);
    CTX.textAlign = "left";

    CTX.fillStyle = "gray";
    let index = 0;
    for (let i = ALERTS.length - 1; i >= 0; --i)
    {
        CTX.font = "14px Helvetica";
        if (index == 0)
            CTX.font = "24px Helvetica";
        CTX.globalAlpha = Math.max(0, Math.min(1, ALERTS[i][1]));
        if (SHOW_ALL_ALERTS)
            CTX.globalAlpha = 0.8;
        if (CTX.globalAlpha > 0)
        {
            CTX.globalAlpha = 0.8;
            CTX.fillText(ALERTS[i][0].toUpperCase(), 70, 30 + 20*index);
            ++index;
        }
    }

    draw_keyboard_hints();

    CTX.globalAlpha = 1;
    CTX.strokeStyle = "black";
    CTX.fillStyle = "lightgreen";
    CTX.lineWidth = 1;
    if (TARGETING_LOCKOUT) CTX.fillStyle = "red";
    CTX.beginPath();
    CTX.arc(MOUSE_SCREEN_POS[0], MOUSE_SCREEN_POS[1], 4, 0, Math.PI*2);
    CTX.stroke();
    // if (TARGETING_STAMINA < TARGETING_MAX && TARGETING_STAMINA > 0)
    // {
    //     CTX.beginPath();
    //     CTX.arc(MOUSE_SCREEN_POS[0], MOUSE_SCREEN_POS[1], 8, -Math.PI/2,
    //         Math.PI*2*TARGETING_STAMINA/TARGETING_MAX - Math.PI/2, false);
    //     CTX.arc(MOUSE_SCREEN_POS[0], MOUSE_SCREEN_POS[1], 4,
    //         Math.PI*2*TARGETING_STAMINA/TARGETING_MAX - Math.PI/2,
    //         -Math.PI/2, true);
    //     CTX.lineTo(MOUSE_SCREEN_POS[0], MOUSE_SCREEN_POS[1] - 8);
    //     CTX.fill();
    //     CTX.stroke();
    // }

    if (GAME_OVER)
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
            WIDTH/2, HEIGHT/2, Math.max(WIDTH, HEIGHT),
            WIDTH/2, HEIGHT/2, Math.min(WIDTH, HEIGHT) / 2);
        grd.addColorStop(0, "rgba(0, 0, 0, 1)");
        grd.addColorStop(1, "rgba(0, 0, 0, 0)");
        CTX.fillStyle = grd;
        CTX.globalAlpha = (1 - TARGETING_STAMINA/TARGETING_MAX) * 0.6;
        CTX.fillRect(0, 0, WIDTH, HEIGHT);
        CTX.textAlign = "center";
        CTX.font = "30px Helvetica";
        CTX.globalAlpha = 0.7;
        CTX.fillStyle = "darkgray";
        CTX.strokeStyle = "darkgray";
        CTX.fillText("TARGETING MODE - SIMULATION TIME DILATED", WIDTH/2, HEIGHT - 80);
        CTX.font = "20px Helvetica";
        CTX.fillText("PRESS [E] TO RETURN TO REAL TIME", WIDTH/2, HEIGHT - 50);
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
        if (PLAYER_SCORE > 0)
        {
            CTX.fillText("TIME BONUS", WIDTH/2 + 20, HEIGHT/2 + 40);
            CTX.fillText(TIME_BONUS, WIDTH/2 + 400, HEIGHT/2 + 40);
            CTX.fillText("ALLY BONUS", WIDTH/2 + 20, HEIGHT/2 + 80);
            CTX.fillText(ALLY_BONUS, WIDTH/2 + 400, HEIGHT/2 + 80);
            CTX.fillText("TOTAL SCORE", WIDTH/2 + 20, HEIGHT/2 + 120);
            CTX.fillText(PLAYER_SCORE, WIDTH/2 + 400, HEIGHT/2 + 120);
            CTX.fillText("PRESS [K] TO ADVANCE", WIDTH/2 + 20, HEIGHT/2 + 160);
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

    if (GAME_OVER || GAME_PAUSED)
    {
        CTX.textAlign = "right";
        CTX.font = "28px Helvetica";
        CTX.globalAlpha = 0.4;
        CTX.fillStyle = CTX.strokeStyle = "gray";
        CTX.fillText("SCROLL DOWN", WIDTH - 50,
            HEIGHT/4 - 30 + window.pageYOffset);
        CTX.fillText("FOR INFO", WIDTH - 50,
            HEIGHT/4 + window.pageYOffset);
        CTX.beginPath();
        CTX.moveTo(WIDTH - 20, HEIGHT/4 - 25 + window.pageYOffset);
        CTX.lineTo(WIDTH - 40, HEIGHT/4 - 40 + window.pageYOffset);
        CTX.lineTo(WIDTH - 40, HEIGHT/4 - 10 + window.pageYOffset);
        CTX.closePath();
        CTX.fill();

        CTX.globalAlpha = Math.min(1, 4*window.pageYOffset/HEIGHT);
        CTX.fillStyle = "white";
        CTX.fillRect(0, 0, WIDTH, HEIGHT);

        CTX.globalAlpha = 0.4;
        CTX.textAlign = "center";
        CTX.fillStyle = CTX.strokeStyle = "gray";
        let screenPos = 10 + window.pageYOffset +
            100000000/Math.pow(window.pageYOffset, 3);
        CTX.beginPath();
        CTX.moveTo(WIDTH/2 - 15, screenPos + 20);
        CTX.lineTo(WIDTH/2, screenPos);
        CTX.lineTo(WIDTH/2 + 15, screenPos + 20);
        CTX.closePath();
        CTX.fill();
        CTX.fillText("GO ALL THE WAY BACK", WIDTH/2, screenPos + 60);
        CTX.fillText("TO RECAPTURE", WIDTH/2, screenPos + 90);
    }
}

function start()
{
    processInput();

    for (let i in ALERTS) ALERTS[i][1] -= DT;

    CAMERA_POS[0] += (CAMERA_TRACK_TARGET.pos[0] - CAMERA_POS[0])*0.2;
    CAMERA_POS[1] += (CAMERA_TRACK_TARGET.pos[1] - CAMERA_POS[1])*0.2;

    // let center_pos = [0, 0];
    // let count = 0;
    // for (let object of WORLD)
    // {
    //     if (object.isShip &&
    //         distance(CAMERA_TRACK_TARGET.pos, object.pos) < 4000)
    //     {
    //         center_pos = add2d(center_pos, object.pos);
    //         ++count;
    //     }
    // }
    // center_pos = div2d(center_pos, count);
    //
    // CAMERA_POS[0] += (center_pos[0] - CAMERA_POS[0])*0.1;
    // CAMERA_POS[1] += (center_pos[1] - CAMERA_POS[1])*0.1;

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
        if (MUSIC_MUTED)
        {
            UNDERTRACK.volume = 0;
            OVERTRACK.volume = 0;
        }
        else
        {
            UNDERTRACK.volume = BETWEEN_WAVES ? 0.05 : 0;
            OVERTRACK.volume = BETWEEN_WAVES ? 0 : 0.05;
        }
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

        if (MUSIC_MUTED)
        {
            UNDERTRACK.volume = 0;
            OVERTRACK.volume = 0;
        }
        else if (NUMBER_OF_ENEMIES == 0 || GAME_OVER)
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
        CURRENT_DT += (DT - CURRENT_DT)*0.1;
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

    if (KEYPRESSES.has("1")) TARGET_ZOOM += 120;
    if (KEYPRESSES.has("2")) TARGET_ZOOM -= 120;
    zoom();

    let ds = 5;
    if (KEYPRESSES.has("ArrowUp")) MOUSE_SCREEN_POS[1] -= ds;
    if (KEYPRESSES.has("ArrowDown")) MOUSE_SCREEN_POS[1] += ds;
    if (KEYPRESSES.has("ArrowLeft")) MOUSE_SCREEN_POS[0] -= ds;
    if (KEYPRESSES.has("ArrowRight")) MOUSE_SCREEN_POS[0] += ds;

    // if (TARGETING_STAMINA <= 0 && SLOW_TIME)
    // {
    //     SLOW_TIME = false;
    //     TARGETING_LOCKOUT = true;
    // }
}
