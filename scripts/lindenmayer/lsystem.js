"use strict";

function apply_rules(predecessor, rules)
{
    let ret = ""
    for (let i = 0; i < predecessor.length; ++i)
    {
        let c = predecessor[i];
        if (c in rules)
        {
            ret += rules[c]
        }
        else
        {
            ret += c
        }
    }
    return ret
}

function iterate_rules(axiom, rules, n)
{
    let res = axiom;
    for (let i = 0; i < n; ++i)
    {
        res = apply_rules(res, rules);
    }
    return res;
}

function render_string(lstring, angle, d, draw_forward)
{
    let pos = [0, 0];
    let heading = 0;
    const dvec = [d, 0];

    let posstack = []
    let ret = [[pos]];

    for (let i = 0; i < lstring.length; ++i)
    {
        const c = lstring[i];
        if (c == "+")
        {
            heading += angle;
        }
        else if (c == "-")
        {
            heading -= angle;
        }
        else if (c == "[")
        {
            posstack.push([pos.slice(), heading]);
        }
        else if (c == "]")
        {
            const [p, h] = posstack.pop();
            pos = p.slice();
            heading = h;
            ret.push([pos]);
        }
        else if (draw_forward.includes(c))
        {
            let delta = rot2d(dvec, heading)
            pos = add2d(pos, delta);
            ret[ret.length - 1].push(pos);
        }
    }

    return ret;
}
