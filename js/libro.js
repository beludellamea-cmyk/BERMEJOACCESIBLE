/* Libro holográfico de la portada. Sigue abriéndose en la home al terminar la intro. */
(function () {
  'use strict';
  var libro = document.getElementById('libro');
  var boton = document.getElementById('libro-alternar');
  if (!libro || !boton) return;
  var texto = boton.querySelector('span');
  var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var usuarioIntervino = false;
  var yaAnimado = false;

  function mostrar(abierto) {
    libro.dataset.estado = abierto ? 'abierto' : 'cerrado';
    boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    if (texto) texto.textContent = abierto ? 'Cerrar el libro' : 'Abrir el libro';
  }
  function abrirDespuesDeIntro() {
    if (yaAnimado) return;
    yaAnimado = true;
    if (reducir) { mostrar(true); return; }
    if (!usuarioIntervino) window.setTimeout(function () {
      if (!usuarioIntervino) mostrar(true);
    }, 240);
  }
  if (!reducir) mostrar(false);
  else mostrar(true);
  window.addEventListener('bermejo:entrada-finalizada', abrirDespuesDeIntro, { once: true });
  boton.addEventListener('click', function () {
    usuarioIntervino = true;
    mostrar(libro.dataset.estado !== 'abierto');
  });
  var visual = libro.querySelector('.libro__caja');
  if (visual) visual.addEventListener('click', function () {
    if (libro.dataset.estado !== 'abierto') {
      usuarioIntervino = true;
      mostrar(true);
    }
  });
  /* Si la introducción no existe (p. ej., apertura desde el historial), el libro se abre. */
  window.addEventListener('load', function () {
    if (yaAnimado) return;
    if (!document.documentElement.classList.contains('con-entrada')) abrirDespuesDeIntro();
  }, { once: true });
})();
