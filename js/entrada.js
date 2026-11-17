/* Introducción visual: libro 3D que se abre como gesto de bienvenida.
   Se muestra una vez por sesión; se puede omitir y respeta movimiento reducido. */
(function () {
  'use strict';
  var pantalla = document.getElementById('entrada');
  if (!pantalla) return;
  var raiz = document.documentElement;
  var iniciar = raiz.classList.contains('con-entrada');
  var accion = document.getElementById('entrada-saltar');
  var terminado = false;
  var reloj = null;
  var finalizacion = null;

  function avisar() {
    window.dispatchEvent(new CustomEvent('bermejo:entrada-finalizada'));
  }
  if (!iniciar) {
    pantalla.remove();
    window.requestAnimationFrame(avisar);
    return;
  }
  try { sessionStorage.setItem('bermejo-entrada-tech-v1', '1'); } catch (e) {}

  function terminar() {
    if (terminado) return;
    terminado = true;
    if (reloj) clearTimeout(reloj);
    pantalla.classList.add('entrada--sale');
    finalizacion = window.setTimeout(function () {
      pantalla.remove();
      raiz.classList.remove('con-entrada');
      avisar();
    }, 650);
  }
  if (accion) accion.addEventListener('click', terminar);
  pantalla.addEventListener('click', function (event) {
    if (event.target.closest('.entrada__libro') || event.target === pantalla) terminar();
  });
  document.addEventListener('keydown', function tecla(e) {
    if (e.key === 'Escape' || e.key === 'Enter') {
      terminar();
      document.removeEventListener('keydown', tecla);
    }
  });
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      if (!terminado) pantalla.classList.add('entrada--activo');
    });
  });
  reloj = window.setTimeout(terminar, 2850);
  window.addEventListener('pagehide', function () {
    if (reloj) clearTimeout(reloj);
    if (finalizacion) clearTimeout(finalizacion);
  }, { once: true });
})();
