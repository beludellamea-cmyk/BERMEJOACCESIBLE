/* Bermejo Accesible: entrada contextual a los dos recorridos, sin duplicar los procesadores de archivos. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search);
    var destino = params.get('recorrido') === 'adaptar' ? 'adaptar' : 'comprender';
    var main = document.getElementById('contenido');
    var laboratorio = document.getElementById('laboratorio');
    var pasoLeer = document.getElementById('paso-leer');
    if (!main) return;

    var enlaces = document.querySelectorAll('.nav-principal a[href*="material.html?recorrido="]');
    enlaces.forEach(function (a) {
      var esActual = a.getAttribute('href').indexOf('recorrido=' + destino) !== -1;
      if (esActual) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    if (!laboratorio || !pasoLeer) return;
    if (destino === 'adaptar') {
      document.body.classList.add('recorrido-adaptar');
      document.title = 'Crear una adaptación | Bermejo Accesible';
      var titulo = main.querySelector('h1');
      if (titulo) titulo.textContent = 'Crear una adaptación educativa';
      var intro = main.querySelector('.intro');
      if (intro) {
        intro.textContent = 'Un recorrido para transformar tu material de clase en una propuesta accesible, con apoyos visuales y revisión docente.';
        var nota = document.createElement('section');
        nota.className = 'recorrido-contexto';
        nota.setAttribute('aria-labelledby', 'recorrido-titulo');
        nota.innerHTML = '<h2 id="recorrido-titulo">Primero cargá el material, después usá el laboratorio.</h2>' +
          '<p><strong>1.</strong> Pegá texto, subí un PDF o una foto. <strong>2.</strong> Revisá el contenido extraído. <strong>3.</strong> Elegí grado, materia y apoyos para generar la propuesta de adaptación.</p>' +
          '<p>La IA trabaja con un borrador que siempre necesita revisión docente. No ingreses información personal identificable.</p>';
        intro.insertAdjacentElement('afterend', nota);
      }
      var tLeer = document.getElementById('t-leer');
      if (tLeer) tLeer.textContent = 'Paso 3. Prepará la adaptación';
      var resumen = pasoLeer.querySelector(':scope > p');
      if (resumen) resumen.textContent = 'Comenzá por el laboratorio. Si después querés escuchar o leer el texto de otras formas, esas opciones siguen disponibles debajo.';
      var primer = pasoLeer.querySelector('.accesos-lectura');
      if (primer) pasoLeer.insertBefore(laboratorio, primer);
    } else {
      document.body.classList.add('recorrido-comprender');
      var contenedor = document.createElement('details');
      contenedor.className = 'laboratorio-acceso';
      var sum = document.createElement('summary');
      sum.textContent = '¿Sos docente y también querés crear una adaptación con IA?';
      laboratorio.parentNode.insertBefore(contenedor, laboratorio);
      contenedor.appendChild(sum);
      contenedor.appendChild(laboratorio);
    }
  });
})();
