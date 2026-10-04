# 汉语 HSK2 · Repaso

App web para repasar todo el curso **HSK 2** (las 15 lecciones del nuevo libro
*新HSK教程 2 · New HSK Course 2*, 2026) y todo el vocabulario HSK 1 y HSK 2 del **HSK 3.0**. Está pensada para hispanohablantes: la gramática, las preguntas y
las traducciones están en español. Es la continuación de
[HSK1 · Repaso](https://nuriacalvo-teacher.github.io/hsk1/): funciona
igual, pero el diseño es de porcelana azul y blanca y la música es distinta.

| Sección | Qué hay | Cuántos |
|---|---|---|
| **Gramática · 语法** | Las estructuras de cada lección explicadas en español, con la fórmula, ejemplos con audio (cada palabra se puede tocar) y un minitest de 3 preguntas. | 45 puntos (3 por lección, los del 小语讲堂) |
| **Ejercicios · 练习** | Una zona de práctica por lección: ejercicios de **cada punto de gramática** (elegir, ordenar fichas, traducir hanzi ↔ español ↔ pinyin, escuchar y una lectura con 3 preguntas), **8 ejercicios de vocabulario** con todas las palabras de la lección y un **examen** que lo mezcla todo. En las traducciones de hanzi al español se puede tocar una palabra para verla, pero cada ayuda resta un 10 %. | 45 puntos · 389 frases · 45 lecturas · 609 frases de vocabulario (una por palabra) |
| **Dictado · 听写** | Escuchas y escribes en pinyin. Se corrige sílaba a sílaba y tono a tono. | 99 dictados: frases y vocabulario de cada lección y dictados especiales (números grandes, precios, horas y duración, fechas, medidas) |
| **Listening · 听力** | Diálogos con 2 o 3 voces y 5 preguntas que se responden en pinyin o en español. Después se ve la transcripción y se puede repetir cada línea. | 30 diálogos, 2 por lección |
| **Lectura · 阅读** | Siempre en **hanzi**: nivel 1 con el pinyin encima y nivel 2 sin él. Al tocar una palabra se ven su pinyin y su traducción y se oye. Cada lectura tiene 5 preguntas. | 30 lecturas, 1 por lección y nivel |
| **Traducción · 翻译** | 4 niveles: hanzi con pinyin → español, español → pinyin, hanzi → español y español → hanzi (con fichas o con el teclado chino). Se puede elegir una lección o mezclar todo el curso. | 447 frases del curso (todas las de los textos del libro) |
| **Vocabulario · 词语** | Todo el vocabulario que hay que aprender, repartido por lecciones para ir poco a poco: las 500 palabras de HSK 1 (3.0), las 200 de HSK 2 (3.0) y las del libro, con buscador y audio. | ≈ 660 palabras + nombres propios |

**Todo el chino de la app se puede tocar** (explicaciones, preguntas, títulos,
ejemplos…): cada hanzi muestra su pinyin y su traducción y se puede escuchar.
Las traducciones al español aceptan sinónimos, variantes de España y América,
frases con o sin pronombre y distintos tiempos verbales equivalentes.

Todos los audios tienen **cuatro velocidades**: muy lento, lento, medio y
normal.

## Cómo usarla

- **En internet (recomendado):** activa GitHub Pages una sola vez en
  **Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save**.
  Al cabo de un minuto la app queda en
  `https://nuriacalvo-teacher.github.io/hsk2/`.
- **En tu ordenador:** descarga el repositorio y abre `index.html` con el
  navegador. No hace falta instalar nada.

El progreso (la mejor nota de cada ejercicio) se guarda en el navegador de
cada alumno.

### Cómo se corrige

- **Pinyin:** los tonos se pueden escribir con marcas (`nǐ hǎo`) o con
  números (`ni3 hao3`), que se convierten solos mientras escribes. También
  hay botones ˉ ˊ ˇ ˋ y ü. Se aceptan los cambios de tono de 不 y 一
  (`bù/bú`, `yī/yí/yì`) y el `yāo` de los teléfonos. Si una sílaba tiene el
  tono mal, sale en naranja y la respuesta vale la mitad. Si falta o sobra
  una sílaba, sale en rojo. En **Ajustes** se pueden ignorar los tonos.
- **Español:** no se tienen en cuenta las tildes, las mayúsculas ni los
  artículos. «3» y «tres» valen igual, y también el masculino y el
  femenino. En las traducciones, si la respuesta se parece pero no es
  igual, la app enseña la traducción de referencia. Siempre hay un botón
  **«Mi respuesta también es correcta»**.
- **Hanzi:** no se tienen en cuenta la puntuación ni los espacios, y
  `28块` = `二十八块`.

### Sonido

- **Música de fondo** en los menús: flauta de bambú (箫) sobre la escala
  pentatónica en modo 羽, con notas graves de guqin, un cuenco y gotas de
  agua. Es distinta de la de HSK1. Se genera en el navegador y
  nunca se repite igual. **Se para al entrar en un ejercicio** y vuelve al
  salir. Se quita o se pone con el botón ♪ de la cabecera. En **Ajustes**
  también se cambia el volumen.
- **Efectos:** hay un sonido para el acierto (arpegio ascendente), otro para
  el «casi» y otro para el fallo (bloque de madera). Al terminar, suena un
  gong con escala ascendente si has aprobado (≥ 50 %; con ≥ 80 % es más
  largo) y un gong grave con escala descendente si has suspendido. Se pueden
  probar y desactivar en **Ajustes**.

### ¿Hace falta instalar un teclado chino?

**No.** Toda la app se puede hacer con el teclado normal del ordenador o del
móvil:

- **Pinyin:** se escriben las letras y el tono con un número detrás
  (`hao3` → hǎo) o con los botones ˉ ˊ ˇ ˋ. La ü se escribe con `v`.
- **Español:** no importan las tildes ni los signos ¿?.
- **Hanzi** (solo en la traducción de nivel 4) se escriben de una de estas
  tres maneras:
  - con **fichas**;
  - con el **teclado de la app**: se teclea el pinyin sin tonos (`woxiang`)
    y se elige la palabra (我 → 想). Solo propone palabras del curso;
  - con el **teclado chino del dispositivo**, si lo tienes instalado.

Dentro de la app, la página **«Cómo escribir pinyin y hanzi»**
(`#/teclado`) explica paso a paso cómo instalar el teclado chino (pinyin) en
iPhone/iPad, Android, Windows, Mac, Chromebook y Linux.

## Audio con voces nativas

La app usa **audios grabados con voces neuronales chinas** (las mismas voces
de Microsoft Edge: Xiaoxiao, Yunxi, Xiaoyi, Yunjian…) si están en `audio/`.
Si todavía no existen, usa la voz china del navegador. **Hay que grabarlos
una vez**, igual que en el proyecto BRIT:

### Opción A · online, sin instalar nada

1. Pestaña **Actions** del repositorio → **Grabar los audios** → **Run workflow**.
2. Si hay que grabarlo todo tarda un par de horas (≈ 1600 audios × 4
   velocidades) y sube él solo los audios al repositorio. Si se acaba el
   tiempo, sube lo que lleva: vuelve a pulsar **Run workflow** y sigue por ahí
   (el resumen de la ejecución dice cuántos faltan).

Todo se graba con voces neuronales nativas: **Xiaoxiao** (mujer) y **Yunxi**
(hombre) leen todas las frases, palabras, ejemplos y lecturas; en los
diálogos, si hay dos personajes del mismo sexo, el segundo es **Xiaoyi** o
**Yunyang**. La velocidad «muy lento» se graba aparte, sin estirar el audio.

> Si falla al subir: **Settings → Actions → General → Workflow permissions →
> Read and write permissions**. Solo hay que tocarlo una vez.
>
> A veces el servicio de voz rechaza las peticiones que vienen de los
> servidores de GitHub. Si pasa, usa la opción B, que sale desde tu propia red.

### Opción B · en el Mac, con doble clic

1. Clona el repositorio o descárgalo (botón verde **Code → Download ZIP**).
2. En la carpeta `tools`, haz **doble clic en `GRABAR-AUDIOS.command`**.
   Si lo clonaste con git, al terminar sube los audios él solo.

### Elegir las voces

- **`tools/COMPARAR-VOCES.command`** (o *Run workflow* marcando
  **comparativa**) graba un MP3 en el que todas las voces chinas dicen su
  nombre y leen la misma frase.
- Escribe en **`tools/voces.txt`** las que más te gusten. En ese mismo
  fichero se cambian las velocidades.
- **`tools/ESCUCHAR-VOCES.command`** (o **muestra**) graba un minuto con las
  voces elegidas a las cuatro velocidades.

Al volver a grabar, **solo se regraban los audios cuyo texto o voz haya
cambiado**.

## Cambiar o añadir contenido

Todo el contenido está en `data/` y se puede editar como texto:

| Fichero | Contenido |
|---|---|
| `data/diccionario.tsv` | Vocabulario de HSK 1 (tema 0). |
| `data/diccionario_hsk2.tsv` | Palabras nuevas de HSK 2 con la lección en la que aparecen. |
| `data/frases_*.txt` | Las frases del curso por lección. Se usan en las traducciones y los dictados de frases. |
| `data/gramatica_*.json` | Las explicaciones de gramática, sus ejemplos y los minitests. |
| `data/dictados_extra.txt` | Los dictados especiales: números, fechas, horas… |
| `data/listenings_*.json` | Los diálogos y sus preguntas. |
| `data/lecturas_n1.json`, `data/lecturas_n2.json` | Las lecturas y sus preguntas. |
| `data/ejercicios_*.json` | La zona de ejercicios: preguntas de gramática, frases (con todas sus traducciones válidas), lecturas y frases de vocabulario de cada lección. |
| `data/diccionario_extra_chars.tsv` | Caracteres sueltos (lección 99) para que también se puedan tocar. |

Después de editar, ejecuta:

```bash
python3 tools/build_data.py     # revisa los textos y regenera js/datos.js
```

El revisor (`tools/revisar.py`) avisa de estos problemas:

- palabras que no están en el diccionario;
- pinyin con distinto número de sílabas que de hanzi;
- ejercicios que no tienen exactamente 5 preguntas.

Luego graba los audios nuevos con la opción A o la B.

## Estructura

```
index.html            la app (una sola página)
css/estilos.css       diseño
js/app.js             pantallas y ejercicios
js/corrector.js       corrección de pinyin, español y hanzi
js/sonido.js          música de fondo y efectos (Web Audio, sin ficheros)
js/datos.js           contenidos (generado por tools/build_data.py)
audio/                audios grabados + manifest.js
data/                 contenidos editables
tools/                revisor, generador de datos y grabador de audio
```
