/* ==========================================================================
   sonido.js · efectos de acierto/fallo y música de fondo china
   --------------------------------------------------------------------------
   Todo se sintetiza en el navegador (Web Audio), sin ficheros:
   - efectos: cuerdas punteadas tipo guzheng (Karplus-Strong), gong,
     bloque de madera y campanillas (iguales que en HSK1)
   - música de HSK2: flauta de bambú (箫) sobre la pentatónica en modo 羽
     (mi-sol-la-si-re), notas graves de guqin, cuenco y gotas de agua
   La música suena solo en los menús; en los ejercicios, solo los efectos.
   ========================================================================== */
(function (global) {
  "use strict";

  var AC = global.AudioContext || global.webkitAudioContext;
  var ctx = null, master = null, musicBus = null, sfxBus = null, reverb = null;
  var prefs = { music: true, sfx: true, musicVol: 0.5 };
  var mode = "menu";            // "menu" (con música) o "exercise" (sin música)
  var unlocked = false;
  var bufCache = {};

  // Pentatónica en re: D E F# A B  (宫 商 角 徵 羽)
  var BASE = 146.83;            // re3
  var STEPS = [0, 2, 4, 7, 9];
  function pent(i) {            // i-ésima nota de la escala (puede ser negativa)
    var oct = Math.floor(i / 5), deg = ((i % 5) + 5) % 5;
    return BASE * Math.pow(2, oct + STEPS[deg] / 12);
  }

  function init() {
    if (ctx || !AC) return !!ctx;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    // reverberación suave (sala de madera)
    reverb = ctx.createConvolver();
    var len = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = ir.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    reverb.buffer = ir;
    var wet = ctx.createGain(); wet.gain.value = 0.35; reverb.connect(wet); wet.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master); musicBus.connect(reverb);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.7; sfxBus.connect(master); sfxBus.connect(reverb);
    return true;
  }

  // ------------------------------------------------------------ instrumentos
  /** Cuerda punteada (Karplus-Strong), cacheada por frecuencia. */
  function pluckBuffer(freq, bright) {
    var key = Math.round(freq * 10) + (bright ? "b" : "");
    if (bufCache[key]) return bufCache[key];
    var sr = ctx.sampleRate, dur = 3.2, n = Math.floor(sr * dur);
    var buf = ctx.createBuffer(1, n, sr), out = buf.getChannelData(0);
    var period = Math.max(2, Math.round(sr / freq));
    var line = new Float32Array(period);
    for (var i = 0; i < period; i++) line[i] = Math.random() * 2 - 1;
    var damp = bright ? 0.4985 : 0.4975, idx = 0, prev = 0;
    for (var s = 0; s < n; s++) {
      var cur = line[idx];
      var nx = damp * (cur + prev);
      prev = cur;
      line[idx] = nx;
      out[s] = cur;
      idx = (idx + 1) % period;
    }
    // ataque suave
    for (var a = 0; a < 120; a++) out[a] *= a / 120;
    bufCache[key] = buf;
    return buf;
  }
  function pluck(freq, when, vol, bus, bright) {
    var src = ctx.createBufferSource();
    src.buffer = pluckBuffer(freq, bright);
    var g = ctx.createGain(); g.gain.value = vol;
    var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = bright ? 5200 : 3200;
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(when);
    // ligera vibración de la cuerda, como en el guzheng
    src.playbackRate.setValueAtTime(1, when);
    src.playbackRate.linearRampToValueAtTime(1.004, when + 0.35);
    src.playbackRate.linearRampToValueAtTime(0.998, when + 0.8);
  }
  function tone(freq, when, dur, vol, type, bus, attack) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + (attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(bus);
    o.start(when); o.stop(when + dur + 0.05);
  }
  /** Gong: parciales inarmónicos con caída lenta. */
  function gong(when, vol, low) {
    var f0 = low ? 72 : 110;
    [[1, 1], [1.48, 0.6], [2.03, 0.45], [2.76, 0.3], [3.9, 0.18], [5.3, 0.1]].forEach(function (p) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(f0 * p[0] * 1.02, when);
      o.frequency.exponentialRampToValueAtTime(f0 * p[0], when + 1.2);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(vol * p[1], when + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, when + (low ? 3.2 : 2.6));
      o.connect(g); g.connect(sfxBus);
      o.start(when); o.stop(when + 3.4);
    });
  }
  /** Bloque de madera (木鱼). */
  function woodblock(when, vol, freq) {
    var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = "triangle"; o.frequency.setValueAtTime(freq || 820, when);
    o.frequency.exponentialRampToValueAtTime((freq || 820) * 0.7, when + 0.08);
    f.type = "bandpass"; f.frequency.value = freq || 820; f.Q.value = 4;
    g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
    o.connect(f); f.connect(g); g.connect(sfxBus);
    o.start(when); o.stop(when + 0.2);
  }
  function chime(freq, when, vol, bus) {
    tone(freq, when, 2.2, vol, "sine", bus, 0.005);
    tone(freq * 2.76, when, 0.9, vol * 0.25, "sine", bus, 0.005);
  }

  // ------------------------------------------------------------ efectos
  var SFX = {
    ok: function (t) { pluck(pent(10), t, 0.5, sfxBus, true); pluck(pent(12), t + 0.09, 0.5, sfxBus, true); pluck(pent(14), t + 0.18, 0.55, sfxBus, true); chime(pent(17), t + 0.26, 0.08, sfxBus); },
    mid: function (t) { pluck(pent(10), t, 0.45, sfxBus, true); pluck(pent(11), t + 0.14, 0.4, sfxBus, false); },
    ko: function (t) { woodblock(t, 0.55, 520); woodblock(t + 0.14, 0.45, 430); pluck(pent(3), t + 0.05, 0.35, sfxBus, false); },
    tick: function (t) { woodblock(t, 0.18, 1400); },
    // resultado final
    excelente: function (t) {
      gong(t, 0.28, false);
      [5, 7, 8, 10, 12, 13, 15, 17].forEach(function (d, i) { pluck(pent(d), t + 0.1 + i * 0.075, 0.45, sfxBus, true); });
      chime(pent(20), t + 0.8, 0.1, sfxBus); chime(pent(22), t + 0.95, 0.08, sfxBus);
    },
    aprobado: function (t) {
      [7, 9, 10, 12].forEach(function (d, i) { pluck(pent(d), t + i * 0.1, 0.45, sfxBus, true); });
      pluck(pent(14), t + 0.45, 0.5, sfxBus, true); chime(pent(17), t + 0.55, 0.07, sfxBus);
    },
    suspenso: function (t) {
      gong(t, 0.22, true);
      [9, 8, 7, 5].forEach(function (d, i) { pluck(pent(d), t + 0.15 + i * 0.2, 0.35, sfxBus, false); });
    }
  };
  function sfx(name) {
    if (!prefs.sfx || !init()) return;
    if (ctx.state === "suspended") ctx.resume();
    var f = SFX[name]; if (f) f(ctx.currentTime + 0.02);
  }

  // ------------------------------------------------------------ música de fondo
  // Modo 羽 (yu): mi sol la si re — más íntimo y melancólico que el de HSK1.
  var MBASE = 164.81;           // mi3
  var MSTEPS = [0, 3, 5, 7, 10];
  function yu(i) {
    var oct = Math.floor(i / 5), deg = ((i % 5) + 5) % 5;
    return MBASE * Math.pow(2, oct + MSTEPS[deg] / 12);
  }
  var noiseBuf = null;
  function noise() {
    if (noiseBuf) return noiseBuf;
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }
  /** Flauta de bambú: tono suave + soplo, con ligadura de entrada y vibrato tardío. */
  function flute(freq, when, dur, vol, from) {
    var out = ctx.createGain(); out.gain.value = 0;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2600;
    out.connect(lp); lp.connect(musicBus);
    var o = ctx.createOscillator(); o.type = "sine";
    var o2 = ctx.createOscillator(); o2.type = "triangle";
    var g2 = ctx.createGain(); g2.gain.value = 0.12;
    o.connect(out); o2.connect(g2); g2.connect(out);
    var start = from || freq * 0.985;
    [o, o2].forEach(function (x, k) {
      var m = k ? 2 : 1;
      x.frequency.setValueAtTime(start * m, when);
      x.frequency.exponentialRampToValueAtTime(freq * m, when + (from ? 0.22 : 0.1));
    });
    // vibrato que aparece poco a poco
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 4.6; lg.gain.setValueAtTime(0, when);
    lg.gain.linearRampToValueAtTime(freq * 0.007, when + Math.min(0.9, dur * 0.6));
    lfo.connect(lg); lg.connect(o.frequency);
    var att = 0.16, rel = Math.min(0.7, dur * 0.4);
    out.gain.setValueAtTime(0, when);
    out.gain.linearRampToValueAtTime(vol, when + att);
    out.gain.setValueAtTime(vol * 0.92, when + dur - rel);
    out.gain.linearRampToValueAtTime(0, when + dur);
    // soplo
    var n = ctx.createBufferSource(); n.buffer = noise(); n.loop = true;
    var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = freq * 2.2; bp.Q.value = 1.2;
    var ng = ctx.createGain(); ng.gain.setValueAtTime(0, when);
    ng.gain.linearRampToValueAtTime(vol * 0.22, when + 0.06);
    ng.gain.linearRampToValueAtTime(vol * 0.06, when + 0.4);
    ng.gain.linearRampToValueAtTime(0, when + dur);
    n.connect(bp); bp.connect(ng); ng.connect(musicBus);
    [o, o2, lfo].forEach(function (x) { x.start(when); x.stop(when + dur + 0.1); });
    n.start(when, Math.random()); n.stop(when + dur + 0.1);
  }
  /** Cuenco: sinusoides con batido lento. */
  function bowl(freq, when, vol) {
    [[1, 1], [1.003, 0.8], [2.71, 0.25]].forEach(function (p) {
      tone(freq * p[0], when, 6, vol * p[1], "sine", musicBus, 0.4);
    });
  }
  /** Gota de agua. */
  function drop(when, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain(), f = 900 + Math.random() * 700;
    o.type = "sine"; o.frequency.setValueAtTime(f, when); o.frequency.exponentialRampToValueAtTime(f * 2.2, when + 0.07);
    g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
    o.connect(g); g.connect(musicBus); o.start(when); o.stop(when + 0.15);
  }

  var timer = null, playing = false, drone = null, pos = 10, beat = 0, nextT = 0, phraseLeft = 0, lastF = 0;
  function startDrone() {
    var g = ctx.createGain(); g.gain.value = 0; g.connect(musicBus);
    var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 360; f.connect(g);
    var oscs = [MBASE / 2, MBASE * 0.75, MBASE].map(function (fr, i) {
      var o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = fr;
      o.detune.value = (i - 1) * 5; o.connect(f); o.start(); return o;
    });
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 0.05; lg.gain.value = 0.02; lfo.connect(lg); lg.connect(g.gain); lfo.start();
    g.gain.setTargetAtTime(0.045, ctx.currentTime, 2.5);
    drone = { g: g, oscs: oscs.concat([lfo]) };
  }
  function stopDrone() {
    if (!drone) return;
    var d = drone; drone = null;
    d.g.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
    setTimeout(function () { d.oscs.forEach(function (o) { try { o.stop(); } catch (e) { /* nada */ } }); }, 3000);
  }
  function schedule() {
    // Frases de flauta de 4-7 notas, lentas, con silencios en los que
    // responden el guqin grave, el cuenco o una gota de agua.
    while (nextT < ctx.currentTime + 2.5) {
      var t = nextT;
      if (phraseLeft <= 0) {
        // silencio entre frases
        var r = Math.random();
        if (r < 0.45) { pluck(yu(Math.random() < 0.5 ? 0 : 2), t + 0.2, 0.34, musicBus, false); pluck(yu(4), t + 0.9, 0.22, musicBus, false); }
        else if (r < 0.7) bowl(yu(5), t + 0.3, 0.03);
        if (Math.random() < 0.5) drop(t + 1.2 + Math.random(), 0.05);
        phraseLeft = 4 + Math.floor(Math.random() * 4);
        pos = 9 + Math.floor(Math.random() * 3);
        lastF = 0;
        nextT += 2.6 + Math.random() * 2.2;
        continue;
      }
      pos += [-2, -1, -1, 1, 1, 2, 0, -1][Math.floor(Math.random() * 8)];
      if (pos < 6) pos = 7; if (pos > 14) pos = 12;
      var last = phraseLeft === 1;
      var dur = last ? 2.6 + Math.random() * 1.2 : [0.7, 0.9, 1.2, 1.6][Math.floor(Math.random() * 4)];
      var f = yu(last ? (Math.random() < 0.6 ? 10 : 7) : pos);
      flute(f, t, dur, 0.16, lastF && Math.random() < 0.35 ? lastF : 0);
      if (beat % 6 === 0) pluck(yu(Math.random() < 0.5 ? 0 : 3), t, 0.26, musicBus, false);
      lastF = f;
      beat++;
      phraseLeft--;
      nextT += dur * 0.96;
    }
  }
  function musicOn() {
    if (playing || !prefs.music || mode !== "menu" || !unlocked || !init()) return;
    if (ctx.state === "suspended") ctx.resume();
    playing = true;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setTargetAtTime(0.55 * prefs.musicVol, ctx.currentTime, 1.2);
    nextT = ctx.currentTime + 0.3; beat = 0; phraseLeft = 0;
    startDrone();
    timer = setInterval(schedule, 500);
    schedule();
  }
  function musicOff() {
    if (!playing) return;
    playing = false;
    clearInterval(timer); timer = null;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.35);
    stopDrone();
  }
  function refresh() { if (prefs.music && mode === "menu") musicOn(); else musicOff(); }

  // El navegador solo deja sonar audio tras un gesto del usuario.
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    if (init() && ctx.state === "suspended") ctx.resume();
    refresh();
    ["pointerdown", "keydown", "touchstart"].forEach(function (ev) { document.removeEventListener(ev, unlock, true); });
  }
  ["pointerdown", "keydown", "touchstart"].forEach(function (ev) { document.addEventListener(ev, unlock, true); });

  global.Sonido = {
    sfx: sfx,
    setMode: function (m) { mode = m; refresh(); },
    setPrefs: function (p) {
      Object.keys(p).forEach(function (k) { prefs[k] = p[k]; });
      if (ctx && playing) musicBus.gain.setTargetAtTime(0.55 * prefs.musicVol, ctx.currentTime, 0.2);
      refresh();
    },
    isPlaying: function () { return playing; },
    available: !!AC
  };
})(window);
