
function draw_keyboard_hints()
{
    function drawKey(x, y, w, h, key, desc)
    {
        CTX.save();
        CTX.translate(x, y);
        CTX.lineWidth = 2;
        CTX.strokeStyle = "black";
        CTX.globalAlpha = 1;
        if (!GAME_PAUSED)
            CTX.globalAlpha = 0.3;
        CTX.fillStyle = "white";
        CTX.fillRect(0, 0, w, h);
        CTX.globalAlpha = 0.5;
        if (desc == '') CTX.globalAlpha = 0.1;
        CTX.strokeRect(0, 0, w, h);
        CTX.font = "20px Helvetica";
        CTX.textAlign = "center";
        CTX.fillStyle = "black";
        CTX.fillText(key, w/2, 3*h/4);

        let mx = MOUSE_SCREEN_POS[0], my = MOUSE_SCREEN_POS[1];
        if (mx > x && mx < x + w && my > y && my < y + h &&
            (SLOW_TIME || GAME_PAUSED) && desc != "")
        {
            CTX.font = "16px Helvetica";
            CTX.beginPath();
            let len = y - (HEIGHT - 270);
            let width = CTX.measureText(desc.toUpperCase()).width;
            if (x < WIDTH/2)
            {
                CTX.moveTo(w, 0);
                CTX.lineTo(len/3 + w, -len);
                CTX.lineTo(len/3 + w + width, -len);
                CTX.stroke();
                CTX.globalAlpha = 0.8;
                CTX.textAlign = "left";
                CTX.fillText(desc.toUpperCase(), len/3 + w, -len - 5);
            }
            else
            {
                CTX.moveTo(0, 0);
                CTX.lineTo(-len/3, -len);
                CTX.lineTo(-len/3 - width, -len);
                CTX.stroke();
                CTX.globalAlpha = 0.8;
                CTX.textAlign = "right";
                CTX.fillText(desc.toUpperCase(), -len/3, -len - 5);
            }
            CTX.globalAlpha = 0.1;
            CTX.fillStyle = "black";
            CTX.fillRect(0, 0, w, h);
        }
        CTX.restore();
    }

    let beginx = 95, beginy = HEIGHT - 230, w = 30, h = 30;
    drawKey(beginx, beginy, w, h, '', '');
    drawKey(beginx + 35, beginy, w, h, '1', 'Zoom Out');
    drawKey(beginx + 70, beginy, w, h, '2', 'Zoom In');

    if (GAME_PAUSED)
    {
        drawKey(beginx + 105, beginy, w, h,
            '3', 'Spawn as: Morrigan Class');
        drawKey(beginx + 140, beginy, w, h,
            '4', 'Spawn as: Corvette Class');
        drawKey(beginx + 175, beginy, w, h,
            '5', 'Spawn as: Amun-Ra Class');
        drawKey(beginx + 210, beginy, w, h,
            '6', 'Spawn as: Scirocco Class');
        drawKey(beginx + 245, beginy, w, h,
            '7', 'Spawn as: Basilisk Class');
        drawKey(beginx + 280, beginy, w, h,
            '8', 'Spawn as: Donnager Class');
        drawKey(beginx + 315, beginy, w, h,
            '9', 'Switch factions (UNN/MCRN)');
    }

    drawKey(beginx, beginy + 35, w*1.5, h, '', '');
    drawKey(beginx + w*1.5 + 5, beginy + 35, w, h, '', '');
    drawKey(beginx + w*2.5 + 10, beginy + 35, w, h,
        'W', 'Accelerate');
    drawKey(beginx + w*3.5 + 15, beginy + 35, w, h,
        'E', 'Toggle targeting mode');

    if (GAME_PAUSED)
    {
        drawKey(beginx + w*4.5 + 20, beginy + 35, w, h,
            '', '');
        drawKey(beginx + w*5.5 + 25, beginy + 35, w, h,
            'T', 'Center camera on object (debug)');
        drawKey(beginx + w*6.5 + 30, beginy + 35, w, h,
            'Y', 'Toggle show behaviors (debug)');
        drawKey(beginx + w*7.5 + 35, beginy + 35, w, h,
            'U', 'Toggle display alerts (debug)');
        drawKey(beginx + w*8.5 + 40, beginy + 35, w, h, '', '');
        drawKey(beginx + w*9.5 + 45, beginy + 35, w, h,
            'O', 'Decrement wave (debug)');
        drawKey(beginx + w*10.5 + 50, beginy + 35, w, h,
            'P', 'Increment wave (debug)');
    }

    drawKey(beginx, beginy + 70, w*1.7, h, '', '');
    drawKey(beginx + w*1.7 + 5, beginy + 70, w, h, 'A', 'Turn left');
    drawKey(beginx + w*2.7 + 10, beginy + 70, w, h, '', '');
    drawKey(beginx + w*3.7 + 15, beginy + 70, w, h, 'D', 'Turn right');

    if (GAME_PAUSED)
    {
        drawKey(beginx + w*4.7 + 20, beginy + 70, w, h, '', '');
        drawKey(beginx + w*5.7 + 25, beginy + 70, w, h,
            'G', 'Toggle keyboard overlay');
        drawKey(beginx + w*6.7 + 30, beginy + 70, w, h,
            'H', 'Toggle draw acceleration (debug)');
        drawKey(beginx + w*8.5 + 40, beginy + 35, w, h,
            'I', 'Toggle invincibility (debug)');
        drawKey(beginx + w*7.7 + 35, beginy + 70, w, h,
            'J', 'Step backward (debug)');
        drawKey(beginx + w*8.7 + 40, beginy + 70, w, h,
            'K', 'Step forward (debug)');
        drawKey(beginx + w*9.7 + 45, beginy + 70, w, h,
            'L', 'Toggle draw torpedo tubes (debug)');
    }

    drawKey(beginx, beginy + 105, w*2.5, h, 'SHIFT', 'Accelerate');
    drawKey(beginx + w*2.5 + 5, beginy + 105, w, h,
        'Z', 'Take control of friendly vessel');
    drawKey(beginx + w*3.5 + 10, beginy + 105, w, h, '', '');
    drawKey(beginx + w*4.5 + 15, beginy + 105, w, h, '', '');

    if (GAME_PAUSED)
    {
        drawKey(beginx + w*5.5 + 20, beginy + 105, w, h,
            'V', 'Toggle locked camera');
        drawKey(beginx + w*6.5 + 25, beginy + 105, w, h,
            'B', 'Toggle draw firing arcs (debug)');
        drawKey(beginx + w*7.5 + 30, beginy + 105, w, h,
            'N', 'Toggle draw hitboxes (debug)');
        drawKey(beginx + w*8.5 + 35, beginy + 105, w, h,
            'M', 'Toggle draw velocity (debug)');
    }

    drawKey(beginx + w*2.7 + 10, beginy + 140, w, h, '', '');
    drawKey(beginx + w*3.7 + 15, beginy + 140, w, h, '', '');
    drawKey(beginx + w*4.7 + 20, beginy + 140, w*5, h,
        'SPACE', 'Fire weapon');

    if (GAME_PAUSED)
    {
        let mbeginx = WIDTH - 150;
        let mw = 40;
        drawKey(mbeginx, beginy, mw, h,
            'L', 'Fire Point Defense Cannons');
        drawKey(mbeginx + mw + 5, beginy, mw, h,
            'R', 'Select target lock');
        drawKey(mbeginx, beginy + h + 5, 2*mw + 5, 100, '', '');
        drawKey(mbeginx + mw*0.9, beginy + h*0.6,
            mw*0.2 + 5, h*0.8 + 5, '', 'Fire Railgun');

        CTX.font = "30px Helvetica";
        CTX.textAlign = "left";
        CTX.globalAlpha = 0.7;
        CTX.fillStyle = "darkgray";
        CTX.fillText("KEYBOARD", beginx, beginy - 100);
        CTX.textAlign = "right";
        CTX.fillText("MOUSE", mbeginx + 5 + 2*mw, beginy - 100);
    }
}
