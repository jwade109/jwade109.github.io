class Ballot
{
    constructor(...candidates)
    {
        this.candidates = candidates;
        this.weight = 1;
    }

    remove(candidate)
    {
        var index = this.candidates.indexOf(candidate);
        if (index > -1)
        {
            this.candidates.splice(index, 1);
            return true;
        }
        return false;
    }

    copy()
    {
        var b = new Ballot(...this.candidates);
        b.weight = this.weight;
        return b;
    }

    toString()
    {
        var text = "";
        for (var i = 0; i < this.candidates.length; ++i)
        {
            text += (i+1) + ": '" + this.candidates[i] + "' ";
        }
        return text + "(" + this.weight + ")";
    }

    static fromString(string)
    {
        return new Ballot(...string.split(", "));
    }
}

function getFptpWinner(ballots)
{
    var candidates = {};
    var max_votes = 0;
    var top_candidate;
    ballots.forEach(function(v)
    {
        if (v.candidates.length > 0)
        {
            var c = v.candidates[0];
            if (isNaN(candidates[c]))
                candidates[c] = 1;
            else
                candidates[c]++;
            if (candidates[c] > max_votes)
            {
                max_votes = candidates[c];
                top_candidate = c;
            }
        }
    });
    return top_candidate;
}

function getRunoffWinner(ballots, seats, quota)
{
    var ballots = cleanBallots(ballots);
    print(ballots);
    if (typeof seats === 'undefined')
        seats = 1;
    if (typeof quota === 'undefined')
        quota = ballots.length/(seats + 1) + 1;
    console.log("quota is " + quota);
    if (seats == 0 || quota == 0) return [];

    var candidates = [];
    ballots.forEach(function(b)
    {
        b.candidates.forEach(function(c)
        {
            if (candidates.indexOf(c) == -1)
            {
                candidates.push(c);
            }
        });
    });

    console.log(candidates.length + " " + seats);
    if (candidates.length <= seats)
        return candidates;
    var tally = tallyTopLevel(ballots);
    var max = -1, min = quota, best, worst;

    for (var c in tally)
    {
        if (tally[c] > max)
        {
            best = c;
            max = tally[c];
        }
        if (tally[c] < min)
        {
            worst = c;
            min = tally[c];
        }
    }

    var winners = [];
    if (max >= quota)
    {
        console.log(best + " wins!");
        winners.push(best);
        var new_ballots = removeCandidate(ballots, best, quota);
        winners.push(...getRunoffWinner(new_ballots, seats - 1, quota));
        return winners;
    }
    console.log(worst + " will be eliminated");
    var new_ballots = removeCandidate(ballots, worst, 0);
    winners.push(...getRunoffWinner(new_ballots, seats, quota));
    return winners;
}

function tallyTopLevel(ballots)
{
    var tally = {};
    cleanBallots(ballots).forEach(function(b)
    {
        if (isNaN(tally[b.candidates[0]]))
            tally[b.candidates[0]] = 1;
        else
            ++tally[b.candidates[0]];
    });
    return tally;
}

function getBallotsWhere(ballots, func)
{
    ret = [];
    ballots.forEach(function(b)
    {
        if (func(b)) ret.push(b.copy());
    });
    return ret;
}

function removeCandidate(ballots, toRemove, quota)
{
    var count = 0;
    var new_ballots = [];
    ballots.forEach(function(b)
    {
        if (b.candidates[0] == toRemove) count++;
        new_ballots.push(b.copy());
    });
    new_ballots.forEach(function(b)
    {
        if (b.candidates[0] == toRemove)
            b.weight *= (count - quota)/count;
        while (b.remove(toRemove));
    });
    return cleanBallots(new_ballots);
}

function sumWeights(ballots)
{
    var sum = 0;
    ballots.forEach(function(b)
    {
        sum += b.weight;
    });
    return sum;
}

function cleanBallots(ballots)
{
    return getBallotsWhere(ballots, function(b)
    {
        return b.candidates.length > 0 && b.weight > 0;
    });
}

function print(ballots)
{
    ballots.forEach(function(b)
    {
        console.log(b.candidates + " " + b.weight);
    });
    console.log("votes remaining: " + sumWeights(ballots));
}

function getColors(ballots)
{
    var colors = {};
    ballots.forEach(function(b)
    {
        for (var c in b.candidates)
        {
            if (typeof colors[b.candidates[c]] === 'undefined')
            {
                colors[b.candidates[c]] =
                    str2color(b.candidates[c]);
            }
        }
    });
}

function str2color(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }    
    var hex = ((hash>>24)&0xFF).toString(16) +
            ((hash>>16)&0xFF).toString(16) +
            ((hash>>8)&0xFF).toString(16) +
            (hash&0xFF).toString(16);
    hex += '000000';
    console.log("%c%s",
        "background: #" + hex.substring(0, 6) + ";", str);
    return "#" + hex.substring(0, 6);
}

var ballot_box = [];

sitecode = document.URL.split("#")[1];

if (sitecode == "load")
{
    for (i = 0; i < 15; i++)
    {
        ballot_box.push(new Ballot("asparagus", "beans", "corn", "dill"));
    }
    for (i = 0; i < 12; i++)
    {
        ballot_box.push(new Ballot("beans", "asparagus", "corn", "dill"));
    }
    for (i = 0; i < 11; i++)
    {
        ballot_box.push(new Ballot("dill", "beans", "asparagus"));
    }
    for (i = 0; i < 8; i++)
    {
        ballot_box.push(new Ballot("beans"));
    }
}

var colors = getColors(ballot_box);