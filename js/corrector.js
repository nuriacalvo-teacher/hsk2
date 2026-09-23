/* ==========================================================================
   corrector.js · corrige pinyin, español y hanzi
   --------------------------------------------------------------------------
   - Pinyin: acepta tonos con marcas (nǐ hǎo) o con números (ni3 hao3),
     con o sin espacios, v o ü. Compara sílaba a sílaba y distingue
     "letras bien, tono mal" de "sílaba mal".
   - Español: sin tildes ni mayúsculas, ignora artículos y preposiciones,
     "3" = "tres", masculino/femenino y plural equivalentes.
   - Hanzi: ignora puntuación y espacios; 28 = 二十八.
   ========================================================================== */
(function (global) {
  "use strict";

  var MARKS = {
    "ā": ["a", 1], "á": ["a", 2], "ǎ": ["a", 3], "à": ["a", 4],
    "ē": ["e", 1], "é": ["e", 2], "ě": ["e", 3], "è": ["e", 4],
    "ī": ["i", 1], "í": ["i", 2], "ǐ": ["i", 3], "ì": ["i", 4],
    "ō": ["o", 1], "ó": ["o", 2], "ǒ": ["o", 3], "ò": ["o", 4],
    "ū": ["u", 1], "ú": ["u", 2], "ǔ": ["u", 3], "ù": ["u", 4],
    "ǖ": ["v", 1], "ǘ": ["v", 2], "ǚ": ["v", 3], "ǜ": ["v", 4], "ü": ["v", 0]
  };
  var TONED = {
    a: "āáǎà", e: "ēéěè", i: "īíǐì", o: "ōóǒò", u: "ūúǔù", v: "ǖǘǚǜ"
  };

  // ------------------------------------------------------------ sílabas
  var INITIALS = ["zh", "ch", "sh", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k",
    "h", "j", "q", "x", "r", "z", "c", "s", "y", "w", ""];
  var FINALS = ["a", "o", "e", "ai", "ei", "ao", "ou", "an", "en", "ang", "eng", "ong",
    "er", "i", "ia", "ie", "iao", "iu", "ian", "in", "iang", "ing", "iong",
    "u", "ua", "uo", "uai", "ui", "uan", "un", "uang", "ueng", "v", "ve",
    "van", "vn", "ue"];
  var SYL = {};
  INITIALS.forEach(function (i) { FINALS.forEach(function (f) { if (i + f) { SYL[i + f] = 1; SYL[i + f + "r"] = 1; } }); });

  function splitLetters(s) {
    var n = s.length, best = new Array(n + 1);
    best[0] = []; best[0].cost = 0;
    for (var i = 0; i < n; i++) {
      if (!best[i]) continue;
      for (var L = 1; L <= 7 && i + L <= n; L++) {
        var piece = s.substr(i, L);
        if (SYL[piece]) {
          // Se prefiere el menor número de sílabas, pero una sílaba con erhua
          // (qier, dianr) cuenta como algo más de una: xīngqī'èr ≠ xing + qier.
          var cost = best[i].cost + (piece !== "er" && /r$/.test(piece) ? 2.1 : 1);
          if (!best[i + L] || cost < best[i + L].cost) {
            var cand = best[i].concat([[i, i + L]]);
            cand.cost = cost;
            best[i + L] = cand;
          }
        }
      }
    }
    if (best[n]) return best[n];
    // No es pinyin válido: se trocea como se pueda para poder señalar el error.
    var out = [], i2 = 0;
    while (i2 < n) {
      var ok = false;
      for (var L2 = Math.min(6, n - i2); L2 > 0; L2--) {
        if (SYL[s.substr(i2, L2)]) { out.push([i2, i2 + L2]); i2 += L2; ok = true; break; }
      }
      if (!ok) { var j = i2 + 1; while (j < n && !SYL[s.substr(j, 1)] && !/[aeiouv]/.test(s[j])) j++; out.push([i2, j]); i2 = j; }
    }
    return out;
  }

  /** Convierte un texto en pinyin en una lista de sílabas {b: letras, t: tono 0-4}. */
  function parse(str) {
    str = (str || "").normalize("NFC").toLowerCase()
      .replace(/u:/g, "v").replace(/[’‘`´]/g, "'")
      .replace(/([1-5])r(?![aeiouvāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü])/g, "r$1");   // dian3r → dianr3
    var chunks = str.split(/[^a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü0-9]+/).filter(Boolean);
    var out = [];
    chunks.forEach(function (chunk) {
      if (/^\d+$/.test(chunk) && !/^[a-z]/.test(chunk)) {
        if (!/^[0-5]$/.test(chunk)) { out.push({ b: "#" + chunk, t: 0 }); return; }
      }
      var base = "", markAt = {}, digitAt = {};
      for (var k = 0; k < chunk.length; k++) {
        var c = chunk[k];
        if (MARKS[c]) { if (MARKS[c][1]) markAt[base.length] = MARKS[c][1]; base += MARKS[c][0]; }
        else if (/[0-5]/.test(c)) {
          if (!base.length) continue;
          digitAt[base.length] = +c === 5 ? 0 : +c;
        }
        else if (/\d/.test(c)) continue;
        else base += c;
      }
      // Las cifras de tono marcan dónde acaba una sílaba: se respeta al trocear.
      var cuts = [0];
      Object.keys(digitAt).forEach(function (p) { cuts.push(+p); });
      cuts.push(base.length);
      cuts = cuts.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
      for (var ci = 0; ci < cuts.length - 1; ci++) {
        var seg = base.slice(cuts[ci], cuts[ci + 1]);
        if (!seg) continue;
        var spans = splitLetters(seg);
        spans.forEach(function (sp, si) {
          var a = cuts[ci] + sp[0], b = cuts[ci] + sp[1], tone = 0;
          for (var p = a; p < b; p++) if (markAt[p]) tone = markAt[p];
          if (!tone && si === spans.length - 1 && digitAt[b] !== undefined) tone = digitAt[b];
          out.push({ b: base.slice(a, b), t: tone });
        });
      }
    });
    return out;
  }

  // En los números de teléfono el 1 se lee yī o yāo: valen las dos.
  function sameBase(x, y) {
    return x.b === y.b || (x.b === "yi" && y.b === "yao") || (x.b === "yao" && y.b === "yi");
  }

  function toneOk(exp, got) {
    if (exp.b !== got.b) return (exp.b === "yao" && exp.t === 1 && got.t === 1) || (got.b === "yao" && got.t === 1 && (exp.t === 1 || exp.t === 0));
    if (exp.t === got.t) return true;
    if (exp.t === 0) return true;                        // tono neutro: vale cualquiera
    if (exp.b === "bu" && (got.t === 2 || got.t === 4)) return true;     // sandhi de 不
    if (exp.b === "yi" && (got.t === 1 || got.t === 2 || got.t === 4)) return true; // sandhi de 一
    return false;
  }

  function lcs(a, b, eq) {
    var n = a.length, m = b.length, dp = [];
    for (var i = 0; i <= n; i++) { dp.push(new Array(m + 1).fill(0)); }
    for (i = n - 1; i >= 0; i--) for (var j = m - 1; j >= 0; j--)
      dp[i][j] = eq(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    var pairs = [];
    i = 0; j = 0;
    while (i < n && j < m) {
      if (eq(a[i], b[j])) { pairs.push([i, j]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
      else j++;
    }
    return pairs;
  }

  /**
   * Compara la respuesta del alumno con el pinyin esperado.
   * Devuelve {score (0..1), level: "ok"|"mid"|"ko", letters, tones, marks: [{text, st}]}
   * st: "ok" | "tone" | "miss" (sílaba esperada) — y extra = sílabas que sobran.
   */
  function comparePinyin(expected, answer, ignoreTones) {
    var E = parse(expected), U = parse(answer);
    var pairs = lcs(E, U, sameBase);
    var matchedE = {}, matchedU = {};
    pairs.forEach(function (p) { matchedE[p[0]] = p[1]; matchedU[p[1]] = 1; });
    var toneErrors = 0, missing = 0;
    var st = E.map(function (e, i) {
      if (matchedE[i] === undefined) { missing++; return "miss"; }
      if (!toneOk(e, U[matchedE[i]])) { toneErrors++; return "tone"; }
      return "ok";
    });
    var extra = U.length - pairs.length;
    var lettersOk = missing === 0 && extra === 0 && E.length > 0;
    var score, level;
    if (lettersOk && (toneErrors === 0 || ignoreTones)) { score = 1; level = "ok"; }
    else if (lettersOk) { score = 0.5; level = "mid"; }
    else {
      score = 0; level = "ko";
      // Casi: una sola sílaba mal en una frase larga
      if (E.length >= 5 && missing + extra <= 1 && toneErrors <= 1) { score = 0.5; level = "mid"; }
    }
    return {
      score: score, level: level, lettersOk: lettersOk, toneErrors: toneErrors,
      missing: missing, extra: extra, total: E.length,
      marks: markPinyin(expected, st)
    };
  }

  /** Reparte los estados de las sílabas sobre el texto original (con sus tonos). */
  function markPinyin(text, states) {
    var out = [], idx = 0;
    var tokens = text.match(/[A-Za-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüÀ-ÿĀ-ž']+|[^A-Za-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüÀ-ÿĀ-ž']+/g) || [];
    tokens.forEach(function (tok) {
      if (!/[a-zA-ZāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüÀ-ÿĀ-ž]/.test(tok)) { out.push({ text: tok, st: "" }); return; }
      var syls = parse(tok);
      if (!syls.length) { out.push({ text: tok, st: "" }); return; }
      // cortar el token original en tantas partes como sílabas
      var parts = cutToken(tok, syls);
      parts.forEach(function (p) { out.push({ text: p, st: states[idx++] || "" }); });
    });
    return out;
  }

  function cutToken(tok, syls) {
    var res = [], pos = 0;
    syls.forEach(function (s, i) {
      if (i === syls.length - 1) { res.push(tok.slice(pos)); return; }
      var count = 0, start = pos;
      while (pos < tok.length && count < s.b.length) {
        var c = tok[pos].toLowerCase();
        if (c !== "'") count++;
        pos++;
      }
      res.push(tok.slice(start, pos));
    });
    return res;
  }

  /** ¿La respuesta del alumno contiene las sílabas de alguna respuesta aceptada? */
  function containsPinyin(answer, accepted, ignoreTones) {
    var U = parse(answer), best = { level: "ko", score: 0 };
    accepted.forEach(function (acc) {
      var A = parse(acc);
      if (!A.length) return;
      for (var s = 0; s + A.length <= U.length; s++) {
        var ok = true, toneBad = 0;
        for (var k = 0; k < A.length; k++) {
          if (!sameBase(A[k], U[s + k])) { ok = false; break; }
          if (!toneOk(A[k], U[s + k])) toneBad++;
        }
        if (ok) {
          var r = (toneBad === 0 || ignoreTones) ? { level: "ok", score: 1 } : { level: "mid", score: 0.5 };
          if (r.score > best.score) best = r;
        }
      }
    });
    return best;
  }

  // ------------------------------------------------------------- escribir tonos
  /** Pone el tono n (1-4, 0 = quitar) en la sílaba sin tono que acaba en `syl`. */
  function applyTone(syl, n) {
    var plain = syl.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/g, function (c) { return MARKS[c][0]; });
    if (!n) return plain.replace(/v/g, "ü");
    var i = -1;
    if (plain.indexOf("a") >= 0) i = plain.indexOf("a");
    else if (plain.indexOf("e") >= 0) i = plain.indexOf("e");
    else if (plain.indexOf("ou") >= 0) i = plain.indexOf("o");
    else {
      for (var k = plain.length - 1; k >= 0; k--) if (/[aeiouv]/.test(plain[k])) { i = k; break; }
    }
    if (i < 0) return plain.replace(/v/g, "ü");
    var v = plain[i];
    return (plain.slice(0, i) + TONED[v][n - 1] + plain.slice(i + 1)).replace(/v/g, "ü");
  }

  /** Convierte "ni3 hao3" → "nǐ hǎo" (y v → ü) mientras se escribe. */
  function numbersToMarks(text) {
    return text.replace(/([a-zA-ZüÜvV:]+)([1-5])/g, function (all, syl, d) {
      var lower = syl.toLowerCase().replace(/u:/g, "v");
      if (!SYL[lower.replace(/ü/g, "v")] && !/[aeiouvü]/.test(lower)) return all;
      var toned = applyTone(lower.replace(/ü/g, "v"), d === "5" ? 0 : +d);
      if (syl[0] === syl[0].toUpperCase() && /[A-Z]/.test(syl[0])) toned = toned[0].toUpperCase() + toned.slice(1);
      return toned;
    });
  }

  /** Aplica el tono a la última sílaba antes del cursor (botones ā á ǎ à). */
  function toneAtCaret(value, caret, n) {
    var before = value.slice(0, caret), after = value.slice(caret);
    var m = before.match(/([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüv]+)$/);
    if (!m) return { value: value, caret: caret };
    var word = m[1];
    // última sílaba del bloque
    var spans = splitLetters(stripMarks(word.toLowerCase()).replace(/ü/g, "v"));
    var last = spans[spans.length - 1];
    var sylText = word.slice(last[0]);
    var upper = /[A-Z]/.test(sylText[0]);
    var toned = applyTone(sylText.toLowerCase().replace(/ü/g, "v"), n);
    if (upper) toned = toned[0].toUpperCase() + toned.slice(1);
    var nb = before.slice(0, before.length - sylText.length) + toned;
    return { value: nb + after, caret: nb.length };
  }

  function stripMarks(s) {
    return s.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, function (c) { return MARKS[c][0]; });
  }

  // ---------------------------------------------------------------- español
  var STOP = ("el la los las un una unos unas lo al del de a en y e o u que se me te le les nos os " +
    "es son esta estan este esto eso ese esa por para con mi mis tu tus su sus muy ya pero").split(" ");
  var STOPSET = {}; STOP.forEach(function (w) { STOPSET[w] = 1; });
  var NUMS = {
    cero: 0, uno: 1, una: 1, un: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8,
    nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16,
    diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintiun: 21, veintiuna: 21,
    veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27,
    veintiocho: 28, veintinueve: 29, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60,
    setenta: 70, ochenta: 80, noventa: 90, cien: 100
  };
  var SYN = { computadora: "ordenador", pc: "ordenador", auto: "coche", carro: "coche", automovil: "coche",
    profe: "profesor", maestro: "profesor", maestra: "profesor", doctor: "medico", doctora: "medico",
    papa: "padre", mama: "madre", perrito: "perro", gatito: "gato", tele: "television", tv: "television",
    filme: "pelicula", cine: "pelicula", yuanes: "yuan", kuai: "yuan", colegio: "escuela",
    lunes: "lunes" };

  function esTokens(s) {
    s = (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[¿?¡!.,;:()"«»\-–—/]/g, " ");
    var raw = s.split(/\s+/).filter(Boolean), out = [];
    for (var i = 0; i < raw.length; i++) {
      var w = raw[i];
      if (NUMS[w] !== undefined) {
        var v = NUMS[w];
        // "treinta y ocho"
        if (v >= 30 && v % 10 === 0 && raw[i + 1] === "y" && NUMS[raw[i + 2]] !== undefined && NUMS[raw[i + 2]] < 10) {
          v += NUMS[raw[i + 2]]; i += 2;
        }
        out.push(String(v)); continue;
      }
      out.push(w);
    }
    return out;
  }
  function stem(w) {
    if (/^\d+$/.test(w)) return w;
    w = SYN[w] || w;
    if (w.length > 4) w = w.replace(/(es|s)$/, "");
    if (w.length > 3) w = w.replace(/[aoe]$/, "");
    return w;
  }
  function content(s) {
    var t = esTokens(s), c = t.filter(function (w) { return !STOPSET[w]; });
    return (c.length ? c : t).map(stem);
  }

  /** Pregunta de comprensión en español: todas las palabras clave de alguna respuesta. */
  function matchKeywords(answer, accepted) {
    var got = {}; content(answer).forEach(function (w) { got[w] = 1; });
    var raw = {}; esTokens(answer).map(stem).forEach(function (w) { raw[w] = 1; });
    for (var i = 0; i < accepted.length; i++) {
      var need = content(accepted[i]);
      if (need.length && need.every(function (w) { return got[w] || raw[w]; })) return { level: "ok", score: 1 };
    }
    // no / sí aislados
    return { level: "ko", score: 0 };
  }

  /** Traducción al español: parecido con la mejor de las traducciones válidas. */
  function compareSpanish(answer, variants) {
    var B = content(answer), best = 0, bestV = variants[0];
    if (!B.length) return { level: "ko", score: 0, sim: 0, best: bestV };
    variants.forEach(function (v) {
      var A = content(v), setB = {}, inter = 0;
      B.forEach(function (w) { setB[w] = (setB[w] || 0) + 1; });
      A.forEach(function (w) { if (setB[w]) { inter++; setB[w]--; } });
      var f = 2 * inter / (A.length + B.length);
      if (f > best) { best = f; bestV = v; }
    });
    var level = best >= 0.8 ? "ok" : best >= 0.5 ? "mid" : "ko";
    return { level: level, score: level === "ok" ? 1 : level === "mid" ? 0.5 : 0, sim: best, best: bestV };
  }

  // ----------------------------------------------------------------- hanzi
  var ZDIG = { "零": 0, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9 };
  function zhNumbers(s) {
    // 二十八 → 28 ; 十一 → 11 ; 八二三 → 823 (cifra a cifra)
    return s.replace(/[零一二三四五六七八九十]+/g, function (run) {
      var m = run.match(/^([一二三四五六七八九])?十([一二三四五六七八九])?$/);
      if (m) return String((m[1] ? ZDIG[m[1]] : 1) * 10 + (m[2] ? ZDIG[m[2]] : 0));
      if (/十/.test(run)) return run;
      return run.split("").map(function (c) { return ZDIG[c]; }).join("");
    });
  }
  function hanziKey(s) {
    return zhNumbers((s || "").replace(/[\s，。？！、；：“”‘’（）《》…—·,.?!;:"'()\[\]]/g, ""));
  }
  function compareHanzi(answer, variants) {
    var a = hanziKey(answer), best = { level: "ko", score: 0, sim: 0, best: variants[0] };
    variants.forEach(function (v) {
      var k = hanziKey(v);
      if (k === a) { best = { level: "ok", score: 1, sim: 1, best: v }; return; }
      var p = lcs(k.split(""), a.split(""), function (x, y) { return x === y; }).length;
      var sim = 2 * p / (k.length + a.length || 1);
      if (sim > best.sim && best.level !== "ok") best = { level: sim >= 0.85 ? "mid" : "ko", score: sim >= 0.85 ? 0.5 : 0, sim: sim, best: v };
    });
    return best;
  }

  global.Corrector = {
    parse: parse, comparePinyin: comparePinyin, containsPinyin: containsPinyin,
    numbersToMarks: numbersToMarks, toneAtCaret: toneAtCaret, applyTone: applyTone,
    matchKeywords: matchKeywords, compareSpanish: compareSpanish, compareHanzi: compareHanzi,
    hanziKey: hanziKey, stripMarks: stripMarks
  };
})(window);
