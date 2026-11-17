/* «Crear»: indicador de cinco pasos (contenido, ajustes, generar, revisar, descargar).
   Solo refleja lo que ya muestran la carga de contenido y el Laboratorio; no cambia su funcionamiento. */
(function () {
  'use strict';
  var lista = document.getElementById('indicador-crear');
  if (!lista) return;
  var items = [1, 2, 3, 4, 5].map(function (n) { return document.getElementById('ind-' + n); });
  var titulos = ['Contenido', 'Ajustes', 'Generar', 'Revisar', 'Descargar'];
  var ultimo = 0;

  function visible(id) { var e = document.getElementById(id); return !!e && !e.hidden; }

  function pasoActual() {
    var res = document.getElementById('lab-resultado');
    if (visible('paso-leer')) {
      var aprobado = document.getElementById('lab-aprobado');
      if (res && !res.hidden) return aprobado && aprobado.checked ? 5 : 4;
      var generar = document.getElementById('lab-generar');
      if (generar && (generar.disabled || generar.getAttribute('aria-disabled') === 'true')) return 3;
      return 2;
    }
    return 1;
  }

  function actualizar() {
    var n = pasoActual();
    if (n === ultimo) return;
    ultimo = n;
    items.forEach(function (li, i) {
      var paso = i + 1;
      li.removeAttribute('aria-current');
      li.classList.toggle('hecho', paso < n);
      var extra = li.querySelector('.visualmente-oculto');
      if (extra) extra.remove();
      if (paso < n) {
        var s = document.createElement('span');
        s.className = 'visualmente-oculto';
        s.textContent = ' (completo)';
        li.appendChild(s);
      }
      if (paso === n) li.setAttribute('aria-current', 'step');
    });
    document.title = 'Paso ' + n + ': ' + titulos[n - 1].toLowerCase() + ' | Crear | Bermejo Accesible';
  }

  var observador = new MutationObserver(actualizar);
  ['paso-cargar', 'paso-revisar', 'paso-leer', 'lab-resultado', 'lab-generar'].forEach(function (id) {
    var e = document.getElementById(id);
    if (e) observador.observe(e, { attributes: true, attributeFilter: ['hidden', 'disabled', 'aria-disabled'] });
  });
  // El resultado se vuelve a dibujar con cada cambio; se vigila su contenido y la casilla de aprobación.
  var resultado = document.getElementById('lab-resultado');
  if (resultado) {
    observador.observe(resultado, { childList: true, subtree: false });
    resultado.addEventListener('change', function (e) { if (e.target && e.target.id === 'lab-aprobado') actualizar(); });
  }
  actualizar();
}());
