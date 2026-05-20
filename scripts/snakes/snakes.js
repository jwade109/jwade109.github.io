
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.canvas.width = document.body.clientWidth;
ctx.canvas.height = document.body.clientHeight;
var WIDTH = ctx.canvas.width;
var HEIGHT = ctx.canvas.height;

var CURRENT, LAST = CURRENT, DT;
var MOUSE_SCREEN_POS = [0, 0];
var MOUSE_BOARD_INDEX = [-1, -1];
var PAUSED = false;

let GAME_BOARD = [];
const SQUARE_WIDTH = 15;
const NUM_ROWS = Math.round(HEIGHT/SQUARE_WIDTH);
const NUM_COLS = Math.round(WIDTH/SQUARE_WIDTH);
var DRAWING = -1;

let SNAKES = [
    new Snake([5, 5], 7, "red"),
    new Snake([30, 21], 9, "blue"),
    new Snake([9, 3], 7, "red"),
    new Snake([13, 32], 12, "purple"),
    new Snake([40, 60], 16, "green"),
    new Snake([50, 50], 13, "orange"),
    new Snake([10, 80], 8, "teal"),
];

function Snake(initial_point, n_points, color)
{
    this.points = [];
    for (let n = 0; n < n_points; n++)
    {
        this.points.push(initial_point);
    }

    this.color = color;
}

Snake.prototype.head = function()
{
    return this.points[0];
}

Snake.prototype.go_to = function(p)
{
    // check for self intersection
    let s = sub2d(p, this.points[1]);
    if (s[0] == 0 && s[1] == 0)
    {
        return;
    }
    this.points.unshift(p);
    this.points.pop();
}

Snake.prototype.go_left = function()
{
    let head = this.head();
    let front = add2d(head, [0, -1]);
    this.go_to(front);
}

Snake.prototype.go_right = function()
{
    let head = this.head();
    let front = add2d(head, [0, 1]);
    this.go_to(front);
}

Snake.prototype.go_down = function()
{
    let head = this.head();
    let front = add2d(head, [1, 0]);
    this.go_to(front);
}

Snake.prototype.go_up = function()
{
    let head = this.head();
    let front = add2d(head, [-1, 0]);
    this.go_to(front);
}

for (let i = 0; i < NUM_ROWS; ++i)
{
    let row = [];
    for (let j = 0; j < NUM_COLS; ++j)
    {
        row.push(0);
    }
    GAME_BOARD.push(row);
}

let frames = 0, iters = 0;

start();

document.addEventListener('mousemove', function(event)
{
    var box = canvas.getBoundingClientRect();
    MOUSE_SCREEN_POS = [event.clientX - box.left, event.clientY - box.top];
    let width = WIDTH/NUM_COLS;
    let height = HEIGHT/NUM_ROWS;
    MOUSE_BOARD_INDEX[1] =
        Math.floor(MOUSE_SCREEN_POS[0]/width);
    MOUSE_BOARD_INDEX[0] =
        Math.floor(MOUSE_SCREEN_POS[1]/height);
});

document.addEventListener('mousedown', function(event)
{
    switch (event.button)
    {
        case 0:
            if (MOUSE_BOARD_INDEX[0] < GAME_BOARD.length &&
                MOUSE_BOARD_INDEX[1] < GAME_BOARD[MOUSE_BOARD_INDEX[0]].length)
                DRAWING = !GAME_BOARD[MOUSE_BOARD_INDEX[0]]
                    [MOUSE_BOARD_INDEX[1]];
    }
});

document.addEventListener('mouseup', function(event)
{
    switch (event.button)
    {
        case 0: DRAWING = -1;
    }
});


document.addEventListener('keypress', function(event)
{
    console.log(event);

    for (let snake of SNAKES)
    {
        switch (event.code)
        {
            case "KeyD": snake.go_right(); break;
            case "KeyW": snake.go_up();    break;
            case "KeyA": snake.go_left();  break;
            case "KeyS": snake.go_down();  break;
        }
    }
});

function modWrap(x, y)
{
    while (x < 0) x += y;
    return x % y;
}

function clearBoard()
{
    for (let i = 0; i < GAME_BOARD.length; ++i)
    {
        for (let j = 0; j < GAME_BOARD[i].length; ++j)
        {
            GAME_BOARD[i][j] = 0;
        }
    }
}

function step_board()
{
    for (let snake of SNAKES)
    {
        if (Math.random() < 0.5)
        {
            if (Math.random() < 0.5)
            {
                snake.go_left();
            }
            else
            {
                snake.go_right();
            }
        }
        else
        {
            if (Math.random() < 0.5)
            {
                snake.go_down();
            }
            else
            {
                snake.go_up();
            }
        }
    }
}

function draw()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.canvas.width = document.body.clientWidth;
    ctx.canvas.height = document.body.clientHeight - 70;
    WIDTH = ctx.canvas.width;
    HEIGHT = ctx.canvas.height;

    let width = WIDTH/NUM_COLS;
    let height = HEIGHT/NUM_ROWS;

    for (let snake of SNAKES)
    {
        for (let i in snake.points)
        {
            let [x, y] = snake.points[i];

            let s = 1 - i / snake.points.length;

            let sw = width * s;
            let sh = height * s;

            ctx.fillStyle = snake.color;
            ctx.fillRect(y * width + width / 2 - sw / 2, x * height + height / 2 - sh / 2, sw, sw);
            ctx.strokeRect(y * width, x * height, width, height);
        }
    }

    ctx.globalAlpha = 1;
    ctx.fillRect(MOUSE_SCREEN_POS[0] - 1, MOUSE_SCREEN_POS[1] - 1, 2, 2);
    if (MOUSE_BOARD_INDEX[0] > -1 && MOUSE_BOARD_INDEX[1] > -1 &&
        MOUSE_BOARD_INDEX[0] < GAME_BOARD.length &&
        MOUSE_BOARD_INDEX[1] < GAME_BOARD[MOUSE_BOARD_INDEX[0]].length)
    {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(MOUSE_BOARD_INDEX[1]*width,
            MOUSE_BOARD_INDEX[0]*height, width, height);
    }

    // if (PAUSED)
    // {
    //     ctx.globalAlpha = 0.7;
    //     ctx.fillStyle = "black";
    //     ctx.fillRect(20, 20, 10, 40);
    //     ctx.fillRect(40, 20, 10, 40);
    // }
}

function start()
{
    setTimeout(function()
    {
        CURRENT = new Date().getTime();
        draw();
        if (!PAUSED && (frames % 3) == 0)
        {
            step_board();
            ++iters;
        }
        requestAnimationFrame(start);
        DT = (CURRENT - LAST)/1000;
        LAST = CURRENT;

        if (DRAWING > -1)
            GAME_BOARD[MOUSE_BOARD_INDEX[0]]
                [MOUSE_BOARD_INDEX[1]] = DRAWING;
        ++frames;

    }, 1000/60);
}
