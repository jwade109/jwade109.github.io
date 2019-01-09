
const CANVAS = document.getElementById("canvas");
const CTX = CANVAS.getContext("2d");

var CURRENT, LAST = CURRENT, DT;
var WIDTH, HEIGHT;
var MOUSE_SCREEN_POS = [0, 0];

let GAME_BOARD = [];
const NUM_ROWS = 35, NUM_COLS = 50;

for (let i = 0; i < NUM_ROWS; ++i)
{
    let row = [];
    for (let j = 0; j < NUM_COLS; ++j)
    {
        row.push(Math.round(Math.random()));
    }
    GAME_BOARD.push(row);
}

start();

document.addEventListener('keydown', function(event)
{
    let str = "";
    switch (event.keyCode)
    {
        case 13: propogateGameOfLife(GAME_BOARD, false);
                 break;
    }
});

document.addEventListener('mousemove', function(event)
{
    MOUSE_SCREEN_POS = [event.clientX, event.clientY];
});


function propogateGameOfLife(gameBoard, wrapAround)
{
    // Any live cell with fewer than two live neighbors dies
    // Any live cell with two or three live neighbors lives
    // Any live cell with more than three live neighbors dies
    // Any dead cell with exactly three live neighbors becomes a live cell

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
                    if (r > -1 && r < gameBoard.length &&
                        c > -1 && c < gameBoard[r].length)
                    {
                        if (r == i && c == j) continue;
                        if (gameBoard[r][c]) ++neighbors;
                    }
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
    CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);
    CTX.canvas.width = document.body.clientWidth;
    CTX.canvas.height = document.body.scrollHeight;
    WIDTH = CTX.canvas.width;
    HEIGHT = CTX.canvas.height;

    CTX.fillStyle = "black";
    let width = 20;
    for (let i = 0; i < GAME_BOARD.length; ++i)
    {
        for (let j = 0; j < GAME_BOARD[i].length; ++j)
        {
            CTX.globalAlpha = GAME_BOARD[i][j];
            if (CTX.globalAlpha > 0)
            {
                CTX.fillRect(100 + j*width, 100 + i*width, width, width);
            }
        }
    }

    CTX.globalAlpha = 1;
    CTX.fillRect(MOUSE_SCREEN_POS[0] - 1, MOUSE_SCREEN_POS[1] - 1, 2, 2);
}

function start()
{
    setTimeout(function()
    {
        CURRENT = new Date().getTime();
        draw();
        GAME_BOARD = propogateGameOfLife(GAME_BOARD, false);
        requestAnimationFrame(start);
        DT = (CURRENT - LAST)/1000;
        LAST = CURRENT;
    }, 1000/20);
}
