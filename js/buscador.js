/* buscador.js
   Miguel Álvarez Hernández. Universidad de Oviedo
   Estándares y Computación Web · Trabajo II: Sitio Web personal

   QUÉ HACE
   Buscador del sitio, sin servidor. Lee la palabra buscada de la dirección
   (buscar.html?q=palabra), la compara con el índice de contenidos (INDICE, que
   define js/indice.js) y pinta los resultados en la página de búsqueda.

   CÓMO FUNCIONA
   1. leerConsulta()  obtiene el parámetro q de la dirección.
   2. normalizar()    pasa el texto a minúsculas y sin tildes, para que
                      «musica» encuentre «Música».
   3. buscar()        puntúa cada entrada del índice: todas las palabras
                      buscadas deben aparecer; cuenta más si están en el título
                      de la sección que en el texto.
   4. mostrar()       escribe la lista de resultados con un fragmento del texto.

   MEJORA PROGRESIVA
   Si JavaScript no está disponible la web sigue funcionando entera. Solo el
   buscador deja de dar resultados y se avisa con un <noscript> y el mapa del
   sitio (ayuda.html).

   ACCESIBILIDAD
   El mensaje de estado está en un párrafo con aria-live="polite", así que un
   lector de pantalla anuncia cuántos resultados hay.

   El índice se regenera con: python3 herramientas/generar-indice.py */

(function () {
    "use strict";

    // Idioma de la página actual («es» o «en»): decide qué parte del índice se usa
    var IDIOMA = document.documentElement.lang === "en" ? "en" : "es";

    var TEXTOS = {
        es: {
            vacio: "Escribe algo para empezar a buscar.",
            ninguno: function (q) { return "No hay resultados para «" + q + "». Prueba con otra palabra o consulta el mapa del sitio."; },
            uno: function (q) { return "1 resultado para «" + q + "»."; },
            varios: function (n, q) { return n + " resultados para «" + q + "»."; }
        },
        en: {
            vacio: "Type something to start searching.",
            ninguno: function (q) { return "No results for \"" + q + "\". Try another word or check the site map."; },
            uno: function (q) { return "1 result for \"" + q + "\"."; },
            varios: function (n, q) { return n + " results for \"" + q + "\"."; }
        }
    }[IDIOMA];

    /* Pasa a minúsculas y quita las tildes (á → a, ñ → n...) */
    function normalizar(texto) {
        return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    }

    /* Devuelve la palabra buscada que viene en la dirección (?q=...) */
    function leerConsulta() {
        var parametros = new URLSearchParams(window.location.search);
        return (parametros.get("q") || "").trim();
    }

    /* Cuenta cuántas veces aparece una palabra en un texto ya normalizado */
    function contar(texto, palabra) {
        var total = 0;
        var pos = texto.indexOf(palabra);
        while (pos !== -1) {
            total++;
            pos = texto.indexOf(palabra, pos + palabra.length);
        }
        return total;
    }

    /* Devuelve las entradas del índice que contienen TODAS las palabras, ordenadas por puntuación */
    function buscar(consulta) {
        var palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
        var resultados = [];
        INDICE.forEach(function (entrada) {
            if (entrada.idioma !== IDIOMA) { return; }
            var titulo = normalizar(entrada.pagina + " " + entrada.seccion);
            var texto = normalizar(entrada.texto);
            var puntos = 0;
            for (var i = 0; i < palabras.length; i++) {
                var enTitulo = contar(titulo, palabras[i]);
                var enTexto = contar(texto, palabras[i]);
                if (enTitulo + enTexto === 0) { return; }   // falta una palabra: se descarta
                puntos += enTitulo * 5 + enTexto;           // el título pesa 5 veces más
            }
            resultados.push({ entrada: entrada, puntos: puntos });
        });
        resultados.sort(function (a, b) { return b.puntos - a.puntos; });
        return resultados;
    }

    /* Recorta unas 160 letras del texto, centradas en la primera palabra encontrada */
    function fragmento(texto, consulta) {
        var palabra = normalizar(consulta).split(/\s+/)[0];
        var pos = normalizar(texto).indexOf(palabra);
        var inicio = Math.max(0, pos - 60);
        var corte = texto.slice(inicio, inicio + 160);
        return (inicio > 0 ? "… " : "") + corte + (inicio + 160 < texto.length ? " …" : "");
    }

    /* Escribe el estado y la lista de resultados en la página */
    function mostrar(consulta, resultados) {
        var estado = document.querySelector("main p[aria-live]");
        var lista = document.querySelector("main ol");
        lista.textContent = "";

        if (!consulta) { estado.textContent = TEXTOS.vacio; return; }
        if (resultados.length === 0) { estado.textContent = TEXTOS.ninguno(consulta); return; }
        estado.textContent = resultados.length === 1 ? TEXTOS.uno(consulta) : TEXTOS.varios(resultados.length, consulta);

        resultados.forEach(function (r) {
            var item = document.createElement("li");
            var titulo = document.createElement("h3");
            var enlace = document.createElement("a");
            enlace.href = r.entrada.url;
            enlace.textContent = r.entrada.pagina === r.entrada.seccion
                ? r.entrada.pagina
                : r.entrada.pagina + " · " + r.entrada.seccion;
            titulo.appendChild(enlace);
            var texto = document.createElement("p");
            texto.textContent = fragmento(r.entrada.texto, consulta);
            item.appendChild(titulo);
            item.appendChild(texto);
            lista.appendChild(item);
        });
    }

    var consulta = leerConsulta();
    // Rellena el cuadro de búsqueda de la página con lo que se buscó
    var campo = document.querySelector("main input[type=search]");
    if (campo) { campo.value = consulta; }
    mostrar(consulta, consulta ? buscar(consulta) : []);
})();
