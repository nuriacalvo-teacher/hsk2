/* ==========================================================================
   app.js · HSK2 Repaso
   Dictado · Listening · Lectura · Traducción · Vocabulario
   Todo corre en el navegador; el progreso se guarda en este dispositivo.
   ========================================================================== */
(function () {
  "use strict";

  var D = window.HSK;
  var C = window.Corrector;
  var APP = document.getElementById("app");

  // ======================================================================
  // utilidades
  // ======================================================================
  function h(tag, props) {
    var e = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "class") e.className = v;
        else if (k === "html") e.innerHTML = v;
        else if (k === "text") e.textContent = v;
        else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v);
        else if (k === "style") e.style.cssText = v;
        else e.setAttribute(k, v === true ? "" : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) add(e, arguments[i]);
    return e;
  }
  function add(e, c) {
    if (arguments.length > 2) { for (var i = 1; i < arguments.length; i++) add(e, arguments[i]); return; }
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(e, x); }); return; }
    e.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  function icon(name, size) {
    var s = size || 20;
    var P = {
      play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>',
      pause: '<rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/>',
      replay: '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      speaker: '<path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      back: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
      menu: '<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
      close: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
      ear: '<path d="M7 10a5 5 0 0 1 10 0c0 3-3 3.5-3 6.5a2.5 2.5 0 0 1-5 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 10a2 2 0 0 1 4 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      pen: '<path d="M4 20l4-1 11-11-3-3L5 16z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 7l3 3" stroke="currentColor" stroke-width="2"/>',
      book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
      swap: '<path d="M4 8h13l-3-3M20 16H7l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      list: '<path d="M8 6h12M8 12h12M8 18h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="4" cy="6" r="1.4" fill="currentColor"/><circle cx="4" cy="12" r="1.4" fill="currentColor"/><circle cx="4" cy="18" r="1.4" fill="currentColor"/>',
      gear: '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.5v3M12 18.5v3M4.2 6.2l2.1 2.1M17.7 15.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 17.8l2.1-2.1M17.7 8.3l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
      keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    };
    return h("span", { "aria-hidden": "true", style: "display:inline-flex", html: '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24">' + (P[name] || "") + "</svg>" });
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  var CN_NUM = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三", "十四", "十五"];
  function pct(x) { return Math.round(x * 100); }
  function scoreClass(p) { return p === undefined ? "" : p >= 80 ? "good" : p >= 50 ? "mid" : "low"; }
  function levelOf(score) { return score >= 1 ? "ok" : score > 0 ? "mid" : "ko"; }

  // ======================================================================
  // almacenamiento (solo en este navegador)
  // ======================================================================
  var KEY = "hsk2-repaso-v1";
  var S = { settings: { tones: "cuentan", speed: "lento", autoTone: true, theme: "auto", voice: "", music: true, sfx: true, musicVol: 0.5 }, progress: {} };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved) { S.settings = Object.assign(S.settings, saved.settings || {}); S.progress = saved.progress || {}; }
  } catch (e) { /* sin almacenamiento: se trabaja en memoria */ }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* nada */ } }
  function saveResult(key, value) {
    var p = S.progress[key] || { best: 0, n: 0 };
    p.last = value; p.best = Math.max(p.best || 0, value); p.n = (p.n || 0) + 1; p.date = Date.now();
    S.progress[key] = p; persist();
  }
  function best(key) { return S.progress[key] ? S.progress[key].best : undefined; }
  function ignoreTones() { return S.settings.tones === "ignorar"; }
  function applyTheme() {
    var t = S.settings.theme;
    if (t === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
  }
  applyTheme();
  var SND = window.Sonido || { sfx: function () {}, setMode: function () {}, setPrefs: function () {}, isPlaying: function () { return false; } };
  function syncSound() { SND.setPrefs({ music: S.settings.music, sfx: S.settings.sfx, musicVol: S.settings.musicVol }); paintMusicBtn(); }
  function resultSound(p) { SND.sfx(p >= 80 ? "excelente" : p >= 50 ? "aprobado" : "suspenso"); }

  // ======================================================================
  // índices de datos
  // ======================================================================
  var FRASE = {}, TEMA = {};
  D.temas.forEach(function (t) { TEMA[t.n] = t; t.frases.forEach(function (f) { f.tema = t.n; FRASE[f.id] = f; }); });
  function item(id) { return FRASE[id] || D.vocab[id] || D.extra[id]; }
  var LIST = {}; D.listenings.forEach(function (l) { LIST[l.id] = l; });
  var READ = {}; D.lecturas.forEach(function (r) { READ[r.id] = r; });
  var DICT = {}; D.dictados.forEach(function (d) { DICT[d.id] = d; });
  var GRAM = {}; (D.gramatica || []).forEach(function (g) { GRAM[g.tema] = g; });

  // ======================================================================
  // pinyin a partir del hanzi (lecturas y textos clicables)
  // ======================================================================
  var PUNCT = "，。？！、；：“”‘’（）《》…—·,.?!;:\"'()";
  var PUNCT_PY = { "，": ",", "。": ".", "？": "?", "！": "!", "、": ",", "；": ";", "：": ":", "“": "“", "”": "”", "（": "(", "）": ")", "…": "…" };
  var NUM_PY = { "零": "líng", "一": "yī", "二": "èr", "三": "sān", "四": "sì", "五": "wǔ", "六": "liù", "七": "qī", "八": "bā", "九": "jiǔ", "十": "shí" };
  function isPunct(w) { return w.split("").every(function (c) { return PUNCT.indexOf(c) >= 0; }); }
  function isNumZh(w) { return /^[零一二三四五六七八九十]+$/.test(w); }
  function numPinyin(w) {
    var out = "";
    w.split("").forEach(function (c, i) {
      var p = NUM_PY[c];
      if (i && /^[aeo]/.test(C.stripMarks(p))) out += "'";
      out += p;
    });
    return out;
  }
  function firstTone(py) { var s = C.parse(py); return s.length ? s[0].t : 0; }

  /** Información de una palabra: {w, py, es, t} */
  function wordInfo(w, override) {
    if (/^\d+$/.test(w)) return { w: w, py: w, es: w, num: true };
    var d = D.dic[w];
    if (d) return { w: w, py: override || d[0], es: d[1], t: d[2], nv: d[3] };
    if (isNumZh(w)) return { w: w, py: override || numPinyin(w), es: C.hanziKey(w), num: true };
    return { w: w, py: override || "", es: "" };
  }

  /** "我 叫 大卫 。 ¶ …" → [[{w,py,es}|{p:"。"}, …], …] (párrafos) */
  function tokensFromText(text) {
    var paras = [[]];
    text.split(/\s+/).filter(Boolean).forEach(function (tok) {
      if (tok === "¶") { paras.push([]); return; }
      var parts = tok.split("|");
      if (isPunct(parts[0])) paras[paras.length - 1].push({ p: parts[0] });
      else paras[paras.length - 1].push(wordInfo(parts[0], parts[1]));
    });
    paras = paras.filter(function (p) { return p.length; });
    fixSandhi(paras);
    return paras;
  }

  /** Troceado por máxima coincidencia con el diccionario (textos de hanzi seguidos). */
  function segment(text) {
    var out = [], i = 0, n = text.length;
    while (i < n) {
      var c = text[i];
      if (/\s/.test(c)) { i++; continue; }
      if (PUNCT.indexOf(c) >= 0) { out.push({ p: c }); i++; continue; }
      if (/\d/.test(c)) { var j = i; while (j < n && /\d/.test(text[j])) j++; out.push(wordInfo(text.slice(i, j))); i = j; continue; }
      var found = null;
      for (var L = Math.min(6, n - i); L >= 2; L--) { if (D.dic[text.substr(i, L)]) { found = text.substr(i, L); break; } }
      if (!found && isNumZh(c)) { var k = i; while (k < n && isNumZh(text[k])) k++; found = text.slice(i, k); }
      if (!found) found = c;
      out.push(wordInfo(found));
      i += found.length;
    }
    fixSandhi([out]);
    return out;
  }

  /** 不 → bú delante de 4.º tono. */
  function fixSandhi(paras) {
    paras.forEach(function (p) {
      for (var i = 0; i < p.length; i++) {
        var t = p[i];
        if (t.w === "不" && t.py === "bù") {
          var nx = p[i + 1];
          if (nx && nx.py && firstTone(nx.py) === 4) t.py = "bú";
        }
      }
    });
  }

  function capFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  // ======================================================================
  // voz: audio grabado o voz del navegador
  // ======================================================================
  var SPEEDS = [
    { k: "muylento", zh: "很慢", es: "Muy lento", file: "muylento", rate: 1, tts: 0.45 },
    { k: "lento", zh: "慢", es: "Lento", file: "lento", rate: 1, tts: 0.6 },
    { k: "medio", zh: "中", es: "Medio", file: "medio", rate: 1, tts: 0.8 },
    { k: "normal", zh: "正常", es: "Normal", file: "normal", rate: 1, tts: 1 }
  ];
  function speedObj(k) { return SPEEDS.filter(function (s) { return s.k === k; })[0] || SPEEDS[1]; }
  function manifest() { return window.HSK_AUDIO && window.HSK_AUDIO.files ? window.HSK_AUDIO.files : null; }
  function recorded(id) { var m = manifest(); return !!(m && id && m[id] && m[id].normal); }
  /** Fichero que toca para esa velocidad. Los audios antiguos no tienen "muy lento" grabado: se usa el lento un poco más despacio. */
  function audioFile(id, sp) {
    var m = manifest(), e = m && m[id];
    if (sp.file === "muylento" && !(e && e.muylento)) return { file: "lento", rate: 0.8 };
    return { file: sp.file, rate: sp.rate };
  }

  var TTS = {
    voices: [],
    load: function () {
      if (!("speechSynthesis" in window)) return;
      var all = speechSynthesis.getVoices();
      var zh = all.filter(function (v) { return /^zh/i.test(v.lang) && !/HK|yue|Cantonese/i.test(v.lang + v.name); });
      zh.sort(function (a, b) { return score(b) - score(a); });
      function score(v) {
        var s = 0;
        if (/zh[-_]CN/i.test(v.lang)) s += 10;
        if (/Natural|Neural|Online|Premium|Enhanced|Xiaoxiao|Yunxi|Google/i.test(v.name)) s += 5;
        if (/Tingting|Ting-Ting|Lili|Meijia/i.test(v.name)) s += 2;
        return s;
      }
      TTS.voices = zh;
    },
    pick: function (g) {
      if (!TTS.voices.length) TTS.load();
      if (S.settings.voice) {
        var chosen = TTS.voices.filter(function (v) { return v.name === S.settings.voice; })[0];
        if (chosen) return chosen;
      }
      var male = /Yunxi|Yunjian|Yunyang|Kangkang|Male|男|Li-mu|Liang/i;
      var list = TTS.voices;
      var pref = list.filter(function (v) { return g === "m" ? male.test(v.name) : !male.test(v.name); });
      return (pref[0] || list[0]) || null;
    },
    available: function () { if (!TTS.voices.length) TTS.load(); return "speechSynthesis" in window; }
  };
  if ("speechSynthesis" in window) { TTS.load(); speechSynthesis.onvoiceschanged = TTS.load; }

  var CURRENT = null;          // reproductor que suena ahora
  function stopAll() { if (CURRENT) CURRENT.stop(); if ("speechSynthesis" in window) speechSynthesis.cancel(); }

  /**
   * Reproductor. opts: {id, lines: [{zh, v}], onLine(i|-1), label}
   * Si el audio está grabado usa el MP3; si no, la voz del navegador.
   */
  function Player(opts) {
    var self = this;
    this.opts = opts;
    this.rec = recorded(opts.id);
    this.audio = null;
    this.playing = false;
    this.stopAt = null;
    this.lineIdx = -1;

    var btn = h("button", { class: "play", type: "button", "aria-label": "Reproducir", onclick: function () { self.toggle(); } }, icon("play", 30));
    var bar = h("i");
    var prog = h("div", { class: "prog", onclick: function (e) {
      if (!self.rec || !self.audio || !self.audio.duration) return;
      var r = e.currentTarget.getBoundingClientRect();
      self.audio.currentTime = (e.clientX - r.left) / r.width * self.audio.duration;
    } }, bar);
    var timeL = h("span", { text: "0:00" });
    var srcTag = h("span", { class: "src-tag" + (this.rec ? " rec" : ""), text: this.rec ? "Voz nativa grabada" : "Voz del navegador" });
    var replay = h("button", { class: "icon-btn", type: "button", title: "Volver a empezar", "aria-label": "Volver a empezar", onclick: function () { self.play(true); } }, icon("replay", 18));
    var chips = SPEEDS.map(function (sp) {
      return h("button", { type: "button", class: "chip" + (S.settings.speed === sp.k ? " on" : ""), "data-k": sp.k, onclick: function () {
        S.settings.speed = sp.k; persist();
        self.el.querySelectorAll(".speeds .chip").forEach(function (c) { c.classList.toggle("on", c.getAttribute("data-k") === sp.k); });
        var was = self.playing; self.stop(); self.audio = null; if (was) self.play(true);
      } }, h("span", { class: "zh", text: sp.zh }), sp.es);
    });
    this.btn = btn; this.bar = bar; this.timeL = timeL;
    this.el = h("div", { class: "player" + (opts.compact ? " compact" : "") },
      h("div", { class: "player-main" }, btn,
        h("div", { class: "track" }, prog, h("div", { class: "meta" }, h("span", { text: opts.label || "" }), h("span", null, srcTag, " ", timeL))),
        replay),
      h("div", { class: "speeds" }, h("span", { class: "lbl", text: "Velocidad" }), chips));
  }
  Player.prototype.speed = function () { return speedObj(S.settings.speed); };
  Player.prototype.setPlaying = function (on) {
    this.playing = on;
    this.btn.classList.toggle("playing", on);
    this.btn.innerHTML = "";
    this.btn.appendChild(icon(on ? "pause" : "play", 30));
    if (!on) { this.lineIdx = -1; if (this.opts.onLine) this.opts.onLine(-1); }
  };
  Player.prototype.ensureAudio = function () {
    var sp = audioFile(this.opts.id, this.speed()), self = this;
    if (this.audio && this.audio._file === sp.file) { this.audio.playbackRate = sp.rate; return this.audio; }
    var a = new Audio("audio/" + sp.file + "/" + this.opts.id + ".mp3");
    a._file = sp.file;
    a.preload = "auto";
    a.playbackRate = sp.rate;
    a.addEventListener("timeupdate", function () {
      if (a.duration) self.bar.style.width = (a.currentTime / a.duration * 100) + "%";
      self.timeL.textContent = fmt(a.currentTime) + " / " + fmt(a.duration || 0);
      var cues = self.cues();
      if (cues && self.opts.onLine) {
        var idx = 0;
        for (var i = 0; i < cues.length; i++) if (a.currentTime + 0.05 >= cues[i]) idx = i;
        if (idx !== self.lineIdx) { self.lineIdx = idx; self.opts.onLine(idx); }
      }
      if (self.stopAt !== null && a.currentTime >= self.stopAt) { a.pause(); self.stopAt = null; self.setPlaying(false); }
    });
    a.addEventListener("ended", function () { self.setPlaying(false); });
    a.addEventListener("error", function () {
      // El MP3 no está: se pasa a la voz del navegador.
      self.rec = false; self.audio = null;
      var tag = self.el.querySelector(".src-tag"); if (tag) { tag.textContent = "Voz del navegador"; tag.classList.remove("rec"); }
      if (self.playing) { self.setPlaying(false); self.play(true); }
    });
    this.audio = a;
    return a;
  };
  Player.prototype.cues = function () {
    var m = manifest(); if (!m || !m[this.opts.id]) return null;
    var e = m[this.opts.id][audioFile(this.opts.id, this.speed()).file]; return e ? e.c : null;
  };
  Player.prototype.toggle = function () { if (this.playing) this.stop(); else this.play(false); };
  Player.prototype.play = function (fromStart) {
    if (CURRENT && CURRENT !== this) CURRENT.stop();
    CURRENT = this;
    this.stopAt = null;
    if (this.rec) {
      var a = this.ensureAudio();
      if (fromStart || a.ended) a.currentTime = 0;
      var p = a.play(); if (p && p.catch) p.catch(function () {});
      this.setPlaying(true);
    } else {
      this.speakFrom(0, this.opts.lines.length);
    }
  };
  Player.prototype.playLine = function (i) {
    if (CURRENT && CURRENT !== this) CURRENT.stop();
    CURRENT = this;
    var cues = this.rec ? this.cues() : null;
    if (this.rec && cues) {
      var a = this.ensureAudio();
      a.currentTime = cues[i];
      this.stopAt = i + 1 < cues.length ? cues[i + 1] - 0.08 : null;
      var p = a.play(); if (p && p.catch) p.catch(function () {});
      this.setPlaying(true);
    } else {
      this.speakFrom(i, i + 1);
    }
  };
  Player.prototype.speakFrom = function (from, to) {
    var self = this;
    if (!TTS.available()) { alert("Este navegador no tiene voz para leer en chino y los audios aún no están grabados."); return; }
    speechSynthesis.cancel();
    var sp = this.speed(), lines = this.opts.lines, total = to - from;
    var voiceCount = TTS.voices.length;
    this.setPlaying(true);
    var i = from;
    function next() {
      if (!self.playing || i >= to) { self.setPlaying(false); self.bar.style.width = "0%"; return; }
      var ln = lines[i];
      var u = new SpeechSynthesisUtterance(ln.zh);
      u.lang = "zh-CN";
      var g = (ln.v || "f1").charAt(0);
      var v = TTS.pick(g); if (v) u.voice = v;
      u.rate = sp.tts;
      // Con una sola voz disponible, el tono distingue a los personajes.
      var n = +(ln.v || "f1").charAt(1) || 1;
      u.pitch = voiceCount > 1 && !S.settings.voice ? 1 : (g === "m" ? 0.75 : 1.15) + (n - 1) * 0.12;
      if (self.opts.onLine) { self.lineIdx = i; self.opts.onLine(i); }
      self.bar.style.width = ((i - from) / total * 100) + "%";
      self.timeL.textContent = (i - from + 1) + " / " + total;
      u.onend = function () { i++; setTimeout(next, 350 / sp.tts); };
      u.onerror = function () { self.setPlaying(false); };
      speechSynthesis.speak(u);
    }
    next();
  };
  Player.prototype.stop = function () {
    if (this.audio) this.audio.pause();
    if (!this.rec && "speechSynthesis" in window) speechSynthesis.cancel();
    this.stopAt = null;
    if (this.playing) this.setPlaying(false);
  };
  function fmt(t) { t = Math.max(0, Math.round(t || 0)); return Math.floor(t / 60) + ":" + ("0" + t % 60).slice(-2); }

  /** Reproduce una palabra o frase suelta (botones de altavoz). */
  function speakOnce(zh, id) {
    stopAll();
    if (id && recorded(id)) {
      var sp = audioFile(id, speedObj(S.settings.speed));
      var a = new Audio("audio/" + sp.file + "/" + id + ".mp3");
      a.playbackRate = sp.rate;
      a.play().catch(function () {});
      CURRENT = { stop: function () { a.pause(); } };
      return;
    }
    if (!TTS.available()) return;
    var u = new SpeechSynthesisUtterance(zh);
    u.lang = "zh-CN"; var v = TTS.pick("f"); if (v) u.voice = v;
    u.rate = Math.max(0.55, speedObj(S.settings.speed).tts);
    speechSynthesis.speak(u);
  }
  function wordAudioId(zh) { if (D.wau && D.wau[zh]) return D.wau[zh]; var v = D.vocab["v-" + zh]; return v ? v.au : null; }

  // ======================================================================
  // ventanita de palabra
  // ======================================================================
  var POP = null;
  function closePop() {
    if (POP) { POP.remove(); POP = null; }
    document.querySelectorAll(".w.sel").forEach(function (x) { x.classList.remove("sel"); });
  }
  function nvLabel(nv) { return nv === "HSK1" ? "HSK 1" : nv === "HSK2" ? "HSK 2" : nv === "libro" ? "del libro" : nv; }
  function showPop(anchor, info, mode) {
    closePop();
    anchor.classList.add("sel");
    var temaTxt = info.t && info.t < 90 ? "Lección " + info.t + (info.nv ? " · " + nvLabel(info.nv) : "") : info.t === 0 ? "HSK 1" : (info.num ? "Número" : "");
    POP = h("div", { class: "pop", role: "dialog" },
      h("button", { class: "icon-btn", type: "button", "aria-label": "Escuchar", onclick: function (e) { e.stopPropagation(); speakOnce(info.w, wordAudioId(info.w)); } }, icon("speaker", 18)),
      mode === "py" ? h("div", { class: "pp", style: "font-size:24px", text: info.py }) : null,
      h("div", { class: "pz", text: info.w }),
      mode !== "py" ? h("div", { class: "pp", text: info.py }) : null,
      h("div", { class: "pe", text: info.es || "—" }),
      temaTxt ? h("div", { class: "pt", text: temaTxt }) : null);
    document.body.appendChild(POP);
    var r = anchor.getBoundingClientRect();
    var top = window.scrollY + r.bottom + 8, left = window.scrollX + r.left;
    left = Math.min(left, window.scrollX + document.documentElement.clientWidth - POP.offsetWidth - 12);
    POP.style.top = top + "px"; POP.style.left = Math.max(12, left) + "px";
  }
  document.addEventListener("click", function (e) {
    if (POP && !POP.contains(e.target) && !e.target.closest(".w")) closePop();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePop(); });

  /**
   * Pinta palabras clicables.
   * mode "zh": hanzi (ventanita con pinyin + español) · "py": pinyin (ventanita con hanzi)
   * ruby: añade encima el pinyin (zh) o el hanzi (py)
   * opts.onReveal(t): se llama la primera vez que se abre cada palabra (ayudas que restan puntos)
   */
  function renderWords(tokens, mode, ruby, opts) {
    var frag = [], sentenceStart = true;
    tokens.forEach(function (t, i) {
      if (t.p) {
        var p = mode === "py" ? (PUNCT_PY[t.p] || t.p) : t.p;
        frag.push(h("span", { class: "pu", text: p + (mode === "py" ? " " : "") }));
        if (/[。？！.?!]/.test(t.p)) sentenceStart = true;
        return;
      }
      var label = mode === "py" ? (sentenceStart ? capFirst(t.py) : t.py) : t.w;
      sentenceStart = false;
      var inner;
      if (ruby) inner = h("ruby", null, label, h("rt", { text: mode === "py" ? t.w : t.py }));
      else inner = label;
      var clickable = !!(t.es || t.py) && !t.plain;
      var span = h("span", { class: "w" + (clickable ? "" : " plain"), tabindex: clickable ? "0" : null }, inner);
      if (clickable) {
        var open = function () {
          if (opts && opts.onReveal && !span.classList.contains("seen")) { span.classList.add("seen"); opts.onReveal(t); }
          showPop(span, t, mode);
        };
        span.addEventListener("click", function (e) { e.stopPropagation(); open(); });
        span.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
      }
      frag.push(span);
      if (mode === "py") {
        var nx = tokens[i + 1];
        if (!nx || !nx.p) frag.push(" ");
      }
    });
    return frag;
  }

  /**
   * Todo el chino de la app se puede tocar: busca los hanzi que haya en los
   * textos (explicaciones, preguntas, títulos…) y los convierte en palabras
   * clicables con pinyin, traducción y audio.
   */
  var CJK_RUN = /([\u3400-\u9fff]+)/;
  var ZH_SKIP = "a,button,input,textarea,select,option,label.opt,.w,.pop,rt,.brush,.big-zh,.stamp,.big-stamp,.ime,.tile,.tiles-bank,.tiles-answer,.no-zh,svg,script,style";
  var ZH_BIG = ".zh,.tr-zh,.g-big,.g-f,.text-body,.big";
  function zhify(root) {
    if (!root) return;
    if (root.nodeType === 3) root = root.parentNode;
    if (!root || root.nodeType !== 1 || (root.closest && root.closest(ZH_SKIP))) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [];
    while (walker.nextNode()) {
      var n = walker.currentNode;
      if (CJK_RUN.test(n.nodeValue) && n.parentNode && !n.parentNode.closest(ZH_SKIP)) list.push(n);
    }
    list.forEach(function (n) {
      var parent = n.parentNode; if (!parent) return;
      var big = !!parent.closest(ZH_BIG);
      var frag = document.createDocumentFragment();
      n.nodeValue.split(CJK_RUN).forEach(function (part, i) {
        if (!part) return;
        if (i % 2) add(frag, h("span", { class: "zi" + (big ? "" : " inl"), lang: "zh-CN" }, renderWords(segment(part), "zh")));
        else frag.appendChild(document.createTextNode(part));
      });
      parent.replaceChild(frag, n);
    });
  }
  if (window.MutationObserver) {
    new MutationObserver(function (muts) {
      muts.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1 || n.nodeType === 3) zhify(n); }); });
    }).observe(APP, { childList: true, subtree: true });
  }

  // ======================================================================
  // campo de pinyin con ayuda para los tonos
  // ======================================================================
  function pinyinInput(opts) {
    opts = opts || {};
    var inp = h(opts.multiline ? "textarea" : "input", {
      class: "inp py", type: "text", autocomplete: "off", autocapitalize: "off", autocorrect: "off", spellcheck: "false",
      placeholder: opts.placeholder || "Escribe en pinyin: nǐ hǎo  ·  o con números: ni3 hao3",
      "aria-label": opts.label || "Respuesta en pinyin"
    });
    inp.addEventListener("input", function () {
      if (!S.settings.autoTone) return;
      var pos = inp.selectionStart, before = inp.value;
      var conv = C.numbersToMarks(before.replace(/v/g, "ü").replace(/V/g, "Ü"));
      if (conv !== before) {
        var delta = conv.length - before.length;
        inp.value = conv;
        try { inp.setSelectionRange(pos + delta, pos + delta); } catch (e) { /* nada */ }
      }
    });
    if (opts.onEnter) inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); opts.onEnter(e); } });
    var tones = [["ˉ", 1, "Primer tono (ā)"], ["ˊ", 2, "Segundo tono (á)"], ["ˇ", 3, "Tercer tono (ǎ)"], ["ˋ", 4, "Cuarto tono (à)"]];
    var bar = h("div", { class: "tonebar" },
      tones.map(function (t) {
        return h("button", { type: "button", title: t[2], "aria-label": t[2], onmousedown: function (e) { e.preventDefault(); }, onclick: function () {
          var r = C.toneAtCaret(inp.value, inp.selectionStart == null ? inp.value.length : inp.selectionStart, t[1]);
          inp.value = r.value; inp.focus(); try { inp.setSelectionRange(r.caret, r.caret); } catch (e) { /* nada */ }
        } }, t[0]);
      }),
      h("button", { type: "button", title: "ü", onmousedown: function (e) { e.preventDefault(); }, onclick: function () {
        var p = inp.selectionStart == null ? inp.value.length : inp.selectionStart;
        inp.value = inp.value.slice(0, p) + "ü" + inp.value.slice(p); inp.focus(); try { inp.setSelectionRange(p + 1, p + 1); } catch (e) { /* nada */ }
      } }, "ü"),
      h("span", { class: "hint" }, S.settings.autoTone ? "Tras la sílaba, escribe 1-4 (hao3 → hǎo) o pulsa un tono · " : "Pulsa un tono tras escribir la sílaba · ",
        h("a", { href: "#/teclado", tabindex: "-1", text: "ayuda" })));
    return { input: inp, el: h("div", { class: "field" }, inp, bar) };
  }

  // ======================================================================
  // teclado de la app: pinyin → hanzi con el vocabulario del curso
  // ======================================================================
  var IME_INDEX = null;
  function imeKey(py) { return C.stripMarks(py.toLowerCase()).replace(/ü/g, "v").replace(/[^a-z]/g, ""); }
  function imeIndex() {
    if (IME_INDEX) return IME_INDEX;
    IME_INDEX = Object.keys(D.dic).map(function (w) {
      var d = D.dic[w];
      return { w: w, key: imeKey(d[0]), py: d[0], es: d[1], t: d[2] || 99 };
    }).filter(function (e) { return e.key; });
    return IME_INDEX;
  }
  function imeCandidates(s) {
    if (!s) return [];
    var idx = imeIndex(), out = [], seen = {};
    function push(e) { if (!seen[e.w]) { seen[e.w] = 1; out.push(e); } }
    // 1) palabras que empiezan por lo escrito (la exacta primero)
    idx.filter(function (e) { return e.key.indexOf(s) === 0; })
      .sort(function (a, b) { return (a.key === s ? 0 : 1) - (b.key === s ? 0 : 1) || a.key.length - b.key.length || a.t - b.t; })
      .forEach(push);
    // 2) palabras que son el principio de lo escrito ("woxiang" → 我)
    idx.filter(function (e) { return s.indexOf(e.key) === 0 && e.key !== s; })
      .sort(function (a, b) { return b.key.length - a.key.length || a.t - b.t; })
      .forEach(push);
    return out.slice(0, 9);
  }

  /** Escribir hanzi sin instalar nada: se teclea pinyin (sin tonos) y se elige la palabra. */
  function hanziIME(opts) {
    var outText = "";
    var out = h("div", { class: "ime-out zh", "aria-live": "polite" });
    var inp = h("input", { class: "inp py", type: "text", autocomplete: "off", autocapitalize: "off", autocorrect: "off", spellcheck: "false",
      placeholder: "Pinyin sin tonos: woxiang…", "aria-label": "Pinyin para convertir en hanzi" });
    var cands = h("div", { class: "ime-cands" });
    var list = [];
    function paintOut() {
      out.innerHTML = "";
      if (outText) add(out, outText); else add(out, h("span", { class: "muted", style: "font-size:15px;font-family:var(--font-ui)", text: "Aquí aparece tu frase en hanzi" }));
      add(out, h("span", { class: "ime-caret" }));
    }
    function letters() { return inp.value.toLowerCase().replace(/ü/g, "v").replace(/[^a-z]/g, ""); }
    function paintCands() {
      var s = letters();
      list = imeCandidates(s);
      cands.innerHTML = "";
      if (s && !list.length) add(cands, h("span", { class: "muted", style: "font-size:14px", text: "Ninguna palabra del curso empieza así" }));
      list.forEach(function (e, i) {
        add(cands, h("button", { type: "button", class: "ime-c", title: e.py + " · " + e.es, onmousedown: function (ev) { ev.preventDefault(); }, onclick: function () { pick(i); } },
          h("small", { text: i + 1 }), h("span", { class: "zh", text: e.w }), h("em", { text: e.py })));
      });
    }
    function pick(i) {
      var e = list[i]; if (!e) return;
      outText += e.w;
      SND.sfx("tick");
      var s = letters();
      inp.value = s.indexOf(e.key) === 0 ? s.slice(e.key.length) : "";
      paintOut(); paintCands(); inp.focus();
    }
    inp.addEventListener("input", paintCands);
    inp.addEventListener("keydown", function (e) {
      if (e.isComposing) return;
      if ((e.key === " " || e.key === "Enter") && letters()) { e.preventDefault(); pick(0); return; }
      if (/^[1-9]$/.test(e.key) && letters()) { e.preventDefault(); pick(+e.key - 1); return; }
      if (e.key === "Backspace" && !inp.value && outText) { e.preventDefault(); outText = outText.slice(0, -1); paintOut(); return; }
      if (e.key === "Enter") { e.preventDefault(); if (opts.onEnter) opts.onEnter(); }
    });
    paintOut();
    var el = h("div", { class: "ime" }, out, inp, cands,
      h("div", { class: "btn-row", style: "margin-top:8px" },
        h("button", { type: "button", class: "btn soft sm", onclick: function () { outText = outText.slice(0, -1); paintOut(); inp.focus(); } }, "⌫ Borrar un carácter"),
        h("button", { type: "button", class: "btn soft sm", onclick: function () { outText = ""; inp.value = ""; paintOut(); paintCands(); inp.focus(); } }, "Borrar todo"),
        h("span", { class: "muted", style: "font-size:13px" }, h("span", { class: "kbd", text: "Espacio" }), " elige la 1.ª · ", h("span", { class: "kbd", text: "1-9" }), " elige otra")));
    return { el: el, value: function () { return outText + (letters() ? "" : ""); }, focus: function () { inp.focus(); } };
  }

  /** Ayudas que restan: cada palabra que se abre quita un 10 % de la nota de esa frase. */
  var HELP_COST = 0.1;
  function helpCounter() {
    var n = 0, locked = false;
    var el = h("div", { class: "help-note" }, "Toca una palabra si no la sabes · cada ayuda resta un 10 %");
    function paint() {
      el.textContent = n ? "Ayudas usadas: " + n + " (−" + Math.round(n * HELP_COST * 100) + " %)" : "Toca una palabra si no la sabes · cada ayuda resta un 10 %";
      el.classList.toggle("used", n > 0);
    }
    return {
      el: el,
      reveal: function () { if (locked) return; n++; SND.sfx("tick"); paint(); },
      lock: function () { locked = true; },
      count: function () { return n; },
      apply: function (score) { return Math.max(0, Math.round((score - n * HELP_COST) * 100) / 100); },
      note: function () { return n ? " · " + n + (n === 1 ? " ayuda" : " ayudas") + " (−" + Math.round(n * HELP_COST * 100) + " %)" : ""; }
    };
  }

  function marksView(marks, ign) {
    return marks.map(function (m) {
      var st = m.st === "tone" && ign ? "ok" : m.st;
      return st ? h("span", { class: "syl " + st, text: m.text }) : m.text;
    });
  }
  function stampText(level) { return level === "ok" ? "对" : level === "mid" ? "差一点" : "错"; }
  function feedbackTitle(level, extra) {
    if (level === "ok") return extra || "¡Correcto! 很好！";
    if (level === "mid") return extra || "¡Casi! Revisa lo marcado.";
    return extra || "No es correcto. Compara con la respuesta.";
  }

  function burst() {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var colors = ["#1d4f9e", "#c39a3e", "#6d9cf0", "#f26b3a", "#2e7d6b"];
    var b = h("div", { class: "burst" });
    for (var i = 0; i < 36; i++) {
      var ang = Math.random() * Math.PI * 2, dist = 120 + Math.random() * 220;
      b.appendChild(h("i", { style: "background:" + colors[i % colors.length] + ";--x:" + Math.cos(ang) * dist + "px;--y:" + Math.sin(ang) * dist + "px" }));
    }
    document.body.appendChild(b);
    setTimeout(function () { b.remove(); }, 1400);
  }

  function resultStamp(p) { return p >= 90 ? "优" : p >= 70 ? "好" : p >= 50 ? "中" : "加油"; }
  function resultMsg(p) {
    return p >= 90 ? "¡Excelente! 太好了！" : p >= 70 ? "¡Muy bien! 很好！" : p >= 50 ? "Vas bien. Repite los fallos para afianzar." : "¡Ánimo! 加油！ Repítelo a velocidad más lenta.";
  }

  // ======================================================================
  // vistas
  // ======================================================================
  function setNav(route) {
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.classList.toggle("on", a.getAttribute("data-r") === route);
    });
    document.querySelector(".nav").classList.remove("open");
  }
  function view(route, nodes) {
    stopAll(); closePop();
    setNav(route);
    APP.innerHTML = "";
    add(APP, h("div", { class: "fade-in" }, nodes));
    window.scrollTo(0, 0);
  }
  function pageHead(bigZh, title, text) {
    return h("div", { class: "page-h" }, h("div", { class: "big-zh", text: bigZh }), h("div", null, h("h1", { text: title }), text ? h("p", { html: text }) : null));
  }
  function backLink(href, text) { return h("a", { class: "back", href: href }, icon("back", 16), text); }
  function exRow(href, num, title, sub, key) {
    var b = best(key);
    return h("a", { class: "card ex", href: href },
      h("div", { class: "num", text: num }),
      h("div", { class: "t" }, h("b", { text: title }), h("span", { text: sub })),
      h("span", { class: "score " + scoreClass(b), text: b === undefined ? "Nuevo" : b + "%" }));
  }
  function avg(keys) {
    if (!keys.length) return 0;
    var s = 0; keys.forEach(function (k) { s += best(k) || 0; }); return Math.round(s / keys.length);
  }
  function modProgress(kind) {
    if (kind === "D") return avg(D.dictados.map(function (d) { return "D:" + d.id; }));
    if (kind === "L") return avg(D.listenings.map(function (l) { return "L:" + l.id; }));
    if (kind === "R") return avg(D.lecturas.map(function (r) { return "R:" + r.id; }));
    if (kind === "E") { var ek = []; D.temas.forEach(function (t) { ek = ek.concat(ejKeys(t.n)); }); return avg(ek); }
    if (kind === "G") { var gk = []; D.gramatica.forEach(function (g) { g.puntos.forEach(function (p) { gk.push("G:" + p.id); }); }); return avg(gk); }
    var ks = []; D.temas.forEach(function (t) { [1, 2, 3, 4].forEach(function (n) { ks.push("T:" + t.n + ":" + n); }); });
    return avg(ks);
  }

  // ------------------------------------------------------------------ inicio
  var KOI = '<svg viewBox="0 0 120 50"><path d="M8 25 L-2 10 Q10 18 14 25 Q10 32 -2 40 Z" fill="#f7a15a" opacity=".95"/>' +
    '<ellipse cx="55" cy="25" rx="42" ry="15" fill="#fff6ee"/><path d="M40 12 Q60 6 82 16 Q70 24 48 22 Z" fill="#f26b3a"/><circle cx="66" cy="31" r="6" fill="#f26b3a"/><circle cx="36" cy="28" r="4" fill="#f59a5c"/>' +
    '<path d="M50 38 Q56 49 64 40 Z" fill="#f7a15a" opacity=".9"/><path d="M50 12 Q58 0 66 11 Z" fill="#f7a15a" opacity=".9"/>' +
    '<circle cx="88" cy="22" r="2.4" fill="#15213a"/><path d="M96 29 Q104 33 108 38" stroke="#f7a15a" stroke-width="1.5" fill="none"/></svg>';
  var BAMBOO = '<svg viewBox="0 0 170 400" preserveAspectRatio="xMaxYMax slice"><g stroke="#9fd0b0" stroke-width="12" stroke-linecap="round" opacity=".55">' +
    '<path d="M70 400 V0"/><path d="M130 400 V40"/></g><g stroke="#e8f4ec" stroke-width="3" opacity=".6"><path d="M62 90h16M62 190h16M62 290h16M122 130h16M122 230h16M122 330h16"/></g>' +
    '<g class="leaves" fill="#bfe3c9" opacity=".75"><path d="M70 90 q-40 6 -62 26 q34 -4 62 -26z"/><path d="M70 92 q-30 16 -44 44 q30 -14 44 -44z"/><path d="M70 190 q42 4 66 24 q-36 -2 -66 -24z"/></g>' +
    '<g class="leaves b" fill="#bfe3c9" opacity=".7"><path d="M130 130 q34 8 40 30 q-26 -10 -40 -30z"/><path d="M130 230 q-38 8 -56 30 q32 -6 56 -30z"/><path d="M130 232 q-20 22 -22 50 q18 -22 22 -50z"/></g></svg>';
  var WAVES = '<svg class="hero-mountains" viewBox="0 0 1200 120" preserveAspectRatio="none"><defs><pattern id="ola" width="80" height="40" patternUnits="userSpaceOnUse">' +
    '<path d="M0 40 a40 40 0 0 1 80 0" fill="#0f2d63" stroke="#8fb4ea" stroke-width="2"/><path d="M12 40 a28 28 0 0 1 56 0" fill="none" stroke="#8fb4ea" stroke-width="2"/><path d="M24 40 a16 16 0 0 1 32 0" fill="none" stroke="#8fb4ea" stroke-width="2"/>' +
    '<path d="M-40 20 a40 40 0 0 1 80 0 M40 20 a40 40 0 0 1 80 0" fill="none" stroke="#8fb4ea" stroke-width="2"/></pattern></defs>' +
    '<rect x="0" y="40" width="1200" height="80" fill="url(#ola)" opacity=".8"/></svg>';

  function viewHome() {
    var rec = manifest() ? Object.keys(manifest()).length : 0;
    var mods = [
      { href: "#/gramatica", ico: "bulb", t: "Gramática", zh: "语法", wm: "法", p: "Las reglas de cada lección explicadas en español, con ejemplos que puedes escuchar y minitests.", k: "G", n: D.gramatica.reduce(function (s, g) { return s + g.puntos.length; }, 0) + " puntos" },
      { href: "#/ejercicios", ico: "list", t: "Ejercicios", zh: "练习", wm: "练", p: "Práctica de cada punto de gramática y de todo el vocabulario: elegir, ordenar, traducir, escuchar y leer. Con examen por lección.", k: "E", n: (D.ejercicios || []).reduce(function (s, t) { return s + t.puntos.length; }, 0) + " puntos · 15 exámenes" },
      { href: "#/dictado", ico: "pen", t: "Dictado", zh: "听写", wm: "听写", p: "Escucha frases y palabras y escríbelas en pinyin, con corrección sílaba a sílaba y de tonos.", k: "D", n: D.dictados.length + " dictados" },
      { href: "#/listening", ico: "ear", t: "Listening", zh: "听力", wm: "听", p: "Diálogos con voces nativas a 4 velocidades y 5 preguntas en pinyin o español.", k: "L", n: D.listenings.length + " diálogos" },
      { href: "#/lectura", ico: "book", t: "Lectura", zh: "阅读", wm: "读", p: "Textos en hanzi, con pinyin encima (nivel 1) o sin él (nivel 2). Toca cada palabra para ver su pinyin y significado.", k: "R", n: D.lecturas.length + " lecturas" },
      { href: "#/traduccion", ico: "swap", t: "Traducción", zh: "翻译", wm: "译", p: "Cuatro niveles: hanzi con pinyin→español, español→pinyin, hanzi→español y español→hanzi.", k: "T", n: "15 lecciones × 4 niveles" }
    ];
    var decor = [h("div", { class: "bamboo", "aria-hidden": "true", html: BAMBOO }),
      h("div", { class: "koi", "aria-hidden": "true", style: "top:52%", html: KOI }),
      h("div", { class: "koi k2", "aria-hidden": "true", style: "top:30%", html: KOI })];
    view("home", [
      h("section", { class: "hero" },
        decor,
        h("h1", null, h("span", { class: "brush", text: "加油！" }), "Repasa todo el HSK 2"),
        h("p", { text: "Gramática explicada en español, dictados, listenings, lecturas y traducciones de las 15 lecciones del curso. Escucha a tu ritmo: cada audio tiene cuatro velocidades." }),
        h("div", { class: "cta" },
          h("a", { class: "btn", href: "#/dictado" }, icon("pen", 18), "Empezar por un dictado"),
          h("a", { class: "btn ghost", href: "#temas" }, "Elegir una lección")),
        h("div", { html: WAVES })),
      h("div", { class: "sec-h" }, h("span", { class: "brush", text: "练习" }), h("h2", { text: "Tipos de ejercicio" })),
      h("div", { class: "grid g4" }, mods.map(function (m) {
        var p = modProgress(m.k);
        return h("a", { class: "card mod", href: m.href },
          h("span", { class: "wm", text: m.wm }),
          h("div", { class: "ico" }, icon(m.ico, 24)),
          h("h3", null, m.t, h("span", { class: "zh", text: m.zh })),
          h("p", { text: m.p }),
          h("div", { class: "bar" }, h("i", { style: "width:" + p + "%" })),
          h("div", { class: "bar-l" }, h("span", { text: m.n }), h("span", { text: p + "%" })));
      })),
      h("div", { class: "sec-h", id: "temas" }, h("span", { class: "brush", text: "课文" }), h("h2", { text: "Repasar por lección" }),
        h("p", { text: "Cada lección reúne su gramática, dictados, listenings, lecturas y traducciones." })),
      h("div", { class: "temas" }, D.temas.map(function (t) {
        return h("a", { class: "tema", href: "#/tema/" + t.n },
          h("span", { class: "n", text: CN_NUM[t.n] }),
          h("div", null, h("b", { text: t.es }), h("span", { class: "zh", text: t.zh })));
      })),
      h("div", { class: "sec-h" }, h("span", { class: "brush", text: "键盘" }), h("h2", { text: "¿Cómo escribo pinyin y hanzi?" })),
      h("a", { class: "note", href: "#/teclado", style: "display:block;text-decoration:none;color:var(--ink-2)" },
        h("b", { text: "No hace falta instalar nada. " }), "El pinyin se escribe con el teclado normal (hao3 → hǎo, o con los botones de tono) y los hanzi, con fichas o con el teclado de la app. Toca aquí si quieres instalar también el teclado chino en tu móvil u ordenador →"),
      h("div", { class: "sec-h" }, h("span", { class: "brush", text: "声音" }), h("h2", { text: "Sobre el audio" })),
      h("div", { class: "note" }, rec
        ? h("span", null, h("b", { text: "Voces nativas grabadas: " }), rec + " audios en cuatro velocidades (muy lento, lento, medio y normal).")
        : h("span", null, h("b", { text: "Aún no hay audios grabados. " }), "Mientras tanto se usa la voz china de tu navegador. Para grabar las voces neuronales, sigue las instrucciones del README del repositorio (pestaña Actions → «Grabar los audios»)."))
    ]);
  }

  // ------------------------------------------------------------------- tema
  function viewTema(n) {
    var t = TEMA[n]; if (!t) return viewHome();
    var dic = D.dictados.filter(function (d) { return d.tema === n; });
    var ls = D.listenings.filter(function (l) { return l.tema === n; });
    var rs = D.lecturas.filter(function (r) { return r.tema === n; });
    var TR = trLevels();
    view("tema", h("div", null,
      backLink("#/", "Inicio"),
      pageHead(CN_NUM[n], "Lección " + n + " · " + t.es, '<span class="zh" style="font-size:20px">' + t.zh + "</span>"),
      h("div", { class: "group-h", text: "Gramática · 语法" }),
      h("div", { class: "grid g3" }, (GRAM[n] ? GRAM[n].puntos : []).map(function (p) { return exRow("#/gramatica/" + n + "/" + p.id, "法", p.titulo, p.zh, "G:" + p.id); })),
      EJ[n] ? [h("div", { class: "group-h", text: "Ejercicios · 练习" }),
        h("div", { class: "grid g3" },
          exRowAvg("#/ejercicios/" + n, "练", "Zona de ejercicios", EJ[n].puntos.length + " puntos de gramática · vocabulario · examen", ejKeys(n)),
          exRow("#/ejercicios/" + n + "/examen", "考", "Examen de la lección " + n, "Todo mezclado", "E:" + n + ":examen"))] : null,
      h("div", { class: "group-h", text: "Dictado · 听写" }),
      h("div", { class: "grid g3" }, dic.map(function (d) { return exRow("#/dictado/" + d.id, d.grupo === "vocabulario" ? "词" : "句", d.titulo, d.items.length + (d.grupo === "vocabulario" ? " palabras" : " frases"), "D:" + d.id); })),
      h("div", { class: "group-h", text: "Listening · 听力" }),
      h("div", { class: "grid g3" }, ls.map(function (l) { return exRow("#/listening/" + l.id, "听", l.titulo, l.lineas.length + " líneas · 5 preguntas", "L:" + l.id); })),
      h("div", { class: "group-h", text: "Lectura · 阅读" }),
      h("div", { class: "grid g3" }, rs.map(function (r) { return exRow("#/lectura/" + r.id, r.nivel === 1 ? "拼" : "汉", r.titulo, "Nivel " + r.nivel + (r.nivel === 1 ? " · hanzi con pinyin" : " · solo hanzi"), "R:" + r.id); })),
      h("div", { class: "group-h", text: "Traducción · 翻译" }),
      h("div", { class: "grid g3" }, TR.map(function (L) { return exRow("#/traduccion/" + n + "/" + L.n, L.icon, "Nivel " + L.n + " · " + L.t, t.frases.length + " frases del tema", "T:" + n + ":" + L.n); }))
    ));
  }

  // ---------------------------------------------------------------- dictado
  function viewDictados() {
    var groups = [
      { k: "frases", t: "Frases de cada tema", d: "Todas las frases del curso, tema a tema." },
      { k: "vocabulario", t: "Vocabulario de cada tema", d: "Palabra a palabra: ideal para afinar los tonos." },
      { k: "especiales", t: "Dictados especiales", d: "Números, edades, precios, fechas, horas y teléfonos." }
    ];
    view("dictado", h("div", null,
      pageHead("听写", "Dictado", "Escucha y escribe en <b>pinyin</b>. Puedes poner los tonos con marcas (<span class=\"py\">nǐ hǎo</span>) o con números (<span class=\"py\">ni3 hao3</span>), que se convierten solos. Las sílabas con el tono mal salen en <span class=\"syl tone\">naranja</span> y las que faltan o sobran, en <span class=\"syl miss\">rojo</span>."),
      groups.map(function (g) {
        var list = D.dictados.filter(function (d) { return d.grupo === g.k; });
        return [h("div", { class: "group-h", text: g.t }),
          h("div", { class: "grid g3" }, list.map(function (d) {
            var num = d.tema ? CN_NUM[d.tema] : d.zh.slice(0, 1);
            return exRow("#/dictado/" + d.id, num, d.titulo, (d.zh !== "词语" ? d.zh + " · " : "") + d.items.length + (g.k === "vocabulario" ? " palabras" : " frases"), "D:" + d.id);
          }))];
      })));
  }

  function runDictado(id, onlyIds) {
    var dct = DICT[id]; if (!dct) return viewDictados();
    var ids = onlyIds || dct.items;
    var items = ids.map(item).filter(Boolean);
    var idx = 0, results = [];
    var wrap = h("div", { class: "ex-wrap" });
    view("dictado", wrap);

    function renderItem() {
      var it = items[idx];
      var checked = false, hinted = false;
      var player = new Player({ id: it.au, lines: [{ zh: it.tts || it.zh, v: "f1" }], label: "Frase " + (idx + 1) + " de " + items.length });
      var pin = pinyinInput({ onEnter: function () { checked ? next() : check(); } });
      var fbBox = h("div");
      var hintBox = h("div", { class: "muted", style: "margin-top:10px;min-height:1.4em" });
      var checkBtn = h("button", { class: "btn", type: "button", onclick: function () { check(); } }, "Comprobar");
      var hintBtn = h("button", { class: "btn soft sm", type: "button", onclick: function () {
        hinted = true;
        hintBox.innerHTML = "";
        add(hintBox, ["Pista: ", h("span", { class: "zh", style: "font-size:22px;color:var(--ink)", text: it.zh }), "  (una respuesta con pista cuenta como media)"]);
      } }, icon("bulb", 16), "Pista: ver hanzi");
      var dots = h("div", { class: "dots" }, items.map(function (_, i) {
        var r = results[i];
        return h("i", { class: i === idx ? "cur" : r ? r.level : "" });
      }));

      function check() {
        if (checked) return;
        if (!pin.input.value.trim()) { pin.input.focus(); pin.input.classList.add("shake"); setTimeout(function () { pin.input.classList.remove("shake"); }, 400); return; }
        checked = true;
        var r = C.comparePinyin(it.py, pin.input.value, ignoreTones());
        var score = hinted ? Math.min(r.score, 0.5) : r.score;
        var level = levelOf(score);
        results[idx] = { level: level, score: score, it: it, answer: pin.input.value };
        SND.sfx(level);
        pin.input.disabled = true;
        var title = r.level === "mid" && r.lettersOk ? "Las sílabas están bien, pero revisa los tonos marcados." : null;
        if (hinted && r.level === "ok") title = "Correcto (con pista).";
        fbBox.innerHTML = "";
        add(fbBox, h("div", { class: "fb " + level },
          h("span", { class: "stamp", text: stampText(level) }),
          h("h4", { text: feedbackTitle(level, title) }),
          h("div", { class: "row" }, h("span", { class: "k", text: "Pinyin correcto" }), h("div", { class: "v py" }, marksView(r.marks, ignoreTones()))),
          h("div", { class: "row" }, h("span", { class: "k", text: "Tu respuesta" }), h("div", { class: "v py", style: "font-size:16px", text: pin.input.value })),
          h("div", { class: "row" }, h("span", { class: "k", text: "Hanzi" }), h("div", { class: "v zh" }, renderWords(segment(it.zh), "zh"))),
          h("div", { class: "row" }, h("span", { class: "k", text: "Significado" }), h("div", { class: "v", style: "font-size:16px", text: it.es.join(" / ") })),
          level !== "ok" ? h("button", { class: "link-btn", type: "button", onclick: function () {
            results[idx].level = "ok"; results[idx].score = 1; SND.sfx("ok"); this.textContent = "Marcada como correcta";
          } }, "Mi respuesta también es correcta") : null));
        checkBtn.textContent = idx + 1 < items.length ? "Siguiente →" : "Ver resultado";
        checkBtn.onclick = next;
        checkBtn.focus();
      }
      function next() { player.stop(); idx++; if (idx < items.length) renderItem(); else finish(); }

      wrap.innerHTML = "";
      add(wrap, [
        h("div", { class: "ex-head" }, backLink("#/dictado", "Dictados"), dots,
          h("h1", null, dct.titulo, h("span", { class: "zh", text: dct.zh }))),
        h("div", { class: "card q-card" },
          h("div", { class: "prompt" }, h("div", { class: "lbl", text: "Escucha y escribe en pinyin" })),
          player.el,
          h("div", { style: "height:16px" }),
          pin.el, hintBox,
          h("div", { class: "btn-row", style: "margin-top:16px" }, checkBtn, hintBtn,
            h("span", { class: "muted", style: "font-size:13px;margin-left:auto" }, h("span", { class: "kbd", text: "Enter" }), " comprobar · ", h("span", { class: "kbd", text: "Mayús+Enter" }), " escuchar otra vez")),
          fbBox)
      ]);
      pin.input.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); player.play(true); } });
      pin.input.focus();
      setTimeout(function () { player.play(true); }, 250);
    }

    function finish() {
      var total = results.reduce(function (s, r) { return s + (r ? r.score : 0); }, 0);
      var p = pct(total / items.length);
      if (!onlyIds) saveResult("D:" + id, p);
      resultSound(p);
      var wrong = results.filter(function (r) { return r.level !== "ok"; }).map(function (r) { return r.it.id; });
      if (p >= 80) burst();
      wrap.innerHTML = "";
      add(wrap, [
        h("div", { class: "ex-head" }, backLink("#/dictado", "Dictados"), h("h1", null, dct.titulo, h("span", { class: "zh", text: dct.zh }))),
        h("div", { class: "card result" },
          h("div", { class: "big-stamp", text: resultStamp(p) }),
          h("div", { class: "pct", text: p + "%" }),
          h("div", { class: "sub", text: resultMsg(p) }),
          h("div", { class: "btn-row", style: "justify-content:center;margin-top:18px" },
            wrong.length ? h("button", { class: "btn", type: "button", onclick: function () { runDictado(id, wrong); } }, "Repetir los " + wrong.length + " fallos") : null,
            h("button", { class: "btn ghost", type: "button", onclick: function () { runDictado(id); } }, "Repetir todo"),
            h("a", { class: "btn soft", href: "#/dictado" }, "Otros dictados")),
          h("div", { class: "review" }, results.map(function (r) {
            return h("div", { class: "it" }, h("span", { class: "m " + r.level, text: r.level === "ok" ? "✓" : r.level === "mid" ? "~" : "✗" }),
              h("div", null, h("div", { class: "zh", text: r.it.zh }), h("div", { class: "py", text: r.it.py }),
                r.level !== "ok" ? h("div", { class: "muted py", style: "font-size:14px", text: "Tú: " + r.answer }) : null),
              h("button", { class: "icon-btn", style: "margin-left:auto", type: "button", "aria-label": "Escuchar", onclick: function () { speakOnce(r.it.tts || r.it.zh, r.it.au); } }, icon("speaker", 16)));
          })))
      ]);
    }
    renderItem();
  }

  // ------------------------------------------------------ preguntas (común)
  function questionsBlock(qs, onDone) {
    var fields = qs.map(function (q, i) {
      var pin = q.lang === "py" ? pinyinInput({ placeholder: "Respuesta en pinyin", label: "Respuesta " + (i + 1) }) : null;
      var inp = pin ? pin.input : h("input", { class: "inp", type: "text", autocomplete: "off", placeholder: "Respuesta en español", "aria-label": "Respuesta " + (i + 1) });
      var res = h("div");
      var card = h("div", { class: "card qq" },
        h("div", { class: "qh" }, h("span", { class: "qn", text: i + 1 }), h("div", { class: "qt" }, q.q,
          h("span", { class: "lang " + q.lang, text: q.lang === "py" ? "responde en pinyin" : "responde en español" }))),
        pin ? pin.el : inp, res);
      return { q: q, inp: inp, res: res, card: card, score: 0 };
    });
    var btn = h("button", { class: "btn", type: "button" }, "Corregir");
    var done = false;
    btn.addEventListener("click", function () {
      if (done) return;
      var empty = fields.filter(function (f) { return !f.inp.value.trim(); });
      if (empty.length === fields.length) { fields[0].inp.focus(); return; }
      done = true;
      fields.forEach(function (f) {
        var r = f.q.lang === "py" ? C.containsPinyin(f.inp.value, f.q.a, ignoreTones()) : C.matchKeywords(f.inp.value, f.q.a);
        if (!f.inp.value.trim()) r = { level: "ko", score: 0 };
        f.score = r.score;
        f.inp.disabled = true;
        f.res.className = "res " + r.level;
        f.res.innerHTML = "";
        add(f.res, [h("b", { text: r.level === "ok" ? "✓ Correcto." : r.level === "mid" ? "~ Casi (revisa los tonos)." : "✗" }),
          h("span", { text: "Respuesta: " + f.q.r })]);
        if (r.level !== "ok") {
          add(f.res, [" ", h("button", { class: "link-btn", type: "button", onclick: function () {
            f.score = 1; f.res.className = "res ok"; SND.sfx("ok"); this.textContent = "Marcada como correcta"; this.disabled = true; update(true);
          } }, "Mi respuesta es correcta")]);
        }
      });
      btn.classList.add("hidden");
      update();
      var tot = fields.reduce(function (s2, f2) { return s2 + f2.score; }, 0);
      resultSound(pct(tot / fields.length));
    });
    var scoreBox = h("div");
    function update(silent) {
      var total = fields.reduce(function (s, f) { return s + f.score; }, 0);
      var p = pct(total / fields.length);
      scoreBox.innerHTML = "";
      add(scoreBox, h("div", { class: "fb " + (p >= 80 ? "ok" : p >= 50 ? "mid" : "ko") },
        h("span", { class: "stamp", text: resultStamp(p) }),
        h("h4", { text: "Resultado: " + p + "% · " + resultMsg(p) }),
        h("div", { class: "muted", text: "Debajo tienes la transcripción/traducción para repasar." })));
      onDone(p);
    }
    return { el: h("div", null, h("div", { class: "qs" }, fields.map(function (f) { return f.card; })), h("div", { class: "btn-row", style: "margin-top:16px" }, btn), scoreBox) };
  }

  // -------------------------------------------------------------- listening
  function viewListenings() {
    view("listening", h("div", null,
      pageHead("听力", "Listening", "Escucha el diálogo (tantas veces como quieras y a la velocidad que prefieras) y responde a las <b>5 preguntas</b> en pinyin o en español. Después verás la transcripción con hanzi, pinyin y traducción, y podrás repetir cada frase."),
      D.temas.map(function (t) {
        var ls = D.listenings.filter(function (l) { return l.tema === t.n; });
        if (!ls.length) return null;
        return [h("div", { class: "group-h", text: "Lección " + t.n + " · " + t.es }),
          h("div", { class: "grid g3" }, ls.map(function (l) { return exRow("#/listening/" + l.id, CN_NUM[t.n], l.titulo, l.escena, "L:" + l.id); }))];
      })));
  }

  function runListening(id) {
    var L = LIST[id]; if (!L) return viewListenings();
    var lineEls = [];
    var trBox = h("div", { class: "hidden" });
    var player = new Player({
      id: L.id, label: L.lineas.length + " líneas",
      lines: L.lineas.map(function (ln) { return { zh: ln.tts || ln.zh, v: L.voces[ln.sp] }; }),
      onLine: function (i) { lineEls.forEach(function (e, k) { e.classList.toggle("now", k === i); }); }
    });
    var show = { zh: true, py: true, es: true };
    function transcript() {
      trBox.innerHTML = "";
      lineEls = [];
      var toggles = h("div", { class: "chips", style: "margin-bottom:10px" }, [["zh", "汉字"], ["py", "Pinyin"], ["es", "Español"]].map(function (x) {
        return h("button", { type: "button", class: "chip" + (show[x[0]] ? " on" : ""), onclick: function () { show[x[0]] = !show[x[0]]; transcript(); } }, x[1]);
      }));
      var lines = L.lineas.map(function (ln, i) {
        var e = h("div", { class: "tr-line" },
          h("div", { class: "tr-sp" }, h("button", { class: "icon-btn", type: "button", "aria-label": "Escuchar esta línea", onclick: function () { player.playLine(i); } }, icon("play", 14))),
          h("div", { class: "tr-body" },
            h("div", { class: "tr-sp", text: ln.sp }),
            show.zh ? h("div", { class: "tr-zh" }, renderWords(segment(ln.zh), "zh")) : null,
            show.py ? h("div", { class: "tr-py", text: ln.py }) : null,
            show.es ? h("div", { class: "tr-es", text: ln.es }) : null));
        lineEls.push(e);
        return e;
      });
      add(trBox, h("div", { class: "card", style: "margin-top:18px" }, h("h3", { style: "margin:0 0 6px", text: "Transcripción · 听力原文" }),
        h("p", { class: "muted", style: "margin:0 0 10px;font-size:14px", text: "Pulsa ▶ para oír una línea suelta. Toca un hanzi para ver su pinyin y significado." }), toggles, lines));
    }
    var qb = questionsBlock(L.preguntas, function (p) {
      saveResult("L:" + id, p);
      if (p >= 80) burst();
      transcript(); trBox.classList.remove("hidden");
    });
    var persons = h("div", { class: "persons" }, Object.keys(L.personajes).map(function (sp) {
      var g = L.personajes[sp];
      return h("span", { class: "person" }, h("span", { class: "av " + g, text: sp.slice(0, 1) }), sp);
    }));
    var i = D.listenings.indexOf(L), nx = D.listenings[i + 1];
    view("listening", h("div", { class: "ex-wrap" },
      h("div", { class: "ex-head" }, backLink("#/listening", "Listenings"),
        h("h1", null, L.titulo, h("span", { class: "zh", text: "第" + CN_NUM[L.tema] + "课" }))),
      h("div", { class: "card q-card" },
        h("div", { class: "note", style: "margin-bottom:12px" }, h("b", { text: "Situación: " }), L.escena),
        persons,
        player.el),
      qb.el, trBox,
      nx ? h("div", { class: "btn-row", style: "margin-top:20px;justify-content:flex-end" }, h("a", { class: "btn ghost", href: "#/listening/" + nx.id }, "Siguiente listening →")) : null));
  }

  // ----------------------------------------------------------------- lectura
  var readLevel = 1;
  function viewLecturas(level) {
    if (level) readLevel = level;
    var tabs = h("div", { class: "tabs" }, [1, 2].map(function (n) {
      return h("button", { type: "button", class: "tab" + (readLevel === n ? " on" : ""), onclick: function () { viewLecturas(n); } },
        h("span", { class: "brush", style: "font-size:30px;color:var(--red)", text: n === 1 ? "拼" : "汉" }),
        h("span", null, "Nivel " + n, h("small", { text: n === 1 ? "Hanzi con pinyin encima" : "Solo hanzi" })));
    }));
    var list = D.lecturas.filter(function (r) { return r.nivel === readLevel; });
    view("lectura", h("div", null,
      pageHead("阅读", "Comprensión lectora", "Lee el texto en hanzi " + (readLevel === 1 ? "(con el <b>pinyin encima</b> como ayuda)" : "(sin pinyin: toca una palabra si la necesitas)") + " y toca cualquier palabra para ver su pinyin, su traducción y escucharla. Luego responde a las <b>5 preguntas</b>."),
      tabs,
      h("div", { class: "grid g3" }, list.map(function (r) {
        return exRow("#/lectura/" + r.id, CN_NUM[r.tema], r.titulo, "Lección " + r.tema + " · " + TEMA[r.tema].es, "R:" + r.id);
      }))));
  }

  function runLectura(id) {
    var R = READ[id]; if (!R) return viewLecturas();
    readLevel = R.nivel;
    var mode = "zh";
    var paras = tokensFromText(R.texto);
    var titleTok = tokensFromText(R.titulo_zh)[0] || [];
    var ruby = R.nivel === 1;
    var body = h("div", { class: "text-body lv2" });
    function paint() {
      body.innerHTML = "";
      paras.forEach(function (p) { add(body, h("p", null, renderWords(p, mode, ruby))); });
    }
    paint();
    var trBox = h("div", { class: "hidden" }, h("div", { class: "card", style: "margin-top:18px" },
      h("h3", { style: "margin:0 0 8px", text: "Traducción · 翻译" }), h("p", { style: "margin:0", text: R.es })));
    var player = new Player({ id: R.id, label: "Texto completo", lines: paras.map(function (p) {
      return { zh: p.map(function (t) { return t.p || t.w; }).join(""), v: R.tema % 2 ? "f2" : "m2" };
    }) });
    var listen = h("details", { style: "margin-top:16px" }, h("summary", { style: "cursor:pointer;font-weight:700;color:var(--ink-2)" }, "🔊 Escuchar el texto"), h("div", { style: "margin-top:10px" }, player.el));
    var qb = questionsBlock(R.preguntas, function (p) { saveResult("R:" + id, p); if (p >= 80) burst(); trBox.classList.remove("hidden"); });
    var same = D.lecturas.filter(function (r) { return r.nivel === R.nivel; });
    var nx = same[same.indexOf(R) + 1];
    view("lectura", h("div", { class: "ex-wrap" },
      h("div", { class: "ex-head" }, backLink("#/lectura", "Lecturas"),
        h("span", { class: "lang " + (R.nivel === 1 ? "py" : "es"), text: "Nivel " + R.nivel + (R.nivel === 1 ? " · hanzi + pinyin" : " · hanzi") })),
      h("article", { class: "card reading" },
        h("h2", { text: R.titulo }),
        h("div", { class: "ttl-zh " + (mode === "py" ? "py" : "zh"), style: "font-size:20px;color:var(--red)" }, renderWords(titleTok, mode)),
        h("label", { class: "toggle", style: "margin-bottom:14px" }, h("input", { type: "checkbox", checked: ruby, onchange: function (e) { ruby = e.target.checked; paint(); } }),
          "Mostrar el pinyin encima de los hanzi"),
        body, listen),
      qb.el, trBox,
      nx ? h("div", { class: "btn-row", style: "margin-top:20px;justify-content:flex-end" }, h("a", { class: "btn ghost", href: "#/lectura/" + nx.id }, "Siguiente lectura →")) : null));
  }

  // ------------------------------------------------------------- traducción
  function trLevels() {
    return [
      { n: 1, t: "Hanzi + pinyin → español", icon: "拼", from: "py", to: "es", d: "Lee la frase en hanzi, con su pinyin debajo, y escríbela en español." },
      { n: 2, t: "Español → pinyin", icon: "音", from: "es", to: "py", d: "Traduce al chino escribiendo en pinyin con tonos." },
      { n: 3, t: "Hanzi → español", icon: "汉", from: "zh", to: "es", d: "Solo hanzi. Puedes tocar una palabra para verla, pero cada ayuda resta un 10 %." },
      { n: 4, t: "Español → hanzi", icon: "字", from: "es", to: "zh", d: "Construye la frase en hanzi con fichas o con el teclado chino." }
    ];
  }
  var trSel = { tema: 0, nivel: 1 };
  function viewTraduccion() {
    var levels = trLevels();
    var box = h("div");
    function paint() {
      box.innerHTML = "";
      add(box, [
        h("div", { class: "group-h", text: "1 · Elige el nivel" }),
        h("div", { class: "grid g4" }, levels.map(function (L) {
          return h("button", { type: "button", class: "tab" + (trSel.nivel === L.n ? " on" : ""), style: "width:100%", onclick: function () { trSel.nivel = L.n; paint(); } },
            h("span", { class: "brush", style: "font-size:30px;color:var(--red)", text: L.icon }),
            h("span", null, "Nivel " + L.n + " · " + L.t, h("small", { text: L.d })));
        })),
        h("div", { class: "group-h", text: "2 · Elige el tema" }),
        h("div", { class: "grid g3" },
          exRow("#/traduccion/0/" + trSel.nivel, "全", "Todo el curso (mezcla)", "10 frases al azar de las 15 lecciones", "T:0:" + trSel.nivel),
          D.temas.map(function (t) {
            return exRow("#/traduccion/" + t.n + "/" + trSel.nivel, CN_NUM[t.n], "Lección " + t.n + " · " + t.es, t.zh + " · " + t.frases.length + " frases", "T:" + t.n + ":" + trSel.nivel);
          }))
      ]);
    }
    paint();
    view("traduccion", h("div", null,
      pageHead("翻译", "Traducción", "Todas las frases del curso, organizadas por tema, en <b>cuatro niveles</b> de dificultad. En cada sesión salen hasta 10 frases del tema elegido."),
      box));
  }

  function tileWords(zh) {
    return segment(zh).filter(function (t) { return !t.p; }).map(function (t) { return t.w; });
  }

  /**
   * Respuesta en hanzi de tres maneras: fichas, teclado de la app (pinyin → hanzi)
   * o teclado chino del dispositivo. words: fichas correctas; distract: fichas de más.
   */
  function hanziAnswer(words, distract, onSubmit) {
    var locked = false;
    var bankWords = shuffle(words.concat(distract || []));
    var chosen = [];
    var ansLine = h("div", { class: "tiles-answer", "aria-label": "Tu frase" });
    var bank = h("div", { class: "tiles-bank" });
    var ime = hanziIME({ onEnter: onSubmit });
    var kbInput = h("input", { class: "inp zh", type: "text", lang: "zh-CN", placeholder: "Escribe con el teclado chino de tu dispositivo", "aria-label": "Respuesta en hanzi" });
    kbInput.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); onSubmit(); } });
    function paintTiles() {
      ansLine.innerHTML = ""; bank.innerHTML = "";
      if (!chosen.length) add(ansLine, h("span", { class: "muted", style: "font-size:14px", text: "Toca las fichas en orden para formar la frase" }));
      chosen.forEach(function (bi, k) {
        add(ansLine, h("button", { type: "button", class: "tile", onclick: function () { if (locked) return; chosen.splice(k, 1); paintTiles(); } }, bankWords[bi]));
      });
      bankWords.forEach(function (w, bi) {
        add(bank, h("button", { type: "button", class: "tile" + (chosen.indexOf(bi) >= 0 ? " used" : ""), onclick: function () { if (locked || chosen.indexOf(bi) >= 0) return; chosen.push(bi); SND.sfx("tick"); paintTiles(); } }, w));
      });
    }
    paintTiles();
    var modes = {
      fichas: h("div", null, ansLine, bank),
      app: ime.el,
      sistema: h("div", null, kbInput, h("p", { class: "muted", style: "font-size:13px;margin:6px 0 0" }, "Necesitas tener instalado el teclado chino (pinyin). ", h("a", { href: "#/teclado" }, "Cómo instalarlo")))
    };
    var mode = S.settings.hanziMode || "fichas";
    var modeChips = h("div", { class: "chips", style: "margin-bottom:12px" });
    function paintMode() {
      modeChips.innerHTML = "";
      [["fichas", "Fichas"], ["app", "Pinyin → hanzi (teclado de la app)"], ["sistema", "Teclado chino del dispositivo"]].forEach(function (m) {
        add(modeChips, h("button", { type: "button", class: "chip" + (mode === m[0] ? " on" : ""), onclick: function () {
          if (locked) return;
          mode = m[0]; S.settings.hanziMode = mode; persist(); paintMode();
        } }, m[1]));
      });
      Object.keys(modes).forEach(function (k) { modes[k].classList.toggle("hidden", k !== mode); });
      if (mode === "app") ime.focus(); else if (mode === "sistema") kbInput.focus();
    }
    setTimeout(paintMode, 0);
    return {
      el: h("div", null, modeChips, modes.fichas, modes.app, modes.sistema),
      get: function () {
        if (mode === "app") return ime.value();
        if (mode === "sistema") return kbInput.value;
        return chosen.map(function (bi) { return bankWords[bi]; }).join("");
      },
      lock: function () { locked = true; kbInput.disabled = true; }
    };
  }

  function runTraduccion(tema, nivel, onlyIds) {
    var L = trLevels()[nivel - 1]; if (!L) return viewTraduccion();
    var pool = tema ? (TEMA[tema] ? TEMA[tema].frases : []) : [].concat.apply([], D.temas.map(function (t) { return t.frases; }));
    // Frases de una sola sílaba o sin contenido no sirven para traducir al revés.
    pool = pool.filter(function (f) { return C.parse(f.py).length >= 1; });
    var items = onlyIds ? onlyIds.map(function (id) { return FRASE[id]; }) : shuffle(pool).slice(0, 10);
    var idx = 0, results = [];
    var wrap = h("div", { class: "ex-wrap" });
    var title = tema ? "Lección " + tema + " · " + TEMA[tema].es : "Todo el curso";
    view("traduccion", wrap);

    function renderItem() {
      var f = items[idx], checked = false, hinted = false;
      var helps = helpCounter(), ha = null;
      var promptEl = h("div", { class: "big " + (L.from === "es" ? "" : "zh") });
      if (L.from === "zh") add(promptEl, renderWords(segment(f.zh), "zh", false, { onReveal: helps.reveal }), helps.el);
      else if (L.from === "py") add(promptEl, renderWords(segment(f.zh), "zh"), h("div", { class: "py", style: "font-size:clamp(18px,2.6vw,22px);color:var(--ink-2);margin-top:6px", text: f.py }));
      else promptEl.textContent = f.es[0];
      var hintBox = h("div", { class: "muted", style: "min-height:1.4em;margin-top:8px;text-align:center" });
      var getAnswer, answerEl, focusEl;
      if (L.to === "es") {
        var ta = h("textarea", { class: "inp", placeholder: "Escribe la traducción en español", "aria-label": "Traducción" });
        ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); checked ? next() : check(); } });
        answerEl = ta; focusEl = ta; getAnswer = function () { return ta.value; };
      } else if (L.to === "py") {
        var pin = pinyinInput({ onEnter: function () { checked ? next() : check(); } });
        answerEl = pin.el; focusEl = pin.input; getAnswer = function () { return pin.input.value; };
      } else {
        var words = tileWords(f.zh);
        var distract = shuffle(uniq([].concat.apply([], (TEMA[f.tema].frases).map(function (o) { return tileWords(o.zh); }))).filter(function (w) { return words.indexOf(w) < 0; })).slice(0, 3);
        var ha = hanziAnswer(words, distract, function () { checked ? next() : check(); });
        answerEl = ha.el; focusEl = null; getAnswer = ha.get;
      }
      var fbBox = h("div");
      var checkBtn = h("button", { class: "btn", type: "button", onclick: function () { check(); } }, "Comprobar");
      var hintBtn = h("button", { class: "btn soft sm", type: "button", onclick: function () {
        hinted = true; hintBox.innerHTML = "";
        if (L.from === "zh") add(hintBox, h("span", { class: "py", style: "font-size:18px;color:var(--ink)", text: f.py }));
        else if (L.from === "py") add(hintBox, h("span", { style: "font-size:17px;color:var(--ink)", text: "Empieza así: «" + f.es[0].split(" ").slice(0, 2).join(" ") + "…»" }));
        else if (L.to === "py") add(hintBox, h("span", { class: "py", style: "font-size:18px;color:var(--ink)", text: f.py.split(/\s+/).map(function (w) { return w.charAt(0) + "…"; }).join(" ") }));
        else add(hintBox, h("span", { class: "py", style: "font-size:18px;color:var(--ink)", text: f.py }));
        add(hintBox, h("div", { style: "font-size:13px", text: "(con pista, la respuesta cuenta como media)" }));
      } }, icon("bulb", 16), "Pista");
      var dots = h("div", { class: "dots" }, items.map(function (_, i) { var r = results[i]; return h("i", { class: i === idx ? "cur" : r ? r.level : "" }); }));

      function check() {
        if (checked) return;
        var ans = getAnswer();
        if (!ans.trim()) { if (focusEl) focusEl.focus(); return; }
        checked = true;
        var r, marks = null;
        if (L.to === "es") r = C.compareSpanish(ans, f.es);
        else if (L.to === "py") {
          var opts = [f.py].concat(f.altpy || []), bestR = null;
          opts.forEach(function (o) { var x = C.comparePinyin(o, ans, ignoreTones()); if (!bestR || x.score > bestR.score) { bestR = x; bestR.exp = o; } });
          r = bestR; marks = bestR.marks;
        } else r = C.compareHanzi(ans, [f.zh].concat(f.altzh || []));
        var score = helps.apply(hinted ? Math.min(r.score, 0.5) : r.score);
        var level = levelOf(score);
        results[idx] = { level: level, score: score, f: f, answer: ans };
        helps.lock();
        if (ha) ha.lock();
        SND.sfx(level);
        var titles = {
          es: { ok: "¡Bien traducido!", mid: "Parecido. Compara con la traducción y decide.", ko: "No coincide. Compara con la traducción." },
          py: { ok: "¡Correcto!", mid: r.lettersOk ? "Las sílabas están bien, revisa los tonos." : "¡Casi! Revisa lo marcado.", ko: "No es correcto. Mira la frase correcta." },
          zh: { ok: "¡Correcto! 对了！", mid: "¡Casi! Revisa el orden o algún carácter.", ko: "No es correcto. Mira la frase correcta." }
        };
        fbBox.innerHTML = "";
        add(fbBox, h("div", { class: "fb " + level },
          h("span", { class: "stamp", text: stampText(level) }),
          h("h4", { text: titles[L.to][level] + (hinted ? " (con pista)" : "") + helps.note() }),
          h("div", { class: "row" }, h("span", { class: "k", text: "Hanzi" }), h("div", { class: "v zh" }, renderWords(segment(f.zh), "zh"),
            " ", h("button", { class: "icon-btn", style: "vertical-align:middle", type: "button", "aria-label": "Escuchar", onclick: function () { speakOnce(f.tts || f.zh, f.au); } }, icon("speaker", 16)))),
          h("div", { class: "row" }, h("span", { class: "k", text: "Pinyin" }), h("div", { class: "v py" }, marks ? marksView(marks, ignoreTones()) : f.py)),
          h("div", { class: "row" }, h("span", { class: "k", text: "Español" }), h("div", { class: "v", style: "font-size:17px", text: f.es.join("  /  ") })),
          h("div", { class: "row" }, h("span", { class: "k", text: "Tu respuesta" }), h("div", { class: "v " + (L.to === "zh" ? "zh" : L.to === "py" ? "py" : ""), style: "font-size:16px", text: ans })),
          level !== "ok" ? h("button", { class: "link-btn", type: "button", onclick: function () { results[idx].level = "ok"; results[idx].score = helps.apply(1); SND.sfx("ok"); this.textContent = "Marcada como correcta"; this.disabled = true; } }, "Mi respuesta también es correcta") : null));
        checkBtn.textContent = idx + 1 < items.length ? "Siguiente →" : "Ver resultado";
        checkBtn.onclick = next;
        checkBtn.focus();
      }
      function next() { idx++; if (idx < items.length) renderItem(); else finish(); }

      wrap.innerHTML = "";
      add(wrap, [
        h("div", { class: "ex-head" }, backLink("#/traduccion", "Traducción"), dots,
          h("h1", null, "Nivel " + nivel + " · " + L.t, h("span", { class: "h1-sub", text: title }))),
        h("div", { class: "card q-card" },
          h("div", { class: "prompt" }, h("div", { class: "lbl", text: L.to === "es" ? "Traduce al español" : L.to === "py" ? "Tradúcelo al chino en pinyin" : "Tradúcelo al chino en hanzi" }), promptEl, hintBox),
          answerEl,
          h("div", { class: "btn-row", style: "margin-top:16px" }, checkBtn, hintBtn),
          fbBox)
      ]);
      if (focusEl) focusEl.focus();
    }
    function finish() {
      var total = results.reduce(function (s, r) { return s + r.score; }, 0);
      var p = pct(total / items.length);
      if (!onlyIds) saveResult("T:" + tema + ":" + nivel, p);
      resultSound(p);
      if (p >= 80) burst();
      var wrong = results.filter(function (r) { return r.level !== "ok"; }).map(function (r) { return r.f.id; });
      wrap.innerHTML = "";
      add(wrap, [
        h("div", { class: "ex-head" }, backLink("#/traduccion", "Traducción"), h("h1", null, "Nivel " + nivel + " · " + L.t, h("span", { class: "h1-sub", text: title }))),
        h("div", { class: "card result" },
          h("div", { class: "big-stamp", text: resultStamp(p) }),
          h("div", { class: "pct", text: p + "%" }),
          h("div", { class: "sub", text: resultMsg(p) }),
          h("div", { class: "btn-row", style: "justify-content:center;margin-top:18px" },
            wrong.length ? h("button", { class: "btn", type: "button", onclick: function () { runTraduccion(tema, nivel, wrong); } }, "Repetir los " + wrong.length + " fallos") : null,
            h("button", { class: "btn ghost", type: "button", onclick: function () { runTraduccion(tema, nivel); } }, "Otras 10 frases"),
            nivel < 4 ? h("a", { class: "btn soft", href: "#/traduccion/" + tema + "/" + (nivel + 1) }, "Subir al nivel " + (nivel + 1)) : null),
          h("div", { class: "review" }, results.map(function (r) {
            return h("div", { class: "it" }, h("span", { class: "m " + r.level, text: r.level === "ok" ? "✓" : r.level === "mid" ? "~" : "✗" }),
              h("div", null, h("div", { class: "zh", text: r.f.zh }), h("div", { class: "py", text: r.f.py }), h("div", { class: "muted", style: "font-size:14px", text: r.f.es[0] }),
                r.level !== "ok" ? h("div", { class: "muted", style: "font-size:14px", text: "Tú: " + r.answer }) : null));
          })))
      ]);
    }
    if (!items.length) return viewTraduccion();
    renderItem();
  }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

  // ------------------------------------------------------------ vocabulario
  function viewVocab() {
    var q = h("input", { class: "inp search", type: "search", placeholder: "Buscar: hanzi, pinyin o español", "aria-label": "Buscar" });
    var box = h("div");
    function paint() {
      var s = q.value.trim().toLowerCase(), sp = C.stripMarks(s);
      box.innerHTML = "";
      D.temas.forEach(function (t) {
        var words = Object.keys(D.dic).filter(function (w) {
          var d = D.dic[w];
          if (d[2] !== t.n) return false;
          if (!s) return true;
          return w.indexOf(s) >= 0 || C.stripMarks(d[0].toLowerCase()).replace(/\s/g, "").indexOf(sp.replace(/\s/g, "")) >= 0 || d[1].toLowerCase().indexOf(s) >= 0;
        });
        if (!words.length) return;
        add(box, [h("div", { class: "group-h", text: "Lección " + t.n + " · " + t.es }),
          h("div", { class: "card", style: "padding:6px 14px" }, h("table", { class: "vocab-t" }, h("tbody", null, words.map(function (w) {
            var d = D.dic[w];
            return h("tr", { style: "cursor:pointer", onclick: function () { speakOnce(w, wordAudioId(w)); } },
              h("td", { class: "zh", text: w }), h("td", { class: "py", text: d[0] }), h("td", null, d[1], d[3] ? h("span", { class: "nv-tag", text: nvLabel(d[3]) }) : null),
              h("td", { style: "width:1%" }, icon("speaker", 16)));
          }))))]);
      });
      var h1 = Object.keys(D.dic).filter(function (w) {
        var d = D.dic[w]; if (d[2] !== 0) return false;
        if (!s) return true;
        return w.indexOf(s) >= 0 || C.stripMarks(d[0].toLowerCase()).replace(/\s/g, "").indexOf(sp.replace(/\s/g, "")) >= 0 || d[1].toLowerCase().indexOf(s) >= 0;
      });
      if (h1.length) add(box, [h("div", { class: "group-h", text: "Repaso · vocabulario de HSK 1" }),
        h("div", { class: "card", style: "padding:6px 14px" }, h("table", { class: "vocab-t" }, h("tbody", null, h1.map(function (w) {
          var d = D.dic[w];
          return h("tr", { style: "cursor:pointer", onclick: function () { speakOnce(w, wordAudioId(w)); } },
            h("td", { class: "zh", text: w }), h("td", { class: "py", text: d[0] }), h("td", { text: d[1] }), h("td", { style: "width:1%" }, icon("speaker", 16)));
        }))))]);
      if (!box.children.length) add(box, h("p", { class: "muted", text: "No hay resultados." }));
    }
    q.addEventListener("input", paint);
    paint();
    view("vocabulario", h("div", null,
      pageHead("词语", "Vocabulario", "Todo el vocabulario que tienes que aprender (HSK 1 y HSK 2 según el HSK 3.0 y las palabras del libro), repartido por lecciones para ir aprendiéndolo poco a poco. Toca una fila para oírla."),
      q, box));
  }

  // --------------------------------------------------------------- gramática
  function viewGramatica() {
    view("gramatica", h("div", null,
      pageHead("语法", "Gramática", "Las estructuras importantes de cada lección, <b>explicadas en español</b>, con ejemplos que puedes escuchar y tocar palabra a palabra, y un minitest para comprobar que lo has entendido."),
      D.gramatica.map(function (g) {
        var t = TEMA[g.tema];
        return [h("div", { class: "group-h", text: "Lección " + g.tema + (t ? " · " + t.zh : "") }),
          h("div", { class: "grid g3" }, g.puntos.map(function (p) { return exRow("#/gramatica/" + g.tema + "/" + p.id, CN_NUM[g.tema], p.titulo, p.zh, "G:" + p.id); }))];
      })));
  }

  function runGramatica(tema, pid) {
    var g = GRAM[tema]; if (!g) return viewGramatica();
    var list = [].concat.apply([], D.gramatica.map(function (x) { return x.puntos; }));
    var p = g.puntos.filter(function (x) { return x.id === pid; })[0] || g.puntos[0];
    var i = list.indexOf(p), prev = list[i - 1], nx = list[i + 1];
    function temaOf(pt) { var r = 0; D.gramatica.forEach(function (x) { if (x.puntos.indexOf(pt) >= 0) r = x.tema; }); return r; }
    var ejemplos = h("div", { class: "g-ejs" }, p.ejemplos.map(function (ej) {
      return h("div", { class: "g-ej" },
        h("button", { class: "icon-btn", type: "button", "aria-label": "Escuchar", onclick: function () { speakOnce(ej.tts || ej.zh, ej.au); } }, icon("speaker", 16)),
        h("div", null,
          h("div", { class: "tr-zh" }, renderWords(segment(ej.zh), "zh")),
          h("div", { class: "tr-py", text: ej.py }),
          h("div", { class: "tr-es", text: ej.es }),
          ej.nota ? h("div", { class: "g-nota", html: ej.nota }) : null));
    }));
    // minitest
    var answered = 0, good = 0;
    var practica = h("div", { class: "qs" }, (p.practica || []).map(function (q, qi) {
      var res = h("div");
      var btns = q.opciones.map(function (o, oi) {
        return h("button", { type: "button", class: "chip g-op", onclick: function () {
          if (card.getAttribute("data-done")) return;
          card.setAttribute("data-done", "1");
          var ok = oi === q.ok;
          answered++; if (ok) good++;
          btns.forEach(function (b, bi) { b.classList.add(bi === q.ok ? "g-ok" : bi === oi ? "g-ko" : "g-dim"); });
          SND.sfx(ok ? "ok" : "ko");
          res.className = "res " + (ok ? "ok" : "ko");
          add(res, [h("b", { text: ok ? "✓ ¡Bien!" : "✗ La correcta es «" + q.opciones[q.ok] + "»." }), " ", q.exp || ""]);
          if (answered === p.practica.length) {
            var pc = pct(good / answered);
            saveResult("G:" + p.id, pc);
            resultSound(pc);
            if (pc >= 80) burst();
          }
        } }, h("span", { class: "zh", text: o }));
      });
      var card = h("div", { class: "card qq" },
        h("div", { class: "qh" }, h("span", { class: "qn", text: qi + 1 }), h("div", { class: "qt", style: "font-size:19px" }, q.q.replace(/_{2,}/g, "＿＿"))),
        h("div", { class: "chips", style: "margin-top:12px" }, btns), res);
      return card;
    }));
    view("gramatica", h("div", { class: "ex-wrap" },
      h("div", { class: "ex-head" }, backLink("#/gramatica", "Gramática"),
        h("h1", null, p.titulo, h("span", { class: "h1-sub", text: "Lección " + tema + (TEMA[tema] ? " · " + TEMA[tema].zh : "") }))),
      h("article", { class: "card reading g-card" },
        h("div", { class: "g-big zh", text: p.zh }),
        p.explicacion.map(function (par) { return h("p", { class: "g-p", html: par }); }),
        p.estructura && p.estructura.length ? h("div", { class: "g-est" }, h("div", { class: "k", text: "Estructura" }), p.estructura.map(function (e) { return h("div", { class: "g-f", text: e }); })) : null,
        h("div", { class: "k", style: "margin-top:18px", text: "Ejemplos · 例句" }),
        ejemplos,
        p.ojo ? h("div", { class: "note", style: "margin-top:16px" }, h("b", { text: "¡Ojo! " }), h("span", { html: p.ojo })) : null),
      p.practica && p.practica.length ? [h("div", { class: "sec-h" }, h("span", { class: "brush", text: "练习" }), h("h2", { text: "Comprueba que lo has entendido" })), practica] : null,
      ejPoint(p.id) ? h("a", { class: "note ej-cta", href: "#/ejercicios/" + tema + "/" + p.id },
        h("b", { text: "¿Quieres practicarlo a fondo? " }), "Ejercicios de este punto: elegir, ordenar fichas, traducir (hanzi ↔ español ↔ pinyin), escuchar y una lectura →") : null,
      h("div", { class: "btn-row", style: "margin-top:22px;justify-content:space-between" },
        prev ? h("a", { class: "btn soft", href: "#/gramatica/" + temaOf(prev) + "/" + prev.id }, "← " + prev.titulo.slice(0, 28) + (prev.titulo.length > 28 ? "…" : "")) : h("span"),
        nx ? h("a", { class: "btn ghost", href: "#/gramatica/" + temaOf(nx) + "/" + nx.id }, nx.titulo.slice(0, 28) + (nx.titulo.length > 28 ? "…" : "") + " →") : null)));
  }

  // -------------------------------------------------------------- ejercicios
  var EJ = {}; (D.ejercicios || []).forEach(function (t) { EJ[t.tema] = t; });
  var VDRILLS = [
    { k: "sig", zh: "义", t: "Significado", d: "Ves el hanzi y eliges qué significa." },
    { k: "han", zh: "字", t: "Reconoce el hanzi", d: "Lees la palabra en español y eliges su hanzi." },
    { k: "esc", zh: "听", t: "Escucha y elige", d: "Oyes la palabra y eliges el hanzi." },
    { k: "py", zh: "拼", t: "Pinyin y tonos", d: "Ves el hanzi y escribes el pinyin con tonos." },
    { k: "es", zh: "译", t: "Tradúcela al español", d: "Ves el hanzi y escribes lo que significa." },
    { k: "espy", zh: "音", t: "Del español al pinyin", d: "Lees la palabra en español y la escribes en pinyin." },
    { k: "ctx", zh: "句", t: "Completa la frase", d: "Eliges la palabra que falta en cada frase." },
    { k: "fr", zh: "翻", t: "Frases con el vocabulario", d: "Traduces frases con las palabras nuevas: hanzi, pinyin y español." }
  ];
  var KIND_LBL = {
    choice: "Elige la opción correcta", order: "Ordena las fichas para formar la frase",
    zh_es: "Traduce al español", es_py: "Tradúcelo al chino en pinyin", es_zh: "Tradúcelo al chino en hanzi",
    listen_py: "Escucha y escribe en pinyin", listen_choice: "Escucha y elige qué significa",
    word_py: "Escribe el pinyin con tonos", word_es: "¿Qué significa?", espy: "Escríbelo en pinyin", lectura: "Lectura · 阅读"
  };
  function ejPoint(pid) {
    var r = null;
    (D.ejercicios || []).forEach(function (t) { t.puntos.forEach(function (p) { if (p.id === pid) r = p; }); });
    return r;
  }
  function gramPoint(pid) {
    var r = null;
    D.gramatica.forEach(function (g) { g.puntos.forEach(function (p) { if (p.id === pid) r = p; }); });
    return r;
  }
  function lessonWords(n) {
    return Object.keys(D.vocab).map(function (k) { return D.vocab[k]; }).filter(function (v) { return v.t === n; });
  }
  /** "creer, parecer (opinión)" → ["creer", "parecer", "creer, parecer"] */
  function glossVariants(es) {
    var clean = es.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
    var parts = clean.split(/[,;/]| o /).map(function (x) { return x.trim(); }).filter(Boolean);
    return uniq(parts.concat([clean, es]));
  }
  function glossShort(es) { return es.replace(/\s*\([^)]*\)/g, "").split(/[;]/)[0].trim(); }
  function hasZh(s) { return /[㐀-鿿]/.test(s); }
  function interleave(a, b) {
    var out = [], i = 0, j = 0;
    while (i < a.length || j < b.length) {
      if (i < a.length) out.push(a[i++]);
      if (i < a.length && i % 2 === 0) out.push(a[i++]);
      if (j < b.length) out.push(b[j++]);
    }
    return out;
  }
  function pickOthers(list, not, n, key) {
    key = key || function (x) { return x; };
    var seen = {}; seen[key(not)] = 1;
    return shuffle(list).filter(function (x) { var k = key(x); if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, n);
  }
  /** Opciones barajadas: devuelve {opts, ok} */
  function mkChoice(right, wrongs) {
    var opts = shuffle([right].concat(wrongs));
    return { opts: opts, ok: opts.indexOf(right) };
  }
  var FRASE_KINDS = ["order", "zh_es", "es_py", "es_zh", "listen_py", "zh_es", "listen_choice", "order", "es_zh", "es_py", "listen_choice", "zh_es"];
  function fraseItems(frases, pool, kinds) {
    kinds = kinds || FRASE_KINDS;
    var off = Math.floor(Math.random() * kinds.length);
    return shuffle(frases).map(function (f, i) { return { kind: kinds[(i + off) % kinds.length], f: f, pool: pool }; });
  }
  function eligeItems(list) {
    return shuffle(list).map(function (q) {
      var c = mkChoice(q.opciones[q.ok], q.opciones.filter(function (_, i) { return i !== q.ok; }));
      return { kind: "choice", q: q.q.replace(/_{2,}/g, "＿＿"), opts: c.opts, ok: c.ok, exp: q.exp, tag: "Gramática" };
    });
  }
  function pointItems(pid) {
    var ej = ejPoint(pid); if (!ej) return [];
    var items = interleave(eligeItems(ej.elige), fraseItems(ej.frases, ej.frases));
    if (ej.lectura) items.push({ kind: "lectura", lec: ej.lectura });
    return items;
  }
  function allLessonWords() { return Object.keys(D.vocab).map(function (k) { return D.vocab[k]; }); }
  function vocabItem(k, v, words, n) {
    var others = words.length >= 4 ? words : allLessonWords();
    if (k === "sig") {
      var c = mkChoice(glossShort(v.es[0]), pickOthers(others, v, 3, function (x) { return x.zh; }).map(function (x) { return glossShort(x.es[0]); }).filter(function (g) { return g !== glossShort(v.es[0]); }));
      return { kind: "choice", tag: "Vocabulario", word: v, promptWord: true, opts: c.opts, ok: c.ok };
    }
    if (k === "han" || k === "esc") {
      var c2 = mkChoice(v.zh, pickOthers(others, v, 3, function (x) { return x.zh; }).map(function (x) { return x.zh; }));
      return { kind: k === "esc" ? "listen_word" : "choice", tag: "Vocabulario", word: v, q: k === "han" ? "¿Cómo se escribe «" + glossShort(v.es[0]) + "»?" : null, opts: c2.opts, ok: c2.ok, zhOpts: true };
    }
    if (k === "py") return { kind: "word_py", w: v };
    if (k === "es") return { kind: "word_es", w: v };
    if (k === "espy") return { kind: "espy", w: v };
    return null;
  }
  /** El vocabulario de cada lección se practica por partes de 20 palabras. */
  var VPART = 20;
  function vParts(n) { return Math.max(1, Math.ceil(lessonWords(n).length / VPART)); }
  function partWords(n, p) { var w = lessonWords(n); return p ? w.slice((p - 1) * VPART, p * VPART) : w; }
  function partSents(n, p) {
    var t = EJ[n]; if (!t) return [];
    if (!p) return t.vocab;
    var ws = partWords(n, p).map(function (v) { return v.zh; });
    return t.vocab.filter(function (s) { return ws.indexOf(s.w) >= 0; });
  }
  function ctxItems(n, p) {
    var t = EJ[n]; if (!t) return [];
    var words = lessonWords(n);
    return shuffle(partSents(n, p)).map(function (s) {
      var wrongs = pickOthers(words, { zh: s.w }, 5, function (x) { return x.zh; }).map(function (x) { return x.zh; })
        .filter(function (w) { return s.zh.indexOf(w) < 0; }).slice(0, 3);
      var c = mkChoice(s.w, wrongs);
      return { kind: "choice", tag: "Vocabulario en contexto", q: s.zh.replace(s.w, "＿＿"), opts: c.opts, ok: c.ok, zhOpts: true, sent: s };
    });
  }
  function vocabDrill(n, k, p) {
    var words = lessonWords(n), part = partWords(n, p);
    if (k === "ctx") return ctxItems(n, p);
    if (k === "fr") return EJ[n] ? fraseItems(partSents(n, p), EJ[n].vocab, ["zh_es", "es_py", "es_zh", "listen_py", "order", "listen_choice"]) : [];
    return shuffle(part).map(function (v) { return vocabItem(k, v, words, n); }).filter(Boolean);
  }
  function examItems(n) {
    var items = [];
    var t = EJ[n]; if (!t) return items;
    t.puntos.forEach(function (p) {
      items = items.concat(eligeItems(p.elige).slice(0, 2), fraseItems(p.frases, p.frases).slice(0, 2));
    });
    var words = lessonWords(n);
    shuffle(words).slice(0, 6).forEach(function (v, i) { items.push(vocabItem(["sig", "han", "esc", "py", "es", "espy"][i % 6], v, words, n)); });
    items = shuffle(items.concat(ctxItems(n).slice(0, 2)));
    var lec = shuffle(t.puntos.filter(function (p) { return p.lectura; }))[0];
    if (lec) items.push({ kind: "lectura", lec: lec.lectura });
    return items;
  }
  function ejKeys(n) {
    var ks = [];
    var t = EJ[n]; if (!t) return ks;
    t.puntos.forEach(function (p) { ks.push("E:" + p.id); });
    for (var p = 1; p <= vParts(n); p++) VDRILLS.forEach(function (d) { ks.push("E:" + n + ":" + d.k + ":" + p); });
    ks.push("E:" + n + ":examen");
    return ks;
  }
  function exRowAvg(href, num, title, sub, keys) {
    var done = keys.filter(function (k) { return best(k) !== undefined; }).length;
    var a = avg(keys);
    return h("a", { class: "card ex", href: href },
      h("div", { class: "num", text: num }),
      h("div", { class: "t" }, h("b", { text: title }), h("span", { text: sub })),
      h("span", { class: "score " + (done ? scoreClass(a) : ""), text: done ? a + "%" : "Nuevo" }));
  }

  function viewEjercicios() {
    view("ejercicios", h("div", null,
      pageHead("练习", "Ejercicios", "Una zona de práctica para cada lección: <b>ejercicios de cada punto de gramática</b> (elegir, ordenar, traducir, escuchar y leer), <b>ocho ejercicios de vocabulario</b> con todas las palabras de la lección (HSK 1, HSK 2 y libro), por partes de 20 y un <b>examen de la lección</b> que lo mezcla todo."),
      h("div", { class: "note", style: "margin-bottom:18px" }, h("b", { text: "Todo el chino se puede tocar. " }),
        "Toca cualquier hanzi para ver su pinyin, su traducción y escucharlo. En las traducciones de hanzi al español, cada palabra que abras resta un 10 % de esa frase: úsalo solo si lo necesitas."),
      h("div", { class: "temas" }, D.temas.map(function (t) {
        var ks = ejKeys(t.n), done = ks.filter(function (k) { return best(k) !== undefined; }).length;
        return h("a", { class: "tema", href: "#/ejercicios/" + t.n },
          h("span", { class: "n", text: CN_NUM[t.n] }),
          h("div", null, h("b", { text: t.es }), h("span", { class: "zh", text: t.zh }),
            h("span", { class: "ej-prog", text: done ? done + "/" + ks.length + " hechos · " + avg(ks) + "%" : ks.length + " ejercicios" })));
      }))));
  }

  var ejPart = {};
  function viewEjTema(n) {
    var t = TEMA[n], e = EJ[n]; if (!t || !e) return viewEjercicios();
    var words = lessonWords(n), np = vParts(n), cur = Math.min(ejPart[n] || 1, np);
    var vbox = h("div");
    function paintV() {
      vbox.innerHTML = "";
      var pw = partWords(n, cur), ns = partSents(n, cur).length;
      add(vbox, [
        np > 1 ? h("div", { class: "tabs" }, Array.apply(null, Array(np)).map(function (_, i) {
          var k = i + 1, ws = partWords(n, k);
          return h("button", { type: "button", class: "tab" + (k === cur ? " on" : ""), onclick: function () { cur = ejPart[n] = k; paintV(); } },
            h("span", { class: "brush", style: "font-size:26px;color:var(--red)", text: CN_NUM[k] }),
            h("span", null, "Parte " + k, h("small", { text: ws[0].zh + " … " + ws[ws.length - 1].zh + " · " + ws.length + " palabras" })));
        })) : null,
        h("div", { class: "grid g3" }, VDRILLS.map(function (d) {
          var cnt = d.k === "ctx" || d.k === "fr" ? ns + " frases" : pw.length + " palabras";
          return exRow("#/ejercicios/" + n + "/v-" + d.k + "-" + cur, d.zh, d.t, d.d + " · " + cnt, "E:" + n + ":" + d.k + ":" + cur);
        }))]);
    }
    paintV();
    view("ejercicios", h("div", null,
      backLink("#/ejercicios", "Ejercicios"),
      pageHead(CN_NUM[n], "Ejercicios · Lección " + n, t.es + ' · <span class="zh">' + t.zh + "</span>"),
      h("div", { class: "group-h", text: "Gramática · 语法" }),
      h("div", { class: "grid g3" }, e.puntos.map(function (p) {
        var g = gramPoint(p.id), cnt = p.elige.length + p.frases.length + (p.lectura ? 1 : 0);
        return exRow("#/ejercicios/" + n + "/" + p.id, "法", g ? g.titulo : p.id, cnt + " ejercicios · gramática, traducción, listening y lectura", "E:" + p.id);
      })),
      h("div", { class: "group-h", text: "Vocabulario · 词语 (" + words.length + " palabras)" }),
      vbox,
      h("div", { class: "group-h", text: "Examen de la lección · 考试" }),
      h("div", { class: "grid g3" }, exRow("#/ejercicios/" + n + "/examen", "考", "Examen de la lección " + n, "Gramática, vocabulario, traducción, listening y lectura mezclados", "E:" + n + ":examen"))));
  }

  function runEj(n, id) {
    var t = TEMA[n], e = EJ[n]; if (!t || !e) return viewEjercicios();
    var items, title, key;
    if (id === "examen") { items = examItems(n); title = "Examen de la lección " + n; key = "E:" + n + ":examen"; }
    else if (/^v-/.test(id)) {
      var mm = /^v-([a-z]+)(?:-(\d+))?$/.exec(id) || [], pp = Math.min(+mm[2] || 1, vParts(n));
      var d = VDRILLS.filter(function (x) { return x.k === mm[1]; })[0]; if (!d) return viewEjTema(n);
      items = vocabDrill(n, d.k, pp); title = d.t + (vParts(n) > 1 ? " · parte " + pp : ""); key = "E:" + n + ":" + d.k + ":" + pp;
    } else {
      var g = gramPoint(id); if (!ejPoint(id)) return viewEjTema(n);
      items = pointItems(id); title = g ? g.titulo : id; key = "E:" + id;
    }
    runSession({ items: items, title: title, sub: "Lección " + n + " · " + t.zh, key: key, back: "#/ejercicios/" + n, backTxt: "Lección " + n, next: nextEj(n, id) });
  }
  function nextEj(n, id) {
    var e = EJ[n], list = e.puntos.map(function (p) { return p.id; });
    for (var p = 1; p <= vParts(n); p++) list = list.concat(VDRILLS.map(function (d) { return "v-" + d.k + "-" + p; }));
    list.push("examen");
    if (/^v-[a-z]+$/.test(id)) id += "-1";
    var i = list.indexOf(id);
    return i >= 0 && i + 1 < list.length ? "#/ejercicios/" + n + "/" + list[i + 1] : (TEMA[n + 1] && EJ[n + 1] ? "#/ejercicios/" + (n + 1) : null);
  }

  /** Motor común de los ejercicios. o: {items, title, sub, key, back, backTxt, next} */
  function runSession(o, retry) {
    var items = o.items.filter(Boolean);
    if (!items.length) return viewEjercicios();
    var idx = 0, results = [];
    var wrap = h("div", { class: "ex-wrap" });
    view("ejercicios", wrap);

    function head(withDots) {
      return h("div", { class: "ex-head" }, backLink(o.back, o.backTxt),
        withDots ? h("div", { class: "dots" }, items.map(function (_, i) { var r = results[i]; return h("i", { class: i === idx ? "cur" : r ? r.level : "" }); })) : null,
        h("h1", null, o.title, h("span", { class: "h1-sub", text: o.sub })));
    }
    function speakBtn(zh, au) {
      return h("button", { class: "icon-btn", style: "vertical-align:middle", type: "button", "aria-label": "Escuchar", onclick: function () { speakOnce(zh, au); } }, icon("speaker", 16));
    }
    function sentenceRows(f, marks, ans, ansCls) {
      return [
        h("div", { class: "row" }, h("span", { class: "k", text: "Hanzi" }), h("div", { class: "v zh" }, renderWords(segment(f.zh), "zh"), " ", speakBtn(f.tts || f.zh, f.au))),
        h("div", { class: "row" }, h("span", { class: "k", text: "Pinyin" }), h("div", { class: "v py" }, marks ? marksView(marks, ignoreTones()) : f.py)),
        h("div", { class: "row" }, h("span", { class: "k", text: "Español" }), h("div", { class: "v", style: "font-size:17px", text: f.es.slice(0, 3).join("  /  ") })),
        ans !== undefined ? h("div", { class: "row" }, h("span", { class: "k", text: "Tu respuesta" }), h("div", { class: "v " + (ansCls || ""), style: "font-size:16px", text: ans })) : null
      ];
    }
    function wordRows(v, ans, ansCls) {
      return [
        h("div", { class: "row" }, h("span", { class: "k", text: "Palabra" }), h("div", { class: "v zh" }, renderWords(segment(v.zh), "zh"), " ", speakBtn(v.zh, v.au))),
        h("div", { class: "row" }, h("span", { class: "k", text: "Pinyin" }), h("div", { class: "v py", text: v.py })),
        h("div", { class: "row" }, h("span", { class: "k", text: "Español" }), h("div", { class: "v", style: "font-size:17px", text: v.es[0] })),
        ans !== undefined ? h("div", { class: "row" }, h("span", { class: "k", text: "Tu respuesta" }), h("div", { class: "v " + (ansCls || ""), style: "font-size:16px", text: ans })) : null
      ];
    }

    function renderItem() {
      var it = items[idx], checked = false, hinted = false;
      var helps = helpCounter();
      var fbBox = h("div"), hintBox = h("div", { class: "muted", style: "min-height:1.4em;margin-top:8px;text-align:center" });
      var promptEl = h("div"), answerEl = null, getAnswer = null, focusEl = null, player = null, ha = null, hintFn = null;
      var checkBtn = h("button", { class: "btn", type: "button", onclick: function () { check(); } }, "Comprobar");
      var nextBtn = h("button", { class: "btn hidden", type: "button", onclick: function () { next(); } }, idx + 1 < items.length ? "Siguiente →" : "Ver resultado");
      var lbl = KIND_LBL[it.kind] || "";
      var f = it.f, v = it.w || it.word;

      function done(level, score, extra) {
        checked = true;
        results[idx] = { level: level, score: score, it: it, answer: extra && extra.answer };
        SND.sfx(level);
        checkBtn.classList.add("hidden"); if (hintBtnEl) hintBtnEl.classList.add("hidden");
        nextBtn.classList.remove("hidden");
        helps.lock(); if (ha) ha.lock();
        setTimeout(function () { nextBtn.focus(); }, 30);
      }
      function fb(level, title, rows, allowOverride) {
        fbBox.innerHTML = "";
        add(fbBox, h("div", { class: "fb " + level },
          h("span", { class: "stamp", text: stampText(level) }),
          h("h4", { text: title }),
          rows,
          allowOverride && level !== "ok" ? h("button", { class: "link-btn", type: "button", onclick: function () {
            results[idx].level = "ok"; results[idx].score = helps.apply(1); SND.sfx("ok"); this.textContent = "Marcada como correcta"; this.disabled = true;
          } }, "Mi respuesta también es correcta") : null));
      }

      // ---- opción múltiple (gramática, vocabulario, contexto, escucha)
      function choiceUI(opts, ok, zhOpts, after) {
        var res = h("div");
        var btns = opts.map(function (op, oi) {
          return h("button", { type: "button", class: "chip g-op" + (zhOpts || hasZh(op) ? " zh-op" : ""), onclick: function () {
            if (checked) return;
            var good = oi === ok;
            btns.forEach(function (b, bi) { b.classList.add(bi === ok ? "g-ok" : bi === oi ? "g-ko" : "g-dim"); });
            done(good ? "ok" : "ko", good ? 1 : 0, { answer: op });
            res.className = "res " + (good ? "ok" : "ko");
            add(res, [h("b", { text: good ? "✓ ¡Bien! " : "✗ La correcta es «" + opts[ok] + "». " })]);
            if (after) add(res, after(good));
          } }, zhOpts || hasZh(op) ? h("span", { class: "zh", text: op }) : op);
        });
        return h("div", null, h("div", { class: "chips ej-opts" }, btns), res);
      }

      if (it.kind === "choice" || it.kind === "listen_word") {
        if (it.promptWord) {
          lbl = "¿Qué significa esta palabra?";
          add(promptEl, h("div", { class: "big zh no-zh" }, v.zh));
        } else if (it.kind === "listen_word") {
          lbl = "Escucha la palabra y elige su hanzi";
          player = new Player({ id: v.au, lines: [{ zh: v.zh, v: "f1" }], label: "Palabra", compact: true });
          add(promptEl, player.el);
        } else {
          if (it.tag) lbl = it.tag === "Gramática" ? "Gramática · elige la opción correcta" : it.tag === "Vocabulario en contexto" ? "Completa la frase con la palabra que falta" : "Elige la opción correcta";
          add(promptEl, h("div", { class: "big" + (hasZh(it.q) && !/[a-záéíóúñ¿]{3}/i.test(it.q) ? " zh" : "") }, it.q));
        }
        answerEl = choiceUI(it.opts, it.ok, it.zhOpts, function () {
          var out = [];
          if (it.exp) out.push(h("span", { text: it.exp }));
          if (v) out.push(h("div", { class: "fb-mini" }, h("span", { class: "zh", style: "font-size:22px" }, renderWords(segment(v.zh), "zh")), "  ", h("span", { class: "py", text: v.py }), " · ", v.es[0], " ", speakBtn(v.zh, v.au)));
          if (it.sent) out.push(h("div", { class: "fb-mini" }, h("div", { class: "zh", style: "font-size:22px" }, renderWords(segment(it.sent.zh), "zh"), " ", speakBtn(it.sent.zh, it.sent.au)),
            h("div", { class: "py", text: it.sent.py }), h("div", { text: it.sent.es[0] })));
          return out;
        });
        checkBtn.classList.add("hidden");
      } else if (it.kind === "listen_choice") {
        player = new Player({ id: f.au, lines: [{ zh: f.tts || f.zh, v: "f1" }], label: "Escucha la frase", compact: true });
        add(promptEl, player.el);
        var others = pickOthers(it.pool, f, 3, function (x) { return x.es[0]; }).map(function (x) { return x.es[0]; });
        var c = mkChoice(f.es[0], others);
        answerEl = choiceUI(c.opts, c.ok, false, function () { return h("div", { class: "fb-mini" }, h("div", { class: "zh", style: "font-size:22px" }, renderWords(segment(f.zh), "zh")), h("div", { class: "py", text: f.py })); });
        checkBtn.classList.add("hidden");
      } else if (it.kind === "order") {
        add(promptEl, h("div", { class: "big", text: f.es[0] }));
        var words = tileWords(f.zh), sh = shuffle(words), guard = 0;
        while (words.length > 1 && sh.join("") === words.join("") && guard++ < 10) sh = shuffle(words);
        ha = hanziAnswer(sh, [], function () { checked ? next() : check(); });
        answerEl = ha.el; getAnswer = ha.get;
        hintFn = function () { add(hintBox, h("span", { class: "zh", style: "font-size:22px;color:var(--ink)", text: words[0] + " …" }), h("div", { style: "font-size:13px", text: "La frase empieza así (con pista cuenta la mitad)" })); };
      } else if (it.kind === "zh_es") {
        add(promptEl, h("div", { class: "big zh" }, renderWords(segment(f.zh), "zh", false, { onReveal: helps.reveal })), helps.el);
        var ta = h("textarea", { class: "inp", placeholder: "Escribe la traducción en español", "aria-label": "Traducción" });
        ta.addEventListener("keydown", function (ev) { if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); checked ? next() : check(); } });
        answerEl = ta; focusEl = ta; getAnswer = function () { return ta.value; };
        hintFn = function () { add(hintBox, h("span", { class: "py", style: "font-size:18px;color:var(--ink)", text: f.py })); };
      } else if (it.kind === "es_py" || it.kind === "espy" || it.kind === "listen_py" || it.kind === "word_py") {
        if (it.kind === "listen_py") {
          player = new Player({ id: f.au, lines: [{ zh: f.tts || f.zh, v: "f1" }], label: "Escucha la frase", compact: true });
          add(promptEl, player.el);
          hintFn = function () { add(hintBox, h("span", { class: "zh no-zh", style: "font-size:24px;color:var(--ink)", text: f.zh })); };
        } else if (it.kind === "es_py") {
          add(promptEl, h("div", { class: "big", text: f.es[0] }));
          hintFn = function () { add(hintBox, h("span", { class: "py", style: "font-size:18px;color:var(--ink)", text: f.py.split(/\s+/).map(function (x) { return x.charAt(0) + "…"; }).join(" ") })); };
        } else if (it.kind === "espy") {
          add(promptEl, h("div", { class: "big", text: glossShort(v.es[0]) }));
          hintFn = function () { add(hintBox, h("span", { class: "zh no-zh", style: "font-size:26px;color:var(--ink)", text: v.zh })); };
        } else {
          add(promptEl, h("div", { class: "big zh no-zh", style: "font-size:clamp(40px,7vw,60px)" }, v.zh));
          hintFn = function () { add(hintBox, h("span", { style: "font-size:17px;color:var(--ink)", text: v.es[0] })); };
        }
        var pin = pinyinInput({ onEnter: function () { checked ? next() : check(); } });
        answerEl = pin.el; focusEl = pin.input; getAnswer = function () { return pin.input.value; };
      } else if (it.kind === "word_es") {
        add(promptEl, h("div", { class: "big zh no-zh", style: "font-size:clamp(40px,7vw,60px)" }, v.zh), speakBtn(v.zh, v.au));
        var inp = h("input", { class: "inp", type: "text", autocomplete: "off", placeholder: "Significado en español", "aria-label": "Significado" });
        inp.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); checked ? next() : check(); } });
        answerEl = inp; focusEl = inp; getAnswer = function () { return inp.value; };
        hintFn = function () { add(hintBox, h("span", { class: "py", style: "font-size:20px;color:var(--ink)", text: v.py })); };
      } else if (it.kind === "es_zh") {
        add(promptEl, h("div", { class: "big", text: f.es[0] }));
        var tw = tileWords(f.zh);
        var dis = shuffle(uniq([].concat.apply([], it.pool.map(function (o) { return tileWords(o.zh); }))).filter(function (w) { return tw.indexOf(w) < 0; })).slice(0, 3);
        ha = hanziAnswer(tw, dis, function () { checked ? next() : check(); });
        answerEl = ha.el; getAnswer = ha.get;
        hintFn = function () { add(hintBox, h("span", { class: "py", style: "font-size:18px;color:var(--ink)", text: f.py })); };
      } else if (it.kind === "lectura") {
        answerEl = lecturaUI(it.lec);
        checkBtn.classList.add("hidden");
      }

      function check() {
        if (checked || !getAnswer) return;
        var ans = getAnswer();
        if (!ans.trim()) { if (focusEl) { focusEl.focus(); focusEl.classList.add("shake"); setTimeout(function () { focusEl.classList.remove("shake"); }, 400); } return; }
        var r, marks = null, rows, cls = "";
        if (it.kind === "zh_es") { r = C.compareSpanish(ans, f.es); rows = sentenceRows(f, null, ans); }
        else if (it.kind === "word_es") {
          r = C.compareSpanish(ans, glossVariants(v.es[0]));
          if (r.level !== "ok" && C.matchKeywords(ans, glossVariants(v.es[0])).level === "ok") r = { level: "ok", score: 1 };
          rows = wordRows(v, ans);
        } else if (it.kind === "es_py" || it.kind === "listen_py") {
          var best0 = null;
          [f.py].concat(f.altpy || []).forEach(function (o) { var x = C.comparePinyin(o, ans, ignoreTones()); if (!best0 || x.score > best0.score) best0 = x; });
          r = best0; marks = r.marks; rows = sentenceRows(f, marks, ans, "py");
        } else if (it.kind === "word_py" || it.kind === "espy") {
          r = C.comparePinyin(v.py, ans, ignoreTones()); rows = wordRows(v, ans, "py");
          rows[1] = h("div", { class: "row" }, h("span", { class: "k", text: "Pinyin" }), h("div", { class: "v py" }, marksView(r.marks, ignoreTones())));
        } else { r = C.compareHanzi(ans, [f.zh].concat(f.altzh || [])); rows = sentenceRows(f, null, ans, "zh"); }
        var score = helps.apply(hinted ? Math.min(r.score, 0.5) : r.score);
        var level = levelOf(score);
        done(level, score, { answer: ans });
        if (pin) pin.input.disabled = true;
        if (answerEl && answerEl.tagName === "TEXTAREA" || answerEl && answerEl.tagName === "INPUT") answerEl.disabled = true;
        var tt = level === "ok" ? "¡Correcto! 很好！" : level === "mid" ? (r.lettersOk ? "Las sílabas están bien, revisa los tonos." : "¡Casi! Compara con la respuesta.") : "No es correcto. Mira la respuesta.";
        fb(level, tt + (hinted ? " (con pista)" : "") + helps.note(), rows, true);
      }
      function next() { if (player) player.stop(); stopAll(); idx++; if (idx < items.length) renderItem(); else finish(); }

      var hintBtnEl = hintFn ? h("button", { class: "btn soft sm", type: "button", onclick: function () {
        if (checked || hinted) return; hinted = true; hintBox.innerHTML = ""; hintFn();
        add(hintBox, h("div", { style: "font-size:13px", text: "(con pista, la respuesta cuenta como media)" }));
      } }, icon("bulb", 16), "Pista") : null;

      wrap.innerHTML = "";
      add(wrap, [head(true),
        h("div", { class: "card q-card" + (it.kind === "lectura" ? " reading" : "") },
          h("div", { class: "prompt" }, h("div", { class: "lbl", text: (it.tag && it.kind === "choice" ? "" : "") + lbl }), promptEl, hintBox),
          answerEl,
          h("div", { class: "btn-row", style: "margin-top:16px" }, checkBtn, hintBtnEl, nextBtn),
          fbBox)]);
      if (focusEl) focusEl.focus();
      if (player) setTimeout(function () { player.play(true); }, 250);

      // ---- lectura con 3 preguntas
      function lecturaUI(lec) {
        var ruby = false, body = h("div", { class: "text-body lv2" });
        var paras = lec.zh.split(/\n+/);
        function paint() { body.innerHTML = ""; paras.forEach(function (p) { add(body, h("p", null, renderWords(segment(p), "zh", ruby))); }); }
        paint();
        var lp = new Player({ id: lec.au, label: "Texto", compact: true, lines: (lec.zh.match(/[^。！？]+[。！？]?/g) || [lec.zh]).map(function (x) { return { zh: x, v: "f2" }; }) });
        player = null;
        var answered = 0, good = 0, trBox = h("div", { class: "hidden" });
        var qs = lec.preguntas.map(function (q, qi) {
          var c = mkChoice(q.opciones[q.ok], q.opciones.filter(function (_, i) { return i !== q.ok; }));
          var res = h("div"), card, dn = false;
          var btns = c.opts.map(function (op, oi) {
            return h("button", { type: "button", class: "chip g-op" + (hasZh(op) ? " zh-op" : ""), onclick: function () {
              if (dn) return; dn = true;
              var ok = oi === c.ok; answered++; if (ok) good++;
              btns.forEach(function (b, bi) { b.classList.add(bi === c.ok ? "g-ok" : bi === oi ? "g-ko" : "g-dim"); });
              SND.sfx(ok ? "ok" : "ko");
              res.className = "res " + (ok ? "ok" : "ko");
              add(res, h("b", { text: ok ? "✓ ¡Bien!" : "✗ La correcta es «" + c.opts[c.ok] + "»." }));
              if (answered === lec.preguntas.length) {
                var sc = good / answered;
                trBox.classList.remove("hidden");
                done(levelOf(sc === 1 ? 1 : sc >= 0.5 ? 0.5 : 0), sc, { answer: good + "/" + answered });
              }
            } }, hasZh(op) ? h("span", { class: "zh", text: op }) : op);
          });
          card = h("div", { class: "card qq" }, h("div", { class: "qh" }, h("span", { class: "qn", text: qi + 1 }), h("div", { class: "qt" }, q.q)),
            h("div", { class: "chips", style: "margin-top:12px" }, btns), res);
          return card;
        });
        add(trBox, h("div", { class: "fb-mini", style: "margin-top:14px" }, h("div", { class: "py", style: "margin-bottom:6px", text: lec.py }), h("div", { text: lec.es })));
        return h("div", null,
          h("h2", { style: "margin:0 0 8px;font-size:21px", text: lec.titulo }),
          h("label", { class: "toggle", style: "margin-bottom:10px" }, h("input", { type: "checkbox", onchange: function (ev) { ruby = ev.target.checked; paint(); } }), "Mostrar el pinyin encima de los hanzi"),
          body, lp.el, trBox,
          h("div", { class: "qs", style: "margin-top:16px" }, qs));
      }
    }

    function finish() {
      var total = results.reduce(function (s, r) { return s + (r ? r.score : 0); }, 0);
      var p = pct(total / items.length);
      if (!retry) saveResult(o.key, p);
      resultSound(p);
      if (p >= 80) burst();
      var wrong = results.map(function (r, i) { return r && r.level !== "ok" ? items[i] : null; }).filter(Boolean);
      wrap.innerHTML = "";
      add(wrap, [head(false),
        h("div", { class: "card result" },
          h("div", { class: "big-stamp", text: resultStamp(p) }),
          h("div", { class: "pct", text: p + "%" }),
          h("div", { class: "sub", text: resultMsg(p) }),
          h("div", { class: "btn-row", style: "justify-content:center;margin-top:18px" },
            wrong.length ? h("button", { class: "btn", type: "button", onclick: function () { runSession(Object.assign({}, o, { items: wrong }), true); } }, "Repetir los " + wrong.length + " fallos") : null,
            h("button", { class: "btn ghost", type: "button", onclick: function () { route(); } }, "Empezar de nuevo"),
            o.next ? h("a", { class: "btn soft", href: o.next }, "Siguiente ejercicio →") : null),
          h("div", { class: "review" }, results.map(function (r) {
            if (!r) return null;
            var it = r.it, f = it.f || it.sent, v = it.w || it.word;
            var main = f ? [h("div", { class: "zh", text: f.zh }), h("div", { class: "py", text: f.py }), h("div", { class: "muted", style: "font-size:14px", text: f.es[0] })]
              : v ? [h("div", { class: "zh", text: v.zh }), h("div", { class: "py", text: v.py }), h("div", { class: "muted", style: "font-size:14px", text: v.es[0] })]
              : it.lec ? [h("div", { style: "font-weight:700", text: "Lectura: " + it.lec.titulo })]
              : [h("div", { text: it.q }), h("div", { class: "muted", style: "font-size:14px", text: "Respuesta: " + it.opts[it.ok] })];
            return h("div", { class: "it" }, h("span", { class: "m " + r.level, text: r.level === "ok" ? "✓" : r.level === "mid" ? "~" : "✗" }),
              h("div", null, main, r.level !== "ok" && r.answer ? h("div", { class: "muted", style: "font-size:14px", text: "Tú: " + r.answer }) : null));
          })))]);
    }
    renderItem();
  }

  // --------------------------------------------------------- cómo escribir
  function viewTeclado() {
    function sec(zh, title, body) { return h("div", { class: "card kb-sec" }, h("div", { class: "kb-h" }, h("span", { class: "brush", text: zh }), h("h3", { text: title })), body); }
    function steps(list) { return h("ol", { class: "steps" }, list.map(function (x) { return h("li", { html: x }); })); }
    function dev(name, list, sw) { return h("details", { class: "dev" }, h("summary", { text: name }), steps(list), sw ? h("p", { class: "muted", html: sw }) : null); }
    view("teclado", h("div", { class: "ex-wrap" },
      pageHead("键盘", "Cómo escribir pinyin y hanzi", "Resumen: <b>no tienes que instalar nada</b>. Con el teclado normal de tu ordenador o móvil puedes hacer toda la app. Instalar el teclado chino es opcional."),
      h("div", { class: "grid", style: "gap:14px" },
        sec("拼音", "Pinyin: teclado normal, sin instalar nada", h("div", null,
          h("p", { html: "Escribe las letras y pon el tono de una de estas tres maneras:" }),
          h("ul", { class: "steps" },
            h("li", { html: "<b>Con un número después de la sílaba:</b> <span class='kbd'>hao3</span> se convierte solo en <span class='py'>hǎo</span>. 1 = ā, 2 = á, 3 = ǎ, 4 = à. El tono neutro no lleva número." }),
            h("li", { html: "<b>Con los botones</b> ˉ ˊ ˇ ˋ que hay debajo de cada casilla: escribe la sílaba y pulsa el tono. Es lo más cómodo en el móvil." }),
            h("li", { html: "<b>La ü:</b> escribe <span class='kbd'>v</span> (<span class='kbd'>nv3</span> → <span class='py'>nǚ</span>) o pulsa el botón ü." }),
            h("li", { html: "Puedes escribir las sílabas juntas o separadas (<span class='py'>xuésheng</span> o <span class='py'>xué sheng</span>), en mayúsculas o minúsculas. Si prefieres no preocuparte de los tonos, desactívalos en <a href='#/ajustes'>Ajustes</a>." })))),
        sec("西班牙语", "Español: teclado normal", h("p", { html: "Las tildes, las mayúsculas y los signos ¿? no cuentan, así que no hace falta cambiar nada del teclado. Los números valen en cifra o en letra (3 = tres)." })),
        sec("汉字", "Hanzi: tres opciones", h("div", null,
          h("p", { html: "Solo hace falta escribir hanzi en la <b>traducción de nivel 4</b> (español → hanzi). Allí eliges cómo:" }),
          h("ul", { class: "steps" },
            h("li", { html: "<b>Fichas</b> (por defecto): tocas las palabras en orden. No necesita teclado." }),
            h("li", { html: "<b>Teclado de la app (pinyin → hanzi):</b> escribes el pinyin sin tonos (<span class='kbd'>woxiang</span>) y eliges la palabra en la lista (我 → 想). Funciona en cualquier ordenador o móvil y solo propone palabras del curso." }),
            h("li", { html: "<b>Teclado chino del dispositivo:</b> el que usan los chinos. Es opcional, pero muy útil si vas a seguir estudiando. Se instala así:" })),
          dev("iPhone / iPad", [
            "Ajustes → General → Teclado → Teclados → <b>Añadir teclado…</b>",
            "Elige <b>Chino (simplificado)</b> → marca <b>Pinyin – QWERTY</b> → OK.",
            "Para usarlo: en cualquier teclado, toca el <b>globo 🌐</b> hasta que salga 拼音. Escribe <span class='kbd'>nihao</span> y elige 你好."
          ], "Para volver al español, toca otra vez el globo."),
          dev("Android (teclado Gboard)", [
            "Abre los ajustes de Gboard (toca el engranaje ⚙ del teclado, o Ajustes → Sistema → Teclado → Gboard).",
            "<b>Idiomas → Añadir teclado</b> → busca <b>Chino (simplificado)</b> → elige <b>Pinyin</b> → Hecho.",
            "Para usarlo: toca el <b>globo 🌐</b> del teclado o mantén pulsada la barra espaciadora y elige 中文."
          ], "Si tu móvil usa otro teclado (Samsung, etc.), instalar Gboard desde Play Store es lo más sencillo."),
          dev("Windows 10 / 11", [
            "Inicio → Configuración → <b>Hora e idioma → Idioma y región</b> (en Windows 10: <b>Idioma</b>).",
            "<b>Agregar un idioma</b> → <b>Chino (simplificado, China)</b> → Siguiente → Instalar. (Puedes desmarcar «Establecer como idioma de Windows».)",
            "Queda incluido el teclado <b>Microsoft Pinyin</b>.",
            "Para cambiar de teclado: <span class='kbd'>Windows</span> + <span class='kbd'>Espacio</span>. Con Microsoft Pinyin, <span class='kbd'>Mayús</span> alterna entre chino (中) e inglés (英)."
          ]),
          dev("Mac", [
            "Menú  → Ajustes del Sistema → <b>Teclado</b> → Fuentes de entrada → <b>Editar…</b>",
            "Pulsa <b>+</b> → <b>Chino simplificado</b> → <b>Pinyin – Simplificado</b> → Añadir.",
            "Para cambiar de teclado: <span class='kbd'>Control</span> + <span class='kbd'>Espacio</span> (o la tecla 🌐 / fn)."
          ], "Truco para pinyin con tonos en el Mac sin la app: añade también la fuente «ABC – Extendido»; con ella, <span class='kbd'>Opción</span> + <span class='kbd'>a</span> y luego la vocal pone el tono 1 (ā), Opción+e → 2, Opción+v → 3, Opción+` → 4."),
          dev("Chromebook / Linux", [
            "Chromebook: Configuración → Dispositivo → Teclado → Cambiar configuración de entrada → Métodos de entrada → <b>Añadir</b> → Pinyin.",
            "Linux (Ubuntu, Vitalinux…): instala <b>ibus-libpinyin</b> (o fcitx-pinyin) y añade «Chinese – Intelligent Pinyin» en Configuración → Teclado. Si no puedes instalar programas, usa el teclado de la app."
          ]))))));
  }

  // ---------------------------------------------------------------- ajustes
  function viewAjustes() {
    function radio(name, val, title, sub) {
      return h("label", { class: "opt" }, h("input", { type: "radio", name: name, checked: S.settings[name] === val, onchange: function () { S.settings[name] = val; persist(); if (name === "theme") applyTheme(); } }),
        h("span", null, h("b", { text: title }), sub ? h("small", { text: sub }) : null));
    }
    TTS.load();
    var voiceSel = h("select", { class: "inp", style: "font-size:16px", onchange: function (e) { S.settings.voice = e.target.value; persist(); } },
      h("option", { value: "", text: "Automática" }),
      TTS.voices.map(function (v) { return h("option", { value: v.name, selected: S.settings.voice === v.name, text: v.name + " (" + v.lang + ")" }); }));
    var rec = manifest() ? Object.keys(manifest()).length : 0;
    view("ajustes", h("div", { class: "settings" },
      pageHead("设置", "Ajustes", "Se guardan en este navegador."),
      h("div", { class: "grid g3" },
        h("div", { class: "card" }, h("h3", { text: "Tonos" }),
          radio("tones", "cuentan", "Los tonos cuentan", "Un tono mal = respuesta a medias (recomendado)."),
          radio("tones", "ignorar", "Ignorar los tonos", "Solo se corrigen las letras. Los tonos se marcan, pero no restan.")),
        h("div", { class: "card" }, h("h3", { text: "Velocidad por defecto" }),
          SPEEDS.map(function (sp) { return radio("speed", sp.k, sp.es + " · " + sp.zh, null); })),
        h("div", { class: "card" }, h("h3", { text: "Escribir pinyin" }),
          h("label", { class: "toggle" }, h("input", { type: "checkbox", checked: S.settings.autoTone, onchange: function (e) { S.settings.autoTone = e.target.checked; persist(); } }),
            "Convertir números en tonos al escribir (hao3 → hǎo, v → ü)"),
          h("a", { class: "btn soft sm", href: "#/teclado" }, icon("keyboard", 16), "Cómo escribir pinyin y hanzi")),
        h("div", { class: "card" }, h("h3", { text: "Sonido" }),
          h("label", { class: "toggle" }, h("input", { type: "checkbox", checked: S.settings.music, onchange: function (e) { S.settings.music = e.target.checked; persist(); syncSound(); } }),
            "Música de fondo en los menús (se para en los ejercicios)"),
          h("label", null, h("div", { class: "muted", style: "font-size:13px;margin-bottom:4px", text: "Volumen de la música" }),
            h("input", { type: "range", min: "0.1", max: "1", step: "0.05", value: S.settings.musicVol, style: "width:100%;accent-color:var(--red)", oninput: function (e) { S.settings.musicVol = +e.target.value; persist(); syncSound(); } })),
          h("label", { class: "toggle" }, h("input", { type: "checkbox", checked: S.settings.sfx, onchange: function (e) { S.settings.sfx = e.target.checked; persist(); syncSound(); if (S.settings.sfx) SND.sfx("ok"); } }),
            "Efectos de acierto, fallo y resultado"),
          h("div", { class: "btn-row" }, ["ok", "mid", "ko", "excelente", "suspenso"].map(function (k) {
            var lbl = { ok: "Acierto", mid: "Casi", ko: "Fallo", excelente: "Aprobado", suspenso: "Suspenso" }[k];
            return h("button", { type: "button", class: "btn soft sm", onclick: function () { SND.sfx(k); } }, "▶ " + lbl);
          }))),
        h("div", { class: "card" }, h("h3", { text: "Aspecto" }),
          radio("theme", "auto", "Automático", "Como el sistema"), radio("theme", "light", "Claro", null), radio("theme", "dark", "Oscuro", null)),
        h("div", { class: "card" }, h("h3", { text: "Voz" }),
          h("p", { class: "muted", style: "margin:0;font-size:14px", text: rec ? "Hay " + rec + " audios grabados con voces nativas: se usan siempre que existen." : "Aún no hay audios grabados: se usa la voz del navegador." }),
          h("label", null, h("div", { class: "muted", style: "font-size:13px;margin-bottom:4px", text: "Voz del navegador (para lo que no esté grabado)" }), voiceSel),
          h("button", { class: "btn soft sm", type: "button", onclick: function () { speakOnce("我每天早上六点起床，然后去跑步。"); } }, icon("speaker", 16), "Probar la voz")),
        h("div", { class: "card" }, h("h3", { text: "Progreso" }),
          h("p", { class: "muted", style: "margin:0;font-size:14px", text: Object.keys(S.progress).length + " ejercicios hechos." }),
          h("button", { class: "btn ghost sm", type: "button", onclick: function () {
            if (confirm("¿Borrar todo el progreso guardado en este navegador?")) { S.progress = {}; persist(); viewAjustes(); }
          } }, "Borrar el progreso")))));
  }

  // ======================================================================
  // rutas
  // ======================================================================
  function route() {
    var parts = (location.hash.replace(/^#\/?/, "") || "").split("/");
    var r = parts[0];
    var exercise = (/^(dictado|listening|lectura|gramatica)$/.test(r) && parts[1]) || (/^(traduccion|ejercicios)$/.test(r) && parts[1] !== undefined && parts[2]);
    SND.setMode(exercise ? "exercise" : "menu");
    if (r === "temas" || location.hash === "#temas") { viewHome(); var el = document.getElementById("temas"); if (el) el.scrollIntoView(); return; }
    if (r === "dictado") return parts[1] ? runDictado(parts[1]) : viewDictados();
    if (r === "listening") return parts[1] ? runListening(parts[1]) : viewListenings();
    if (r === "lectura") return parts[1] ? runLectura(parts[1]) : viewLecturas();
    if (r === "traduccion") return parts[1] !== undefined && parts[2] ? runTraduccion(+parts[1], +parts[2]) : viewTraduccion();
    if (r === "tema") return viewTema(+parts[1]);
    if (r === "vocabulario") return viewVocab();
    if (r === "ajustes") return viewAjustes();
    if (r === "teclado") return viewTeclado();
    if (r === "gramatica") return parts[1] ? runGramatica(+parts[1], parts[2]) : viewGramatica();
    if (r === "ejercicios") return parts[2] ? runEj(+parts[1], parts[2]) : parts[1] ? viewEjTema(+parts[1]) : viewEjercicios();
    viewHome();
  }
  window.addEventListener("hashchange", route);
  document.querySelector(".menu-btn").addEventListener("click", function () { document.querySelector(".nav").classList.toggle("open"); });
  document.querySelector(".menu-btn").appendChild(icon("menu", 24));
  var musicBtn = document.querySelector(".music-btn");
  function paintMusicBtn() {
    if (!musicBtn) return;
    musicBtn.classList.toggle("off", !S.settings.music);
    musicBtn.title = S.settings.music ? "Quitar la música de fondo" : "Poner música de fondo";
    musicBtn.setAttribute("aria-label", musicBtn.title);
    musicBtn.setAttribute("aria-pressed", S.settings.music ? "true" : "false");
  }
  if (musicBtn) musicBtn.addEventListener("click", function () { S.settings.music = !S.settings.music; persist(); syncSound(); });
  syncSound();

  // pétalos de ciruelo
  (function petals() {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var box = document.querySelector(".petals");
    for (var i = 0; i < 9; i++) {
      box.appendChild(h("span", { class: "petal", style: "left:" + (Math.random() * 100) + "%;animation-duration:" + (14 + Math.random() * 14) + "s;animation-delay:-" + (Math.random() * 20) + "s;--dx:" + (40 + Math.random() * 120) + "px;transform:scale(" + (0.6 + Math.random() * 0.6) + ")" }));
    }
  })();

  route();
})();
