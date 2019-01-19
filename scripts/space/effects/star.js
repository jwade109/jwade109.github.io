// star.js

function Star(pos)
{
    this.pos = pos;
    this.zindex = Math.random()*0.2 + 0.7;
}

Star.prototype.draw = function()
{
    let offset = mult2d(sub2d(CAMERA_POS, this.pos), this.zindex);
    let parallax = add2d(this.pos, offset);
    if (isOffScreen(parallax))
    {
        this.pos = add2d(CAMERA_POS,
            [Math.random()*MAX_ZOOM - MAX_ZOOM/2,
             Math.random()*MAX_ZOOM - MAX_ZOOM/2]);
        let offset = mult2d(sub2d(CAMERA_POS, this.pos), this.zindex);
        let parallax = add2d(this.pos, offset);
    }

    CTX.save();
    CTX.translate(parallax[0]*PIXELS, parallax[1]*PIXELS);
    CTX.beginPath();
    CTX.fillStyle = "black";
    CTX.globalAlpha = 0.5 - this.zindex/3; // this.zindex;
    CTX.arc(0, 0, Math.max((1 - this.zindex)*5,
        (1 - this.zindex)*10*PIXELS), 0, Math.PI*2);
    CTX.fill();
    CTX.restore();
}
