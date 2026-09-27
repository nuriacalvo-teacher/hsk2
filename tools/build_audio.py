#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_audio.py · graba con voces neuronales chinas todos los audios de la app
(dictados, listenings y lecturas), cada uno a CUATRO velocidades.

Por qué existe
--------------
La app puede leer el chino con la voz del propio navegador, pero esa voz
cambia de un aparato a otro (en Linux muchas veces ni existe). Este script
graba los audios una sola vez con voces neuronales de Microsoft (edge-tts,
gratis y sin cuenta) y a partir de ahí todo el mundo oye exactamente lo mismo.

Uso
---
    pip install edge-tts
    python3 tools/build_data.py        # (si has cambiado algo de data/)
    python3 tools/build_audio.py

Deja los MP3 en audio/lento, audio/medio y audio/normal, más
audio/manifest.js y audio/manifest.json. La app detecta el manifest sola.
Si se interrumpe, se vuelve a lanzar y continúa por donde iba. Si cambia el
texto de un audio, se regraba solo ese.

Opciones
--------
    --only L05a L05b         graba solo esas unidades
    --tipo listening         graba solo un tipo (frase, palabra, listening, lectura)
    --force                  regraba aunque ya existan
    --demo                   muestra corta con las voces elegidas
    --audition               comparativa de TODAS las voces chinas disponibles
    --list-voices            lista las voces chinas disponibles
"""

import argparse
import asyncio
import hashlib
import io
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
AUDIO_DIR = os.path.join(ROOT, "audio")
UNITS_FILE = os.path.join(ROOT, "data", "audios.json")
VOICES_FILE = os.path.join(HERE, "voces.txt")

# Voces por defecto (se pueden cambiar en tools/voces.txt).
# f1/m1: voces principales · f2/m2: segundas voces · f3/m3: terceros personajes.
# Una voz puede llevar un cambio de tono con @: zh-CN-XiaoxiaoNeural@+15Hz
VOICES = {
    "f1": "zh-CN-XiaoxiaoNeural",
    "m1": "zh-CN-YunxiNeural",
    "f2": "zh-CN-XiaoyiNeural",
    "m2": "zh-CN-YunyangNeural",
    "f3": "zh-CN-XiaoxiaoNeural@+6Hz",
    "m3": "zh-CN-YunjianNeural",
}
# Velocidad de cada versión (porcentaje sobre la velocidad natural de la voz).
SPEEDS = {"muylento": "-50%", "lento": "-35%", "medio": "-18%", "normal": "+0%"}

GAP = {"listening": 0.55, "lectura": 0.7}      # silencio entre líneas/párrafos (a velocidad normal)
CONCURRENCY = 6


def load_voice_config():
    if not os.path.exists(VOICES_FILE):
        return
    for line in io.open(VOICES_FILE, encoding="utf-8"):
        line = line.split("#", 1)[0].strip()
        if "=" not in line:
            continue
        key, _, val = line.partition("=")
        key, val = key.strip().lower(), val.strip()
        if not val:
            continue
        if key in VOICES:
            VOICES[key] = val
        elif key.startswith("velocidad_") and key[10:] in SPEEDS:
            SPEEDS[key[10:]] = val


# ---------------------------------------------------------------------------
# MP3 sin dependencias externas: duración y silencio
# ---------------------------------------------------------------------------
BITRATES_V1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
BITRATES_V2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0]
RATES = {3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000]}


def mp3_frames(data):
    i = 0
    if data[:3] == b"ID3":
        size = 0
        for b in data[6:10]:
            size = (size << 7) | (b & 0x7F)
        i = 10 + size
    n = len(data)
    while i + 4 <= n:
        if data[i] != 0xFF or (data[i + 1] & 0xE0) != 0xE0:
            i += 1
            continue
        version = (data[i + 1] >> 3) & 0x03
        layer = (data[i + 1] >> 1) & 0x03
        if version == 1 or layer != 1:
            i += 1
            continue
        br_index = (data[i + 2] >> 4) & 0x0F
        sr_index = (data[i + 2] >> 2) & 0x03
        padding = (data[i + 2] >> 1) & 0x01
        if br_index in (0, 15) or sr_index == 3:
            i += 1
            continue
        rate = RATES[version][sr_index]
        bitrate = (BITRATES_V1 if version == 3 else BITRATES_V2)[br_index] * 1000
        samples = 1152 if version == 3 else 576
        size = (samples // 8) * bitrate // rate + padding
        if size < 4 or i + size > n:
            break
        yield i, size, samples, rate
        i += size


def mp3_info(data):
    total, rate = 0, 24000
    for _, _, samples, sr in mp3_frames(data):
        total += samples
        rate = sr
    return (total / float(rate) if rate else 0.0), rate


def silence_mp3(seconds, rate=24000):
    sr_index = {22050: 0, 24000: 1, 16000: 2}.get(rate)
    if sr_index is None:
        return b""
    bitrate = 32000
    frame_len = (576 // 8) * bitrate // rate
    header = bytes([0xFF, 0b11110011, (4 << 4) | (sr_index << 2), 0b11000000])
    frame = header + b"\x00" * (frame_len - 4)
    count = int(round(seconds / (576.0 / rate)))
    return frame * max(0, count)


# ---------------------------------------------------------------------------
# síntesis
# ---------------------------------------------------------------------------
async def synth(text, voice, rate="+0%"):
    import edge_tts
    pitch = "+0Hz"
    if "@" in voice:
        voice, pitch = voice.split("@", 1)
    last = None
    for attempt in range(4):
        try:
            chunks = []
            communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
            async for item in communicate.stream():
                if item["type"] == "audio":
                    chunks.append(item["data"])
            if chunks:
                return b"".join(chunks)
            last = RuntimeError("edge-tts no devolvió audio")
        except Exception as exc:                        # noqa: BLE001
            last = exc
        await asyncio.sleep(1.5 * (attempt + 1))
    raise RuntimeError("%s (voz %s)" % (last, voice))


def unit_hash(unit):
    blob = json.dumps([unit["lineas"], [VOICES[l["v"]] for l in unit["lineas"]], SPEEDS],
                      ensure_ascii=False, sort_keys=True)
    return hashlib.sha1(blob.encode("utf-8")).hexdigest()[:12]


async def build_one(uid, unit, speed):
    """Graba una unidad a una velocidad. Devuelve {"d": duración, "c": [inicio de cada línea]}."""
    pieces, cues, elapsed, rate = [], [], 0.0, 24000
    factor = {"muylento": 1.9, "lento": 1.55, "medio": 1.2}.get(speed, 1.0)
    gap = GAP.get(unit["tipo"], 0.5) * factor
    for i, ln in enumerate(unit["lineas"]):
        audio = await synth(ln["zh"], VOICES[ln["v"]], SPEEDS[speed])
        seconds, rate = mp3_info(audio)
        if i:
            g = silence_mp3(gap, rate)
            pieces.append(g)
            elapsed += mp3_info(g)[0]
        cues.append(round(elapsed, 2))
        pieces.append(audio)
        elapsed += seconds
    folder = os.path.join(AUDIO_DIR, speed)
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, uid + ".mp3"), "wb") as fh:
        fh.write(b"".join(pieces))
    return {"d": round(elapsed, 2), "c": cues}


def write_manifest(files):
    data = {"version": 2, "speeds": list(SPEEDS.keys()), "files": files}
    with io.open(os.path.join(AUDIO_DIR, "manifest.json"), "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
    with io.open(os.path.join(AUDIO_DIR, "manifest.js"), "w", encoding="utf-8") as fh:
        fh.write("/* Generado por tools/build_audio.py */\nwindow.HSK_AUDIO = ")
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write(";\n")


async def build_all(args):
    units = json.load(io.open(UNITS_FILE, encoding="utf-8"))["units"]
    if args.only:
        units = {k: v for k, v in units.items() if k in set(args.only)}
    if args.tipo:
        units = {k: v for k, v in units.items() if v["tipo"] in set(args.tipo)}
    os.makedirs(AUDIO_DIR, exist_ok=True)

    manifest_path = os.path.join(AUDIO_DIR, "manifest.json")
    files = {}
    if os.path.exists(manifest_path):
        try:
            files = json.load(io.open(manifest_path, encoding="utf-8")).get("files", {})
        except ValueError:
            files = {}

    todo = []
    for uid, unit in units.items():
        h = unit_hash(unit)
        old = files.get(uid)
        complete = old and old.get("h") == h and all(
            s in old and os.path.exists(os.path.join(AUDIO_DIR, s, uid + ".mp3")) for s in SPEEDS)
        if complete and not args.force:
            continue
        todo.append((uid, unit, h))

    print("Audios: %d en total, %d por grabar (x%d velocidades)" % (len(units), len(todo), len(SPEEDS)))
    # Primero lo que se oye más (frases y palabras), luego lecturas y diálogos.
    order = {"palabra": 0, "frase": 1, "lectura": 2, "listening": 3}
    todo.sort(key=lambda t: order.get(t[1]["tipo"], 9))
    deadline = time.time() + args.max_minutes * 60 if args.max_minutes else None
    skipped = [0]
    sem = asyncio.Semaphore(CONCURRENCY)
    done = [0]
    failed = []

    async def worker(uid, unit, h):
        async with sem:
            if deadline and time.time() > deadline:
                skipped[0] += 1
                return
            try:
                entry = {"h": h}
                for speed in SPEEDS:
                    entry[speed] = await build_one(uid, unit, speed)
                files[uid] = entry
            except Exception as exc:                    # noqa: BLE001
                failed.append(uid)
                print("  ERROR en %s: %s" % (uid, exc))
                return
            done[0] += 1
            if done[0] % 20 == 0 or done[0] == len(todo):
                print("  %d/%d grabados" % (done[0], len(todo)), flush=True)
                write_manifest(files)                   # guarda a medias: se puede reanudar

    await asyncio.gather(*(worker(*t) for t in todo))

    # Quita del manifest lo que ya no existe en data/audios.json
    if not args.only and not args.tipo:
        all_units = json.load(io.open(UNITS_FILE, encoding="utf-8"))["units"]
        files = {k: v for k, v in files.items() if k in all_units}
    write_manifest(files)
    total = sum(v["normal"]["d"] for v in files.values() if "normal" in v)
    print("\nListo: %d audios · %d min de audio a velocidad normal" % (len(files), total // 60))
    if skipped[0]:
        print("Se acabó el tiempo: quedan %d audios. Vuelve a lanzarlo y seguirá por ahí." % skipped[0])
    if failed:
        print("Han fallado %d audios. Vuelve a lanzar el script para reintentarlos." % len(failed))
        return 1
    return 0


SAMPLE = "你好！我叫李月，我是中国人。今天九月一号，星期三。你想喝茶吗？"


async def build_demo():
    """Muestra corta: cada voz configurada lee una frase a las cuatro velocidades."""
    os.makedirs(AUDIO_DIR, exist_ok=True)
    pieces, rate = [], 24000
    for key in ("f1", "m1", "f2", "m2"):
        print("  %s = %s" % (key, VOICES[key]))
        for speed in SPEEDS:
            audio = await synth(SAMPLE, VOICES[key], SPEEDS[speed])
            rate = mp3_info(audio)[1]
            if pieces:
                pieces.append(silence_mp3(0.8, rate))
            pieces.append(audio)
    out = os.path.join(AUDIO_DIR, "muestra-voces.mp3")
    with open(out, "wb") as fh:
        fh.write(b"".join(pieces))
    print("\nMuestra lista: %s" % out)
    return 0


async def build_audition():
    import edge_tts
    voices = [v for v in await edge_tts.list_voices() if v["Locale"].startswith("zh-")]
    voices.sort(key=lambda v: (v["Locale"], v["Gender"], v["ShortName"]))
    os.makedirs(AUDIO_DIR, exist_ok=True)
    pieces, rate = [], 24000
    print("Comparativa con %d voces chinas:\n" % len(voices))
    for v in voices:
        print("  %-34s %-7s %s" % (v["ShortName"], v["Gender"], v["Locale"]))
        try:
            name = v["ShortName"].split("-")[-1].replace("Neural", "")
            audio = await synth("%s。%s" % (name, SAMPLE), v["ShortName"], "-15%")
        except Exception as exc:                        # noqa: BLE001
            print("      (fallo: %s)" % exc)
            continue
        rate = mp3_info(audio)[1]
        if pieces:
            pieces.append(silence_mp3(1.0, rate))
        pieces.append(audio)
    out = os.path.join(AUDIO_DIR, "comparativa-voces.mp3")
    with open(out, "wb") as fh:
        fh.write(b"".join(pieces))
    print("\nComparativa lista: %s" % out)
    print("Apunta las que más te gusten y escríbelas en tools/voces.txt.")
    return 0


async def main_async(args):
    load_voice_config()
    if args.list_voices:
        import edge_tts
        for v in await edge_tts.list_voices():
            if v["Locale"].startswith("zh-"):
                print("%-34s %-7s %s" % (v["ShortName"], v["Gender"], v["Locale"]))
        return 0
    if args.audition:
        return await build_audition()
    if args.demo:
        return await build_demo()
    return await build_all(args)


def main():
    ap = argparse.ArgumentParser(description="Graba los audios de la app de repaso HSK2 con edge-tts.")
    ap.add_argument("--only", nargs="+", metavar="ID")
    ap.add_argument("--tipo", nargs="+", choices=["frase", "palabra", "listening", "lectura"])
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--max-minutes", type=float, default=0, help="deja de empezar audios nuevos pasado este tiempo")
    ap.add_argument("--demo", action="store_true")
    ap.add_argument("--audition", action="store_true")
    ap.add_argument("--list-voices", action="store_true")
    args = ap.parse_args()
    try:
        import edge_tts                                # noqa: F401
    except ImportError:
        print("Falta edge-tts. Instálalo con:  pip install edge-tts", file=sys.stderr)
        return 1
    if not os.path.exists(UNITS_FILE):
        print("Falta data/audios.json: ejecuta antes  python3 tools/build_data.py", file=sys.stderr)
        return 1
    return asyncio.run(main_async(args))


if __name__ == "__main__":
    sys.exit(main())
