/* consentimiento.js
   Miguel Álvarez Hernández. Universidad de Oviedo

   Pide permiso antes de medir el uso de la web con Microsoft Clarity (pruebas
   de usabilidad). Clarity no se carga hasta pulsar «Aceptar»; la elección se
   guarda en el navegador y se puede cambiar desde la página de privacidad.
   Si CLARITY_ID está vacío, el script no hace nada. */

(function () {
    "use strict";

    var CLARITY_ID = "zdijt6p269";
    var CLAVE = "consentimiento-clarity";

    if (!CLARITY_ID) { return; }

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

    function leer() { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } }
    function guardar(valor) { try { localStorage.setItem(CLAVE, valor); } catch (e) { } }

    function cargarClarity() {
        (function (c, l, a, r, i, t, y) {
            c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
            t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
            y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
        })(window, document, "clarity", "script", CLARITY_ID);
        window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
    }

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
        var cabecera = document.querySelector("body > header");
        if (cabecera) { cabecera.insertAdjacentElement("afterend", caja); } else { document.body.insertBefore(caja, document.body.children[1] || null); }
    }

    var eleccion = leer();
    if (eleccion === "si") { cargarClarity(); }
    else if (eleccion !== "no") { mostrarAviso(); }

    /* Lo usa la página de privacidad: borra la elección y vuelve a preguntar */
    window.cambiarConsentimiento = function () {
        try { localStorage.removeItem(CLAVE); } catch (e) { }
        window.location.reload();
    };
})();
