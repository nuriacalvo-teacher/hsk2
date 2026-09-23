#!/bin/bash
#
#  Grabar los audios de la app de repaso HSK2  ·  para Mac
#
#  Haz DOBLE CLIC en este archivo desde el Finder. No hay que escribir nada.
#  La primera vez tarda un poco más porque prepara las herramientas.
#  Si se corta, vuelve a hacer doble clic: continúa por donde iba.
#

set -u
cd "$(dirname "$0")/.." || exit 1
. "tools/_entorno.sh"

echo "==========================================================="
echo "   Grabando los audios de la app de repaso HSK2  汉语"
echo "==========================================================="
echo

preparar_entorno || exit 1

python3 tools/build_data.py || { pausa; exit 1; }
echo
".venv-audio/bin/python" tools/build_audio.py "$@"
ESTADO=$?
echo

if [ $ESTADO -ne 0 ]; then
  echo "La grabación no ha terminado bien. Los mensajes de arriba dicen por qué."
  echo "Puedes volver a hacer doble clic: continuará por donde se quedó."
  pausa
  exit $ESTADO
fi

if [ -d .git ] && command -v git >/dev/null 2>&1; then
  echo "Subiendo los audios a GitHub..."
  git add audio js data
  if git diff --staged --quiet; then
    echo "No había audios nuevos que subir."
  elif git commit -q -m "Audios grabados" && git push -q; then
    echo "LISTO. Los audios ya están en GitHub y la app los usará sola."
  else
    echo "Los audios están grabados en la carpeta audio/ pero no he podido"
    echo "subirlos a GitHub. Súbelos a mano desde la web del repositorio."
  fi
else
  echo "LISTO. Los audios están en la carpeta audio/"
fi
pausa
