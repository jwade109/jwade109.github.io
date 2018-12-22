// factions.js

function Faction(name, c1, c2, c3, c4)
{
    this.name = name;
    this.c1 = c1;
    this.c2 = c2;
    this.c3 = c3;
    this.c4 = c4;
}

// DD7029

var MCRN = new Faction("MCRN", "#8D3F32", "#8D3F32", "#666666", "#222222")

var UNN = new Faction("UNN", "#30507C", "#30507C", "#BAB4B8", "#716D70")

var NEUTRAL = new Faction("", "#FFFFFF", "#FFFFFF", "#BAB4B8", "#716D70")
