/* CLARIA Aula: un solo recorrido para docentes.
   Grado + materia + tema O material -> clase + texto adaptado + resumen + actividades + DUA.
   Archivo se lee en el navegador; la IA recibe texto solo luego de autorización. */
(function(){
'use strict';
document.addEventListener('DOMContentLoaded',function(){
  const $=id=>document.getElementById(id);
  const zona=$('claria-docente-rapido'),form=$('aula-formulario'),chat=$('claria-conversacion');
  if(!zona||!form||!chat)return;
  const grado=$('aula-grado'),materia=$('aula-materia'),tema=$('aula-tema'),
    fuente=$('aula-texto-fuente'),archivo=$('aula-archivo'),archivoEstado=$('aula-archivo-estado'),
    confirmar=$('aula-confirmar'),boton=$('aula-generar'),status=$('aula-estado'),
    resultado=$('aula-resultado'),pictos=$('aula-pictogramas'),imagenes=$('aula-imagenes');
  const endpoint=String(window.BERMEJO_CHAT_ENDPOINT||'').replace(/\/$/,'');
  const claves=['clase','textoAdaptado','resumen','actividades','evaluacion','dua'];
  const titulos={clase:'La clase completa',textoAdaptado:'Texto adaptado',resumen:'Resumen',actividades:'Actividades',evaluacion:'Evaluación',dua:'Apoyos DUA'};
  let datos=null,actual=null,generando=false,buscando=0;
  function aviso(t){status.textContent=t;}
  function marcado(t){return /[\w.+-]+@[\w-]+\.[\w.-]+|\b(?:dni|documento|tel[eé]fono|celular)\s*[:#]?\s*\d{6,}|\b\d{8,11}\b/i.test(t);}
  function setGenerando(valor,txt){
    generando=valor;boton.disabled=valor;archivo.disabled=valor;
    for(const b of zona.querySelectorAll('[data-rehacer]'))b.disabled=valor;
    if(txt)aviso(txt);
  }
  function mostrarPerfil(){
    const docente=$('claria-rol-docente').getAttribute('aria-pressed')==='true';
    zona.hidden=!docente;
    document.body.classList.toggle('claria-modo-docente',docente);
    chat.hidden=docente;
    if(docente){zona.scrollIntoView({block:'nearest',behavior:'auto'});}
  }
  document.querySelectorAll('.claria-rol').forEach(b=>b.addEventListener('click',mostrarPerfil));
  function abrirChat(){
    chat.hidden=false;chat.scrollIntoView({block:'start',behavior:'smooth'});
    const input=$('claria-texto');input.focus({preventScroll:true});
  }
  $('aula-chat-abrir').addEventListener('click',abrirChat);
  $('aula-preguntar').addEventListener('click',function(){
    $('claria-texto').value='Quiero revisar mi propuesta sobre '+(datos?.tema||'el material')+'. ';
    abrirChat();
  });
  grado.addEventListener('change',function(){
    const secundaria=grado.value.includes('año');
    for(const opt of materia.options){
      if(opt.text==='Ciencias Naturales'){
        opt.hidden=secundaria;
        if(secundaria && materia.value===opt.value)materia.value='';
      }
    }
  });
  const detalle=$('aula-texto-detalle');
  fuente.addEventListener('input',()=>{if(fuente.value.trim())detalle.open=true;});
  function crear(tag,clase,text){
    const e=document.createElement(tag);
    if(clase)e.className=clase;
    if(text!==undefined)e.textContent=text;
    return e;
  }
  function pintarSeccion(k){
    const caja=$('aula-vista-'+k);
    caja.replaceChildren();
    const texto=String(actual[k]||'').trim();
    // Renderizar texto plano, sin interpretar HTML suministrado por la IA.
    const bloques=texto.split(/\n{2,}/).map(t=>t.trim()).filter(Boolean);
    bloques.forEach(b=>{
      const primera=b.split('\n')[0].trim();
      const enc=/^[A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ0-9\s:–—-]{3,70}$/.test(primera)&&primera.length<65;
      if(enc&&b.length===primera.length)caja.appendChild(crear('h5',null,primera));
      else caja.appendChild(crear('p',null,b));
    });
  }
  function copiarTodo(){
    return claves.map(k=>titulos[k].toUpperCase()+'\n\n'+(actual?.[k]||'')).join('\n\n'+'—'.repeat(24)+'\n\n');
  }
  function entregar(j){
    actual=Object.fromEntries(claves.map(k=>[k,String(j.contenido?.[k]||'')]));
    $('aula-resultado-titulo').textContent=(datos.tema?datos.tema:'Propuesta basada en tu material')+' · '+datos.grado;
    $('aula-resultados-nota').textContent=datos.texto
      ?'Clase y adaptaciones basadas en el material que subiste. Revisá los conceptos, el resumen y las actividades antes de usarlos.'
      :'Clase y materiales creados a partir del tema indicado. Revisá su contenido antes de utilizarlos.';
    for(const key of claves){
      pintarSeccion(key);
      $('aula-edicion-'+key).hidden=true;
      zona.querySelector('[data-editar="'+key+'"]').setAttribute('aria-expanded','false');
    }
    resultado.hidden=false;
    resultado.scrollIntoView({block:'start',behavior:'auto'});
    consultarVisuales(j.contenido?.palabrasVisuales||[]);
  }
  async function post(path,body,ms=58000){
    if(!endpoint)throw new Error('No está configurada la conexión con la IA.');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),ms);
    try{
      const res=await fetch(endpoint+path,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(body),signal:controller.signal
      });
      const j=await res.json().catch(()=>({}));
      if(!res.ok){
        const err=new Error(j.error||('El servicio respondió con error '+res.status));
        err.status=res.status;err.code=j.codigo||'';throw err;
      }
      return j;
    }finally{clearTimeout(timer);}
  }
  form.addEventListener('submit',async function(e){
    e.preventDefault();if(generando)return;
    if(!grado.value){grado.focus();aviso('Elegí el grado o año.');return;}
    if(!materia.value){materia.focus();aviso('Elegí la materia.');return;}
    const t=tema.value.trim(),f=fuente.value.trim();
    if(!t&&f.length<20){tema.focus();aviso('Escribí el tema o subí/pegá un material de al menos 20 caracteres.');return;}
    if(marcado(t+' '+f)){aviso('Revisá y quitá nombres, DNI, correos y otros datos personales antes de enviar el texto.');return;}
    if(!confirmar.checked){confirmar.focus();aviso('Para usar IA, confirmá que revisaste el contenido y autorizás su envío.');return;}
    datos={grado:grado.value,materia:materia.value,tema:t,texto:f.slice(0,8000)};
    setGenerando(true,'CLARIA está preparando la clase, la adaptación, el resumen y las actividades…');
    try{
      const r=await post('/aula',{accion:'generar',grado:datos.grado,materia:datos.materia,tema:datos.tema,texto:datos.texto,confirmacion:true});
      if(!r.contenido||claves.some(k=>typeof r.contenido[k]!=='string'||!r.contenido[k].trim()))
        throw new Error('La IA no devolvió todos los materiales. Probá nuevamente.');
      entregar(r);aviso('¡Listo! Más abajo están todos los materiales. Tocá «Modificar» en cualquier apartado para cambiarlo.');
    }catch(err){
      if(err.status===404)aviso('CLARIA todavía necesita la nueva versión de Cloudflare para preparar todo junto. Actualizá el Worker bermejochat con backend/chat-worker.js y tocá Deploy.');
      else if(err.name==='AbortError')aviso('Gemini tardó demasiado en responder. Probá nuevamente con un texto más corto.');
      else aviso('No se pudo completar la propuesta: '+err.message);
    }finally{setGenerando(false);}
  });
  for(const key of claves){
    const toggle=zona.querySelector('[data-editar="'+key+'"]');
    const panel=$('aula-edicion-'+key),edicion=$('aula-texto-'+key),instruccion=$('aula-instruccion-'+key);
    toggle.addEventListener('click',function(){
      if(!actual)return;
      panel.hidden=!panel.hidden;
      toggle.setAttribute('aria-expanded',String(!panel.hidden));
      toggle.textContent=panel.hidden?'Modificar':'Cerrar edición';
      if(!panel.hidden){edicion.value=actual[key];edicion.focus({preventScroll:true});}
    });
    zona.querySelector('[data-guardar="'+key+'"]').addEventListener('click',function(){
      if(!actual)return;
      if(edicion.value.trim().length<10){aviso('La sección necesita contenido antes de guardarla.');return;}
      actual[key]=edicion.value.trim();pintarSeccion(key);
      panel.hidden=true;toggle.textContent='Modificar';toggle.setAttribute('aria-expanded','false');
      aviso('Guardaste los cambios en '+titulos[key]+'.');
      if(key==='textoAdaptado')consultarVisuales([]);
    });
    zona.querySelector('[data-rehacer="'+key+'"]').addEventListener('click',async function(){
      if(generando||!actual||!datos)return;
      if(!confirmar.checked){aviso('Para pedir cambios a la IA, marcá la autorización.');return;}
      const cambio=instruccion.value.trim();
      if(cambio.length<3){instruccion.focus();aviso('Escribí qué querés cambiar. También podés editar el texto directamente.');return;}
      if(marcado(cambio)){aviso('Quitá los datos personales de la indicación.');return;}
      setGenerando(true,'CLARIA está modificando solo '+titulos[key]+'…');
      try{
        const r=await post('/aula',{accion:'modificar',grado:datos.grado,materia:datos.materia,tema:datos.tema,seccion:key,actual:edicion.value.trim(),cambio,confirmacion:true});
        if(!r.respuesta)throw new Error('No se recibió la sección corregida.');
        edicion.value=r.respuesta;actual[key]=r.respuesta;pintarSeccion(key);
        panel.hidden=true;toggle.textContent='Modificar';toggle.setAttribute('aria-expanded','false');
        aviso('Actualicé '+titulos[key]+'. Las demás secciones no cambiaron.');
        if(key==='textoAdaptado')consultarVisuales([]);
      }catch(err){aviso('No se pudo modificar esa sección: '+err.message);}
      finally{setGenerando(false);}
    });
  }
  // Los apoyos visuales se ubican junto al texto adaptado, no lejos de él.
  const areaVisual=zona.querySelector('.aula-visuales');
  zona.querySelector('[data-seccion="textoAdaptado"]').appendChild(areaVisual);
  const alias={evaporacion:'vapor',condensacion:'nube',precipitacion:'lluvia',mezclas:'mezcla',plantas:'planta',animales:'animal',arboles:'arbol',nubes:'nube',gotas:'gota'};
  function normal(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
  function conceptos(entrada){
    const fromIA=Array.isArray(entrada)?entrada.filter(x=>typeof x==='string').map(x=>x.trim()):[];
    const vacias=new Set('para como donde porque cuando tienen tenemos para con del las los una unos estas este esos sin desde hasta clase objetivo material ejemplo actividad'.split(' '));
    const fromText=(actual?.textoAdaptado||'').match(/\p{L}+/gu)||[];
    return [...fromIA,...fromText].map(x=>normal(x)).filter(x=>x.length>=3&&!vacias.has(x)).filter((x,i,a)=>a.indexOf(x)===i).slice(0,14);
  }
  async function consultarVisuales(palabras){
    const id=++buscando;
    pictos.replaceChildren();imagenes.replaceChildren();
    const titular=crear('p','aula-visuales__estado','Buscando pictogramas para los conceptos del texto adaptado…');
    pictos.append(titular);
    if(window.BermejoPictos){
      const ul=crear('ul','aula-pictos-lista');pictos.append(ul);
      let encontrados=0;
      for(const palabra of conceptos(palabras)){
        if(id!==buscando)return;
        const opciones=[palabra,...(alias[palabra]?[alias[palabra]]:[])];
        for(const opcion of opciones){
          try{
            const candidatos=await window.BermejoPictos.buscar(opcion);
            const picto=window.BermejoPictos.mejor(candidatos,opcion);
            if(!picto)continue;
            const li=crear('li','aula-picto');
            const img=document.createElement('img');img.src=window.BermejoPictos.url(picto.id,300);
            img.alt='Pictograma para '+opcion;img.loading='lazy';img.width=120;img.height=120;
            const texto=crear('span',null,palabra);li.append(img,texto);
            ul.append(li);encontrados++;break;
          }catch(_){/* Si no responde ARASAAC, se conserva el texto. */}
        }
        if(encontrados>=10)break;
      }
      if(id===buscando)titular.textContent=encontrados
        ?'Se encontraron '+encontrados+' pictogramas; revisá si representan bien los conceptos.'
        :'No se encontraron coincidencias suficientes en ARASAAC. El texto adaptado permanece disponible.';
    }else titular.textContent='Los pictogramas requieren conectarse al catálogo de ARASAAC.';
    if(id!==buscando)return;
    const coincidencias=window.Ilustraciones?.buscar((datos?.tema||'')+' '+(actual?.textoAdaptado||'').slice(0,1600),3)||[];
    if(coincidencias.length){
      imagenes.append(crear('h5',null,'Ilustraciones complementarias'));
      const lista=crear('ul','aula-ilustraciones');
      coincidencias.forEach(x=>{const li=crear('li');li.append(window.Ilustraciones.crearFigura(x,actual.textoAdaptado));lista.append(li);});
      imagenes.append(lista);
    }
  }
  // PDF, fotografía y TXT: reconocimiento local y revisión antes del envío.
  function cargarScript(src,variable){
    if(window[variable])return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');s.src=src;s.async=true;
      s.onload=()=>window[variable]?resolve():reject(new Error('No se inició la biblioteca de lectura.'));
      s.onerror=()=>reject(new Error('No se pudo descargar la biblioteca de lectura.'));
      document.head.appendChild(s);
    });
  }
  async function extraerFoto(f){
    await cargarScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js','Tesseract');
    const worker=await window.Tesseract.createWorker('spa',1);
    try{const r=await worker.recognize(f);return r.data.text||'';}
    finally{await worker.terminate();}
  }
  async function extraer(file){
    if(file.size>20*1024*1024)throw new Error('El archivo supera 20 MB.');
    const ext=file.name.toLowerCase().split('.').pop();
    if(ext==='txt')return file.text();
    if(['png','jpg','jpeg','webp'].includes(ext))return extraerFoto(file);
    if(ext!=='pdf')throw new Error('Se admiten PDF, JPG, PNG, WEBP y TXT.');
    await cargarScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js','pdfjsLib');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
    const partes=[];let escan=0;
    try{
      for(let i=1;i<=Math.min(pdf.numPages,12);i++){
        archivoEstado.textContent='Leyendo página '+i+' de '+Math.min(pdf.numPages,12)+'…';
        const pagina=await pdf.getPage(i),tc=await pagina.getTextContent();
        let t=tc.items.map(x=>x.str||'').join(' ').trim();
        if(t.length<20&&escan<3){
          escan++;
          const vp=pagina.getViewport({scale:1.6}),canvas=document.createElement('canvas');
          canvas.width=Math.floor(vp.width);canvas.height=Math.floor(vp.height);
          await pagina.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;
          t=await extraerFoto(canvas);canvas.width=canvas.height=0;
        }
        if(t)partes.push(t);pagina.cleanup();
      }
      archivoEstado.dataset.detalle=(pdf.numPages>12?'Se leyeron solo las primeras 12 páginas. ':'')+
        (escan?'Se realizó reconocimiento de imagen en '+escan+' páginas; revisá el texto.':'');
      return partes.join('\n\n');
    }finally{await pdf.destroy();}
  }
  archivo.addEventListener('change',async function(){
    const file=archivo.files?.[0];if(!file||generando)return;
    setGenerando(true,'Leyendo el archivo en el dispositivo; todavía no se envió a la IA.');
    archivoEstado.textContent='Extrayendo '+file.name+'…';
    archivoEstado.dataset.detalle='';
    try{
      const texto=(await extraer(file)).trim();
      if(texto.length<20)throw new Error('No se detectó texto suficiente. Probá con una foto más nítida.');
      fuente.value=texto.slice(0,8000);detalle.open=true;
      archivoEstado.textContent='Texto extraído de '+file.name+'. Revisalo antes de generar. '+
        (texto.length>8000?'Solo se incluyeron los primeros 8.000 caracteres. ':'')+
        (archivoEstado.dataset.detalle||'');
      aviso('Archivo leído en tu dispositivo. El texto todavía no se envió.');
      fuente.focus({preventScroll:true});
    }catch(e){archivoEstado.textContent='No pude leer el archivo: '+e.message;aviso('Podés pegar el texto directamente.');}
    finally{setGenerando(false);}
  });
  $('aula-copiar').addEventListener('click',async function(){
    if(!actual)return;
    try{await navigator.clipboard.writeText(copiarTodo());aviso('Copiaste la clase y los materiales.');}
    catch(_){aviso('No fue posible copiar automáticamente. Podés usar «Modificar» para seleccionar los textos.');}
  });
  function guardarBlob(blob,nombre){
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=nombre;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
  $('aula-word').addEventListener('click',async function(){
    if(!actual)return;
    aviso('Preparando el archivo Word editable…');
    try{
      await cargarScript('js/vendor/docx.umd.js','docx');
      const D=window.docx,children=[];
      for(const k of claves){
        children.push(new D.Paragraph({text:titulos[k],heading:D.HeadingLevel.HEADING_2,spacing:{before:260,after:150}}));
        for(const l of actual[k].split('\n')){
          children.push(new D.Paragraph({text:l.trim()||' ',spacing:{after:130}}));
        }
      }
      const doc=new D.Document({sections:[{children}]});
      guardarBlob(await D.Packer.toBlob(doc),'CLARIA_Clase_y_materiales.docx');
      aviso('Word descargado con los textos editables. Para incluir los pictogramas visibles, elegí Imprimir / PDF.');
    }catch(e){aviso('No se pudo crear el Word: '+e.message);}
  });
  $('aula-imprimir').addEventListener('click',function(){
    if(!actual)return;
    aviso('Podés imprimir o guardar como PDF. Revisá las imágenes antes de confirmar.');
    window.print();
  });
  mostrarPerfil();
  const query=new URLSearchParams(location.search);
  if(query.get('rol')==='docente')$('claria-rol-docente').click();
  if(query.get('accion')==='material'){detalle.open=true;fuente.focus({preventScroll:true});}
});
})();