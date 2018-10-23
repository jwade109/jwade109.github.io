function astarID(startID, goalID, graph)
{
    let start = null, goal = null;
    graph.traverseVertices(function(v)
    {
        if (v.id == startID) start = v;
        else if (v.id == goalID) goal = v;
    })
    if (start == null || goal == null) return;
    return astar(start, goal);
}

function astar(start, goal)
{
    function heuristicScore(vertex)
    {
        return distance(vertex, goal);
    }

    function distance(v1, v2)
    {
        let dx = v1.x - v2.x;
        let dy = v1.y - v2.y;
        return Math.sqrt(dx*dx + dy*dy);
    }

    function buildTrace(trace, current)
    {
        let path = [current];
        while (trace.has(current))
        {
            current = trace.get(current);
            path.push(current);
        }
        return path;
    }

    let closedSet = [], openSet = [start];
    let gscore = new Map(), fscore = new Map(), trace = new Map();
    gscore.set(start, 0);
    fscore.set(start, heuristicScore(start));

    while (openSet.length > 0)
    {
        openSet.sort(function(a, b)
        {
            return fscore.get(a) - fscore.get(b);
        });

        let current = openSet[0];
        if (current === goal) return buildTrace(trace, current);

        if (typeof fscore.get(current) == "undefined")
            fscore.set(current, Infinity);
        if (typeof gscore.get(current) == "undefined")
            gscore.set(current, Infinity);

        openSet.splice(0, 1);
        closedSet.push(current);

        for (let neighbor of current.neighbors())
        {
            if (closedSet.includes(neighbor)) continue;

            if (typeof fscore.get(neighbor) == "undefined")
                fscore.set(neighbor, Infinity);
            if (typeof gscore.get(neighbor) == "undefined")
                gscore.set(neighbor, Infinity);

            let tentgScore = gscore.get(current) + distance(current, neighbor)

            if (!openSet.includes(neighbor)) openSet.push(neighbor);
            else if (tentgScore >= gscore.get(neighbor)) continue;

            trace.set(neighbor, current);
            gscore.set(neighbor, tentgScore);
            fscore.set(neighbor, tentgScore + heuristicScore(neighbor));
        }
    }
    return buildTrace(trace, current);
}

function drawTrace(ctx, trace)
{
    ctx.strokeStyle = "blue";
    ctx.globalAlpha = 1;
    ctx.beginPath();
    for (let vertex of trace)
    {
        ctx.lineTo(vertex.x, vertex.y);
    }
    ctx.stroke();
}
