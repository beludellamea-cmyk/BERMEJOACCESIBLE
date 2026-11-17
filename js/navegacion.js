/* Menú principal (en pantallas angostas), panel de accesibilidad y acceso a la ayuda. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var menu = document.getElementById('menu-principal');
    var abrir = document.querySelector('.menu-abrir');
    var ajustes = document.getElementById('ajustes');
    var movil = window.matchMedia('(max-width: 52rem)');

    function cerrarMenu(devolverFoco) {
      if (!menu || !abrir) return;
      menu.dataset.menuCerrado = 'true';
      abrir.setAttribute('aria-expanded', 'false');
      if (devolverFoco) abrir.focus();
    }
    function adaptar() {
      if (!menu || !abrir) return;
      if (movil.matches) cerrarMenu(false);
      else { delete menu.dataset.menuCerrado; abrir.setAttribute('aria-expanded', 'false'); }
    }
    adaptar();
    if (movil.addEventListener) movil.addEventListener('change', adaptar);
    else movil.addListener(adaptar);

    if (abrir && menu) {
      abrir.addEventListener('click', function () {
        var estabaCerrado = menu.dataset.menuCerrado === 'true';
        menu.dataset.menuCerrado = String(!estabaCerrado);
        abrir.setAttribute('aria-expanded', String(estabaCerrado));
        if (estabaCerrado) {
          if (ajustes) ajustes.open = false;
          menu.querySelector('a').focus();
        }
      });
    }

    if (ajustes) {
      ajustes.addEventListener('toggle', function () {
        if (ajustes.open && movil.matches) cerrarMenu(false);
      });
      // Se cierra al tocar fuera del panel.
      document.addEventListener('click', function (e) {
        if (ajustes.open && !ajustes.contains(e.target)) ajustes.open = false;
      });
    }

    // «Ayuda por voz y guía» abre el asistente (lo crea asistente-global.js).
    document.querySelectorAll('[data-abrir-ayuda]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (ajustes) ajustes.open = false;
        if (movil.matches) cerrarMenu(false);
        if (window.BermejoGuia && window.BermejoGuia.abrir) window.BermejoGuia.abrir();
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (ajustes && ajustes.open) { ajustes.open = false; ajustes.querySelector('summary').focus(); }
      else if (movil.matches && menu && menu.dataset.menuCerrado === 'false') cerrarMenu(true);
    });
  });
}());
