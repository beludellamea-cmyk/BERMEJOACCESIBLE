/* Pictogramas de ARASAAC: búsqueda por significado y selector manual.
   Usa la API oficial (api.arasaac.org). Solo se envía la palabra que se busca;
   nunca el texto del material. Cada búsqueda es una acción de la persona que usa la página.
   Pictogramas: Sergio Palao. Origen: ARASAAC (https://arasaac.org). Licencia CC BY-NC-SA. Propiedad: Gobierno de Aragón (España). */
(function () {
  'use strict';

  var API = 'https://api.arasaac.org/v1/pictograms/es/search/';
  var IMAGENES = 'https://static.arasaac.org/pictograms/';
  var MAX_MOSTRADOS = 24;
  var cache = new Map();

  function normalizar(t) {
    return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  function url(id, tam) {
    return IMAGENES + id + '/' + id + '_' + (tam || 300) + '.png';
  }

  /* Devuelve candidatos {id, palabra, definicion, sensible} en el orden de relevancia de ARASAAC. */
  async function buscar(termino, senal) {
    var clave = normalizar(termino);
    if (!clave) return [];
    if (cache.has(clave)) return cache.get(clave);
    var r = await fetch(API + encodeURIComponent(String(termino).trim()), { signal: senal });
    if (r.status === 404) { cache.set(clave, []); return []; }
    if (!r.ok) throw new Error('arasaac');
    var datos = await r.json();
    var lista = (Array.isArray(datos) ? datos : []).filter(function (p) { return p && Number.isInteger(p._id); }).map(function (p) {
      var k = (p.keywords && p.keywords[0]) || {};
      return {
        id: p._id,
        palabra: k.keyword || String(termino).trim(),
        definicion: k.meaning ? String(k.meaning).trim() : '',
        claves: (p.keywords || []).reduce(function (a, x) {
          if (x.keyword) a.push(normalizar(x.keyword));
          if (x.plural) a.push(normalizar(x.plural));
          return a;
        }, []),
        sensible: !!(p.sex || p.violence)
      };
    });
    cache.set(clave, lista);
    return lista;
  }

  /* ---------- Fotos reales (Wikimedia Commons) ----------
     Solo se aceptan archivos con licencia libre (CC BY, CC BY-SA, CC0, dominio público).
     Se guarda autor, licencia y enlace para dar el crédito en el material. */
  var COMMONS = 'https://commons.wikimedia.org/w/api.php';
  var cacheFotos = new Map();
  var LICENCIA_LIBRE = /^(cc[ -]?by(?![ -]?(nc|nd))|cc[ -]?0|cc zero|public domain|dominio p|pd\b)/i;

  function textoPlano(html) {
    var d = new DOMParser().parseFromString(String(html || ''), 'text/html');
    return (d.body.textContent || '').replace(/\s+/g, ' ').trim();
  }

  async function buscarFotos(termino, senal) {
    var clave = normalizar(termino);
    if (!clave) return [];
    if (cacheFotos.has(clave)) return cacheFotos.get(clave);
    var q = new URLSearchParams({
      action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: String(termino).trim() + ' filetype:bitmap',
      gsrlimit: '30', prop: 'imageinfo', iiprop: 'url|extmetadata|mime|size', iiurlwidth: '400', format: 'json', origin: '*', uselang: 'es'
    });
    var r = await fetch(COMMONS + '?' + q.toString(), { signal: senal });
    if (!r.ok) throw new Error('commons');
    var datos = await r.json();
    var paginas = datos && datos.query && datos.query.pages ? Object.keys(datos.query.pages).map(function (k) { return datos.query.pages[k]; }) : [];
    paginas.sort(function (a, b) { return (a.index || 0) - (b.index || 0); });
    var lista = [];
    paginas.forEach(function (pg) {
      var i = pg.imageinfo && pg.imageinfo[0];
      if (!i || !i.thumburl || !/^image\/(jpeg|png|webp)$/.test(i.mime || '')) return;
      var m = i.extmetadata || {};
      var licencia = textoPlano(m.LicenseShortName && m.LicenseShortName.value);
      if (!LICENCIA_LIBRE.test(licencia)) return;
      lista.push({
        tipo: 'imagen',
        id: pg.pageid,
        palabra: String(pg.title || '').replace(/^(File|Archivo):/i, '').replace(/\.[a-z0-9]+$/i, '').slice(0, 80),
        definicion: [textoPlano(m.Artist && m.Artist.value).slice(0, 60), licencia].filter(Boolean).join(' · '),
        sensible: false,
        imagen: {
          url: i.thumburl, ancho: i.thumbwidth || 400, alto: i.thumbheight || 300, mime: i.mime,
          titulo: String(pg.title || '').replace(/^(File|Archivo):/i, ''), autor: textoPlano(m.Artist && m.Artist.value) || 'Autor no indicado',
          licencia: licencia, pagina: i.descriptionurl || ''
        }
      });
    });
    cacheFotos.set(clave, lista);
    return lista;
  }

  function enCache(termino) {
    var c = cache.get(normalizar(termino));
    return c || null;
  }

  /* Elige automáticamente: primero un pictograma cuya palabra coincide exactamente; si no, ninguno.
     Nunca se elige solo uno de contenido sexual o violento. */
  function mejor(candidatos, termino) {
    var n = normalizar(termino);
    var aptos = (candidatos || []).filter(function (c) { return !c.sensible; });
    for (var i = 0; i < aptos.length; i++) {
      if (aptos[i].claves.indexOf(n) !== -1) return aptos[i];
    }
    return null;
  }

  function crear(tag, clase, texto) {
    var e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  }

  /* ---------- Selector manual (diálogo) ---------- */
  var dlg = null;
  var ref = {};
  var resolver = null;
  var devolverFoco = null;
  var seleccion = null;
  var candidatosActuales = [];
  var solicitud = null;

  function construir() {
    if (dlg) return;
    dlg = document.createElement('dialog');
    dlg.className = 'picto-selector';
    dlg.setAttribute('aria-labelledby', 'picto-sel-titulo');

    var titulo = crear('h2', null, 'Elegir pictograma');
    titulo.id = 'picto-sel-titulo';
    ref.titulo = titulo;

    var aviso = crear('p', 'aviso');
    aviso.appendChild(crear('strong', null, 'Antes de buscar: '));
    aviso.appendChild(document.createTextNode('se envía al servicio elegido solo la palabra que escribas (no el texto del material): ARASAAC para pictogramas, Wikimedia Commons para fotos. Las imágenes se cargan desde sus servidores.'));
    ref.aviso = aviso;

    var tipos = crear('fieldset', 'picto-sel__tipo');
    tipos.appendChild(crear('legend', null, 'Tipo de apoyo visual'));
    var rP = document.createElement('input'); rP.type = 'radio'; rP.name = 'picto-sel-tipo'; rP.value = 'pictograma'; rP.checked = true;
    var rF = document.createElement('input'); rF.type = 'radio'; rF.name = 'picto-sel-tipo'; rF.value = 'imagen';
    var lP = crear('label', 'lab-opcion'); lP.append(rP, document.createTextNode(' Pictogramas de ARASAAC'));
    var lF = crear('label', 'lab-opcion'); lF.append(rF, document.createTextNode(' Fotos reales (Wikimedia Commons, licencia libre)'));
    tipos.append(lP, lF);
    ref.tipoP = rP; ref.tipoF = rF;

    var fila = crear('div', 'picto-sel__busqueda');
    var divCampo = document.createElement('div');
    var etq = crear('label', 'etiqueta', 'Palabra o idea a buscar');
    etq.htmlFor = 'picto-sel-q';
    var q = document.createElement('input');
    // type=text (no search): en type=search, Esc borra el campo en vez de cerrar el diálogo.
    q.type = 'text'; q.id = 'picto-sel-q'; q.maxLength = 40; q.autocomplete = 'off'; q.setAttribute('enterkeyhint', 'search');
    divCampo.append(etq, q);
    var bBuscar = crear('button', 'boton boton--principal', 'Buscar');
    bBuscar.type = 'button';
    fila.append(divCampo, bBuscar);

    var sens = crear('label', 'ia-consentimiento picto-sel__sensible');
    var cSens = document.createElement('input');
    cSens.type = 'checkbox';
    sens.append(cSens, document.createTextNode(' Incluir pictogramas con contenido sexual o violento (por ejemplo, para ESI o Historia).'));

    var estado = crear('p', 'picto-sel__estado');
    estado.setAttribute('role', 'status'); estado.setAttribute('aria-live', 'polite');

    var campo = crear('fieldset', 'picto-sel__lista');
    var leyenda = crear('legend', null, 'Pictogramas encontrados');
    var grilla = crear('div', 'picto-sel__grilla');
    campo.append(leyenda, grilla);

    var acciones = crear('div', 'fila-botones');
    var bUsar = crear('button', 'boton boton--principal', 'Usar el pictograma elegido');
    var bQuitar = crear('button', 'boton', 'Dejar solo el texto (sin pictograma)');
    var bCancelar = crear('button', 'boton', 'Cancelar');
    [bUsar, bQuitar, bCancelar].forEach(function (b) { b.type = 'button'; });
    acciones.append(bUsar, bQuitar, bCancelar);

    var credito = crear('p', 'credito');
    ref.credito = credito;
    credito.append('Pictogramas: Sergio Palao. Origen: ');
    var enlace = crear('a', null, 'ARASAAC'); enlace.href = 'https://arasaac.org';
    credito.append(enlace, '. Licencia: CC BY-NC-SA. Propiedad: Gobierno de Aragón (España).');

    dlg.append(titulo, aviso, tipos, fila, sens, estado, campo, acciones, credito);
    document.body.appendChild(dlg);
    ref.q = q; ref.buscar = bBuscar; ref.sensibles = cSens; ref.estado = estado; ref.grilla = grilla;
    ref.usar = bUsar; ref.quitar = bQuitar; ref.cancelar = bCancelar;

    function cambioTipo() {
      var foto = ref.tipoF.checked;
      ref.sensibles.parentNode.hidden = foto;
      ref.credito.hidden = foto;
      candidatosActuales = []; seleccion = null; ref.grilla.replaceChildren();
      var inicial = ref.q.value.trim();
      var previos = inicial ? (foto ? cacheFotos.get(normalizar(inicial)) : enCache(inicial)) : null;
      if (previos) { candidatosActuales = previos; pintar(previos, inicial); }
      else ref.estado.textContent = foto ? 'Escribí una palabra y tocá «Buscar» para pedir fotos a Wikimedia Commons.' : 'Escribí una palabra y tocá «Buscar» para pedir pictogramas a ARASAAC.';
    }
    rP.addEventListener('change', cambioTipo);
    rF.addEventListener('change', cambioTipo);
    bBuscar.addEventListener('click', buscarEnSelector);
    q.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); buscarEnSelector(); } });
    cSens.addEventListener('change', function () { pintar(candidatosActuales, q.value); });
    bUsar.addEventListener('click', function () {
      if (!seleccion) { ref.estado.textContent = 'Primero elegí un pictograma de la lista.'; return; }
      if (seleccion.tipo === 'imagen') cerrar({ tipo: 'imagen', imagen: seleccion.imagen, palabra: seleccion.palabra, buscado: ref.q.value.trim() });
      else cerrar({ tipo: 'pictograma', id: seleccion.id, palabra: seleccion.palabra, buscado: ref.q.value.trim() });
    });
    bQuitar.addEventListener('click', function () { cerrar(null); });
    bCancelar.addEventListener('click', function () { cerrar(undefined); });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); cerrar(undefined); });
  }

  function cerrar(resultado) {
    if (solicitud) { solicitud.abort(); solicitud = null; }
    if (dlg.open) dlg.close();
    var r = resolver; resolver = null;
    if (devolverFoco && document.contains(devolverFoco)) devolverFoco.focus();
    devolverFoco = null;
    if (r) r(resultado);
  }

  function pintar(lista, termino) {
    ref.grilla.replaceChildren();
    seleccion = null;
    var visibles = lista.filter(function (c) { return ref.sensibles.checked || !c.sensible; });
    var ocultos = lista.length - visibles.length;
    if (!visibles.length) {
      ref.estado.textContent = lista.length
        ? 'No hay pictogramas para «' + termino + '» sin contenido sensible. Podés incluirlos con la casilla de arriba o probar otra palabra.'
        : (ref.tipoF.checked ? 'No encontramos fotos con licencia libre para «' : 'ARASAAC no tiene pictogramas para «') + termino + '». Probá con un sinónimo o una palabra más simple.';
      return;
    }
    var mostrados = visibles.slice(0, MAX_MOSTRADOS);
    ref.estado.textContent = 'Encontramos ' + visibles.length + (ref.tipoF.checked ? (visibles.length === 1 ? ' foto' : ' fotos') : (visibles.length === 1 ? ' pictograma' : ' pictogramas')) +
      ' para «' + termino + '».' + (visibles.length > MAX_MOSTRADOS ? ' Se muestran los primeros ' + MAX_MOSTRADOS + '.' : '') +
      (ocultos ? ' Se ocultaron ' + ocultos + ' de contenido sensible.' : '');
    mostrados.forEach(function (c, i) {
      var etiqueta = crear('label', 'picto-op');
      var radio = document.createElement('input');
      radio.type = 'radio'; radio.name = 'picto-sel'; radio.value = String(c.id);
      var img = document.createElement('img');
      img.src = c.tipo === 'imagen' ? c.imagen.url : url(c.id, 300); img.alt = ''; img.width = 96; img.height = 96; img.loading = 'lazy';
      if (c.tipo === 'imagen') img.style.objectFit = 'cover';
      var texto = crear('span', 'picto-op__texto');
      texto.appendChild(crear('strong', null, c.palabra));
      if (c.definicion) texto.appendChild(crear('span', null, c.definicion.length > 110 ? c.definicion.slice(0, 107) + '…' : c.definicion));
      if (c.sensible) texto.appendChild(crear('span', 'picto-op__marca', 'Contenido sensible'));
      etiqueta.append(radio, img, texto);
      radio.addEventListener('change', function () {
        seleccion = c;
        Array.prototype.forEach.call(ref.grilla.children, function (n) { n.classList.remove('picto-op--elegido'); });
        etiqueta.classList.add('picto-op--elegido');
      });
      ref.grilla.appendChild(etiqueta);
    });
  }

  async function buscarEnSelector() {
    var termino = ref.q.value.trim();
    if (!termino) { ref.estado.textContent = 'Escribí una palabra para buscar.'; ref.q.focus(); return; }
    if (solicitud) solicitud.abort();
    solicitud = new AbortController();
    var propia = solicitud;
    ref.buscar.disabled = true;
    ref.estado.textContent = 'Buscando en ARASAAC…';
    try {
      candidatosActuales = ref.tipoF.checked ? await buscarFotos(termino, propia.signal) : await buscar(termino, propia.signal);
      pintar(candidatosActuales, termino);
    } catch (e) {
      if (e.name === 'AbortError') return;
      candidatosActuales = [];
      ref.grilla.replaceChildren();
      ref.estado.textContent = 'No pudimos conectarnos con ' + (ref.tipoF.checked ? 'Wikimedia Commons' : 'ARASAAC') + '. Revisá tu conexión e intentá de nuevo.';
    } finally {
      if (solicitud === propia) solicitud = null;
      ref.buscar.disabled = false;
    }
  }

  /* opciones: {termino, busqueda, desde (elemento que recupera el foco)}.
     Devuelve una promesa: {id, palabra, buscado} si eligió; null si quitó el pictograma; undefined si canceló. */
  function elegir(opciones) {
    construir();
    if (resolver) cerrar(undefined);
    var inicial = (opciones.busqueda || opciones.termino || '').trim();
    ref.titulo.textContent = opciones.termino ? 'Elegir pictograma para «' + opciones.termino + '»' : 'Agregar un pictograma';
    ref.q.value = inicial;
    ref.sensibles.checked = false;
    ref.grilla.replaceChildren();
    seleccion = null;
    candidatosActuales = [];
    ref.quitar.hidden = !!opciones.sinQuitar;
    ref.tipoP.checked = opciones.modo !== 'imagen'; ref.tipoF.checked = opciones.modo === 'imagen';
    ref.sensibles.parentNode.hidden = ref.tipoF.checked; ref.credito.hidden = ref.tipoF.checked;
    devolverFoco = opciones.desde || document.activeElement;
    // Si esa palabra ya se consultó (con confirmación previa), se muestran sus opciones sin pedir de nuevo.
    var previos = inicial ? (ref.tipoF.checked ? cacheFotos.get(normalizar(inicial)) : enCache(inicial)) : null;
    if (previos) {
      candidatosActuales = previos;
      pintar(previos, inicial);
    } else {
      ref.estado.textContent = inicial ? 'Tocá «Buscar» para consultar a ARASAAC la palabra «' + inicial + '».' : 'Escribí una palabra y tocá «Buscar».';
    }
    return new Promise(function (res) {
      resolver = res;
      dlg.showModal();
      ref.q.focus();
    });
  }

  window.BermejoPictos = { buscar: buscar, mejor: mejor, url: url, elegir: elegir, enCache: enCache, normalizar: normalizar };
})();
