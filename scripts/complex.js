function addComplex(z1, z2)
{
    return [z1[0] + z2[0], z1[1] + z1[1]];
}

function subtractComplex(z1, z2)
{
    [z1[0] - z2[0], z1[1] - z1[1]]
}

function exponentComplex(base, n)
{
    let r = Math.sqrt(Math.pow(base[0], 2) + Math.pow(base[1], 2));
    let a = Math.atan2(base[1], base[0]);
    return [Math.pow(r, n)*Math.sin(n*a), Math.pow(r, n)*Math.cos(n*a)];
}
