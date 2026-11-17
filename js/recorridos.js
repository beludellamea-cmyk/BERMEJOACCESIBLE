/* Bermejo Accesible: dos recorridos en una sola página, sin perder el material cargado. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var main = document.getElementById('contenido');
    var lab = document.getElementById('laboratorio');
    var pasoLeer = document.getElementById('paso-leer');
    if (!main || !lab || !pasoLeer) return;
    var h1 = main.querySelector('h1');
    var intro = main.querySelector('.intro');
    var pasoTitulo = document.getElementById('t-leer');
    var pasoIntro = pasoLeer.querySelector(':scope > p');
    var primero = pasoLeer.querySelector('.accesos-lectura');
    var textoH1 = h1 ? h1.textContent : '';
    var textoIntro = intro ? intro.textContent : '';
    var textoPaso = pasoTitulo ? pasoTitulo.textContent : '';
    var textoPasoIntro = pasoIntro ? pasoIntro.textContent : '';
    var detalles = document.createElement('details');
    detalles.className = 'laboratorio-acceso';
    var sumario = document.createElement('summary');
    sumario.textContent = '¿Sos docente y también querés crear una adaptación con IA?';
    detalles.appendChild(sumario);
    var nota = document.createElement('section');
    nota.className = 'recorrido-contexto';
    nota.setAttribute('aria-labelledby', 'recorrido-titulo');
    nota.innerHTML = '<h2 id="recorrido-titulo">Primero cargá el material, después usá el laboratorio.</h2>' +
      '<p><strong>1.</strong> Pegá texto, subí un PDF o una foto. <strong>2.</strong> Revisá el contenido extraído. <strong>3.</strong> Elegí grado, materia y apoyos para crear tu adaptación.</p>' +
      '<p>La IA ofrece un borrador sujeto a revisión docente. No ingreses datos personales identificables.</p>';
    if (intro) intro.insertAdjacentElement('afterend', nota);

    function modoActual() {
      return new URLSearchParams(location.search).get('recorrido') === 'adaptar' ? 'adaptar' : 'comprender';
    }
    function aplicar(modo) {
      var adaptar = modo === 'adaptar';
      document.body.classList.toggle('recorrido-adaptar', adaptar);
      document.body.classList.toggle('recorrido-comprender', !adaptar);
      document.title = adaptar ? 'Crear una adaptación | Bermejo Accesible' : 'Comprender mi material | Bermejo Accesible';
      if (h1) h1.textContent = adaptar ? 'Crear una adaptación educativa' : textoH1;
      if (intro) intro.textContent = adaptar
        ? 'Un recorrido para transformar tu material de clase en una propuesta accesible, con apoyos visuales y revisión docente.'
        : textoIntro;
      nota.hidden = !adaptar;
      if (pasoTitulo) pasoTitulo.textContent = adaptar ? 'Paso 3. Prepará la adaptación' : textoPaso;
      if (pasoIntro) pasoIntro.textContent = adaptar
        ? 'Comenzá por el laboratorio. Las opciones para leer y escuchar el texto siguen disponibles debajo.'
        : textoPasoIntro;
      if (adaptar) {
        if (lab.parentNode === detalles) detalles.removeChild(lab);
        if (detalles.isConnected) detalles.remove();
        if (primero) pasoLeer.insertBefore(lab, primero);
        else pasoLeer.appendChild(lab);
      } else {
        if (!detalles.isConnected) pasoLeer.appendChild(detalles);
        detalles.appendChild(lab);
      }
      document.querySelectorAll('.nav-principal a[href*="material.html?recorrido="]').forEach(function (a) {
        var actual = a.getAttribute('href').indexOf('recorrido=' + modo) !== -1;
        if (actual) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    }
    aplicar(modoActual());

    /* Al cambiar de recorrido dentro de esta página se conserva el material ya cargado. */
    document.querySelectorAll('.nav-principal a[href^="material.html?recorrido="]').forEach(function (a) {
      a.addEventListener('click', function (evento) {
        var url = new URL(a.href, location.href);
        if (url.pathname !== location.pathname) return;
        evento.preventDefault();
        var nuevoModo = url.searchParams.get('recorrido') === 'adaptar' ? 'adaptar' : 'comprender';
        history.pushState({recorrido:nuevoModo}, '', url);
        aplicar(nuevoModo);
        var destino = !pasoLeer.hidden && pasoTitulo ? pasoTitulo : h1;
        if (destino) {
          destino.scrollIntoView({block:'start',behavior:'auto'});
          if (destino.hasAttribute('tabindex')) destino.focus({preventScroll:true});
        }
      });
    });
    window.addEventListener('popstate', function () { aplicar(modoActual()); });
  });
})();
