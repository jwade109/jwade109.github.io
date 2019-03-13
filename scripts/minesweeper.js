
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.canvas.width = document.body.clientWidth;
ctx.canvas.height = document.body.clientHeight;
var WIDTH = ctx.canvas.width;
var HEIGHT = ctx.canvas.height;

var CURRENT, LAST = CURRENT, DT;
var MOUSE_SCREEN_POS = [0, 0];
var MOUSE_BOARD_INDEX = [-1, -1];

let GAME_BOARD;
const SQUARE_WIDTH = 35;
const NUM_ROWS = Math.round(HEIGHT/SQUARE_WIDTH);
const NUM_COLS = Math.round(WIDTH/SQUARE_WIDTH);

restart();
start();

canvas.oncontextmenu = function(e)
{
    e.preventDefault();
};

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
    event.preventDefault();
    event.stopPropagation();
    switch (event.button)
    {
        case 0: floodReveal(MOUSE_BOARD_INDEX[1], MOUSE_BOARD_INDEX[0]);
                break;
        case 2: GAME_BOARD[MOUSE_BOARD_INDEX[1]]
            [MOUSE_BOARD_INDEX[0]].flagged =
                !GAME_BOARD[MOUSE_BOARD_INDEX[1]]
                [MOUSE_BOARD_INDEX[0]].flagged;
    }
});

function restart()
{
    GAME_BOARD = [];
    for (let i = 0; i < NUM_COLS; ++i)
    {
        let row = [];
        for (let j = 0; j < NUM_ROWS; ++j)
        {
            row.push({ revealed: false, neighbors: 0,
              isBomb: Math.random() < 0.15, flagged: false });
        }
        GAME_BOARD.push(row);
    }

    for (let i = 0; i < GAME_BOARD.length; ++i)
    {
        for (let j = 0; j < GAME_BOARD[i].length; ++j)
        {
            let neighbors = 0;
            for (let r = i - 1; r <= i + 1; ++r)
            {
                for (let c = j - 1; c <= j + 1; ++c)
                {
                    if (r == i && c == j) continue;
                    if (r < 0 || c < 0) continue;
                    if (r >= GAME_BOARD.length || c >= GAME_BOARD[r].length)
                        continue;
                    if (GAME_BOARD[r][c].isBomb)
                        neighbors++;
                }
            }
            GAME_BOARD[i][j].neighbors = neighbors;
        }
    }
}

function floodReveal(i, j)
{
    if (i < 0 || j < 0) return;
    if (i >= GAME_BOARD.length || j >= GAME_BOARD[i].length) return;

    if (GAME_BOARD[i][j].revealed ||
        GAME_BOARD[i][j].neighbors != 0 ||
        GAME_BOARD[i][j].isBomb)
    {
        GAME_BOARD[i][j].revealed = true;
        return;
    }

    GAME_BOARD[i][j].revealed = true;

    floodReveal(i - 1, j);
    floodReveal(i + 1, j);
    floodReveal(i, j - 1);
    floodReveal(i, j + 1);
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
    ctx.strokeStyle = "gray";
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
    for (let i = 0; i < GAME_BOARD.length; ++i)
    {
        for (let j = 0; j < GAME_BOARD[i].length; ++j)
        {
            ctx.globalAlpha = 1;

            if (GAME_BOARD[i][j].isBomb)
            {
                ctx.fillStyle = "black";
                ctx.beginPath();
                ctx.arc((i + 0.5)*width, (j + 0.5)*height,
                    (width + height)/8, 0, Math.PI*2);
                ctx.fill();
            }
            else
            {
                ctx.globalAlpha = 1;
                ctx.fillStyle = "black";
                ctx.textAlign = "center";
                ctx.font = "20px Helvetica";
                ctx.fillText(GAME_BOARD[i][j].neighbors,
                    (i+0.5)*width, (j+0.75)*height);
            }

            if (!GAME_BOARD[i][j].revealed)
            {
                ctx.globalAlpha = 1;
                ctx.fillStyle = "gray";
                ctx.fillRect(i*width, j*height, width, height);
                if (GAME_BOARD[i][j].flagged)
                {
                    ctx.fillStyle = "red";
                    ctx.beginPath();
                    ctx.arc((i + 0.5)*width, (j + 0.5)*height,
                        (width + height)/16, 0, Math.PI*2);
                    ctx.fill();
                }
            }

            ctx.globalAlpha = 1;
            ctx.strokeStyle = "lightgray";
            ctx.strokeRect(i*width, j*height, width, height);
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

}

function start()
{
    setTimeout(function()
    {
        CURRENT = new Date().getTime();
        draw();
        requestAnimationFrame(start);
        DT = (CURRENT - LAST)/1000;
        LAST = CURRENT;

    }, 1000/100);
}
