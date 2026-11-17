/* CLARIA · Producción docente directa. La guía actual sigue disponible en claria.js.
   El Worker /docente amplía los resultados cuando se despliegue en Cloudflare. */
(function(){
'use strict';
document.addEventListener('DOMContentLoaded',function(){
  const $=id=>document.getElementById(id);
  const sector=$('claria-docente-rapido'),chat=$('claria-conversacion');
  if(!sector||!chat)return;
  const clase=$('docente-form-clase'),material=$('docente-form-material'),
    salida=$('docente-resultado'),edicion=$('docente-resultado-editar'),visual=$('docente-resultado-visual'),
    mensaje=$('docente-estado'),archivo=$('docente-material-archivo'),archivoEstado=$('docente-archivo-estado'),
    entradaMaterial=$('docente-material-texto'),endpoint=String(window.BERMEJO_CHAT_ENDPOINT||'').replace(/\/$/,'');
  let ocupado=false,modo='texto',tipo='clase',idVisual=0;
  function aviso(t){mensaje.textContent=t;}
  function ocupadoAhora(v,t){
    ocupado=v;archivo.disabled=v;$('docente-clase-generar').disabled=v;$('docente-material-generar').disabled=v;
    if(t)aviso(t);
  }
  function datosPersonales(t){return /[\w.+-]+@[\w-]+\.[\w.-]+|\b(?:dni|documento|tel[eé]fono|celular)\s*[:#]?\s*\d{6,}|\b\d{8,11}\b/i.test(t);}
  function seleccionarRol(){
    const esDocente=$('claria-rol-docente').getAttribute('aria-pressed')==='true';
    sector.hidden=!esDocente;document.body.classList.toggle('claria-modo-docente',esDocente);
    if(!esDocente){chat.hidden=false;document.body.classList.remove('claria-charlando');}
    else if(!document.body.classList.contains('claria-charlando'))chat.hidden=true;
  }
  document.querySelectorAll('.claria-rol').forEach(b=>b.addEventListener('click',function(){
    if(ocupado)return;document.body.classList.remove('claria-charlando');seleccionarRol();
    if(!sector.hidden)sector.scrollIntoView({block:'start',behavior:'auto'});
  }));
  function pestana(nombre){
    if(ocupado)return;
    document.querySelectorAll('[data-docente-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.docenteTab===nombre)));
    clase.hidden=nombre!=='clase';material.hidden=nombre!=='material';
    if(nombre==='dudas'){
      chat.hidden=false;document.body.classList.add('claria-charlando');$('claria-texto').focus({preventScroll:true});
    }else{chat.hidden=true;document.body.classList.remove('claria-charlando');}
    aviso('');
  }
  document.querySelectorAll('[data-docente-tab]').forEach(b=>b.addEventListener('click',()=>pestana(b.dataset.docenteTab)));
  for(const [grado,materia] of [[$('docente-clase-grado'),$('docente-clase-materia')],[$('docente-material-grado'),$('docente-material-materia')]]){
    grado.addEventListener('change',function(){
      const sec=grado.value.includes('año');
      for(const opt of materia.options){
        if(opt.text==='Ciencias Naturales'){opt.hidden=sec;if(sec&&materia.value===opt.value)materia.value='';}
      }
    });
  }
  function obligatorio(campos,permiso){
    for(const campo of campos){if(!campo.value.trim()){campo.focus();aviso('Completá grado, materia y tema o material antes de continuar.');return false;}}
    if(!permiso.checked){permiso.focus();aviso('Confirmá que no incluiste datos personales y autorizás el uso de IA.');return false;}
    return true;
  }
  async function pedir(ruta,contenido,ms=45000){
    if(!endpoint)throw new Error('No hay un servicio de IA configurado.');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),ms);
    try{
      const r=await fetch(endpoint+ruta,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(contenido),signal:controller.signal});
      const j=await r.json().catch(()=>({}));
      if(!r.ok){
        let detalle=typeof j.error==='string'?j.error:'El servicio devolvió un error.';
        if(/^(La IA no respondió|El servicio de IA no respondió)/i.test(detalle)){
          detalle='Gemini no pudo generar la respuesta. Podría tratarse de una configuración del modelo, permisos de la clave o una saturación temporal. Revisá los registros de bermejochat en Cloudflare.';
        }
        const e=new Error(detalle);
        e.status=r.status;
        e.codigo=typeof j.codigo==='string'?j.codigo:'';
        throw e;
      }
      return j;
    }finally{clearTimeout(timer);}
  }
  async function generarClase(datos){
    try{
      const r=await pedir('/docente',Object.assign({accion:'plan',confirmacion:true},datos),52000);
      if(!r.respuesta)throw new Error('La IA no entregó contenido.');
      return {texto:r.respuesta,nota:'Propuesta generada con IA. Revisá los contenidos y la normativa antes de utilizarla.'};
    }catch(e){
      if(e.status!==404)throw e;
      const instrucciones=[
        'Soy docente. Prepará DIRECTAMENTE una clase concreta, sin pedir más datos. Español de Argentina.',
        'Grado: '+datos.grado+'. Materia: '+datos.materia+'. Tema: '+datos.tema+'. Duración: '+datos.duracion+'.',
        datos.objetivo?'Objetivo específico: '+datos.objetivo+'.':'Escribí un objetivo específico.',
        'Respondé con secciones: OBJETIVO, TEXTO EXPLICATIVO para enseñar conceptos, INICIO, DESARROLLO (dos actividades con consignas y ejemplos), CIERRE, EVALUACIÓN, DUA (compromiso, representación, acción y expresión).',
        'Proponé apoyos visuales y opciones orales, gráficas o escritas sin bajar la exigencia conceptual. No inventes artículos ni obligaciones de normas.'
      ].join('\n').slice(0,1490);
      const r=await pedir('/asistente',{texto:instrucciones,perfil:'docente',confirmacion:true,historial:[]},32000);
      return {texto:r.respuesta,nota:'Propuesta breve: la IA actual tiene un límite de extensión. Para una versión completa con más actividades, actualizá el Worker en Cloudflare.'};
    }
  }
  async function generarMaterial(datos){
    try{
      const r=await pedir('/docente',{accion:datos.accion,grado:datos.grado,materia:datos.materia,formato:datos.formato,texto:datos.texto.slice(0,8000),confirmacion:true},52000);
      if(!r.respuesta)throw new Error('La IA no entregó contenido.');
      return {texto:r.respuesta,nota:'Material generado con IA para revisar.'+(datos.texto.length>8000?' Se procesaron los primeros 8.000 caracteres.':'')};
    }catch(e){
      if(e.status!==404)throw e;
      if(datos.accion==='adaptar'){
        const r=await pedir('/adaptar',{texto:datos.texto.slice(0,6000),confirmacion:true},32000);
        if(!r.texto)throw new Error('La IA no entregó la adaptación.');
        return {texto:r.texto,nota:'Adaptación con el servicio actual.'+(datos.texto.length>6000?' Se procesaron solo los primeros 6.000 caracteres.':'')+' Para ajustar mejor al grado, actualizá el Worker.'};
      }
      const fuente=datos.texto.slice(0,1000);
      const r=await pedir('/asistente',{texto:('Hacé un resumen FIEL del siguiente material, con título, ideas principales y síntesis, lenguaje claro y sin inventar hechos. Material: '+fuente).slice(0,1490),perfil:'docente',confirmacion:true,historial:[]},32000);
      return {texto:r.respuesta,nota:datos.texto.length>1000?'ATENCIÓN: resumen PARCIAL basado solo en los primeros 1.000 caracteres. Para resumir todo el material, actualizá el Worker.':'Resumen breve del material con la IA disponible.'};
    }
  }
  function tag(tipo,clase,contenido){
    const n=document.createElement(tipo);if(clase)n.className=clase;if(contenido!==undefined)n.textContent=contenido;return n;
  }
  function palabras(t,max){
    const excluir=new Set(('para como pero porque cuando donde desde hasta sobre entre hacia esta esto estos estas esos esas tiene tienen estaba estaban son fue fueron hay vamos puede deben cada mucho algunas algunos con una uno unos las los del que por sin sus mas menos tambien todos todas otro otra muy todo forma tipos parte actividad').split(' '));
    const frecuentes=['agua','sol','lluvia','nube','planta','arbol','rio','animal','casa','escuela','alumno','libro','mezcla','sal','aceite','aire','tierra','comida','mapa','vapor','calor'];
    const vistos=new Set();
    return (t.match(/\p{L}+/gu)||[]).map(w=>w.toLowerCase()).filter(w=>{
      const n=w.normalize('NFD').replace(/[\u0300-\u036f]/g,'');if(n.length<3||excluir.has(n)||vistos.has(n))return false;vistos.add(n);return true;
    }).map((w,i)=>({w,i,primero:frecuentes.includes(w)?0:1})).sort((a,b)=>a.primero-b.primero||a.i-b.i).slice(0,max).map(o=>o.w);
  }
  async function pictogramas(t,marca){
    const caja=tag('section','docente-visuales'),status=tag('p',null,'Buscando pictogramas en ARASAAC…'),ul=tag('ul','docente-pictos');
    caja.append(tag('h5',null,'Pictogramas de apoyo'),status,ul);visual.append(caja);
    if(!window.BermejoPictos){status.textContent='No está disponible la búsqueda de pictogramas.';return;}
    let encontrados=0;
    for(const palabra of palabras(t,12)){
      if(marca!==idVisual || !visual.contains(caja))return;
      try{
        const r=await window.BermejoPictos.buscar(palabra);
        const p=window.BermejoPictos.mejor(r,palabra);
        if(!p)continue;
        const li=tag('li'),img=document.createElement('img');
        img.src=window.BermejoPictos.url(p.id,300);img.alt='Pictograma para '+palabra;
        img.width=150;img.height=150;img.loading='lazy';
        li.append(img,tag('span',null,palabra));ul.append(li);encontrados++;
      }catch(_){/* Se mantiene la lectura aunque no haya respuesta de ARASAAC. */}
    }
    if(marca===idVisual){
      status.textContent=encontrados?'Se encontraron '+encontrados+' pictogramas.':'No hubo coincidencias suficientes para este contenido.';
      $('docente-resultado-creditos').textContent='Pictogramas: Sergio Palao · ARASAAC · CC BY-NC-SA · Gobierno de Aragón.';
    }
  }
  function imagenes(t){
    const caja=tag('section','docente-visuales');caja.append(tag('h5',null,'Imágenes de apoyo'));
    const ilustraciones=window.Ilustraciones?window.Ilustraciones.buscar(t.slice(0,1700),3):[];
    if(!ilustraciones.length)caja.append(tag('p',null,'Esta colección todavía no contiene imágenes adecuadas para el tema. El texto sigue disponible.'));
    else{
      const lista=tag('ul','docente-ilustraciones');
      ilustraciones.forEach(h=>{const li=tag('li');li.append(window.Ilustraciones.crearFigura(h,t));lista.append(li);});
      caja.append(lista);
    }
    visual.append(caja);
    $('docente-resultado-creditos').textContent='Ilustraciones propias de Bermejo Accesible (según disponibilidad por tema).';
  }
  function vistaPrevia(){
    const texto=edicion.value.trim();visual.replaceChildren();const marca=++idVisual;
    if(!texto)return;
    visual.append(tag('h4',null,tipo==='clase'?'Propuesta de clase':'Material presentado'));
    const partes=texto.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
    partes.forEach((p,i)=>{
      if(modo==='partes'){
        const sec=tag('section','docente-bloque-parte');
        sec.append(tag('h5',null,'Parte '+(i+1)),tag('p',null,p));visual.append(sec);
      }else visual.append(tag('p',null,p));
    });
    $('docente-resultado-creditos').textContent='';
    if(tipo==='clase')return;
    if(modo==='pictogramas')pictogramas(texto,marca);
    if(modo==='imagenes')imagenes(texto);
  }
  function entregar(texto,nota,nuevoTipo,nuevoModo){
    tipo=nuevoTipo;modo=nuevoModo;
    edicion.value=texto;salida.hidden=false;
    $('docente-resultado-titulo').textContent=nuevoTipo==='clase'?'Tu clase está preparada':nuevoTipo==='resumir'?'Tu resumen está preparado':'Tu texto adaptado está preparado';
    $('docente-resultado-etiqueta').textContent='Editable';
    salida.querySelector('.docente-resultado__aviso').textContent=nota+' Corregí y verificá antes de usarlo.';
    vistaPrevia();salida.scrollIntoView({block:'start',behavior:'auto'});
  }
  clase.addEventListener('submit',async e=>{
    e.preventDefault();if(ocupado)return;
    const grado=$('docente-clase-grado'),materia=$('docente-clase-materia'),tema=$('docente-clase-tema');
    if(!obligatorio([grado,materia,tema],$('docente-clase-consentimiento')))return;
    const datos={grado:grado.value,materia:materia.value,tema:tema.value,objetivo:$('docente-clase-objetivo').value.trim(),duracion:$('docente-clase-tiempo').value};
    if(datosPersonales(Object.values(datos).join(' '))){aviso('Quitá datos personales antes de continuar.');return;}
    ocupadoAhora(true,'CLARIA está preparando la clase, el texto explicativo y las actividades…');
    try{const r=await generarClase(datos);entregar(r.texto,r.nota,'clase','texto');aviso('¡Listo! Podés revisar y descargar la clase.');}
    catch(e){aviso('No se pudo preparar la clase: '+(e.name==='AbortError'?'Se agotó el tiempo de espera. Probá con un tema o texto más corto.':e.message));}
    finally{ocupadoAhora(false);}
  });
  material.addEventListener('submit',async e=>{
    e.preventDefault();if(ocupado)return;
    const grado=$('docente-material-grado'),materia=$('docente-material-materia'),contenido=entradaMaterial.value.trim();
    if(!obligatorio([grado,materia],$('docente-material-consentimiento')))return;
    if(contenido.length<20){entradaMaterial.focus();aviso('Subí o pegá un texto de al menos 20 caracteres.');return;}
    if(datosPersonales(contenido)){aviso('Quitá datos personales del material antes de continuar.');return;}
    const accion=material.querySelector('input[name="docente-tipo"]:checked').value;
    const formato=material.querySelector('input[name="docente-presentacion"]:checked').value;
    ocupadoAhora(true,'CLARIA está preparando el material…');
    try{
      const r=await generarMaterial({grado:grado.value,materia:materia.value,accion,formato,texto:contenido});
      entregar(r.texto,r.nota,accion,formato);aviso('Material preparado. Revisá el resultado y elegí si querés imprimir o descargar.');
    }catch(e){aviso('No se pudo preparar el material: '+(e.name==='AbortError'?'Se agotó el tiempo de espera. Probá con un tema o texto más corto.':e.message));}
    finally{ocupadoAhora(false);}
  });
  function script(url,global){
    if(window[global])return Promise.resolve();
    return new Promise((ok,fail)=>{
      const s=document.createElement('script');s.src=url;s.async=true;
      s.onload=()=>window[global]?ok():fail(new Error('No se pudo iniciar la biblioteca.'));
      s.onerror=()=>fail(new Error('No se pudo descargar la biblioteca. Revisá internet.'));
      document.head.append(s);
    });
  }
  async function ocr(fuente){
    await script('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js','Tesseract');
    const w=await window.Tesseract.createWorker('spa',1);
    try{const r=await w.recognize(fuente);return r.data.text||'';}
    finally{await w.terminate();}
  }
  async function extraer(file){
    if(file.size>20*1024*1024)throw new Error('El archivo debe pesar menos de 20 MB.');
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(ext==='txt'||file.type==='text/plain')return file.text();
    if(['png','jpg','jpeg','webp'].includes(ext)){
      archivoEstado.textContent='Reconociendo el texto de la foto…';
      return ocr(file);
    }
    if(ext!=='pdf')throw new Error('Se admiten PDF, TXT, JPG, PNG y WEBP.');
    await script('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js','pdfjsLib');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    let pdf;
    try{
      pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
      const texto=[],limite=Math.min(12,pdf.numPages);
      let imagenesOCR=0;
      for(let i=1;i<=limite;i++){
        archivoEstado.textContent='Extrayendo página '+i+' de '+limite+'…';
        const pagina=await pdf.getPage(i);
        let t=(await pagina.getTextContent()).items.map(x=>x.str||'').join(' ').trim();
        if(t.length<20&&imagenesOCR<3){
          imagenesOCR++;
          archivoEstado.textContent='Reconociendo página escaneada '+i+'…';
          const v=pagina.getViewport({scale:1.6}),can=document.createElement('canvas');
          can.width=Math.floor(v.width);can.height=Math.floor(v.height);
          await pagina.render({canvasContext:can.getContext('2d'),viewport:v}).promise;
          t=await ocr(can);can.width=0;can.height=0;
        }
        if(t.trim())texto.push(t.trim());pagina.cleanup();
      }
      archivoEstado.dataset.nota=(pdf.numPages>limite?'Solo se leyeron las primeras '+limite+' páginas. ':'')+
        (imagenesOCR?'Se usó OCR en '+imagenesOCR+' páginas; revisá errores.':'');
      return texto.join('\n\n');
    }finally{if(pdf)await pdf.destroy();}
  }
  archivo.addEventListener('change',async function(){
    if(ocupado||!archivo.files.length)return;
    const file=archivo.files[0];ocupadoAhora(true,'Extrayendo el texto en tu dispositivo…');
    archivoEstado.textContent='Abriendo '+file.name+'…';archivoEstado.dataset.nota='';
    try{
      const t=(await extraer(file)).trim();if(t.length<20)throw new Error('No se reconoció suficiente texto. Probá otra imagen.');
      entradaMaterial.value=t.slice(0,10000);
      archivoEstado.textContent='Listo: '+file.name+'. Revisá el texto extraído. '+(t.length>10000?'Se conservaron los primeros 10.000 caracteres. ':'')+(archivoEstado.dataset.nota||'');
      aviso('El archivo se leyó localmente. No se envió ningún texto a la IA.');entradaMaterial.focus({preventScroll:true});
    }catch(e){archivoEstado.textContent='Error: '+e.message;aviso('Podés pegar el texto manualmente.');}
    finally{ocupadoAhora(false);}
  });
  $('docente-resultado-preview').addEventListener('click',()=>{vistaPrevia();aviso('Vista previa actualizada.');});
  $('docente-resultado-copiar').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(edicion.value);aviso('Texto copiado.');}
    catch(_){edicion.select();aviso('Texto seleccionado. Copialo con Ctrl+C.');}
  });
  function descargar(blob,nombre){
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=nombre;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
  }
  $('docente-resultado-word').addEventListener('click',async()=>{
    if(!edicion.value.trim())return;aviso('Preparando Word editable…');
    try{
      await script('js/vendor/docx.umd.js','docx');const D=window.docx;
      const parts=edicion.value.split('\n').map(line=>new D.Paragraph({text:line.trim()||' ',spacing:{after:140}}));
      const doc=new D.Document({sections:[{children:parts}]});
      const blob=await D.Packer.toBlob(doc);
      descargar(blob,'CLARIA_'+(tipo==='clase'?'planificacion':tipo)+'.docx');
      aviso('Word editable descargado.');
    }catch(e){aviso('No se pudo exportar a Word: '+e.message+'. Podés copiar el texto.');}
  });
  $('docente-resultado-imprimir').addEventListener('click',()=>{
    vistaPrevia();aviso('Elegí «Guardar como PDF» o una impresora.');window.print();
  });
  seleccionarRol();
  const params=new URLSearchParams(location.search);
  if(params.get('rol')==='docente'){
    $('claria-rol-docente').click();
    if(params.get('accion')==='material')pestana('material');
  }
});
})();