
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

lastVertex = null;
trace = null;

canvas.onmousemove = function(e)
{
    var rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
}

canvas.onmousedown = function(e)
{
    let newVertex = new Vertex(mx, my);
    mold.traverseVertices(function(v)
    {
        for (let nearby of mold.kNearest(newVertex, 3))
        {
            newVertex.addNeighbor(nearby, 1);
        }
    });
    mold.addVertex(newVertex);
    lastVertex = newVertex;

    if (lastVertex != null);
        trace = astar(mold.root, newVertex);
}

function draw()
{
    var fps = 50;
    setTimeout(function()
    {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.canvas.width = document.body.clientWidth;
        ctx.canvas.height = document.body.scrollHeight;
        width = ctx.canvas.width;
        height = ctx.canvas.height;
        requestAnimationFrame(draw);

        mold.draw(ctx);
        if (trace != null) drawTrace(ctx, trace);

    }, 1000/fps);
}

let width = document.body.clientWidth;
let height = document.body.scrollHeight;
let mx = width/2, my = height/2;

let vertices = [];
let num = Math.random()*10 + 10;
let mold = new Graph();

draw();

for (let i = 0; i < 12; ++i)
{
    let newVertex = new Vertex(Math.random()*width*7/8 + width/16,
                               Math.random()*height*7/8 + height/16);
    for (let nearby of mold.kNearest(newVertex, 2))
    {
        newVertex.addNeighbor(nearby, 1);
    }
    mold.addVertex(newVertex);
    lastVertex = newVertex;
}
