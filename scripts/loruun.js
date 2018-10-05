// porting all the original MATLAB functions here.

class Entry
{
    constructor(loruun, english, definition, role, id)
    {
        this.loruun = loruun;
        this.english = english;
        this.definition = definition;
        this.role = role;
        this.id = id;
    }
}

// takes the path of a dictionary text file and converts
// it to an array of entries
function loadDictionary(path)
{
    var dict = [];
    var client = new XMLHttpRequest();
    client.open('GET', path, false);
    client.send();
    txt = client.responseText.split("\n");
    for (var i = 0; i < txt.length - 1; ++i)
        dict.push(new Entry(...txt[i].split(";"), i));
    return dict;
}

// takes a loruun word in a string and returns
// the dictionary entry, if it exists
function query(key)
{
    key = canonical(key);
    for (var e in dict)
    {
        if (dict[e].loruun == key)
        {
            return dict[e];
        }
    }
}

// takes an english or loruun word/phrase and returns
// possible entry matches from the dictionary
function find(key, lang)
{
    var entries = [];
    if (key == "" || key == " ") return entries;
    for (var e in dict)
    {
        var en = dict[e];
        if (en.loruun.includes(key) && lang == "l")
            entries.push(en);
        else if ((en.english.includes(key) ||
                  en.definition.includes(key)) &&
                 lang == "e")
            entries.push(en);
    }
    return entries;
}

// translates loruun symbol to best english shorthand
function translate(key)
{
    var english = "";
    var tokens = key.split(" ");
    for (var i in tokens)
    {
        var entry = query(tokens[i]);
        if (typeof entry !== 'undefined')
            english += entry.english + " ";
        else if (tokens[i] != "")
            english += "[" + tokens[i] + "] ";
    }
    return english;
}

// converts string to grammatical structures
// of constituent loruun symbols
function structure(key)
{
    var struct = "";
    var tokens = key.split(" ");
    for (var i in tokens)
    {
        var entry = query(tokens[i]);
        if (typeof entry !== 'undefined')
            struct += entry.role + " ";
        else if (tokens[i] != "")
            struct += "[" + tokens[i] + "] ";
    }
    return struct;
}

// converts string to hex id of constituent loruun symbols
function numerical(key)
{
    var numbers = "";
    var tokens = key.split(" ");
    for (var i in tokens)
    {
        var entry = query(tokens[i]);
        if (typeof entry !== 'undefined')
            numbers += entry.id.toString(16) + " ";
        else if (tokens[i] != "")
            numbers += "[" + tokens[i] + "] ";
    }
    return numbers;
}

// converts string to canonical loruun notation
// i.e. no double consonants, no triple vowels, no capitalization
function canonical(str)
{
    str = str.toLowerCase();
    var i = 0, len = str.length;
    while (i < len)
    {
        var a = str[i];
        var b = str[i+1];
        var c = str[i+2];

        if ((a != 'a' && a != 'e' && a != 'i' &&
            a != 'o' && a != 'u' && a == b) ||
            (a == b && a == c))
        {
            str = str.substr(0, i) + str.substr(i+1, str.length);
            --len;
        }
        else ++i;
    }
    return str;
}

var dict = loadDictionary(
  'https://jwade109.github.io/resources/dictionary.txt');
  // 'file:///resources/dictionary.txt');
