# -*- coding: utf-8 -*-
"""
hsk.py · utilidades comunes a los scripts de tools/.

- leer el diccionario (data/diccionario*.tsv)
- trocear un texto en hanzi en palabras del diccionario
- trocear pinyin en sílabas y quitar los tonos
"""

import glob
import io
import os
import re
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")

PUNCT_ZH = set("，。？！、；：“”‘’（）《》…—·,.?!;:\"'()[] ")

# ---------------------------------------------------------------------------
# diccionario
# ---------------------------------------------------------------------------
def load_dict():
    """{hanzi: {"p": pinyin, "es": español, "t": tema}}"""
    words = {}
    for path in sorted(glob.glob(os.path.join(DATA, "diccionario*.tsv"))):
        for n, line in enumerate(io.open(path, encoding="utf-8"), 1):
            line = line.rstrip("\n")
            if not line.strip() or line.lstrip().startswith("#"):
                continue
            cols = line.split("\t")
            if len(cols) < 3:
                raise SystemExit("%s:%d: faltan columnas: %r" % (os.path.basename(path), n, line))
            zh, py, es = cols[0].strip(), cols[1].strip(), cols[2].strip()
            tema = int(cols[3]) if len(cols) > 3 and cols[3].strip().isdigit() else 0
            words[zh] = {"p": py, "es": es, "t": tema}
    return words


def segment(text, words, maxlen=6):
    """Máxima coincidencia hacia delante. Devuelve [(token, en_diccionario)].
    Las cifras seguidas forman un solo token."""
    out, i, n = [], 0, len(text)
    while i < n:
        c = text[i]
        if c.isspace():
            i += 1
            continue
        if c.isdigit():
            j = i
            while j < n and text[j].isdigit():
                j += 1
            out.append((text[i:j], True))
            i = j
            continue
        if c in PUNCT_ZH:
            out.append((c, True))
            i += 1
            continue
        for L in range(min(maxlen, n - i), 0, -1):
            w = text[i:i + L]
            if w in words:
                out.append((w, True))
                i += L
                break
        else:
            out.append((c, False))
            i += 1
    return out


# ---------------------------------------------------------------------------
# pinyin
# ---------------------------------------------------------------------------
TONE_MARKS = {
    "ā": ("a", 1), "á": ("a", 2), "ǎ": ("a", 3), "à": ("a", 4),
    "ē": ("e", 1), "é": ("e", 2), "ě": ("e", 3), "è": ("e", 4),
    "ī": ("i", 1), "í": ("i", 2), "ǐ": ("i", 3), "ì": ("i", 4),
    "ō": ("o", 1), "ó": ("o", 2), "ǒ": ("o", 3), "ò": ("o", 4),
    "ū": ("u", 1), "ú": ("u", 2), "ǔ": ("u", 3), "ù": ("u", 4),
    "ǖ": ("v", 1), "ǘ": ("v", 2), "ǚ": ("v", 3), "ǜ": ("v", 4), "ü": ("v", 0),
}

INITIALS = ["zh", "ch", "sh", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k",
            "h", "j", "q", "x", "r", "z", "c", "s", "y", "w", ""]
FINALS = ["a", "o", "e", "ai", "ei", "ao", "ou", "an", "en", "ang", "eng", "ong",
          "er", "i", "ia", "ie", "iao", "iu", "ian", "in", "iang", "ing", "iong",
          "u", "ua", "uo", "uai", "ui", "uan", "un", "uang", "ueng", "v", "ve",
          "van", "vn", "ue"]
SYLLABLES = set()
for _i in INITIALS:
    for _f in FINALS:
        SYLLABLES.add(_i + _f)
SYLLABLES.discard("")
SYLLABLES |= set(x + "r" for x in list(SYLLABLES))   # erhua: nǎr, yìdiǎnr


def strip_tones(py):
    """'Nǐ hǎo!' -> ('ni hao!', [0,3,...]) : letras sin tono, en minúscula."""
    out = []
    for ch in unicodedata.normalize("NFC", py.lower()):
        base = TONE_MARKS.get(ch)
        out.append(base[0] if base else ch)
    return "".join(out)


def syllables(py):
    """Sílabas de un texto en pinyin, sin tonos. Sirve para contar."""
    letters = re.sub(r"[^a-zv]+", " ", strip_tones(py)).split()
    result = []
    for chunk in letters:
        result.extend(split_letters(chunk))
    return result


def split_letters(s):
    """Divide 'zhongguoren' en ['zhong','guo','ren'] con programación dinámica
    (el mínimo número de sílabas válidas)."""
    n = len(s)
    best = [None] * (n + 1)
    best[0] = []
    cost_at = [0.0] * (n + 1)
    for i in range(n):
        if best[i] is None:
            continue
        for L in range(1, 9):
            if i + L > n:
                break
            piece = s[i:i + L]
            if piece in SYLLABLES:
                cost = cost_at[i] + (2.1 if piece != "er" and piece.endswith("r") else 1)
                if best[i + L] is None or cost < cost_at[i + L]:
                    best[i + L] = best[i] + [piece]
                    cost_at[i + L] = cost
    return best[n] if best[n] is not None else [s]


ERHUA = ("哪儿", "那儿", "这儿", "点儿", "会儿", "玩儿", "孩儿")


def hanzi_syllable_count(zh):
    n = 0
    for i, c in enumerate(zh):
        if "一" <= c <= "鿿":
            if c == "儿" and i > 0 and zh[i - 1:i + 1] in ERHUA:
                continue
            n += 1
        elif c.isdigit():
            n += 1          # aproximado: no se usa para cifras
    return n


def has_tones(py):
    return any(ch in TONE_MARKS and TONE_MARKS[ch][1] for ch in unicodedata.normalize("NFC", py.lower()))
