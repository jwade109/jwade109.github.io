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
    constructor(word, modifiers)
    {
        this.word = word;
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
        console.log("Error: expected " + type
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
        while (tokens.length)
        {
            let next = peek();
            if (next.type == "NON")
            {
                body.push(parseNoun());
            }
            else if (next.type == "VRB")
            {
                body.push(parseVerb())
            }
            else if (next.type == "FLG")
            {
                modifiers.push(pop("FLG"));
            }
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
        return new ClauseNode(body, modifiers)
    }

    function parseNoun()
    {
        let tense;
        let modifiers = [];
        let noun = pop("NON");
        while (tokens.length)
        {
            let next = peek();
            if (next.type == "MOD")
            {
                modifiers.push(pop("MOD"));
            }
            else
            {
                return new NounNode(noun, modifiers);
            }
        }
        return new NounNode(noun, modifiers);
    }

    function parseVerb()
    {
          let tense = ""
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
    let str = "[SENTENCE ";
    for (let clause of clauses)
    {
        str += printClause(clause);
    }
    return (str + "]").replace(/\]\[/g, "] [");

    function printClause(clause)
    {
        let str = "[CLAUSE\n  " + printFlags(clause.flags);
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
        return str + "]";
    }

    function printFlags(flags)
    {
        let str = "[FLAGS";
        for (let flag of flags)
        {
            str += " " + flag.loruun;
        }
        return str + "]";
    }

    function printVerb(verb)
    {
        let str = "[VERB " + verb.word.loruun;
        if (typeof verb.tense != "undefined")
            str += " [TENSE " + verb.tense.loruun + "]";
        if (verb.modifiers.length) str += " [MODS";
        for (let mod of verb.modifiers)
        {
            str += " " + mod.loruun;
        }
        if (verb.modifiers.length) str += "]";
        return str + "]";
    }

    function printNoun(noun)
    {
        let str = "[NOUN " + noun.word.loruun;
        if (noun.modifiers.length) str += " [MODS";
        for (let mod of noun.modifiers)
        {
            str += " " + mod.loruun;
        }
        if (noun.modifiers.length) str += "]";
        return str + "]";
    }
}
