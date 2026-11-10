#!/usr/bin/env python3
"""generar-indice.py
Miguel Álvarez Hernández. Universidad de Oviedo
Estándares y Computación Web · Trabajo II: Sitio Web personal

Qué hace
--------
Lee las páginas HTML del sitio (las de la carpeta raíz, en español, y las de
en/, en inglés) y genera el archivo js/indice.js, que es el índice que usa el
buscador (js/buscador.js).

Cada entrada del índice corresponde a una sección de una página:
    { idioma, pagina, seccion, url, texto }

Cuándo ejecutarlo
-----------------
Cada vez que se cambie el texto de alguna página:

    python3 herramientas/generar-indice.py

No necesita instalar nada: solo usa la biblioteca estándar de Python.
"""
import json
import pathlib
from html.parser import HTMLParser

RAIZ = pathlib.Path(__file__).resolve().parent.parent

# Páginas que NO se indexan: el propio buscador y la ayuda (repite el contenido de las demás)
EXCLUIR = {"buscar.html", "search.html", "ayuda.html", "help.html"}

# Etiquetas cuyo contenido no forma parte del texto de la página
IGNORAR = {"script", "style", "noscript", "form", "nav", "footer", "head"}

# Etiquetas que contienen texto útil para buscar
TEXTO = {"p", "li", "dd", "dt", "td", "th", "figcaption", "summary", "caption", "h3"}


class Extractor(HTMLParser):
    """Recorre una página y agrupa su texto por secciones (cada h1/h2 abre una)."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.titulo = ""
        self.secciones = []      # lista de [titulo_seccion, [fragmentos de texto]]
        self._pila = []          # etiquetas abiertas
        self._buffer = None      # texto de la etiqueta que se está leyendo
        self._previo = []        # texto que aparece antes del h1 (por ejemplo, la etiqueta superior)

    def handle_starttag(self, tag, attrs):
        self._pila.append(tag)
        if tag in ("h1", "h2") or tag in TEXTO:
            self._buffer = []

    def handle_endtag(self, tag):
        if tag in self._pila:
            while self._pila and self._pila.pop() != tag:
                pass
        if self._buffer is None:
            return
        texto = " ".join("".join(self._buffer).split())
        self._buffer = None
        if not texto or any(t in IGNORAR for t in self._pila):
            return
        if tag == "h1":
            self.titulo = texto
            self.secciones.append([texto, self._previo])
            self._previo = []
        elif tag == "h2":
            self.secciones.append([texto, []])
        elif tag in TEXTO:
            if not self.secciones:
                self._previo.append(texto)
            else:
                self.secciones[-1][1].append(texto)

    def handle_data(self, data):
        if self._buffer is not None:
            self._buffer.append(data)


def indexar(carpeta, idioma, prefijo):
    entradas = []
    for ruta in sorted(carpeta.glob("*.html")):
        if ruta.name in EXCLUIR:
            continue
        ex = Extractor()
        ex.feed(ruta.read_text(encoding="utf-8"))
        for seccion, trozos in ex.secciones:
            texto = " ".join(trozos)
            if not texto:
                continue
            entradas.append({
                "idioma": idioma,
                "pagina": ex.titulo,
                "seccion": seccion,
                "url": prefijo + ruta.name,
                "texto": texto,
            })
    return entradas


def main():
    entradas = indexar(RAIZ, "es", "")
    if (RAIZ / "en").is_dir():
        entradas += indexar(RAIZ / "en", "en", "en/")
    salida = RAIZ / "js" / "indice.js"
    salida.parent.mkdir(exist_ok=True)
    contenido = (
        "// indice.js: GENERADO por herramientas/generar-indice.py. No editar a mano.\n"
        "var INDICE = " + json.dumps(entradas, ensure_ascii=False, indent=1) + ";\n"
    )
    salida.write_text(contenido, encoding="utf-8")
    print(f"{len(entradas)} secciones indexadas en {salida.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
