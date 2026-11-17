/* Laboratorio de adaptaciones accesibles con IA (etapa 1).
   - Pide una propuesta al servicio de IA existente (ruta /laboratorio), solo tras confirmar.
   - La propuesta es un borrador: el docente la edita, elige los pictogramas y la aprueba.
   - No se guarda nada en el navegador; el texto no sale de la página sin confirmación explícita.
   Depende de pictogramas-arasaac.js y laboratorio-exportar.js. */
(function () {
  'use strict';

  var raiz = document.getElementById('laboratorio');
  var texto = document.getElementById('texto-editable');
  if (!raiz || !texto || !window.BermejoPictos || !window.BermejoLabExportar) return;

  var Pictos = window.BermejoPictos;
  var Exportar = window.BermejoLabExportar;
  var endpoint = String(window.BERMEJO_CHAT_ENDPOINT || '').replace(/\/$/, '');

  function $(s) { return raiz.querySelector(s); }
  function todos(s) { return Array.prototype.slice.call(raiz.querySelectorAll(s)); }
  function crear(tag, clase, contenido) {
    var e = document.createElement(tag);
    if (clase) e.className = clase;
    if (contenido != null) e.textContent = contenido;
    return e;
  }
  var contador = 0;
  function uid(p) { contador += 1; return 'lab-' + p + '-' + contador; }

  var form = $('#lab-form');
  var estado = $('#lab-estado');
  var errores = $('#lab-errores');
  var resultado = $('#lab-resultado');

  var lab = { datos: null, consulta: null, textoEnviado: '', busqueda: null };
  var cantidadTocada = false;

  function decir(mensaje) { estado.textContent = ''; setTimeout(function () { estado.textContent = mensaje; }, 60); }

  /* ---------- Formulario ---------- */
  var materia = $('#lab-materia');
  var materiaOtra = $('#lab-materia-otra');
  var grado = $('#lab-grado');
  var chkPictos = $('input[name="lab-apoyo"][value="pictogramas"]');

  function sincronizarFormulario() {
    var otra = materia.value === 'otra';
    $('#lab-materia-otra-caja').hidden = !otra;
    var conPictos = chkPictos.checked;
    $('#lab-cantidad').disabled = !conPictos;
    $('#lab-cantidad-ayuda').textContent = conPictos
      ? 'Controla cuántos pictogramas se proponen por parte del texto.'
      : 'Se usa cuando elegís pictogramas como apoyo.';
  }
  materia.addEventListener('change', sincronizarFormulario);
  chkPictos.addEventListener('change', sincronizarFormulario);
  grado.addEventListener('change', function () {
    if (cantidadTocada || !grado.value) return;
    var partes = grado.value.split('-');
    var chico = partes[0] === 'primaria' && Number(partes[1]) <= 4;
    var radio = $('input[name="lab-cantidad"][value="' + (chico ? 'moderados' : 'pocos') + '"]');
    if (radio) radio.checked = true;
  });
  todos('input[name="lab-cantidad"]').forEach(function (r) { r.addEventListener('change', function () { cantidadTocada = true; }); });
  sincronizarFormulario();

  function valores(nombre) {
    return todos('input[name="' + nombre + '"]:checked').map(function (i) { return i.value; });
  }

  function leerFormulario() {
    var problemas = [];
    var fuente = texto.value.trim();
    if (fuente.length < 20 || fuente.length > 6000) {
      problemas.push({ campo: 'texto-editable', mensaje: 'El contenido revisado debe tener entre 20 y 6000 caracteres. Podés dividir un material largo en partes.' });
    }
    var nombreMateria = materia.value === 'otra' ? materiaOtra.value.trim() : materia.value;
    if (!nombreMateria) problemas.push({ campo: materia.value === 'otra' ? 'lab-materia-otra' : 'lab-materia', mensaje: 'Elegí la materia o escribila.' });
    if (!grado.value) problemas.push({ campo: 'lab-grado', mensaje: 'Elegí el grado o año.' });
    var objetivos = valores('lab-objetivo');
    var libres = $('#lab-objetivos-libres').value.trim();
    var enfoque = ($('input[name="lab-enfoque"]:checked') || {}).value || 'material';
    var orientacionDUA = enfoque === 'propuesta'
      ? 'Organizá la propuesta en inicio, desarrollo y cierre; ofrecé opciones para participar y expresar lo aprendido según el DUA.'
      : 'Priorizá una explicación accesible, apoyos visuales y actividades diversas según el DUA.';
    if (!objetivos.length && !libres) problemas.push({ campo: 'lab-objetivos-grupo', mensaje: 'Marcá al menos un objetivo pedagógico o escribí uno.' });
    var formatos = valores('lab-formato');
    if (!formatos.length) problemas.push({ campo: 'lab-formatos-grupo', mensaje: 'Elegí al menos un formato de actividad.' });
    if (formatos.length > 4) problemas.push({ campo: 'lab-formatos-grupo', mensaje: 'Elegí hasta cuatro formatos de actividad.' });
    if (!$('#lab-consentimiento').checked) problemas.push({ campo: 'lab-consentimiento', mensaje: 'Para continuar, confirmá que quitaste los datos personales y que el texto se enviará al servicio de IA.' });
    if (!endpoint) problemas.push({ campo: 'lab-generar', mensaje: 'Falta configurar la dirección del servicio de IA (js/chat-config.js).' });
    if (problemas.length) return { problemas: problemas };
    var partes = grado.value.split('-');
    return {
      problemas: [],
      fuente: fuente,
      pedido: {
        texto: fuente,
        confirmacion: true,
        materia: nombreMateria.slice(0, 80),
        etapa: partes[0],
        numero: Number(partes[1]),
        objetivos: objetivos,
        objetivosLibres: [libres.slice(0, 250), orientacionDUA].filter(Boolean).join(' ').slice(0, 400),
        apoyos: valores('lab-apoyo'),
        niveles: valores('lab-nivel'),
        cantidadApoyos: ($('input[name="lab-cantidad"]:checked') || {}).value || 'pocos',
        formatos: formatos
      },
      meta: { materia: nombreMateria, grado: grado.options[grado.selectedIndex].text }
    };
  }

  function mostrarErrores(problemas) {
    errores.replaceChildren();
    errores.hidden = false;
    errores.appendChild(crear('h4', null, problemas.length === 1 ? 'Hay un dato para corregir' : 'Hay ' + problemas.length + ' datos para corregir'));
    var ul = crear('ul');
    problemas.forEach(function (p) {
      var li = document.createElement('li');
      var a = crear('a', null, p.mensaje);
      a.href = '#' + p.campo;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var destino = document.getElementById(p.campo);
        if (!destino) return;
        var foco = destino.matches('input,select,textarea,button') ? destino : (destino.querySelector('input,select,textarea') || destino);
        foco.focus();
      });
      li.appendChild(a);
      ul.appendChild(li);
    });
    errores.appendChild(ul);
    errores.focus();
  }

  function ocultarErrores() { errores.hidden = true; errores.replaceChildren(); }

  async function solicitar(pedido) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 60000);
    try {
      var r = await fetch(endpoint + '/laboratorio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pedido), signal: ctrl.signal
      });
      var salida;
      try { salida = await r.json(); } catch (e) { throw new Error('El servicio de IA devolvió una respuesta que no se pudo leer.'); }
      if (!r.ok) throw new Error(salida.error || 'El servicio de IA no respondió.');
      return salida;
    } finally { clearTimeout(timer); }
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var lectura = leerFormulario();
    if (lectura.problemas.length) { decir(''); mostrarErrores(lectura.problemas); return; }
    ocultarErrores();
    var boton = $('#lab-generar');
    boton.disabled = true;
    decir('Preparando la propuesta. Puede tardar hasta un minuto…');
    try {
      var r = await solicitar(lectura.pedido);
      lab.consulta = { pedido: lectura.pedido, meta: lectura.meta };
      lab.textoEnviado = lectura.fuente;
      lab.datos = modelo(r);
      pintarResultado();
      decir('Propuesta recibida. Es un borrador de la IA: revisala y corregila antes de usarla.');
      $('#lab-res-titulo').focus();
    } catch (err) {
      decir(err.name === 'AbortError' ? 'El servicio tardó demasiado. Probá de nuevo o con un texto más corto.' : err.message);
    } finally { boton.disabled = false; }
  });

  function modelo(r) {
    return {
      titulo: r.titulo || '',
      anticipacion: r.anticipacion || '',
      bloques: (r.bloques || []).map(function (b) {
        return {
          subtitulo: b.subtitulo || '', texto: b.texto || '',
          conceptos: (b.conceptos || []).map(function (c) {
            return { termino: c.termino, busqueda: c.busqueda || c.termino, picto: null, imagen: null, estado: 'pendiente' };
          })
        };
      }),
      vocabulario: (r.vocabulario || []).map(function (v) { return { termino: v.termino, definicion: v.definicion }; }),
      actividades: (r.actividades || []).map(function (a) {
        return { tipo: a.tipo, consigna: a.consigna || '', items: a.items || [], respuesta: a.respuesta || '', pistas: a.pistas || '', acompanado: a.acompanado || '' };
      }),
      notas: r.notas || []
    };
  }

  /* ---------- Controles de edición reutilizables ---------- */
  function campo(contenedor, etiqueta, valor, alCambiar, opciones) {
    opciones = opciones || {};
    var id = uid('c');
    var caja = crear('div', 'lab-campo');
    var l = crear('label', 'etiqueta', etiqueta);
    l.htmlFor = id;
    var c = document.createElement(opciones.linea ? 'input' : 'textarea');
    if (opciones.linea) c.type = 'text'; else c.rows = opciones.filas || 3;
    c.id = id; c.value = valor || '';
    if (opciones.ayuda) {
      var idAyuda = uid('a');
      var ayuda = crear('p', 'ayuda', opciones.ayuda);
      ayuda.id = idAyuda;
      c.setAttribute('aria-describedby', idAyuda);
      caja.append(l, ayuda, c);
    } else { caja.append(l, c); }
    c.addEventListener('input', function () { alCambiar(c.value); });
    contenedor.appendChild(caja);
    return c;
  }

  function seccion(titulo, intro) {
    var s = crear('section', 'lab-seccion');
    var h = crear('h4', null, titulo);
    var id = uid('t');
    h.id = id; h.tabIndex = -1;
    s.setAttribute('aria-labelledby', id);
    s.appendChild(h);
    if (intro) s.appendChild(crear('p', null, intro));
    return { nodo: s, titulo: h };
  }

  /* ---------- Resultado ---------- */
  function pintarResultado() {
    var d = lab.datos;
    resultado.hidden = false;
    resultado.replaceChildren();
    var h = crear('h4', null, 'Propuesta de la IA para revisar');
    h.id = 'lab-res-titulo'; h.tabIndex = -1;
    resultado.appendChild(h);
    var aviso = crear('div', 'aviso');
    aviso.appendChild(crear('p', null, 'Este es un borrador generado por IA. Puede cambiar datos, perder ideas o equivocarse. Compará con el texto original, corregí lo que haga falta y recién después aprobalo. Todo lo que ves se puede editar.'));
    resultado.appendChild(aviso);

    // Título y explicación
    var s1 = seccion('Explicación accesible');
    campo(s1.nodo, 'Título del material', d.titulo, function (v) { d.titulo = v; }, { linea: true });
    if (d.anticipacion || (lab.consulta.pedido.apoyos.indexOf('anticipacion') !== -1)) {
      campo(s1.nodo, 'Qué vamos a aprender', d.anticipacion, function (v) { d.anticipacion = v; }, { filas: 3 });
    }
    d.bloques.forEach(function (b, i) { s1.nodo.appendChild(pintarBloque(b, i)); });
    resultado.appendChild(s1.nodo);

    // Pictogramas
    if (lab.consulta.pedido.apoyos.indexOf('pictogramas') !== -1) resultado.appendChild(panelBusquedaPictos());

    // Vocabulario
    if (lab.consulta.pedido.apoyos.indexOf('glosario') !== -1 || d.vocabulario.length) resultado.appendChild(pintarVocabulario());

    // Actividades
    resultado.appendChild(pintarActividades());

    // Notas
    if (d.notas.length) {
      var sn = seccion('Notas de la IA para el docente', 'La IA señaló estos puntos para que los verifiques.');
      var ul = crear('ul');
      d.notas.forEach(function (n) { ul.appendChild(crear('li', null, n)); });
      sn.nodo.appendChild(ul);
      resultado.appendChild(sn.nodo);
    }

    resultado.appendChild(pintarAprobacion());
    actualizarAvisoPictos();
  }

  /* Sube o baja un elemento de una lista del modelo y vuelve a dibujar, conservando las opciones de salida. */
  function mover(lista, i, paso, nombre, clase) {
    var j = i + paso;
    if (j < 0 || j >= lista.length) return;
    var guardado = {};
    todos('#lab-aprobacion input').forEach(function (x) { guardado[x.id || (x.name + '=' + x.value)] = x.checked; });
    var tmp = lista[i]; lista[i] = lista[j]; lista[j] = tmp;
    pintarResultado();
    todos('#lab-aprobacion input').forEach(function (x) { var k = x.id || (x.name + '=' + x.value); if (k in guardado) x.checked = guardado[k]; });
    var destino = todos('.' + clase)[j];
    var boton = destino && destino.querySelector('.lab-mover[data-paso="' + paso + '"]');
    if (destino && (!boton || boton.disabled)) boton = destino.querySelector('.lab-mover:not([disabled])');
    if (boton) boton.focus();
    decir(nombre + ' movida a la posición ' + (j + 1) + ' de ' + lista.length + '.');
  }

  function botonesMover(contenedor, lista, i, nombre, clase) {
    var fila = crear('div', 'fila-botones');
    [[-1, 'Subir'], [1, 'Bajar']].forEach(function (d) {
      var b = crear('button', 'boton lab-mover', d[1]);
      b.type = 'button'; b.dataset.paso = String(d[0]);
      b.setAttribute('aria-label', d[1] + ' ' + nombre.toLowerCase() + ' ' + (i + 1));
      if ((d[0] < 0 && i === 0) || (d[0] > 0 && i === lista.length - 1)) b.disabled = true;
      b.addEventListener('click', function () { mover(lista, i, d[0], nombre, clase); });
      fila.appendChild(b);
    });
    contenedor.appendChild(fila);
  }

  function pintarBloque(b, i) {
    var f = crear('fieldset', 'lab-bloque');
    f.appendChild(crear('legend', null, 'Parte ' + (i + 1)));
    botonesMover(f, lab.datos.bloques, i, 'Parte', 'lab-bloque');
    campo(f, 'Subtítulo', b.subtitulo, function (v) { b.subtitulo = v; }, { linea: true });
    campo(f, 'Texto', b.texto, function (v) { b.texto = v; }, { filas: 5 });
    if (lab.consulta.pedido.apoyos.indexOf('pictogramas') !== -1) {
      var cab = crear('p', 'lab-conceptos__titulo');
      cab.appendChild(crear('strong', null, 'Pictogramas de esta parte'));
      f.appendChild(cab);
      var ul = crear('ul', 'lab-conceptos');
      ul.setAttribute('aria-label', 'Pictogramas de la parte ' + (i + 1));
      b.conceptos.forEach(function (c) { ul.appendChild(pintarConcepto(b, c, i)); });
      f.appendChild(ul);
      var agregar = crear('button', 'boton', 'Agregar un apoyo visual a la parte ' + (i + 1));
      agregar.type = 'button';
      agregar.addEventListener('click', function () { agregarConcepto(b, ul, i, agregar); });
      f.appendChild(agregar);
    }
    return f;
  }

  /* ---------- Pictogramas ---------- */
  function pintarConcepto(bloque, c, iBloque) {
    var li = crear('li', 'lab-concepto');
    refrescarConcepto(li, bloque, c, iBloque);
    return li;
  }

  function refrescarConcepto(li, bloque, c, iBloque) {
    li.replaceChildren();
    var fig = crear('figure', 'lab-picto');
    if (c.imagen) {
      var foto = document.createElement('img');
      foto.src = c.imagen.url;
      foto.alt = 'Foto: ' + (c.termino || c.imagen.titulo);
      foto.loading = 'lazy';
      foto.addEventListener('error', function () {
        fig.replaceChildren(crear('span', 'lab-picto__vacio', 'No se pudo cargar la imagen. Revisá tu conexión.'));
      });
      fig.appendChild(foto);
      fig.appendChild(crear('figcaption', 'lab-picto__credito', c.imagen.autor + ' · ' + c.imagen.licencia));
    } else if (c.picto) {
      var img = document.createElement('img');
      img.src = Pictos.url(c.picto.id, 300);
      img.alt = 'Pictograma: ' + (c.termino || c.picto.palabra);
      img.width = 300; img.height = 300; img.loading = 'lazy';
      img.addEventListener('error', function () {
        fig.replaceChildren(crear('span', 'lab-picto__vacio', 'No se pudo cargar la imagen. Revisá tu conexión.'));
      });
      fig.appendChild(img);
    } else {
      fig.appendChild(crear('span', 'lab-picto__vacio',
        c.estado === 'pendiente' ? 'Todavía sin buscar' : 'Sin pictograma (solo texto)'));
    }
    li.appendChild(fig);
    var datos = crear('div', 'lab-concepto__datos');
    campo(datos, 'Palabra que acompaña al pictograma', c.termino, function (v) {
      c.termino = v;
      var im = li.querySelector('img');
      if (im) im.alt = (c.imagen ? 'Foto: ' + (v || c.imagen.titulo) : 'Pictograma: ' + (v || c.picto.palabra));
    }, { linea: true });
    var acciones = crear('div', 'fila-botones');
    var tiene = !!(c.picto || c.imagen);
    var cambiar = crear('button', 'boton', tiene ? 'Cambiar apoyo visual' : 'Elegir apoyo visual');
    cambiar.type = 'button';
    cambiar.setAttribute('aria-label', (tiene ? 'Cambiar apoyo visual de «' : 'Elegir apoyo visual para «') + (c.termino || 'esta palabra') + '»');
    cambiar.addEventListener('click', function () { elegirPara(c, li, bloque, iBloque, cambiar); });
    var quitar = crear('button', 'boton', 'Eliminar palabra');
    quitar.type = 'button';
    quitar.setAttribute('aria-label', 'Eliminar palabra «' + (c.termino || 'sin nombre') + '»');
    quitar.addEventListener('click', function () {
      var pos = bloque.conceptos.indexOf(c);
      if (pos !== -1) bloque.conceptos.splice(pos, 1);
      var lista = li.parentNode;
      li.remove();
      actualizarAvisoPictos();
      decir('Se eliminó la palabra «' + (c.termino || 'sin nombre') + '».');
      var foco = lista.querySelector('button') || lista.parentNode.querySelector('button');
      if (foco) foco.focus();
    });
    acciones.append(cambiar, quitar);
    datos.appendChild(acciones);
    li.appendChild(datos);
  }

  function aplicar(c, r) {
    if (r.tipo === 'imagen') { c.imagen = r.imagen; c.picto = null; }
    else { c.picto = { id: r.id, palabra: r.palabra }; c.imagen = null; }
  }

  async function elegirPara(c, li, bloque, iBloque, desde) {
    var r = await Pictos.elegir({ termino: c.termino, busqueda: c.busqueda || c.termino, desde: desde, modo: c.imagen ? 'imagen' : 'pictograma' });
    if (r === undefined) return;
    if (r === null) {
      c.picto = null; c.imagen = null; c.estado = 'sin';
      decir('Se dejó «' + (c.termino || 'la palabra') + '» solo con texto.');
    } else {
      aplicar(c, r);
      c.estado = 'ok';
      if (!c.termino) c.termino = r.palabra;
      decir((c.imagen ? 'Foto elegida' : 'Pictograma elegido') + ' para «' + c.termino + '».');
    }
    refrescarConcepto(li, bloque, c, iBloque);
    actualizarAvisoPictos();
    var nuevo = li.querySelector('button');
    if (nuevo) nuevo.focus();
  }

  async function agregarConcepto(bloque, ul, iBloque, desde) {
    var r = await Pictos.elegir({ termino: '', busqueda: '', desde: desde, sinQuitar: true });
    if (!r) return;
    var c = { termino: r.palabra, busqueda: r.buscado || r.palabra, picto: null, imagen: null, estado: 'ok' };
    aplicar(c, r);
    bloque.conceptos.push(c);
    var li = pintarConcepto(bloque, c, iBloque);
    ul.appendChild(li);
    decir('Se agregó el apoyo visual «' + c.termino + '».');
    var foco = li.querySelector('input');
    if (foco) foco.focus();
    actualizarAvisoPictos();
  }

  function pendientes() {
    var lista = [];
    lab.datos.bloques.forEach(function (b) {
      b.conceptos.forEach(function (c) { if (c.estado === 'pendiente' && c.busqueda) lista.push(c); });
    });
    return lista;
  }

  function panelBusquedaPictos() {
    var s = seccion('Pictogramas de ARASAAC');
    s.nodo.id = 'lab-panel-pictos';
    var aviso = crear('div', 'aviso');
    var p = crear('p');
    p.appendChild(crear('strong', null, 'Antes de buscar: '));
    p.appendChild(document.createTextNode('se enviarán a ARASAAC, una por una, solo estas palabras (no el texto del material):'));
    aviso.appendChild(p);
    var palabras = crear('p', 'lab-palabras');
    palabras.id = 'lab-palabras-pictos';
    aviso.appendChild(palabras);
    s.nodo.appendChild(aviso);
    s.nodo.appendChild(crear('p', null, 'ARASAAC propone el pictograma que mejor coincide con cada palabra. Después podés cambiar cualquiera y ver otras opciones por su significado. Si no hay uno que coincida, queda solo el texto.'));
    var fila = crear('div', 'fila-botones');
    var buscar = crear('button', 'boton boton--principal', 'Buscar pictogramas en ARASAAC');
    buscar.type = 'button'; buscar.id = 'lab-buscar-pictos';
    var detener = crear('button', 'boton', 'Detener la búsqueda');
    detener.type = 'button'; detener.id = 'lab-detener-pictos'; detener.hidden = true;
    fila.append(buscar, detener);
    s.nodo.appendChild(fila);
    buscar.addEventListener('click', buscarTodos);
    detener.addEventListener('click', function () { if (lab.busqueda) lab.busqueda.abort(); });
    return s.nodo;
  }

  function actualizarAvisoPictos() {
    var cont = document.getElementById('lab-palabras-pictos');
    var boton = document.getElementById('lab-buscar-pictos');
    if (!cont || !lab.datos) return;
    var unicas = [];
    pendientes().forEach(function (c) { if (unicas.indexOf(c.busqueda) === -1) unicas.push(c.busqueda); });
    cont.textContent = unicas.length ? unicas.join(', ') : 'No quedan palabras por buscar.';
    boton.disabled = !unicas.length || !!lab.busqueda;
  }

  async function buscarTodos() {
    var cola = [];
    var vistas = {};
    pendientes().forEach(function (c) {
      var n = Pictos.normalizar(c.busqueda);
      if (!vistas[n]) { vistas[n] = true; cola.push(c.busqueda); }
    });
    if (!cola.length) return;
    var total = cola.length;
    var hechas = 0;
    var cortado = false;
    lab.busqueda = new AbortController();
    var senal = lab.busqueda.signal;
    var detener = document.getElementById('lab-detener-pictos');
    document.getElementById('lab-buscar-pictos').disabled = true;
    detener.hidden = false;
    detener.focus();
    decir('Buscando pictogramas: 0 de ' + total + ' palabras.');
    async function trabajador() {
      while (cola.length && !senal.aborted && !cortado) {
        var palabra = cola.shift();
        try { await Pictos.buscar(palabra, senal); } catch (e) {
          if (e.name === 'AbortError') return;
          cortado = true; return;
        }
        hechas += 1;
        if (hechas % 3 === 0 || hechas === total) decir('Buscando pictogramas: ' + hechas + ' de ' + total + ' palabras.');
      }
    }
    await Promise.all([trabajador(), trabajador(), trabajador()]);
    var detenida = senal.aborted;
    lab.busqueda = null;
    detener.hidden = true;

    var asignados = 0, sinResultado = 0;
    lab.datos.bloques.forEach(function (b, i) {
      b.conceptos.forEach(function (c) {
        if (c.estado !== 'pendiente') return;
        var candidatos = Pictos.enCache(c.busqueda);
        if (!candidatos) return; // no llegó a consultarse: sigue pendiente
        var m = Pictos.mejor(candidatos, c.busqueda);
        c.picto = m ? { id: m.id, palabra: m.palabra } : null;
        c.estado = m ? 'ok' : 'sin';
        if (m) asignados++; else sinResultado++;
      });
    });
    // Repintar los conceptos de todas las partes sin perder el foco de la sección
    var bloques = todos('.lab-bloque');
    lab.datos.bloques.forEach(function (b, i) {
      var ul = bloques[i] && bloques[i].querySelector('.lab-conceptos');
      if (!ul) return;
      ul.replaceChildren();
      b.conceptos.forEach(function (c) { ul.appendChild(pintarConcepto(b, c, i)); });
    });
    actualizarAvisoPictos();
    var msg = (detenida ? 'Búsqueda detenida. ' : cortado ? 'Se cortó la conexión con ARASAAC. ' : 'Listo. ') +
      'Se ' + (asignados === 1 ? 'asignó 1 pictograma' : 'asignaron ' + asignados + ' pictogramas') +
      (sinResultado ? ' y ' + (sinResultado === 1 ? '1 palabra quedó sin pictograma que coincida' : sinResultado + ' palabras quedaron sin pictograma que coincida') + '; podés buscarlas a mano.' : '.') +
      ' Revisá cada uno: elegí «Cambiar apoyo visual» si no representa bien la idea.';
    decir(msg);
    document.getElementById('lab-buscar-pictos').focus();
  }

  /* ---------- Vocabulario ---------- */
  function pintarVocabulario() {
    var d = lab.datos;
    var s = seccion('Vocabulario', 'Términos del texto con una definición simple. Corregilos o eliminá los que no sirvan.');
    var ul = crear('ul', 'lab-lista');
    function fila(v) {
      var li = crear('li', 'lab-vocab');
      campo(li, 'Término', v.termino, function (x) { v.termino = x; }, { linea: true });
      campo(li, 'Definición', v.definicion, function (x) { v.definicion = x; }, { filas: 2 });
      var b = crear('button', 'boton', 'Eliminar término');
      b.type = 'button';
      b.setAttribute('aria-label', 'Eliminar término «' + (v.termino || 'sin nombre') + '»');
      b.addEventListener('click', function () {
        d.vocabulario.splice(d.vocabulario.indexOf(v), 1);
        li.remove();
        decir('Se eliminó el término.');
        s.titulo.focus();
      });
      li.appendChild(b);
      return li;
    }
    d.vocabulario.forEach(function (v) { ul.appendChild(fila(v)); });
    s.nodo.appendChild(ul);
    var agregar = crear('button', 'boton', 'Agregar un término');
    agregar.type = 'button';
    agregar.addEventListener('click', function () {
      var v = { termino: '', definicion: '' };
      d.vocabulario.push(v);
      var li = fila(v);
      ul.appendChild(li);
      li.querySelector('input').focus();
    });
    s.nodo.appendChild(agregar);
    return s.nodo;
  }

  /* ---------- Actividades ---------- */
  var ROTULOS = {
    opciones: { items: 'Opciones (una por línea)', respuesta: 'Respuesta correcta (igual a una de las opciones)' },
    unir: { items: 'Pares (una línea por par, con el formato: concepto = pareja)', respuesta: null },
    completar: { items: 'Banco de palabras (una por línea)', respuesta: 'Palabras que completan, en orden' },
    ordenar: { items: 'Pasos en el orden correcto (uno por línea; en el archivo aparecen mezclados)', respuesta: null },
    vf: { items: 'Afirmaciones (una por línea)', respuesta: 'Clave de respuestas (por ejemplo: 1 V; 2 F)' },
    breve: { items: null, respuesta: 'Respuesta esperada' },
    expresar: { items: 'Formas posibles de mostrar lo aprendido (una por línea)', respuesta: 'Qué buscar en la producción' }
  };

  function pintarActividades() {
    var d = lab.datos;
    var s = seccion('Actividades', 'Cada actividad tiene la consigna autónoma y, si lo pediste, pistas y un paso a paso con ayuda. El archivo final te deja elegir cuáles incluir.');
    var lista = crear('div', 'lab-actividades');
    function tarjeta(a) {
      var f = crear('fieldset', 'lab-actividad');
      var leyenda = crear('legend');
      leyenda.textContent = 'Actividad: ' + (Exportar.etiquetas[a.tipo] || a.tipo);
      f.appendChild(leyenda);
      botonesMover(f, d.actividades, d.actividades.indexOf(a), 'Actividad', 'lab-actividad');
      var r = ROTULOS[a.tipo] || ROTULOS.breve;
      campo(f, 'Consigna', a.consigna, function (v) { a.consigna = v; }, { filas: 3 });
      if (r.items) campo(f, r.items, (a.items || []).join('\n'), function (v) {
        a.items = v.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
      }, { filas: 5 });
      if (r.respuesta) campo(f, r.respuesta, a.respuesta, function (v) { a.respuesta = v; }, { linea: true });
      else f.appendChild(crear('p', 'ayuda', 'La clave de esta actividad se arma sola a partir de lo que escribas arriba.'));
      var ped = lab.consulta.pedido.niveles;
      if (ped.indexOf('pistas') !== -1 || a.pistas) campo(f, 'Pistas graduales (una por línea)', a.pistas, function (v) { a.pistas = v; }, { filas: 3 });
      if (ped.indexOf('acompanado') !== -1 || a.acompanado) campo(f, 'Paso a paso con ayuda y ejemplo resuelto', a.acompanado, function (v) { a.acompanado = v; }, { filas: 4 });
      var b = crear('button', 'boton', 'Eliminar esta actividad');
      b.type = 'button';
      b.setAttribute('aria-label', 'Eliminar esta actividad: ' + (Exportar.etiquetas[a.tipo] || a.tipo));
      b.addEventListener('click', function () {
        d.actividades.splice(d.actividades.indexOf(a), 1);
        f.remove();
        decir('Se eliminó la actividad.');
        s.titulo.focus();
      });
      f.appendChild(b);
      return f;
    }
    d.actividades.forEach(function (a) { lista.appendChild(tarjeta(a)); });
    s.nodo.appendChild(lista);
    return s.nodo;
  }

  function validarActividades() {
    var msgs = [];
    lab.datos.actividades.forEach(function (a, i) {
      var n = 'Actividad ' + (i + 1) + ' (' + (Exportar.etiquetas[a.tipo] || a.tipo) + '): ';
      var items = a.items || [];
      if (!a.consigna.trim()) msgs.push(n + 'falta la consigna.');
      if (a.tipo === 'opciones') {
        if (items.length < 2) msgs.push(n + 'escribí al menos dos opciones.');
        else if (!items.some(function (x) { return x.toLowerCase() === a.respuesta.trim().toLowerCase(); })) msgs.push(n + 'la respuesta correcta debe ser igual a una de las opciones.');
      } else if (a.tipo === 'unir') {
        if (items.some(function (x) { var p = x.split('='); return p.length !== 2 || !p[0].trim() || !p[1].trim(); })) msgs.push(n + 'cada línea debe tener el formato concepto = pareja.');
        else if (items.length < 2) msgs.push(n + 'escribí al menos dos pares.');
      } else if (a.tipo === 'ordenar' && items.length < 3) msgs.push(n + 'escribí al menos tres pasos.');
      else if (a.tipo === 'completar') {
        if (items.length < 2) msgs.push(n + 'el banco necesita al menos dos palabras.');
        if (a.consigna.indexOf('___') === -1) msgs.push(n + 'la consigna debe tener espacios para completar, escritos como ___.');
      } else if ((a.tipo === 'vf' || a.tipo === 'expresar') && items.length < 2) msgs.push(n + 'escribí al menos dos líneas.');
      if (['opciones', 'completar', 'vf', 'breve', 'expresar'].indexOf(a.tipo) !== -1 && !a.respuesta.trim()) msgs.push(n + 'falta la respuesta o la clave.');
    });
    return msgs;
  }

  /* ---------- Aprobación y salida ---------- */
  function pintarAprobacion() {
    var s = seccion('Aprobación y archivo');
    s.nodo.id = 'lab-aprobacion';
    var ped = lab.consulta.pedido;
    var inc = crear('fieldset', 'lab-incluir');
    inc.appendChild(crear('legend', null, 'Qué incluir en el archivo'));
    function casilla(id, etiqueta, marcado) {
      var l = crear('label', 'ia-consentimiento');
      var c = document.createElement('input');
      c.type = 'checkbox'; c.id = id; c.checked = marcado;
      l.append(c, document.createTextNode(' ' + etiqueta));
      inc.appendChild(l);
    }
    casilla('lab-inc-pistas', 'Pistas graduales', ped.niveles.indexOf('pistas') !== -1);
    casilla('lab-inc-acomp', 'Paso a paso con ayuda', ped.niveles.indexOf('acompanado') !== -1);
    casilla('lab-inc-clave', 'Respuestas esperadas y notas, en una página aparte para el docente', true);
    s.nodo.appendChild(inc);
    var dist = crear('fieldset', 'lab-incluir');
    dist.appendChild(crear('legend', null, 'Distribución del archivo'));
    function opciones(nombre, titulo, lista, defecto) {
      var g = crear('fieldset', 'lab-subgrupo');
      g.appendChild(crear('legend', null, titulo));
      lista.forEach(function (o) {
        var l = crear('label', 'lab-opcion');
        var r = document.createElement('input');
        r.type = 'radio'; r.name = nombre; r.value = o[0]; r.checked = o[0] === defecto;
        l.append(r, document.createTextNode(' ' + o[1]));
        g.appendChild(l);
      });
      dist.appendChild(g);
    }
    opciones('lab-dist-picto', 'Tamaño de los apoyos visuales', [['p', 'Pequeño'], ['m', 'Mediano'], ['g', 'Grande']], 'm');
    opciones('lab-dist-letra', 'Tamaño de la letra', [['n', 'Normal'], ['g', 'Grande'], ['mg', 'Muy grande']], 'n');
    var salto = crear('label', 'ia-consentimiento');
    var cSalto = document.createElement('input');
    cSalto.type = 'checkbox'; cSalto.id = 'lab-dist-salto';
    salto.append(cSalto, document.createTextNode(' Cada actividad en una página nueva'));
    dist.appendChild(salto);
    s.nodo.appendChild(dist);
    var apr = crear('label', 'ia-consentimiento');
    var chk = document.createElement('input');
    chk.type = 'checkbox'; chk.id = 'lab-aprobado';
    apr.append(chk, document.createTextNode(' Soy docente y revisé la explicación, los pictogramas y las actividades. Conservan el contenido del texto original y no tienen errores.'));
    s.nodo.appendChild(apr);
    var fila = crear('div', 'fila-botones');
    var prev = crear('button', 'boton', 'Ver vista previa');
    var word = crear('button', 'boton boton--principal', 'Descargar en Word editable (.docx)');
    var desc = crear('button', 'boton', 'Descargar el material (.html)');
    var imp = crear('button', 'boton', 'Imprimir o guardar como PDF');
    [prev, word, desc, imp].forEach(function (b) { b.type = 'button'; });
    fila.append(prev, word, desc, imp);
    s.nodo.appendChild(fila);
    var vista = crear('div', 'lab-vista');
    vista.id = 'lab-vista'; vista.hidden = true;
    s.nodo.appendChild(vista);
    prev.addEventListener('click', function () { vistaPrevia(vista, prev); });
    word.addEventListener('click', function () { exportar('word', word); });
    desc.addEventListener('click', function () { exportar('descargar', desc); });
    imp.addEventListener('click', function () { exportar('imprimir', imp); });
    return s.nodo;
  }

  function opcionesSalida(borrador) {
    return {
      pistas: !!document.getElementById('lab-inc-pistas').checked,
      acompanado: !!document.getElementById('lab-inc-acomp').checked,
      clave: !!document.getElementById('lab-inc-clave').checked,
      tamPicto: (document.querySelector('input[name="lab-dist-picto"]:checked') || {}).value || 'm',
      letra: (document.querySelector('input[name="lab-dist-letra"]:checked') || {}).value || 'n',
      salto: !!document.getElementById('lab-dist-salto').checked,
      borrador: !!borrador
    };
  }

  function vistaPrevia(cont, boton) {
    var avisos = validarActividades();
    if (avisos.length) { decir('Antes de ver la vista previa: ' + avisos.join(' ')); return; }
    var html = Exportar.construirHTML(lab.datos, lab.consulta.meta, opcionesSalida(true), {});
    cont.replaceChildren();
    var marco = document.createElement('iframe');
    marco.title = 'Vista previa del material (borrador, sin aprobar)';
    marco.setAttribute('sandbox', '');
    marco.srcdoc = html;
    cont.appendChild(marco);
    cont.hidden = false;
    decir('Vista previa actualizada. Es un borrador; para descargarlo marcá la aprobación docente.');
    boton.focus();
  }

  async function exportar(accion, boton) {
    if (!document.getElementById('lab-aprobado').checked) {
      decir('Para descargar o imprimir, un docente debe revisar y marcar la aprobación.');
      document.getElementById('lab-aprobado').focus();
      return;
    }
    var avisos = validarActividades();
    if (avisos.length) { decir('Corregí esto antes de continuar: ' + avisos.join(' ')); return; }
    var etiqueta = boton.textContent;
    boton.disabled = true;
    boton.textContent = 'Preparando…';
    try {
      if (accion === 'word') {
        var w = await window.BermejoLabWord.traerBytes(lab.datos);
        var blob = await window.BermejoLabWord.construir(lab.datos, lab.consulta.meta, opcionesSalida(false), w.bytes);
        var urlW = URL.createObjectURL(blob);
        var aW = document.createElement('a');
        aW.href = urlW; aW.download = 'adaptacion-bermejo-accesible.docx';
        document.body.appendChild(aW); aW.click(); aW.remove();
        setTimeout(function () { URL.revokeObjectURL(urlW); }, 30000);
        decir('Se descargó adaptacion-bermejo-accesible.docx. Podés editarlo en Word, LibreOffice o Google Docs.' +
          (w.faltan ? ' Algunos pictogramas no se pudieron traer y quedaron afuera.' : ''));
        return;
      }
      var inc = await Exportar.incrustarImagenes(lab.datos);
      var html = Exportar.construirHTML(lab.datos, lab.consulta.meta, opcionesSalida(false), inc.imagenes);
      var aviso = inc.faltan ? ' Algunos pictogramas no se pudieron guardar dentro del archivo y necesitarán internet para verse.' : '';
      if (accion === 'descargar') {
        var url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
        var a = document.createElement('a');
        a.href = url; a.download = 'adaptacion-bermejo-accesible.html';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
        decir('Se descargó adaptacion-bermejo-accesible.html. Abrilo con el navegador; desde allí también podés imprimirlo o guardarlo como PDF.' + aviso);
      } else {
        await imprimir(html);
        decir('Se abrió el cuadro de impresión. Elegí «Guardar como PDF» si querés un archivo.' + aviso);
      }
    } catch (e) {
      decir('No se pudo preparar el archivo. Probá de nuevo.');
    } finally {
      boton.disabled = false;
      boton.textContent = etiqueta;
      boton.focus();
    }
  }

  function imprimir(html) {
    return new Promise(function (resolver) {
      var marco = document.createElement('iframe');
      marco.setAttribute('aria-hidden', 'true');
      marco.tabIndex = -1;
      marco.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
      marco.onload = function () {
        var w = marco.contentWindow;
        var imgs = Array.prototype.slice.call(w.document.images);
        var listas = Promise.all(imgs.map(function (im) {
          return im.complete ? Promise.resolve() : new Promise(function (ok) { im.onload = im.onerror = ok; });
        }));
        Promise.race([listas, new Promise(function (ok) { setTimeout(ok, 8000); })]).then(function () {
          w.focus(); w.print();
          setTimeout(function () { marco.remove(); }, 60000);
          resolver();
        });
      };
      marco.srcdoc = html;
      document.body.appendChild(marco);
    });
  }

  /* ---------- Cambios en el material ---------- */
  function reiniciar() {
    if (lab.busqueda) lab.busqueda.abort();
    lab.datos = null; lab.consulta = null; lab.textoEnviado = '';
    resultado.hidden = true; resultado.replaceChildren();
    $('#lab-consentimiento').checked = false;
    ocultarErrores();
    estado.textContent = '';
  }
  document.addEventListener('bermejo:material-nuevo', reiniciar);
  var avisoCambio = false;
  texto.addEventListener('input', function () {
    if (lab.datos && texto.value.trim() !== lab.textoEnviado) {
      if (!avisoCambio) decir('El contenido cambió después de generar la propuesta. Generá una nueva para que coincida.');
      avisoCambio = true;
    } else { avisoCambio = false; }
  });
})();
