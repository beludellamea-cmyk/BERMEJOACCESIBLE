/* Libro de la portada: se abre solo al entrar (si la persona no pidió menos movimiento) y permite probar el mismo texto de tres maneras. */
(function () {
  'use strict';
  var libro = document.getElementById('libro');
  var boton = document.getElementById('libro-alternar');
  var nota = document.getElementById('libro-nota');
  if (!libro || !boton) return;
  var textoBoton = boton.querySelector('span');
  var botonesVista = libro.querySelectorAll('[data-libro-vista]');
  var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tocado = false;
  var notas = {
    grande: 'El mismo texto, con letra grande y poco contenido.',
    pictos: 'El mismo texto, con pictogramas.',
    partes: 'El mismo texto, dividido en partes cortas.'
  };

  function fijar(abierto) {
    libro.dataset.estado = abierto ? 'abierto' : 'cerrado';
    boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    textoBoton.textContent = abierto ? 'Cerrar el libro' : 'Abrir el libro';
  }
  function alternar() { tocado = true; fijar(libro.dataset.estado !== 'abierto'); }

  if (!reducir) {
    fijar(false);
    setTimeout(function () { if (!tocado) fijar(true); }, 700);
  }
  boton.addEventListener('click', alternar);
  libro.querySelector('.libro__caja').addEventListener('click', function () {
    if (libro.dataset.estado === 'cerrado') alternar();
  });
  Array.prototype.forEach.call(botonesVista, function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-libro-vista');
      libro.dataset.vista = v;
      Array.prototype.forEach.call(botonesVista, function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      nota.textContent = notas[v];
      tocado = true;
      fijar(true);
    });
  });
})();
