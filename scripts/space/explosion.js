// explosion.js

class Explosion
{
    constructor(pos, vel, max_radius)
    {
        this.pos = pos;
        this.pos_prev = pos;
        this.theta = 0;
        this.vel = vel;
        this.max_radius = max_radius;
        this.time = 0;
        this.duration = max_radius/100;

        this.trackable = false;
        this.nocollide = true;

        let sources = [
          "Explosion Distant 01.wav",
          "Explosion Distant 02.wav",
          "Explosion Distant Air Bomb 01.wav",
          "Explosion Distant Bomb 01.wav",
          "Explosion Distant Bomb 02.wav"
        ]
        let randn = Math.floor(Math.random()*sources.length);
        this.audio = new Audio(
            "scripts/space/sounds/" + sources[randn]);
        this.audio.volume = 0.1;
        this.audio.play();
    }

    step(dt)
    {
        this.pos_prev = this.pos.slice();
        this.time += dt;
        this.pos[0] += this.vel[0]*dt;
        this.pos[1] += this.vel[1]*dt;
        if (this.time > this.duration) this.remove = true;
    }

    draw(ctx)
    {
        let radius = Math.max(this.max_radius*(
            Math.sin(this.time/this.duration*Math.PI) +
            Math.sin(this.time/this.duration*Math.PI*12)*0.05), 0);

        ctx.save();
        ctx.translate(this.pos[0]*PIXELS, this.pos[1]*PIXELS);
        ctx.globalAlpha = 0.35;

        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(0, 0, radius*PIXELS, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(0, 0, radius*PIXELS*0.7, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(0, 0, radius*PIXELS*0.5, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }
}
