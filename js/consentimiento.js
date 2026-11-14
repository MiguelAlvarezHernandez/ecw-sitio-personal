/* consentimiento.js
   Miguel Álvarez Hernández. Universidad de Oviedo
   Estándares y Computación Web / Experiencia de Usuario

   QUÉ HACE
   Muestra un aviso para pedir permiso antes de medir cómo se usa la web con
   Microsoft Clarity (mapas de calor y grabaciones anónimas de sesión), que se
   usa solo para las pruebas de usabilidad de la asignatura.

   REGLAS
   1. Clarity NO se carga hasta que la persona pulsa «Aceptar».
   2. Si pulsa «Rechazar», no se carga nunca y no se vuelve a preguntar.
   3. La elección se guarda en este navegador (localStorage) y se puede
      cambiar desde la página de privacidad.
   4. Si CLARITY_ID está vacío, el script no hace nada: ni aviso ni medición.

   CÓMO ACTIVARLO
   Escribir el ID del proyecto de Clarity en CLARITY_ID (Clarity > Configuración >
   Información general). Para desactivarlo, vaciarlo otra vez.

   El aviso respeta el idioma de la página («es» o «en») y es accesible:
   se alcanza con el teclado, tiene botones reales y no tapa el contenido. */

(function () {
    "use strict";

    var CLARITY_ID = "zdijt6p269";       // ← ID del proyecto de Microsoft Clarity
    var CLAVE = "consentimiento-clarity"; // nombre con el que se guarda la elección

    if (!CLARITY_ID) { return; }         // sin ID no se hace nada

    var EN = document.documentElement.lang === "en";
    var T = EN ? {
        aviso: "Cookie notice",
        texto: "This site is being tested for a university usability study. With your permission we record clicks, scrolling and anonymous session recordings using Microsoft Clarity. No personal data is collected.",
        mas: "Privacy policy",
        si: "Accept",
        no: "Reject",
        enlace: "privacy.html"
    } : {
        aviso: "Aviso de cookies",
        texto: "Esta web se está probando para un estudio de usabilidad universitario. Con tu permiso registramos clics, desplazamiento y grabaciones anónimas de la sesión con Microsoft Clarity. No se recogen datos personales.",
        mas: "Política de privacidad",
        si: "Aceptar",
        no: "Rechazar",
        enlace: "privacidad.html"
    };

    /* Lee y guarda la elección sin romper si el navegador bloquea el almacenamiento */
    function leer() { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } }
    function guardar(valor) { try { localStorage.setItem(CLAVE, valor); } catch (e) { /* sin almacenamiento */ } }

    /* Carga el código oficial de Clarity y le indica que hay consentimiento */
    function cargarClarity() {
        (function (c, l, a, r, i, t, y) {
            c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
            t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
            y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
        })(window, document, "clarity", "script", CLARITY_ID);
        window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
    }

    /* Crea el aviso y lo coloca justo después del enlace «Saltar al contenido», para que quien
       usa el teclado llegue a él enseguida (visualmente va fijo en la parte inferior) */
    function mostrarAviso() {
        var caja = document.createElement("aside");
        caja.setAttribute("aria-label", T.aviso);
        var p = document.createElement("p");
        p.textContent = T.texto + " ";
        var a = document.createElement("a");
        a.href = T.enlace; a.textContent = T.mas;
        p.appendChild(a);
        var aceptar = document.createElement("button");
        aceptar.type = "button"; aceptar.textContent = T.si;
        var rechazar = document.createElement("button");
        rechazar.type = "button"; rechazar.textContent = T.no;
        aceptar.addEventListener("click", function () { guardar("si"); caja.remove(); cargarClarity(); });
        rechazar.addEventListener("click", function () { guardar("no"); caja.remove(); });
        caja.appendChild(p); caja.appendChild(aceptar); caja.appendChild(rechazar);
        document.body.insertBefore(caja, document.body.children[1] || null);
    }

    var eleccion = leer();
    if (eleccion === "si") { cargarClarity(); }
    else if (eleccion !== "no") { mostrarAviso(); }

    /* Para la página de privacidad: borra la elección y vuelve a preguntar */
    window.cambiarConsentimiento = function () {
        try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ }
        window.location.reload();
    };
})();
