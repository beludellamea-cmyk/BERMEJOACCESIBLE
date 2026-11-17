/* Demostración sin subir datos ni conectarse a la IA. Reutiliza el mismo proceso de lectura. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var boton = document.getElementById('demo-comprender');
    if (!boton) return;
    boton.addEventListener('click', function () {
      var ejemplo = document.getElementById('usar-ejemplo');
      var continuar = document.getElementById('ir-a-leer');
      if (!ejemplo || !continuar) return;
      ejemplo.click();
      continuar.click();
      var paso = document.getElementById('paso-leer');
      if (!paso || paso.hidden) return;
      var ayuda = paso.querySelector('.ayuda-lectura');
      if (ayuda) ayuda.textContent = '¡Este es el mismo texto del ciclo del agua! Probá Escuchar, Leer por partes, Con imágenes y Con pictogramas. En pictogramas, elegí la cantidad y tocá Buscar para consultar ARASAAC.';
      var titulo = document.getElementById('t-leer');
      if (titulo) titulo.focus({ preventScroll: true });
      paso.scrollIntoView({ block: 'start', behavior: 'auto' });
    });
  });
})();