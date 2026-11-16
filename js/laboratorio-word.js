/* Laboratorio de adaptaciones: arma el material revisado como documento de Word (.docx) editable.
   Usa la biblioteca docx (MIT, incluida en js/vendor/docx.umd.js); todo se prepara en el navegador.
   Pictogramas: Sergio Palao. Origen: ARASAAC. Licencia CC BY-NC-SA. Propiedad: Gobierno de Aragón (España). */
(function () {
  'use strict';

  var cargando = null;
  function cargarBiblioteca() {
    if (window.docx) return Promise.resolve(window.docx);
    if (cargando) return cargando;
    cargando = new Promise(function (ok, mal) {
      var s = document.createElement('script');
      s.src = 'js/vendor/docx.umd.js';
      s.onload = function () { window.docx ? ok(window.docx) : mal(new Error('docx')); };
      s.onerror = function () { cargando = null; mal(new Error('No se pudo cargar la biblioteca de Word.')); };
      document.head.appendChild(s);
    });
    return cargando;
  }

  /* Trae cada pictograma elegido como bytes PNG. Devuelve {bytes: {id: Uint8Array}, faltan}. */
  async function traerBytes(datos) {
    var ids = [];
    var E = window.BermejoLabExportar;
    datos.bloques.forEach(function (b) {
      (b.conceptos || []).forEach(function (c) {
        var k = (c.picto || c.imagen) ? E.clave(c) : null;
        if (k && ids.indexOf(k) === -1) ids.push(k);
      });
    });
    var bytes = {}, faltan = 0;
    await Promise.all(ids.map(async function (k) {
      try {
        var r = await fetch(E.direccion(k));
        if (!r.ok) throw new Error('imagen');
        bytes[k] = new Uint8Array(await r.arrayBuffer());
      } catch (e) { faltan++; }
    }));
    return { bytes: bytes, faltan: faltan };
  }

  async function construir(datos, meta, op, bytes) {
    var D = await cargarBiblioteca();
    var E = window.BermejoLabExportar;
    var FUENTE = 'Arial';
    var AZUL = '086776';

    function t(texto, o) { return new D.TextRun(Object.assign({ text: String(texto == null ? '' : texto), font: FUENTE, language: { value: 'es-AR' } }, o || {})); }
    function p(texto, o) {
      o = o || {};
      return new D.Paragraph({ children: [t(texto, o.run)], spacing: { after: 120, line: 320 }, indent: o.indent, keepNext: o.keepNext });
    }
    function parrafos(texto) {
      return String(texto || '').split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean).map(function (x) {
        var lineas = x.split('\n');
        return new D.Paragraph({
          children: lineas.reduce(function (a, l, i) { if (i) a.push(new D.TextRun({ break: 1 })); a.push(t(l)); return a; }, []),
          spacing: { after: 140, line: 340 }
        });
      });
    }
    function h(nivel, texto) {
      return new D.Paragraph({ heading: nivel, children: [t(texto, { bold: true, color: nivel === D.HeadingLevel.HEADING_1 ? '15222C' : AZUL })], spacing: { before: 280, after: 120 }, keepNext: true });
    }
    function lista(items, numerada) {
      return items.map(function (x, i) {
        return new D.Paragraph({ children: [t((numerada ? (i + 1) + '. ' : '• ') + x)], spacing: { after: 80, line: 320 }, indent: { left: 360, hanging: 260 } });
      });
    }
    function celdaSin(hijos, ancho) {
      var nada = { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
      return new D.TableCell({ children: hijos, width: { size: ancho, type: D.WidthType.PERCENTAGE }, borders: { top: nada, bottom: nada, left: nada, right: nada } });
    }
    function celda(hijos, ancho, sombra) {
      var b = { style: D.BorderStyle.SINGLE, size: 6, color: '57808A' };
      return new D.TableCell({ children: hijos, width: { size: ancho, type: D.WidthType.PERCENTAGE }, borders: { top: b, bottom: b, left: b, right: b }, shading: sombra ? { type: D.ShadingType.CLEAR, fill: sombra, color: 'auto' } : undefined, margins: { top: 80, bottom: 80, left: 120, right: 120 } });
    }
    function ayuda(titulo, hijos) {
      return new D.Table({
        width: { size: 100, type: D.WidthType.PERCENTAGE },
        rows: [new D.TableRow({ children: [celda([new D.Paragraph({ children: [t(titulo, { bold: true })], spacing: { after: 60 } })].concat(hijos), 100, 'FFF6D6')] })]
      });
    }
    function espacio() { return new D.Paragraph({ children: [], spacing: { after: 80 } }); }

    var hijos = [];
    hijos.push(h(D.HeadingLevel.HEADING_1, datos.titulo || 'Material adaptado'));
    hijos.push(p([meta.materia, meta.grado].filter(Boolean).join(' · '), { run: { color: '3D4B55', size: 20 } }));

    if (datos.anticipacion && datos.anticipacion.trim()) {
      hijos.push(h(D.HeadingLevel.HEADING_2, 'Qué vamos a aprender'));
      hijos = hijos.concat(parrafos(datos.anticipacion));
    }

    var hayPictos = false, hayFotos = false, fotos = [];
    var tamPt = { n: 12, g: 14, mg: 16 }[op.letra] || 12;
    datos.bloques.forEach(function (b, i) {
      hijos.push(h(D.HeadingLevel.HEADING_2, b.subtitulo || ('Parte ' + (i + 1))));
      hijos = hijos.concat(parrafos(b.texto));
      var pictos = (b.conceptos || []).filter(function (c) { return (c.picto || c.imagen) && bytes[E.clave(c)]; });
      if (pictos.length) {
        var porFila = 4, filas = [];
        for (var k = 0; k < pictos.length; k += porFila) {
          var tramo = pictos.slice(k, k + porFila);
          var celdas = tramo.map(function (c) {
            var palabra = c.termino || (c.picto ? c.picto.palabra : c.imagen.titulo);
            var lado = { p: 72, m: 96, g: 144 }[op.tamPicto] || 96;
            var ancho = lado, alto = lado, tipoImg = 'png', nombre = 'Pictograma', desc = 'Pictograma de ARASAAC que representa: ';
            if (c.imagen) {
              hayFotos = true; if (fotos.indexOf(c.imagen) === -1) fotos.push(c.imagen);
              ancho = Math.round(lado * 1.3); alto = Math.max(20, Math.round(ancho * (c.imagen.alto || 3) / (c.imagen.ancho || 4)));
              tipoImg = c.imagen.mime === 'image/png' ? 'png' : 'jpg'; nombre = 'Foto'; desc = 'Foto de Wikimedia Commons que muestra: ';
            } else { hayPictos = true; }
            return celdaSin([
              new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.ImageRun({ type: tipoImg, data: bytes[E.clave(c)], transformation: { width: ancho, height: alto }, altText: { name: nombre + ' ' + palabra, title: nombre + ': ' + palabra, description: desc + palabra } })] }),
              new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [t(palabra, { bold: true, size: 22 })] })
            ], 100 / porFila);
          });
          while (celdas.length < porFila) celdas.push(celdaSin([new D.Paragraph({ children: [] })], 100 / porFila));
          filas.push(new D.TableRow({ children: celdas, cantSplit: true }));
        }
        hijos.push(new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE }, rows: filas }));
        hijos.push(espacio());
      }
    });

    var vocab = (datos.vocabulario || []).filter(function (v) { return v.termino && v.definicion; });
    if (vocab.length) {
      hijos.push(h(D.HeadingLevel.HEADING_2, 'Palabras para entender mejor'));
      vocab.forEach(function (v) {
        hijos.push(new D.Paragraph({ children: [t(v.termino + ': ', { bold: true }), t(v.definicion)], spacing: { after: 100, line: 320 } }));
      });
    }

    var claves = [];
    if (datos.actividades.length) {
      hijos.push(h(D.HeadingLevel.HEADING_2, 'Actividades'));
      datos.actividades.forEach(function (a, n) {
        var items = (a.items || []).filter(Boolean);
        if (op.salto && n > 0) hijos.push(new D.Paragraph({ children: [new D.PageBreak()] }));
        hijos.push(h(D.HeadingLevel.HEADING_3, 'Actividad ' + (n + 1) + '. ' + (E.etiquetas[a.tipo] || 'Actividad')));
        hijos = hijos.concat(parrafos(a.consigna));
        var clave = a.respuesta || '';
        if (a.tipo === 'opciones') {
          hijos = hijos.concat(items.map(function (x, i) { return new D.Paragraph({ children: [t(E.letra(i).toLowerCase() + ') ' + x)], spacing: { after: 80 }, indent: { left: 360 } }); }));
          hijos.push(p('Mi respuesta: ______'));
        } else if (a.tipo === 'unir') {
          var pares = items.map(E.parUnir);
          var der = E.rotar(pares.map(function (q) { return q[1]; }));
          var cab = new D.TableRow({ tableHeader: true, children: ['Concepto', 'Mi letra', 'Pareja'].map(function (x, i) { return celda([new D.Paragraph({ children: [t(x, { bold: true })] })], [40, 15, 45][i], 'E2EDF2'); }) });
          var cuerpo = pares.map(function (q, i) {
            return new D.TableRow({ cantSplit: true, children: [
              celda([new D.Paragraph({ children: [t((i + 1) + '. ' + q[0])] })], 40),
              celda([new D.Paragraph({ children: [t('____')] })], 15),
              celda([new D.Paragraph({ children: [t(E.letra(i) + '. ' + der[i])] })], 45)] });
          });
          hijos.push(new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE }, rows: [cab].concat(cuerpo) }));
          hijos.push(espacio());
          clave = pares.map(function (q, i) { return (i + 1) + ' → ' + E.letra(der.indexOf(q[1])); }).join('; ');
        } else if (a.tipo === 'completar') {
          hijos.push(new D.Paragraph({ children: [t('Palabras para usar: ', { bold: true }), t(items.join(' · '))], spacing: { after: 120 } }));
        } else if (a.tipo === 'ordenar') {
          hijos.push(p('Escribí el número del orden correcto (1, 2, 3…) antes de cada paso.'));
          hijos = hijos.concat(E.rotar(items).map(function (x) { return new D.Paragraph({ children: [t('___  ' + x)], spacing: { after: 80 }, indent: { left: 360 } }); }));
          clave = items.map(function (x, i) { return (i + 1) + '. ' + x; }).join(' / ');
        } else if (a.tipo === 'vf') {
          items.forEach(function (x, i) {
            hijos.push(new D.Paragraph({ children: [t((i + 1) + '. ' + x)], spacing: { after: 40 }, indent: { left: 360 } }));
            hijos.push(new D.Paragraph({ children: [t('☐ Verdadero     ☐ Falso')], spacing: { after: 100 }, indent: { left: 720 } }));
          });
        } else if (a.tipo === 'expresar') {
          hijos.push(p('Elegí una forma:'));
          hijos = hijos.concat(items.map(function (x) { return new D.Paragraph({ children: [t('☐ ' + x)], spacing: { after: 80 }, indent: { left: 360 } }); }));
        } else {
          hijos.push(p('Mi respuesta: ______________________________________'));
        }
        var pistas = E.lineas(a.pistas);
        if (op.pistas && pistas.length) { hijos.push(ayuda('Pistas', lista(pistas, true))); hijos.push(espacio()); }
        if (op.acompanado && a.acompanado && a.acompanado.trim()) { hijos.push(ayuda('Paso a paso, con ayuda', parrafos(a.acompanado))); hijos.push(espacio()); }
        claves.push('Actividad ' + (n + 1) + ': ' + clave);
      });
    }

    if (op.clave) {
      hijos.push(new D.Paragraph({ children: [new D.PageBreak()] }));
      hijos.push(h(D.HeadingLevel.HEADING_2, 'Para el docente'));
      hijos.push(h(D.HeadingLevel.HEADING_3, 'Respuestas esperadas'));
      hijos = hijos.concat(lista(claves, false));
      var notas = (datos.notas || []).filter(Boolean);
      if (notas.length) { hijos.push(h(D.HeadingLevel.HEADING_3, 'Notas para tener en cuenta')); hijos = hijos.concat(lista(notas, false)); }
    }

    hijos.push(espacio());
    hijos.push(p((op.borrador ? 'Borrador generado con IA, sin aprobación docente.' : 'Material elaborado con apoyo de IA y revisado por un docente antes de usarlo.') + ' Creado con Bermejo Accesible.', { run: { size: 18, color: '3D4B55' } }));
    if (hayFotos) {
      hijos.push(h(D.HeadingLevel.HEADING_3, 'Créditos de las fotos'));
      fotos.forEach(function (f) { hijos.push(p(f.titulo + '. Autor: ' + f.autor + '. Licencia: ' + f.licencia + '. Fuente: Wikimedia Commons' + (f.pagina ? ' (' + f.pagina + ')' : '') + '.', { run: { size: 18, color: '3D4B55' } })); });
    }
    if (hayPictos) hijos.push(p('Pictogramas: Sergio Palao. Origen: ARASAAC (arasaac.org). Licencia: CC BY-NC-SA. Propiedad: Gobierno de Aragón (España).', { run: { size: 18, color: '3D4B55' } }));

    var doc = new D.Document({
      creator: 'Bermejo Accesible',
      title: datos.titulo || 'Material adaptado',
      description: 'Material adaptado con apoyo de IA y revisión docente',
      styles: { default: { document: { run: { font: FUENTE, size: tamPt * 2, language: { value: 'es-AR' } } } } },
      sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: hijos }]
    });
    return D.Packer.toBlob(doc);
  }

  window.BermejoLabWord = { construir: construir, traerBytes: traerBytes };
})();
