#!/bin/bash
#  Comparativa con TODAS las voces chinas disponibles, cada una diciendo su
#  nombre antes de la frase. Doble clic desde el Finder. No toca la app.
set -u
cd "$(dirname "$0")/.." || exit 1
. "tools/_entorno.sh"
preparar_entorno || exit 1
".venv-audio/bin/python" tools/build_audio.py --audition && open audio/comparativa-voces.mp3 2>/dev/null
pausa
