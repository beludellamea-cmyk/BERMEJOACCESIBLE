/* Selector visual de formatos. Las tres funciones existentes se mantienen intactas. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var contenedor = document.querySelector('#paso-cargar .opciones-carga');
    if (!contenedor) return;
    var paneles = Array.from(contenedor.children).filter(function (e) { return e.classList.contains('panel'); });
    if (paneles.length < 3) return;
    var etiquetas = ['Escribir texto','Subir PDF','Sacar o subir foto'];
    var breves = ['Escribí o pegá','Elegí un documento','Usá la cámara o galería'];
    var codigos = ['texto','pdf','foto'];
    var selector = document.createElement('div');
    selector.className = 'seleccion-carga';
    selector.setAttribute('role', 'group');
    selector.setAttribute('aria-label', 'Elegí cómo cargar el material');
    var botones = [];
    paneles.slice(0,3).forEach(function (panel,i) {
      if (!panel.id) panel.id = 'tipo-carga-' + codigos[i];
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.setAttribute('aria-controls',panel.id);
      boton.setAttribute('aria-label','Cargar mediante ' + etiquetas[i]);
      boton.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      boton.dataset.carga = codigos[i];
      var pictograma = panel.querySelector('h3 svg');
      if (pictograma) {
        var figura = pictograma.cloneNode(true);
        figura.setAttribute('aria-hidden','true');
        figura.removeAttribute('focusable');
        boton.appendChild(figura);
      }
      var texto = document.createElement('span');
      texto.textContent = etiquetas[i];
      boton.appendChild(texto);
      var breve = document.createElement('small');
      breve.textContent = breves[i];
      boton.appendChild(breve);
      boton.addEventListener('click', function () {
        paneles.slice(0,3).forEach(function (p,j) {
          p.hidden = i !== j;
          botones[j].setAttribute('aria-pressed',i === j ? 'true':'false');
        });
        var campo = panel.querySelector('textarea,input[type="file"]');
        if (campo) campo.focus({preventScroll:true});
      });
      botones.push(boton);
      selector.appendChild(boton);
      panel.hidden = i !== 0;
    });
    var titulo = document.createElement('p');
    titulo.className = 'ayuda';
    titulo.textContent = 'Elegí cómo comenzar';
    contenedor.parentNode.insertBefore(titulo,contenedor);
    contenedor.parentNode.insertBefore(selector,contenedor);
  });
})();
