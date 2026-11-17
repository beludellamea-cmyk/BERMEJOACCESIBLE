/* Entrada breve: un libro se abre y deja ver la portada. Se muestra una vez por visita, se puede omitir y no aparece si se pidió menos movimiento. */
(function () {
  'use strict';
  var e = document.getElementById('entrada');
  if (!e) return;
  var salta = false;
  try { salta = sessionStorage.getItem('bermejo-entrada') === '1'; } catch (x) {}
  var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (salta || reducir) { e.remove(); return; }
  try { sessionStorage.setItem('bermejo-entrada', '1'); } catch (x) {}
  document.documentElement.classList.add('con-entrada');
  var cerrada = false;
  function cerrar() {
    if (cerrada) return; cerrada = true;
    e.classList.add('entrada--sale');
    setTimeout(function () { e.remove(); document.documentElement.classList.remove('con-entrada'); }, 600);
  }
  setTimeout(cerrar, 2300);
  e.addEventListener('click', cerrar);
  document.addEventListener('keydown', cerrar, { once: true });
})();
