function getRandomColor()
{
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++)
    {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

color_palette = ["Blue", "Red", "Yellow", "Green",
                 "Orange", "Olive", "Purple", "Fuchsia",
                 "Lime", "Teal", "Aqua", "Maroon", "Navy"];

function str2color(str)
{
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }    
    var hex = ((hash>>24)&0xFF) + ((hash>>16)&0xFF) +
              ((hash>>8)&0xFF) + (hash&0xFF);
    var index = hex % color_palette.length;
    return color_palette[index];
}

function getColors(ballots)
{
    var colors = {};
    var count = 0;
    ballots.forEach(function(b)
    {
        for (var c in b.candidates)
        {
            if (typeof colors[b.candidates[c].toLowerCase()] === 'undefined')
            {
                colors[b.candidates[c]] = color_palette[count];
                count = (count + 1) % color_palette.length;
            }
        }
    });
    return colors;
}

function clickGetWinner()
{
    elem = document.getElementById('winner');
    if (ballot_box.length)
    {
        var winner = getRunoffWinner(ballot_box)
        document.getElementById("winner")
            .parentElement.style.display = "inline-block";
        elem.innerHTML = 
        "<h3>The winner is " + winner + "!</h3>";
    }
}

function clickClear()
{
    document.getElementById("winner")
        .parentElement.style.display = "none";
    document.getElementById("candidates")
        .parentElement.style.display = "none";
    ballot_box = [];
    document.getElementById('winner').innerHTML = "";
    document.getElementById('candidates').innerHTML = "";
}

function clickAddBallot()
{
    var x = document.getElementById('input');
    var text = x.elements[0].value;
    var count = parseInt(x.elements[1].value);

    if (isNaN(count)) count = 1;
    
    if (text != "")
    {
        for (var i = 0; i < count; ++i)
        {
            addBallot(Ballot.fromString(text));
        }
    }
}

function addBallot(ballot)
{
    document.getElementById("candidates")
        .parentElement.style.display = "inline-block";
    ballot_box.push(ballot);
    makeBalls(ballot_box, width, height);
    colors = getColors(ballot_box);
    var cand = document.getElementById('candidates');
    cand.innerHTML = "";
    for (var c in colors)
    {
        cand.innerHTML +=
            "<p style='" + 
            "font-size: 24px; " +
            "margin: 10px 0; " +
            "padding: 0 0 0 15px; " + 
            "border-left: 24px solid " + colors[c] + "'>" +
            c + "</p>";
    }
}

function drawBallot(ballot, canvas)
{
    var ctx = canvas.getContext("2d");
    ctx.beginPath();

    var arclength = 2*Math.PI/ballot.candidates.length;

    for (var i = 0; i < ballot.candidates.length; ++i)
    {
        ctx.beginPath();
        ctx.arc(ballot.ball.x, ballot.ball.y, ballot.weight*30,
            ballot.ball.theta+(arclength*i),
            ballot.ball.theta+(arclength*(i+1)));
        if (ballot.candidates.length > 1)
            ctx.lineTo(ballot.ball.x, ballot.ball.y);
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = colors[ballot.candidates[i]];
        ctx.fill();
    }
    for (var i = 0; i < ballot.candidates.length; ++i)
    {
        ctx.beginPath();
        ctx.arc(ballot.ball.x, ballot.ball.y, ballot.weight*30,
            ballot.ball.theta+(arclength*i),
            ballot.ball.theta+(arclength*(i+1)));
        if (ballot.candidates.length > 1)
            ctx.lineTo(ballot.ball.x, ballot.ball.y);
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

function makeBalls(ballots, width, height)
{
    ballots.forEach(function(b)
    {
        if (typeof b.ball === 'undefined')
        {
            b.ball = new Ball(Math.random()*3*width/4 + width/8,
                              Math.random()*3*height/4 + height/8,
                              Math.random()*500 - 250,
                              Math.random()*500 - 250);
        }
    });
}

function draw(width, height)
{
    setTimeout(function(width, height)
    {
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.canvas.width = document.body.clientWidth;
        ctx.canvas.height = document.body.scrollHeight;
        width = ctx.canvas.width;
        height = ctx.canvas.height;
        requestAnimationFrame(draw);
        ballot_box.forEach(function(b)
        {
            b.ball.r = b.weight*30;
            b.ball.kinematics(1/fps, width, height);
            drawBallot(b, canvas);
        });
    }, 1000/fps);
}

var fps = 50;
var width = document.body.clientWidth;
var height = document.body.clientHeight;
var canvas = document.getElementById("canvas");
var ballot_box = [];

sitecode = document.URL.split("#")[1];

if (sitecode == "load")
{
    for (i = 0; i < 15; i++)
    {
        addBallot(new Ballot("Asparagus", "Beans", "Corn", "Dill"));
    }
    for (i = 0; i < 12; i++)
    {
        addBallot(new Ballot("Beans", "Asparagus", "Corn", "Dill"));
    }
    for (i = 0; i < 11; i++)
    {
        addBallot(new Ballot("Dill", "Beans", "Asparagus"));
    }
    for (i = 0; i < 8; i++)
    {
        addBallot(new Ballot("Beans"));
    }
}

colors = getColors(ballot_box);
makeBalls(ballot_box, width, height);
draw(width, height);
clickAddBallot();