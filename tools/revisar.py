#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
revisar.py · comprueba los textos de data/ antes de publicarlos.

    python3 tools/revisar.py                 # todo
    python3 tools/revisar.py listenings      # solo data/listenings*.json
    python3 tools/revisar.py lecturas        # solo data/lecturas*.json

Errores (impiden publicar):
  - JSON mal formado, campos que faltan, número de preguntas distinto de 5
  - en las lecturas, palabras que no están en el diccionario
  - en los listenings, un personaje que habla y no está en "personajes"
Avisos (conviene mirarlos):
  - caracteres que no están en el diccionario (posible palabra fuera de HSK1-2)
  - el pinyin de una línea no tiene tantas sílabas como hanzi
  - respuestas en pinyin sin tonos
"""

import glob
import io
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hsk  # noqa: E402

WORDS = hsk.load_dict()
CHARS = set("".join(WORDS.keys()))
errors, warnings = [], []


def err(where, msg):
    errors.append("%s: %s" % (where, msg))


def warn(where, msg):
    warnings.append("%s: %s" % (where, msg))


def check_questions(where, qs):
    if not isinstance(qs, list) or len(qs) != 5:
        err(where, "debe tener exactamente 5 preguntas (tiene %s)" % (len(qs) if isinstance(qs, list) else "?"))
        return
    for i, q in enumerate(qs, 1):
        w = "%s pregunta %d" % (where, i)
        for k in ("q", "lang", "a", "r"):
            if k not in q:
                err(w, "falta el campo %r" % k)
        if q.get("lang") not in ("es", "py"):
            err(w, "lang debe ser 'es' o 'py'")
        a = q.get("a")
        if not isinstance(a, list) or not a or not all(isinstance(x, str) and x.strip() for x in a):
            err(w, "'a' debe ser una lista de respuestas aceptadas")
            continue
        if q.get("lang") == "py":
            for x in a:
                if not hsk.has_tones(x):
                    warn(w, "respuesta en pinyin sin tonos: %r" % x)
                if re.search(r"[一-鿿]", x):
                    err(w, "respuesta en pinyin con hanzi: %r" % x)


def unknown_chars(zh):
    return sorted(set(c for c in zh if "一" <= c <= "鿿" and c not in CHARS))


def check_pinyin_len(where, zh, py):
    if re.search(r"\d", zh):
        return
    a = hsk.hanzi_syllable_count(zh)
    b = len(hsk.syllables(py))
    if a != b:
        warn(where, "%d hanzi pero %d sílabas en el pinyin: %s | %s" % (a, b, zh, py))


def check_listenings():
    ids = set()
    for path in sorted(glob.glob(os.path.join(hsk.DATA, "listenings*.json"))):
        name = os.path.basename(path)
        try:
            items = json.load(io.open(path, encoding="utf-8"))
        except ValueError as e:
            err(name, "JSON mal formado: %s" % e)
            continue
        for it in items:
            where = "%s %s" % (name, it.get("id", "?"))
            for k in ("id", "tema", "titulo", "escena", "personajes", "lineas", "preguntas"):
                if k not in it:
                    err(where, "falta el campo %r" % k)
            if it.get("id") in ids:
                err(where, "id repetido")
            ids.add(it.get("id"))
            pers = it.get("personajes", {})
            for sp, g in pers.items():
                if g not in ("f", "m"):
                    err(where, "el género de %s debe ser 'f' o 'm'" % sp)
            for n, ln in enumerate(it.get("lineas", []), 1):
                w = "%s línea %d" % (where, n)
                for k in ("sp", "zh", "py", "es"):
                    if not ln.get(k):
                        err(w, "falta %r" % k)
                if ln.get("sp") not in pers:
                    err(w, "el personaje %r no está en 'personajes'" % ln.get("sp"))
                bad = unknown_chars(ln.get("zh", ""))
                if bad:
                    warn(w, "caracteres fuera del diccionario: %s" % "".join(bad))
                check_pinyin_len(w, ln.get("zh", ""), ln.get("py", ""))
            check_questions(where, it.get("preguntas"))


def check_lecturas():
    ids = set()
    for path in sorted(glob.glob(os.path.join(hsk.DATA, "lecturas*.json"))):
        name = os.path.basename(path)
        try:
            items = json.load(io.open(path, encoding="utf-8"))
        except ValueError as e:
            err(name, "JSON mal formado: %s" % e)
            continue
        for it in items:
            where = "%s %s" % (name, it.get("id", "?"))
            for k in ("id", "nivel", "tema", "titulo", "titulo_zh", "texto", "es", "preguntas"):
                if k not in it:
                    err(where, "falta el campo %r" % k)
            if it.get("id") in ids:
                err(where, "id repetido")
            ids.add(it.get("id"))
            if it.get("nivel") not in (1, 2):
                err(where, "nivel debe ser 1 o 2")
            for tok in it.get("texto", "").split():
                word = tok.split("|", 1)[0]
                if word == "¶" or word.isdigit() or all(c in hsk.PUNCT_ZH for c in word) \
                        or all(c in "零一二三四五六七八九十" for c in word):
                    continue
                if word not in WORDS:
                    err(where, "palabra fuera del diccionario: %r" % word)
                if "|" in tok and not tok.split("|", 1)[1]:
                    err(where, "pinyin vacío en %r" % tok)
            check_questions(where, it.get("preguntas"))


def check_frases():
    """frases*.txt y dictados_extra*.txt: pinyin con tantas sílabas como hanzi."""
    for path in sorted(glob.glob(os.path.join(hsk.DATA, "frases*.txt")) + glob.glob(os.path.join(hsk.DATA, "dictados_extra*.txt"))):
        name = os.path.basename(path)
        for n, raw in enumerate(io.open(path, encoding="utf-8"), 1):
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            cols = [c.strip() for c in line.split(" | ")]
            w = "%s:%d" % (name, n)
            if len(cols) < 3:
                err(w, "línea mal formada (hanzi | pinyin | español)")
                continue
            bad = unknown_chars(cols[0])
            if bad:
                warn(w, "caracteres fuera del diccionario: %s" % "".join(bad))
            check_pinyin_len(w, cols[0], cols[1])


def check_gramatica():
    for path in sorted(glob.glob(os.path.join(hsk.DATA, "gramatica*.json"))):
        name = os.path.basename(path)
        try:
            temas = json.load(io.open(path, encoding="utf-8"))
        except ValueError as e:
            err(name, "JSON mal formado: %s" % e)
            continue
        for t in temas:
            for pto in t.get("puntos", []):
                where = "%s %s" % (name, pto.get("id", "?"))
                for k in ("id", "titulo", "explicacion", "estructura", "ejemplos", "practica"):
                    if k not in pto:
                        err(where, "falta el campo %r" % k)
                for i, ej in enumerate(pto.get("ejemplos", []), 1):
                    for k in ("zh", "py", "es"):
                        if not ej.get(k):
                            err("%s ejemplo %d" % (where, i), "falta %r" % k)
                    bad = unknown_chars(ej.get("zh", ""))
                    if bad:
                        warn("%s ejemplo %d" % (where, i), "caracteres fuera del diccionario: %s" % "".join(bad))
                    check_pinyin_len("%s ejemplo %d" % (where, i), ej.get("zh", ""), ej.get("py", ""))
                for i, q in enumerate(pto.get("practica", []), 1):
                    w = "%s práctica %d" % (where, i)
                    if not q.get("q") or not isinstance(q.get("opciones"), list) or len(q["opciones"]) < 2:
                        err(w, "hace falta 'q' y al menos 2 'opciones'")
                    elif not isinstance(q.get("ok"), int) or not 0 <= q["ok"] < len(q["opciones"]):
                        err(w, "'ok' debe ser el índice de la opción correcta")


def main():
    what = sys.argv[1:] or ["listenings", "lecturas", "frases", "gramatica"]
    if "frases" in what:
        check_frases()
    if "gramatica" in what:
        check_gramatica()
    if "listenings" in what:
        check_listenings()
    if "lecturas" in what:
        check_lecturas()
    for w in warnings:
        print("AVISO  " + w)
    for e in errors:
        print("ERROR  " + e)
    print("\n%d errores, %d avisos" % (len(errors), len(warnings)))
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
