/* Laboratorio de adaptaciones: arma el material revisado como un archivo HTML autónomo.
   Sin scripts ni envíos: el archivo se prepara en el navegador. Se puede abrir, imprimir o guardar como PDF.
   Pictogramas: Sergio Palao. Origen: ARASAAC. Licencia CC BY-NC-SA. Propiedad: Gobierno de Aragón (España). */
(function () {
  'use strict';

  var ETIQUETAS = {
    opciones: 'Elegir la respuesta correcta',
    unir: 'Unir conceptos',
    completar: 'Completar con palabras',
    ordenar: 'Ordenar una secuencia',
    vf: 'Verdadero o falso',
    breve: 'Responder con pocas palabras',
    expresar: 'Mostrar lo aprendido de otra forma'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function parrafos(texto) {
    return String(texto || '').split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean)
      .map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }

  function lineas(texto) {
    return String(texto || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
  }

  /* Reordena sin azar para que el archivo sea siempre igual y nunca deje el orden original. */
  function rotar(lista) { return lista.length > 1 ? lista.slice(1).concat(lista[0]) : lista.slice(); }

  function letra(i) { return String.fromCharCode(65 + i); }

  function parUnir(l) {
    var i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  }

  function listaAyuda(titulo, contenido) {
    return '<aside class="ayuda"><h4>' + esc(titulo) + '</h4>' + contenido + '</aside>';
  }

  /* Devuelve {estudiante, clave} para una actividad. */
  function actividad(a, n, op) {
    var items = Array.isArray(a.items) ? a.items.filter(Boolean) : [];
    var cuerpo = '';
    var clave = '';
    if (a.tipo === 'opciones') {
      cuerpo = '<ol class="alfa">' + items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol><p class="marca">Mi respuesta: ______</p>';
      clave = esc(a.respuesta);
    } else if (a.tipo === 'unir') {
      var pares = items.map(parUnir);
      var der = rotar(pares.map(function (p) { return p[1]; }));
      cuerpo = '<table class="unir"><caption>Escribí la letra que corresponde a cada concepto.</caption><thead><tr><th scope="col">Concepto</th><th scope="col">Mi letra</th><th scope="col">Pareja</th></tr></thead><tbody>' +
        pares.map(function (p, i) {
          return '<tr><td>' + (i + 1) + '. ' + esc(p[0]) + '</td><td class="hueco">____</td><td>' + letra(i) + '. ' + esc(der[i]) + '</td></tr>';
        }).join('') + '</tbody></table>';
      clave = pares.map(function (p, i) { return (i + 1) + ' → ' + letra(der.indexOf(p[1])); }).join('; ');
    } else if (a.tipo === 'completar') {
      cuerpo = '<p class="banco"><strong>Palabras para usar:</strong> ' + items.map(esc).join(' · ') + '</p>';
      clave = esc(a.respuesta);
    } else if (a.tipo === 'ordenar') {
      var mezclados = rotar(items);
      cuerpo = '<p>Escribí el número del orden correcto (1, 2, 3…) antes de cada paso.</p><ul class="pasos">' +
        mezclados.map(function (x) { return '<li><span class="hueco">___</span> ' + esc(x) + '</li>'; }).join('') + '</ul>';
      clave = items.map(function (x, i) { return (i + 1) + '. ' + esc(x); }).join('<br>');
    } else if (a.tipo === 'vf') {
      cuerpo = '<ol>' + items.map(function (x) { return '<li>' + esc(x) + '<br><span class="marca">☐ Verdadero &nbsp; ☐ Falso</span></li>'; }).join('') + '</ol>';
      clave = esc(a.respuesta);
    } else if (a.tipo === 'expresar') {
      cuerpo = '<p>Elegí una forma:</p><ul class="formas">' + items.map(function (x) { return '<li>☐ ' + esc(x) + '</li>'; }).join('') + '</ul>';
      clave = esc(a.respuesta);
    } else {
      cuerpo = '<p class="marca">Mi respuesta: ______________________________________</p>';
      clave = esc(a.respuesta);
    }
    var ayudas = '';
    var pistas = lineas(a.pistas);
    if (op.pistas && pistas.length) {
      ayudas += listaAyuda('Pistas', '<ol>' + pistas.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>');
    }
    if (op.acompanado && a.acompanado && a.acompanado.trim()) {
      ayudas += listaAyuda('Paso a paso, con ayuda', parrafos(a.acompanado));
    }
    var html = '<section class="actividad"><h3>Actividad ' + n + '. ' + esc(ETIQUETAS[a.tipo] || 'Actividad') + '</h3>' +
      parrafos(a.consigna) + cuerpo + ayudas + '</section>';
    return { estudiante: html, clave: clave };
  }

  /* datos: modelo del laboratorio. meta: {materia, grado}. op: {pistas, acompanado, clave, borrador}.
     imagenes: mapa id → dirección (data: o https) para los pictogramas. */
  function construirHTML(datos, meta, op, imagenes) {
    imagenes = imagenes || {};
    var hayPictos = false, hayFotos = false, fotos = [];
    var tamLetra = { n: '1.25rem', g: '1.5rem', mg: '1.8rem' }[op.letra] || '1.25rem';
    var anchoFig = { p: '6rem', m: '8.5rem', g: '12rem' }[op.tamPicto] || '8.5rem';
    var titulo = datos.titulo || 'Material adaptado';
    var cuerpo = '';
    if (datos.anticipacion && datos.anticipacion.trim()) {
      cuerpo += '<section class="anticipacion"><h2>Qué vamos a aprender</h2>' + parrafos(datos.anticipacion) + '</section>';
    }
    datos.bloques.forEach(function (b, i) {
      var pictos = (b.conceptos || []).filter(function (c) { return c.picto || c.imagen; });
      var figuras = pictos.map(function (c) {
        var palabra = c.termino || (c.picto ? c.picto.palabra : c.imagen.titulo);
        if (c.imagen) {
          hayFotos = true;
          var nF = fotos.indexOf(c.imagen); if (nF === -1) { fotos.push(c.imagen); }
          var srcF = imagenes[clave(c)] || c.imagen.url;
          return '<li><figure><img src="' + esc(srcF) + '" alt="Foto: ' + esc(palabra) + '" width="' + c.imagen.ancho + '" height="' + c.imagen.alto + '" class="foto"><figcaption>' + esc(palabra) + '</figcaption></figure></li>';
        }
        hayPictos = true;
        var src = imagenes[clave(c)] || window.BermejoPictos.url(c.picto.id, 300);
        return '<li><figure><img src="' + esc(src) + '" alt="Pictograma: ' + esc(palabra) + '" width="300" height="300"><figcaption>' + esc(palabra) + '</figcaption></figure></li>';
      }).join('');
      cuerpo += '<section class="bloque"><h2>' + esc(b.subtitulo || ('Parte ' + (i + 1))) + '</h2>' + parrafos(b.texto) +
        (figuras ? '<ul class="pictos" aria-label="Pictogramas de esta parte">' + figuras + '</ul>' : '') + '</section>';
    });
    var vocab = (datos.vocabulario || []).filter(function (v) { return v.termino && v.definicion; });
    if (vocab.length) {
      cuerpo += '<section class="vocabulario"><h2>Palabras para entender mejor</h2><dl>' +
        vocab.map(function (v) { return '<dt>' + esc(v.termino) + '</dt><dd>' + esc(v.definicion) + '</dd>'; }).join('') + '</dl></section>';
    }
    var claves = [];
    if (datos.actividades.length) {
      cuerpo += '<section class="actividades"><h2>Actividades</h2>';
      datos.actividades.forEach(function (a, i) {
        var r = actividad(a, i + 1, op);
        cuerpo += r.estudiante;
        claves.push('<li><strong>Actividad ' + (i + 1) + ':</strong> ' + r.clave + '</li>');
      });
      cuerpo += '</section>';
    }
    if (op.clave) {
      var notas = (datos.notas || []).filter(Boolean);
      cuerpo += '<section class="docente"><h2>Para el docente</h2><h3>Respuestas esperadas</h3><ul>' + claves.join('') + '</ul>' +
        (notas.length ? '<h3>Notas para tener en cuenta</h3><ul>' + notas.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : '') + '</section>';
    }
    var pie = '<footer><p class="nota">' + (op.borrador
      ? 'Vista previa de un borrador generado con IA, todavía sin aprobación docente.'
      : 'Material elaborado con apoyo de IA y revisado por un docente antes de usarlo.') + ' Creado con Bermejo Accesible.</p>' +
      (hayPictos ? '<p class="nota">Pictogramas: Sergio Palao. Origen: ARASAAC (arasaac.org). Licencia: CC BY-NC-SA. Propiedad: Gobierno de Aragón (España).</p>' : '') +
      (hayFotos ? '<h2>Créditos de las fotos</h2><ul class="nota">' + fotos.map(function (f) {
        return '<li>' + esc(f.titulo) + '. Autor: ' + esc(f.autor) + '. Licencia: ' + esc(f.licencia) + '. Fuente: Wikimedia Commons' + (f.pagina ? ' (' + esc(f.pagina) + ')' : '') + '.</li>';
      }).join('') + '</ul>' : '') + '</footer>';

    var css = '*{box-sizing:border-box}html{font-size:100%}body{margin:0;padding:clamp(1rem,4vw,2.5rem);font-family:Arial,Helvetica,sans-serif;font-size:' + tamLetra + ';line-height:1.6;color:#15222c;background:#fff;overflow-wrap:anywhere}' +
      'main{max-width:50rem;margin:auto}h1{font-size:1.8rem;line-height:1.25;margin:0 0 .3em}h2{font-size:1.45rem;line-height:1.3;margin:1.6em 0 .5em;border-top:3px solid #086776;padding-top:.6em}h3{font-size:1.2rem;margin:1.2em 0 .4em}h4{font-size:1.05rem;margin:.2em 0 .4em}' +
      'p,li,dd{max-width:68ch}.meta,.nota{font-size:.9rem;color:#3d4b55}' +
      '.pictos{list-style:none;display:flex;flex-wrap:wrap;gap:1rem;padding:0;margin:1rem 0}.pictos figure{margin:0;width:' + anchoFig + ';text-align:center;font-size:.95rem}.pictos img.foto{aspect-ratio:4/3;object-fit:cover}.pictos img{display:block;width:100%;height:auto;border:2px solid #57808a;border-radius:.5rem;background:#fff}.pictos figcaption{margin-top:.3rem;font-weight:700}' +
      'dt{font-weight:700;margin-top:.8em}dd{margin:0 0 .4em 1rem}.actividad{border:2px solid #57808a;border-radius:.8rem;padding:.2rem 1.1rem 1rem;margin:1.2rem 0;break-inside:avoid}' + (op.salto ? '@media print{.actividad{break-before:page}}.actividad{break-before:auto}' : '') + '' +
      '.alfa{list-style:lower-alpha}.hueco,.marca{font-family:"Courier New",monospace}.unir{border-collapse:collapse;width:100%}.unir caption{text-align:left;padding-bottom:.4rem}.unir th,.unir td{border:1px solid #57808a;padding:.4rem .6rem;text-align:left;vertical-align:top}' +
      '.banco{background:#f0f7f6;padding:.6rem .8rem;border-radius:.5rem}.pasos,.formas{list-style:none;padding-left:0}.pasos li,.formas li{margin:.5rem 0}' +
      '.ayuda{background:#fff6d6;border-left:.4rem solid #8a6100;padding:.4rem 1rem;margin:.8rem 0;font-size:1.05rem}.ayuda ol{margin:.3rem 0;padding-left:1.4rem}' +
      '.docente{break-before:page}footer{margin-top:2.5rem}' +
      '@media print{body{padding:0;font-size:12pt;print-color-adjust:exact;-webkit-print-color-adjust:exact}h2{break-after:avoid}.bloque{break-inside:avoid}}' +
      '@media(forced-colors:active){.ayuda,.banco{border:2px solid CanvasText}}';

    return '<!doctype html>\n<html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(titulo) + '</title><style>' + css + '</style></head><body><main>' +
      '<header><h1>' + esc(titulo) + '</h1><p class="meta">' + esc([meta.materia, meta.grado].filter(Boolean).join(' · ')) + '</p></header>' + cuerpo + pie + '</main></body></html>';
  }

  /* Clave de un apoyo visual: p:<id> (pictograma) o i:<url> (foto). */
  function clave(c) { return c.imagen ? 'i:' + c.imagen.url : 'p:' + c.picto.id; }
  function direccion(k) { return k.charAt(0) === 'i' ? k.slice(2) : window.BermejoPictos.url(k.slice(2), 300); }

  function leerComoDatos(blob) {
    return new Promise(function (resolver, rechazar) {
      var l = new FileReader();
      l.onload = function () { resolver(l.result); };
      l.onerror = rechazar;
      l.readAsDataURL(blob);
    });
  }

  /* Trae cada pictograma elegido y lo guarda dentro del archivo. Devuelve {imagenes, faltan}. */
  async function incrustarImagenes(datos) {
    var ids = [];
    datos.bloques.forEach(function (b) {
      (b.conceptos || []).forEach(function (c) {
        var k = (c.picto || c.imagen) ? clave(c) : null;
        if (k && ids.indexOf(k) === -1) ids.push(k);
      });
    });
    var imagenes = {};
    var faltan = 0;
    await Promise.all(ids.map(async function (k) {
      try {
        var r = await fetch(direccion(k));
        if (!r.ok) throw new Error('imagen');
        imagenes[k] = await leerComoDatos(await r.blob());
      } catch (e) { faltan++; }
    }));
    return { imagenes: imagenes, faltan: faltan };
  }

  window.BermejoLabExportar = { construirHTML: construirHTML, incrustarImagenes: incrustarImagenes, etiquetas: ETIQUETAS, clave: clave, direccion: direccion, rotar: rotar, parUnir: parUnir, lineas: lineas, letra: letra };
})();
