#!/bin/bash
#  Muestra de 1 minuto con las voces elegidas en tools/voces.txt, a las tres
#  velocidades. Doble clic desde el Finder. No toca la app.
set -u
cd "$(dirname "$0")/.." || exit 1
. "tools/_entorno.sh"
preparar_entorno || exit 1
python3 tools/build_data.py >/dev/null || { pausa; exit 1; }
".venv-audio/bin/python" tools/build_audio.py --demo && open audio/muestra-voces.mp3 2>/dev/null
pausa
