#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_data.py · junta todos los contenidos de data/ en js/datos.js

    python3 tools/build_data.py

Lee:
    data/diccionario*.tsv      vocabulario (palabras clicables, dictados de vocabulario)
    data/frases*.txt           frases del curso por lección (traducción y dictado)
    data/gramatica*.json       explicaciones gramaticales por lección
    data/dictados_extra.txt    dictados temáticos (números, fechas, horas…)
    data/listenings*.json      diálogos con 5 preguntas
    data/lecturas*.json        lecturas de nivel 1 (pinyin) y 2 (hanzi)
Escribe:
    js/datos.js                todo lo que usa la aplicación
    data/audios.json           la lista de audios que graba tools/build_audio.py

Hay que ejecutarlo cada vez que se cambie algo de data/. Antes pasa el
revisor (tools/revisar.py) y se detiene si encuentra errores.
"""

import glob
import hashlib
import io
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hsk  # noqa: E402

ROOT = hsk.ROOT
DATA = hsk.DATA
OUT_JS = os.path.join(ROOT, "js", "datos.js")
OUT_AUDIOS = os.path.join(DATA, "audios.json")

MAX_DICTADO = 10        # frases por dictado; los temas largos se parten en varios

# Palabras con mayúscula que NO son nombres de persona (sí entran en los dictados de vocabulario)
NOT_NAMES = {"中国", "美国", "中国人", "美国人", "汉语", "汉字", "中国菜", "北京", "英语"}


def audio_id(prefix, text):
    return prefix + hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]


def parse_sentence_file(path):
    """Devuelve [{"key", "zh", "es", "items": [...]}] a partir del formato de frases.txt."""
    groups, cur = [], None
    for n, raw in enumerate(io.open(path, encoding="utf-8"), 1):
        line = raw.strip()
        if not line:
            continue
        if line.startswith("#"):
            m = re.match(r"^# ([A-Za-z0-9_-]+) \|\s*(.+?)\s*\|\s*(.+)$", line)
            if m:
                cur = {"key": m.group(1), "zh": m.group(2), "es": m.group(3), "items": []}
                groups.append(cur)
            continue
        cols = [c.strip() for c in line.split(" | ")]
        if len(cols) < 3 or cur is None:
            raise SystemExit("%s:%d: línea mal formada: %s" % (os.path.basename(path), n, line))
        item = {"zh": cols[0], "py": cols[1], "es": [x.strip() for x in cols[2].split(" / ") if x.strip()]}
        for opt in cols[3:]:
            for kv in re.findall(r"(\w+)=(\S+)", opt):
                k, v = kv
                if k == "tts":
                    item["tts"] = v
                elif k in ("py", "zh"):
                    item.setdefault("alt" + k, []).append(v.replace("_", " "))
        cur["items"].append(item)
    return groups


def load_json_files(pattern):
    out = []
    for path in sorted(glob.glob(os.path.join(DATA, pattern))):
        out.extend(json.load(io.open(path, encoding="utf-8")))
    return out


def norm_es(s):
    s = s.lower()
    s = re.sub(r"[¿?¡!.,;:()]", "", s)
    return re.sub(r"\s+", " ", s).strip()


def main():
    rc = subprocess.call([sys.executable, os.path.join(hsk.HERE, "revisar.py")])
    if rc != 0:
        raise SystemExit("\nHay errores en los textos: corrígelos antes de generar la app.")

    words = hsk.load_dict()

    # ---------------------------------------------------------------- frases
    temas = []
    audios = {}
    groups = []
    for path in sorted(glob.glob(os.path.join(DATA, "frases*.txt"))):
        groups.extend(parse_sentence_file(path))
    groups.sort(key=lambda g: int(g["key"]))
    for g in groups:
        n = int(g["key"])
        frases = []
        seen = set()
        for it in g["items"]:
            if it["zh"] in seen:
                continue
            seen.add(it["zh"])
            fid = "f%02d-%02d" % (n, len(frases) + 1)
            it["id"] = fid
            it["au"] = audio_id("d-", it.get("tts", it["zh"]))
            frases.append(it)
        temas.append({"n": n, "zh": g["zh"], "es": g["es"], "frases": frases})

    # Respuestas alternativas: frases distintas con la misma traducción al
    # español valen todas en los ejercicios "español → chino".
    by_es = {}
    for t in temas:
        for f in t["frases"]:
            for es in f["es"]:
                by_es.setdefault(norm_es(es), []).append(f)
    for t in temas:
        for f in t["frases"]:
            for es in f["es"]:
                for other in by_es[norm_es(es)]:
                    if other is f:
                        continue
                    if other["py"] not in f.get("altpy", []):
                        f.setdefault("altpy", []).append(other["py"])
                    if other["zh"] not in f.get("altzh", []):
                        f.setdefault("altzh", []).append(other["zh"])

    # -------------------------------------------------------------- dictados
    dictados = []
    voice_toggle = [0]

    def add_audio(aid, text, kind):
        if aid in audios:
            return
        v = ("f1", "m1", "f2", "m2")[voice_toggle[0] % 4]
        voice_toggle[0] += 1
        audios[aid] = {"tipo": kind, "lineas": [{"v": v, "zh": text}]}

    for t in temas:
        fr = t["frases"]
        parts = max(1, -(-len(fr) // MAX_DICTADO))
        size = -(-len(fr) // parts)
        for p in range(parts):
            chunk = fr[p * size:(p + 1) * size]
            dictados.append({
                "id": "DF%02d%s" % (t["n"], "abcdef"[p] if parts > 1 else ""),
                "grupo": "frases", "tema": t["n"],
                "titulo": "Lección %d · %s%s" % (t["n"], t["es"], " (%d/%d)" % (p + 1, parts) if parts > 1 else ""),
                "zh": t["zh"],
                "items": [f["id"] for f in chunk],
            })
            for f in chunk:
                add_audio(f["au"], f.get("tts", f["zh"]), "frase")

    vocab_by_tema = {}
    for zh, w in words.items():
        if not w["t"]:          # tema 0 = vocabulario de HSK 1 (ya conocido)
            continue
        if w["p"][:1].isupper() and zh not in NOT_NAMES:
            continue
        vocab_by_tema.setdefault(w["t"], []).append(zh)
    vocab_items = {}
    for n in sorted(vocab_by_tema):
        lst = vocab_by_tema[n]
        ids = []
        for zh in lst:
            vid = "v-" + zh
            vocab_items[vid] = {"id": vid, "zh": zh, "py": words[zh]["p"], "es": [words[zh]["es"]],
                                "au": audio_id("w-", zh)}
            add_audio(vocab_items[vid]["au"], zh, "palabra")
            ids.append(vid)
        parts = max(1, -(-len(ids) // 14))
        size = -(-len(ids) // parts)
        for p in range(parts):
            dictados.append({"id": "DV%02d%s" % (n, "abcdef"[p] if parts > 1 else ""), "grupo": "vocabulario",
                             "tema": n, "zh": "词语", "items": ids[p * size:(p + 1) * size],
                             "titulo": "Lección %d · Vocabulario%s" % (n, " (%d/%d)" % (p + 1, parts) if parts > 1 else "")})

    extra_items = {}
    extra_path = os.path.join(DATA, "dictados_extra.txt")
    for g in (parse_sentence_file(extra_path) if os.path.exists(extra_path) else []):
        ids = []
        for i, it in enumerate(g["items"], 1):
            xid = "x-%s-%02d" % (g["key"], i)
            it["id"] = xid
            it["au"] = audio_id("d-", it.get("tts", it["zh"]))
            add_audio(it["au"], it.get("tts", it["zh"]), "frase")
            extra_items[xid] = it
            ids.append(xid)
        dictados.append({"id": "DX-" + g["key"], "grupo": "especiales", "tema": 0,
                         "titulo": g["es"], "zh": g["zh"], "items": ids})

    # ------------------------------------------------------------ listenings
    listenings = sorted(load_json_files("listenings*.json"), key=lambda x: (x["tema"], x["id"]))
    for L in listenings:
        slots = {"f": ["f1", "f2", "f3"], "m": ["m1", "m2", "m3"]}
        voices = {}
        for ln in L["lineas"]:
            sp = ln["sp"]
            if sp not in voices:
                g = L["personajes"][sp]
                voices[sp] = slots[g].pop(0) if slots[g] else g + "1"
        L["voces"] = voices
        audios[L["id"]] = {"tipo": "listening",
                           "lineas": [{"v": voices[ln["sp"]], "zh": ln.get("tts", ln["zh"]), "sp": ln["sp"]}
                                      for ln in L["lineas"]]}

    # -------------------------------------------------------------- lecturas
    lecturas = sorted(load_json_files("lecturas*.json"), key=lambda x: (x["nivel"], x["tema"], x["id"]))
    for R in lecturas:
        paras = [p.strip() for p in R["texto"].split("¶")]
        text = "\n".join("".join(tok.split("|", 1)[0] for tok in p.split()) for p in paras if p)
        audios[R["id"]] = {"tipo": "lectura",
                           "lineas": [{"v": "f2" if R["tema"] % 2 else "m2", "zh": para}
                                      for para in text.split("\n")]}

    # ------------------------------------------------------------- gramática
    gramatica = []
    for path in sorted(glob.glob(os.path.join(DATA, "gramatica*.json"))):
        gramatica.extend(json.load(io.open(path, encoding="utf-8")))
    gramatica.sort(key=lambda g: g["tema"])
    for g in gramatica:
        for pto in g["puntos"]:
            for ej in pto.get("ejemplos", []):
                ej["au"] = audio_id("d-", ej.get("tts", ej["zh"]))
                add_audio(ej["au"], ej.get("tts", ej["zh"]), "frase")

    # ------------------------------------------------------------ diccionario
    dic = {zh: [w["p"], w["es"], w["t"]] for zh, w in words.items()}

    payload = {
        "version": 1,
        "dic": dic,
        "temas": temas,
        "vocab": vocab_items,
        "extra": extra_items,
        "dictados": dictados,
        "listenings": listenings,
        "lecturas": lecturas,
        "gramatica": gramatica,
    }
    os.makedirs(os.path.dirname(OUT_JS), exist_ok=True)
    with io.open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("/* Generado por tools/build_data.py a partir de data/. No editar a mano. */\n")
        f.write("window.HSK = ")
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    with io.open(OUT_AUDIOS, "w", encoding="utf-8") as f:
        json.dump({"version": 1, "units": audios}, f, ensure_ascii=False, indent=1)

    n_fr = sum(len(t["frases"]) for t in temas)
    print("\nOK · js/datos.js generado")
    print("  %d palabras · %d frases en %d temas" % (len(dic), n_fr, len(temas)))
    print("  %d dictados · %d listenings · %d lecturas" % (len(dictados), len(listenings), len(lecturas)))
    print("  %d puntos de gramática" % sum(len(g["puntos"]) for g in gramatica))
    print("  %d audios distintos para grabar (x3 velocidades)" % len(audios))


if __name__ == "__main__":
    main()
