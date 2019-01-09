
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

for (let i = 0; i < NUM_ROWS; ++i)
{
    let row = [];
    for (let j = 0; j < NUM_COLS; ++j)
    {
        row.push(Math.random() < 0.35);
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

function randomize()
{
    for (let i = 0; i < GAME_BOARD.length; ++i)
    {
        for (let j = 0; j < GAME_BOARD[i].length; ++j)
        {
            GAME_BOARD[i][j] = Math.random() < 0.3;
        }
    }
}

function propogateGameOfLife(gameBoard)
{
    let newBoard = [];

    for (let i = 0; i < gameBoard.length; ++i)
    {
        let newRow = [];
        for (let j = 0; j < gameBoard[i].length; ++j)
        {
            let neighbors = 0;
            for (let r = i - 1; r < i + 2; ++r)
            {
                for (let c = j - 1; c < j + 2; ++c)
                {
                    if (r == i && c == j) continue;

                    let rw = modWrap(r, gameBoard.length);
                    let cw = modWrap(c, gameBoard[rw].length);
                    if (gameBoard[rw][cw]) ++neighbors;
                }
            }
            if (gameBoard[i][j] && neighbors < 2)
                newRow.push(0);
            else if (gameBoard[i][j] && neighbors > 3)
                newRow.push(0);
            else if (gameBoard[i][j] && neighbors > 1)
                newRow.push(1);
            else if (!gameBoard[i][j] && neighbors == 3)
                newRow.push(1);
            else
                newRow.push(gameBoard[i][j]);
        }
        newBoard.push(newRow);
    }
    return newBoard;
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

    ctx.fillStyle = "black";
    for (let i = 0; i < GAME_BOARD.length; ++i)
    {
        for (let j = 0; j < GAME_BOARD[i].length; ++j)
        {
            ctx.globalAlpha = 0.1;
            ctx.strokeStyle = "grey";
            ctx.strokeRect(j*width, i*height, width, height);
            ctx.globalAlpha = GAME_BOARD[i][j];
            if (ctx.globalAlpha > 0)
            {
                ctx.fillRect(j*width, i*height, width, height);
            }
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

    if (PAUSED)
    {
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = "black";
        ctx.fillRect(20, 20, 10, 40);
        ctx.fillRect(40, 20, 10, 40);
    }
}

function start()
{
    setTimeout(function()
    {
        CURRENT = new Date().getTime();
        draw();
        if (!PAUSED && (frames % 3) == 0)
        {
            GAME_BOARD = propogateGameOfLife(GAME_BOARD, false);
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
