/* ======================================================================
   SOUND: a heartbeat race track and small sound effects, all made live
   with the Web Audio API (no audio files, nothing to download).
   The track speeds up and gets brighter as the fuse burns down.
   ====================================================================== */
const Sound = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  const MUSIC_VOL = 0.38, SFX_VOL = 0.55;
  let ctx = null, master, music, sfx, noiseBuf;
  const on = { music: true, sfx: true };
  let loop = 0, nextT = 0, step = 0, tension = 0, running = false, ducked = false;

  function init() {
    if (!AC) return false;
    try {
      if (!ctx) {
        ctx = new AC();
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -16; comp.ratio.value = 4;
        master = ctx.createGain(); master.gain.value = 0.9;
        master.connect(comp); comp.connect(ctx.destination);
        music = ctx.createGain(); music.gain.value = on.music ? MUSIC_VOL : 0; music.connect(master);
        sfx = ctx.createGain(); sfx.gain.value = on.sfx ? SFX_VOL : 0; sfx.connect(master);
        noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    } catch (e) { return false; }
  }
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function tone(dest, type, f, t, a, peak, d, fEnd) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (fEnd) o.frequency.exponentialRampToValueAtTime(fEnd, t + a + d);
    env(g, t, a, peak, d);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + a + d + 0.05);
  }
  function noise(dest, t, dur, peak, type, f) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f;
    const g = ctx.createGain(); env(g, t, 0.003, peak, dur);
    s.connect(fl); fl.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.05);
  }

  /* ---- the track: Am – F – G – Em, heartbeat on every beat ---- */
  const PROG = [
    { root: 45, ch: [57, 60, 64, 69] }, { root: 41, ch: [57, 60, 65, 69] },
    { root: 43, ch: [55, 59, 62, 67] }, { root: 40, ch: [55, 59, 64, 67] }
  ];
  const ARP = [0, 2, 1, 3, 2, 1, 0, 2, 1, 3, 2, 0, 3, 1, 2, 1];
  function heart(t, amp) {
    tone(music, 'sine', 92, t, 0.006, 0.95 * amp, 0.15, 40);
    tone(music, 'sine', 78, t + 0.16, 0.006, 0.55 * amp, 0.13, 38);
  }
  function bass(t, m, len, cut) {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = mtof(m);
    f.type = 'lowpass'; f.frequency.value = cut; f.Q.value = 4;
    env(g, t, 0.01, 0.16, len);
    o.connect(f); f.connect(g); g.connect(music); o.start(t); o.stop(t + len + 0.05);
  }
  function pluck(t, m, cut, amp) {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'square'; o.frequency.value = mtof(m);
    f.type = 'lowpass'; f.frequency.setValueAtTime(cut, t); f.frequency.exponentialRampToValueAtTime(260, t + 0.2);
    env(g, t, 0.004, amp, 0.17);
    o.connect(f); f.connect(g); g.connect(music); o.start(t); o.stop(t + 0.26);
  }
  const bpm = () => 92 + tension * 48;
  function schedule() {
    if (!ctx) return;
    const sp = 60 / bpm() / 4;
    while (nextT < ctx.currentTime + 0.12) {
      if (on.music && !ducked) {
        const s = step % 64, pos = s % 16, ch = PROG[Math.floor(s / 16)];
        if (pos % 4 === 0) heart(nextT, 0.75 + tension * 0.35);
        if (pos % 2 === 0) bass(nextT, ch.root + (pos % 8 === 6 ? 12 : 0), sp * 1.7, 260 + tension * 900);
        if (tension > 0.12 || pos % 2 === 0) pluck(nextT, ch.ch[ARP[pos]] + 12, 800 + tension * 3400, 0.035 + tension * 0.03);
        if (tension > 0.3 && pos % 4 === 2) noise(music, nextT, 0.035, 0.1, 'highpass', 7000);
        if (tension > 0.7 && pos % 2 === 1) noise(music, nextT, 0.02, 0.06, 'highpass', 9500);
      }
      nextT += sp; step++;
    }
  }
  function startMusic() {
    if (!init() || running) return;
    running = true; step = 0; nextT = ctx.currentTime + 0.05;
    loop = setInterval(schedule, 25); schedule();
  }
  function stopMusic() { running = false; clearInterval(loop); }
  function setTension(x) { tension = Math.max(0, Math.min(1, x)); }
  // silence the track while the microphone listens, so it does not hear the music
  function duck(yes) {
    ducked = !!yes;
    if (!ctx) return;
    const v = on.music && !ducked ? MUSIC_VOL : 0;
    music.gain.cancelScheduledValues(ctx.currentTime);
    music.gain.setTargetAtTime(v, ctx.currentTime, 0.06);
  }

  /* ---- effects ---- */
  const FX = {
    tick() { tone(sfx, 'square', 1700, ctx.currentTime, 0.001, 0.1, 0.03); },
    count(n) { tone(sfx, 'sine', n ? 640 : 960, ctx.currentTime, 0.005, 0.5, n ? 0.2 : 0.5); if (!n) tone(sfx, 'triangle', 1280, ctx.currentTime, 0.005, 0.25, 0.45); },
    lock() { const t = ctx.currentTime; noise(sfx, t, 0.16, 0.22, 'bandpass', 1600); tone(sfx, 'triangle', 480, t, 0.004, 0.22, 0.12, 760); },
    good() { const t = ctx.currentTime; tone(sfx, 'triangle', mtof(76), t, 0.004, 0.42, 0.22); tone(sfx, 'triangle', mtof(83), t + 0.08, 0.004, 0.42, 0.3); tone(sfx, 'sine', mtof(88), t + 0.16, 0.004, 0.25, 0.45); },
    streak() { const t = ctx.currentTime; [79, 83, 86, 91].forEach((m, i) => tone(sfx, 'triangle', mtof(m), t + i * 0.06, 0.003, 0.3, 0.2)); },
    bad() { const t = ctx.currentTime; tone(sfx, 'sawtooth', 210, t, 0.01, 0.16, 0.3, 105); tone(sfx, 'sine', 140, t, 0.01, 0.2, 0.3, 80); },
    finish() { const t = ctx.currentTime; [60, 64, 67, 72, 76, 79].forEach((m, i) => tone(sfx, 'triangle', mtof(m), t + i * 0.1, 0.004, 0.32, 0.5)); },
    mic() { tone(sfx, 'sine', 880, ctx.currentTime, 0.004, 0.18, 0.08); },
    micOff() { tone(sfx, 'sine', 620, ctx.currentTime, 0.004, 0.14, 0.08); }
  };
  function play(name, arg) {
    if (!on.sfx || !init()) return;
    try { FX[name](arg); } catch (e) { /* audio is optional */ }
  }
  function set(kind, val) {
    on[kind] = !!val;
    if (!ctx) return;
    const node = kind === 'music' ? music : sfx;
    const v = !val ? 0 : kind === 'music' ? (ducked ? 0 : MUSIC_VOL) : SFX_VOL;
    node.gain.cancelScheduledValues(ctx.currentTime);
    node.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
  }
  return {
    init, startMusic, stopMusic, setTension, duck, play, set,
    get on() { return on; }, get bpm() { return bpm(); }, get supported() { return !!AC; }
  };
})();
