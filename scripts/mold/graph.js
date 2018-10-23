var newID = 0;

class Vertex
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
        this.edges = [];
        this.id = newID++;
    }

    addNeighbor(vertex, weight)
    {
        let edge = new Edge(this, vertex, weight);
        if (!this.edges.includes(edge))
            this.edges.push(edge);
        if (!vertex.edges.includes(edge))
            vertex.edges.push(edge);
    }

    removeNeighbor(vertex)
    {
        for (let edge of this.edges)
        {
            if (edge.contains(vertex))
            {
                let index = this.edges.indexOf(edge);
                this.edges.splice(index, 1);
                break;
            }
        }
        for (let edge of vertex.edges)
        {
            if (edge.contains(vertex))
            {
                let index = vertex.edges.indexOf(edge);
                vertex.edges.splice(index, 1);
                break;
            }
        }
    }

    distanceTo(vertex)
    {
        let dx = vertex.x - this.x;
        let dy = vertex.y - this.y;
        return Math.sqrt(dx*dx + dy*dy);
    }

    neighbors()
    {
        let neighbors = [];
        for (let edge of this.edges)
        {
            if (edge.v1 !== this) neighbors.push(edge.v1);
            else neighbors.push(edge.v2);
        }
        return neighbors;
    }
}

class Edge
{
    constructor(v1, v2, weight)
    {
        this.v1 = v1;
        this.v2 = v2;
        this.weight = weight;
    }

    contains(vertex)
    {
        return this.v1 == this.vertex || this.v2 == this.vertex;
    }

    equals(other)
    {
        return (this.v1 === other.v1 && this.v2 === other.v2) ||
               (this.v1 === other.v2 && this.v2 === other.v1);
    }
}

class Graph
{
    constructor()
    {
        this.root = null;
    }

    drawVertices(ctx)
    {
        ctx.globalAlpha = 1;
        let root = this.root;
        this.traverseVertices(function(v)
        {
            ctx.fillStyle = "black";
            if (v === root) ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(v.x, v.y, 3, 0, Math.PI*2);
            ctx.fill();
            ctx.fillText(v.id, v.x + 8, v.y);
        });
    }

    drawEdges(ctx)
    {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "lightgray";
        this.traverseEdges(function(e)
        {
            ctx.beginPath();
            ctx.moveTo(e.v1.x, e.v1.y);
            ctx.lineTo(e.v2.x, e.v2.y);
            ctx.stroke();
        });
    }

    draw(ctx)
    {
        this.drawEdges(ctx);
        this.drawVertices(ctx);
    }

    addVertex(vertex)
    {
        if (this.root == null) this.root = vertex;
    }

    traverseVertices(func)
    {
        let closedSet = [];
        function recurse(vertex)
        {
            if (vertex == null) return;
            if (closedSet.includes(vertex)) return;
            closedSet.push(vertex);
            func(vertex);
            for (let edge of vertex.edges)
            {
                recurse(edge.v1);
                recurse(edge.v2);
            }
        }
        recurse(this.root);
    }

    traverseEdges(func)
    {
        if (this.root == null) return;
        let closedSet = [];
        function recurse(edge)
        {
            if (closedSet.includes(edge)) return;
            closedSet.push(edge);
            func(edge);
            for (let e of edge.v1.edges)
            {
                recurse(e);
            }
            for (let e of edge.v2.edges)
            {
                recurse(e);
            }
        }
        for (let edge of this.root.edges)
            recurse(edge);
    }

    getVertex(id)
    {
        let ret = null;
        this.traverseVertices(function(v)
        {
            if (v.id == id) ret = v;
        })
        return ret;
    }

    kNearest(vertex, k)
    {
        let nearest = [];
        this.traverseVertices(function(v)
        {
            if (v !== vertex) nearest.push(v);
            nearest.sort(function(v1, v2)
            {
                let dx1 = v1.x - vertex.x;
                let dy1 = v1.y - vertex.y;
                let dx2 = v2.x - vertex.x;
                let dy2 = v2.y - vertex.y;
                return (dx1*dx1 + dy1*dy1) - (dx2*dx2 + dy2*dy2);
            });
            nearest = nearest.splice(0, k);
        })
        return nearest;
    }
}
