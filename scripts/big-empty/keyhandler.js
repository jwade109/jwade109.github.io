
var KEYPRESSES = new Map();

let ON_PRESS = new Map();
let ON_HOLD = new Map();
let ON_RELEASE = new Map();

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
    if (window.pageYOffset == 0) event.preventDefault();
    else return;
    handle(event.button, true);
});

document.addEventListener('mouseup', function(event)
{
    if (window.pageYOffset == 0) event.preventDefault();
    handle(event.button, false);
});

document.addEventListener('keydown', function(event)
{
    if (window.pageYOffset == 0) event.preventDefault();
    else return;
    if (event.repeat) return;
    handle(event.keyCode, true);
});

document.addEventListener('keyup', function(event)
{
    if (window.pageYOffset == 0) event.preventDefault();
    if (event.repeat) return;
    handle(event.keyCode, false);
});

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

function handle(code, state)
{
    console.log("Key", code, "state", state);
    if (state && !KEYPRESSES.has(code))
    {
        KEYPRESSES.set(code, Date.now());
        onPress(code);
    }
    else
    {
        let dur = 0;
        if (KEYPRESSES.has(code))
            dur = Date.now() - KEYPRESSES.get(code);
        KEYPRESSES.delete(code);
        onRelease(code, dur);
    }
}

function onPress(code)
{
    if (ON_PRESS.has(code))
        ON_PRESS.get(code)();
}

function onRelease(code, duration)
{
    if (ON_RELEASE.has(code))
        ON_RELEASE.get(code)(duration);
}

function processInput()
{
    for (let key of ON_HOLD)
    {
        if (KEYPRESSES.has(key[0]))
            key[1](Date.now() - KEYPRESSES.get(key[0]));
    }
}

// KEY HANDLER DEFINITIONS

ON_PRESS.set(2, function() // right click
{
    if (TARGET_OBJECT != NEAREST_OBJECT)
        TARGET_OBJECT = NEAREST_OBJECT;
    else
        TARGET_OBJECT = null;
})

ON_PRESS.set(27, function() // escape
{
    GAME_PAUSED = !GAME_PAUSED;
});

ON_PRESS.set(32, function() // space bar
{
    if (GAME_OVER) initialize();
});

ON_PRESS.set(69, function() // e
{
    if (!TARGETING_LOCKOUT) SLOW_TIME = !SLOW_TIME;
});

ON_PRESS.set(84, function() // t
{
    if (TARGET_OBJECT != null && TARGET_OBJECT != CAMERA_TRACK_TARGET)
        CAMERA_TRACK_TARGET = TARGET_OBJECT;
    else
        CAMERA_TRACK_TARGET = PLAYER_SHIP;
});

ON_PRESS.set(90, function() { takeControl(TARGET_OBJECT); }); // z

ON_PRESS.set(75, function() // k
{
    if (GAME_PAUSED) physics(SLOW_DT);
    else if (BETWEEN_WAVES) RESPAWN_TIMER = 0;
});

ON_PRESS.set(51, function() { respawn(0); }); // 3
ON_PRESS.set(52, function() { respawn(1); });
ON_PRESS.set(53, function() { respawn(2); });
ON_PRESS.set(54, function() { respawn(3); }); // 6
ON_PRESS.set(55, function() { respawn(4); });
ON_PRESS.set(56, function() { respawn(5); });
ON_PRESS.set(57, function() // 9
{
    if (PLAYER_SHIP.faction.name == "MCRN")
        PLAYER_SHIP.faction = UNN;
    else if (PLAYER_SHIP.faction.name == "UNN")
        PLAYER_SHIP.faction = MCRN;
});

ON_PRESS.set(66, function() // b
{
    DRAW_FIRING_ARC = !DRAW_FIRING_ARC;
    let str = DRAW_FIRING_ARC ? "enabled." : "disabled."
    throwAlert("DRAW_FIRING_ARC " + str, ALERT_DISPLAY_TIME);
});

ON_PRESS.set(72, function() // h
{
    DRAW_ACCEL = !DRAW_ACCEL;
    let str = DRAW_ACCEL ? "enabled." : "disabled."
    throwAlert("DRAW_ACCEL " + str, ALERT_DISPLAY_TIME);
});

ON_PRESS.set(73, function() // i
{
    PLAYER_INVINCIBLE = !PLAYER_INVINCIBLE;
    let str = PLAYER_INVINCIBLE ? "enabled." : "disabled."
    throwAlert("PLAYER_INVINCIBLE " + str, ALERT_DISPLAY_TIME);
});

ON_PRESS.set(74, function() // j
{
    if (GAME_PAUSED) physics(-SLOW_DT);
});

ON_PRESS.set(76, function() // l
{
    DRAW_TORPEDO_TUBES = !DRAW_TORPEDO_TUBES;
    let str = DRAW_TORPEDO_TUBES ? "enabled." : "disabled."
    throwAlert("DRAW_TORPEDO_TUBES " + str, ALERT_DISPLAY_TIME);
});

ON_PRESS.set("M".charCodeAt(0), function() // m
{
    MUSIC_MUTED = !MUSIC_MUTED;
    let str = MUSIC_MUTED ? "muted." : "unmuted."
    throwAlert("Music " + str, ALERT_DISPLAY_TIME);
});

ON_PRESS.set("R".charCodeAt(0), function() // r
{
    DRAW_TRACE = !DRAW_TRACE;
    let str = DRAW_TRACE ? "enabled." : "disabled."
    throwAlert("DRAW_TRACE " + str, ALERT_DISPLAY_TIME);
});

ON_PRESS.set("N".charCodeAt(0), function() // n
{
    DRAW_HITBOX = !DRAW_HITBOX;
    let str = DRAW_HITBOX ? "enabled." : "disabled."
    throwAlert("DRAW_HITBOX " + str, ALERT_DISPLAY_TIME);
});

ON_PRESS.set(79, function() { --CURRENT_WAVE; }); // o
ON_PRESS.set(80, function() { ++CURRENT_WAVE; }); // p

ON_PRESS.set(85, function() // u
{
    SHOW_ALL_ALERTS = !SHOW_ALL_ALERTS;
    let str = SHOW_ALL_ALERTS ? "enabled." : "disabled."
    throwAlert("SHOW_ALL_ALERTS " + str, ALERT_DISPLAY_TIME);
});

ON_PRESS.set(86, function() // v
{
    LOCK_CAMERA = !LOCK_CAMERA;
    let str = LOCK_CAMERA ? "enabled." : "disabled."
    throwAlert("LOCK_CAMERA " + str, ALERT_DISPLAY_TIME);
});

ON_PRESS.set(89, function() // y
{
    SHOW_BEHAVIORS = !SHOW_BEHAVIORS;
    let str = SHOW_BEHAVIORS ? "enabled." : "disabled."
    throwAlert("SHOW_BEHAVIORS " + str, ALERT_DISPLAY_TIME);
});
