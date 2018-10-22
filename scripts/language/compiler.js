function tokenize(string, dict)
{
    let tokens = [];
    words = string.replace(/[^\w\s]/gi, '').split(/\s+/);
    for (let word of words)
    {
        let entry = query(word);
        if (typeof entry != "undefined")
        {
            tokens.push(entry);
        }
        else
        {
            tokens.push(new Entry(word, word, "", "", -1));
        }
    }
    return tokens;
}

class ClauseNode
{
    constructor(body, flags)
    {
        this.body = body;
        this.flags = flags;
    }
}

class VerbNode
{
    constructor(word, tense, modifiers)
    {
        this.word = word;
        this.tense = tense;
        this.modifiers = modifiers;
    }
}

class NounNode
{
    constructor(word, article, modifiers)
    {
        this.word = word;
        this.article = article;
        this.modifiers = modifiers;
    }
}

function parse(tokens)
{
    function pop(type)
    {
        if (typeof type == "undefined" || tokens[0].type == type)
        {
            return tokens.shift();
        }
        console.log("Error: expected '" + type
            + "', got '" + tokens[0].type + "'");
        tokens.shift();
    }

    function peek(type)
    {
        if (typeof type == "undefined" || tokens[0].type == type)
        {
            return tokens[0];
        }
        console.log("Error: expected " + type
            + "', got '" + tokens[0].type + "'");
        tokens.shift();
    }

    function parseClause()
    {
        let body = [];
        let modifiers = [];
        let i = 0;
        // once over to remove flags
        while (i < tokens.length)
        {
            if (tokens[i].type == "FLG")
            {
                modifiers.push(tokens[i]);
                tokens.splice(i, 1);
            }
            else if (tokens[i].type == "EOC")
            {
                break;
            }
            else
            {
                ++i;
            }
        }
        // again to parse nodes
        while (tokens.length)
        {
            let next = peek();
            if (next.type == "NON")
            {
                body.push(parseNoun());
            }
            else if (next.type == "ART")
            {
                body.push(parseNoun());
            }
            else if (next.type == "VRB")
            {
                body.push(parseVerb())
            }
            // else if (next.type == "FLG")
            // {
            //     modifiers.push(pop("FLG"));
            // }
            else if (next.type == "EOC")
            {
                pop();
                return new ClauseNode(body, modifiers)
            }
            else
            {
                console.log("Error: did not expect token of type '"
                    + next.type + "'");
                pop();
            }
        }
        return new ClauseNode(body, modifiers);
    }

    function parseNoun()
    {
        let modifiers = [];
        let article = "";
        let noun = "";
        let declareNoun = false;
        if (peek().type == "ART")
        {
            article = pop("ART");
            declareNoun = article.loruun == "il";
        }
        if (!declareNoun)
        {
            noun = pop("NON");
        }
        else
        {
            noun = pop();
        }
        while (tokens.length)
        {
            let next = peek();
            if (next.type == "MOD")
            {
                modifiers.push(pop("MOD"));
            }
            else
            {
                return new NounNode(noun, article, modifiers);
            }
        }
        return new NounNode(noun, article, modifiers);
    }

    function parseVerb()
    {
        let tense = "";
        let modifiers = [];
        let verb = pop("VRB");
        while (tokens.length)
        {
            let next = peek();
            if (next.type == "MOD")
            {
                modifiers.push(pop("MOD"));
            }
            else if (next.type == "TNS")
            {
                tense = pop("TNS");
            }
            else
            {
                return new VerbNode(verb, tense, modifiers);
            }
        }
        return new VerbNode(verb, tense, modifiers);
    }

    let clauses = [];
    while (tokens.length > 0)
    {
        clauses.push(parseClause());
    }
    return clauses;
}

function structStr(clauses)
{
    if (clauses.length == 0) return "";
    let str = "<SENTENCE ";
    for (let clause of clauses)
    {
        str += printClause(clause);
    }
    return str + ">";

    function printClause(clause)
    {
        let str = "\n  <CLAUSE " + printFlags(clause.flags);
        for (let element of clause.body)
        {
            if (element instanceof VerbNode)
            {
                str += printVerb(element);
            }
            else if (element instanceof NounNode)
            {
                str += printNoun(element);
            }
        }
        return str + ">";
    }

    function printFlags(flags)
    {
        let str = "\n    <FLAGS";
        for (let i in flags)
        {
            str += " " + printEntry(flags[i]);
            if (i < flags.length - 1)
                str += ",";
        }
        return str + ">";
    }

    function printVerb(verb)
    {
        let str = "\n    <VERB " + printEntry(verb.word);
        if (verb.tense != "")
            str += "\n      <TENSE " + printEntry(verb.tense) + ">";
        if (verb.modifiers.length) str += "\n      <MODS";
        for (let i in verb.modifiers)
        {
            str += " " + printEntry(verb.modifiers[i]);
            if (i < verb.modifiers.length - 1)
                str += ",";
        }
        if (verb.modifiers.length) str += ">";
        return str + ">";
    }

    function printNoun(noun)
    {
        let str = "\n    <NOUN " + printEntry(noun.word);
        if (noun.article != "")
            str += "\n      <ARTICLE " + printEntry(noun.article) + ">";
        if (noun.modifiers.length) str += "\n      <MODS";
        for (let i in noun.modifiers)
        {
            str += " " + printEntry(noun.modifiers[i]);
            if (i < noun.modifiers.length - 1)
                str += ",";
        }
        if (noun.modifiers.length) str += ">";
        return str + ">";
    }

    function printEntry(entry)
    {
        return entry.loruun + " -> " + entry.english;
    }
}
