/* Bermejo Accesible · Decilo con pictogramas, basado en el motor
 * de CLARIA · La información, más clara para todos.
 * Funciona en el navegador: no envía las frases a Gemini. */
(function(){
'use strict';
document.addEventListener('DOMContentLoaded', function(){
  const $=id=>document.getElementById(id);
  const conversar=$('claria-modo-conversar'),pictogramas=$('claria-modo-pictogramas'),
        interaccion=$('claria-interaccion'),panel=$('claria-pictogramas');
  if(!conversar||!pictogramas||!panel||!interaccion)return;
  const texto=$('pictos-texto'),estado=$('pictos-estado'),
        convertirBtn=$('pictos-convertir'),resultado=$('pictos-resultado'),
        lista=$('pictos-tarjetas'),frase=$('pictos-frase'),
        revision=$('pictos-revision'),alternativas=$('pictos-alternativas'),
        revisionTitulo=$('pictos-revision-titulo'),
        formaEscribir=$('pictos-forma-escribir'),formaElegir=$('pictos-forma-elegir'),
        areaEscribir=$('pictos-escribir'),areaElegir=$('pictos-elegir'),
        categorias=$('pictos-categorias'),opciones=$('pictos-opciones'),
        pantalla=$('pictos-pantalla');
  let motor=null,dic=null,tablero=null,fraseActual='',fichas=[],indice=-1,ocupado=false,
      reconocimiento=null,categoriaActual=null;
  const lecturaFrase=t=>{
    if(!('speechSynthesis' in window)){mostrar('Este dispositivo no tiene lectura en voz alta disponible.');return;}
    try{
      speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);
      u.lang='es-AR';u.rate=.88;u.pitch=1;
      const voces=speechSynthesis.getVoices();
      u.voice=voces.find(x=>x.lang.toLowerCase()==='es-ar')||voces.find(x=>x.lang.toLowerCase().startsWith('es'))||null;
      speechSynthesis.speak(u);
      if(speechSynthesis.resume)speechSynthesis.resume();
      mostrar('CLARIA está diciendo tu mensaje.');
    }catch(e){mostrar('No se pudo iniciar la voz. Probá con otro navegador o revisá el volumen.');}
  };
  function mostrar(s){estado.textContent=s;}
  function nodo(tipo,clase,contenido){
    const el=document.createElement(tipo);
    if(clase)el.className=clase;
    if(contenido!==undefined)el.textContent=contenido;
    return el;
  }
  function modo(nombre){
    const esPictos=nombre==='pictogramas';
    if(esPictos){
      const mic=$('asesoria-modo-voz');
      if(mic&&mic.getAttribute('aria-pressed')==='true')mic.click();
    }
    interaccion.hidden=esPictos;
    panel.hidden=!esPictos;
    conversar.setAttribute('aria-pressed',String(!esPictos));
    pictogramas.setAttribute('aria-pressed',String(esPictos));
    if(esPictos){
      if(!motor)mostrar('Cargando pictogramas…');
      panel.scrollIntoView({block:'nearest',behavior:'auto'});
    }
  }
  conversar.addEventListener('click',()=>modo('conversar'));
  pictogramas.addEventListener('click',()=>modo('pictogramas'));
  if(new URLSearchParams(window.location.search).get('modo')==='pictogramas')modo('pictogramas');
  function setForma(name){
    const elegir=name==='elegir';
    formaEscribir.setAttribute('aria-pressed',String(!elegir));
    formaElegir.setAttribute('aria-pressed',String(elegir));
    areaEscribir.hidden=elegir;
    areaElegir.hidden=!elegir;
    if(elegir&&!categoriaActual&&tablero?.categorias?.length)mostrarCategoria(tablero.categorias[0].id);
    if(!elegir)texto.focus({preventScroll:true});
  }
  formaEscribir.addEventListener('click',()=>setForma('escribir'));
  formaElegir.addEventListener('click',()=>setForma('elegir'));
  function pictograma(f,grande=false){
    const li=nodo('li','pictos-tarjeta'+(f.pic&&f.estado!=='texto'&&f.estado!=='func'?' pictos-tarjeta--imagen':' pictos-tarjeta--solo'));
    const img=(f.pic&&f.estado!=='texto'&&f.estado!=='func')?f.pic:null;
    if(img){
      const image=document.createElement('img');image.src=img.src;image.alt='';image.loading='lazy';
      image.crossOrigin='anonymous';image.width=140;image.height=140;
      image.addEventListener('error',()=>{image.replaceWith(nodo('span','pictos-falta','Imagen no disponible'));});
      li.append(image);
    }else li.append(nodo('span','pictos-falta',f.estado==='func'?'':'Solo texto'));
    li.append(nodo('span','pictos-tarjeta__palabra',f.orig));
    if(!grande){
      const label=f.estado==='revisar'?'Revisar imagen':f.estado==='sin'?'Sin pictograma':f.estado==='elegido'?'Elegido por vos':'';
      if(label)li.append(nodo('small','pictos-tarjeta__aviso',label));
    }
    return li;
  }
  function dibujarTarjetas(){
    lista.replaceChildren();pantalla.querySelector('#pictos-pantalla-tarjetas').replaceChildren();
    for(let i=0;i<fichas.length;i++){
      const f=fichas[i],li=pictograma(f);
      const b=nodo('button','pictos-tarjeta__editar','Cambiar');
      b.type='button';b.setAttribute('aria-label','Elegir pictograma para '+f.orig);
      b.addEventListener('click',()=>abrirRevision(i));
      li.append(b);lista.append(li);
      pantalla.querySelector('#pictos-pantalla-tarjetas').append(pictograma(f,true));
    }
    frase.textContent=fraseActual;
    $('pictos-pantalla-frase').textContent=fraseActual;
  }
  function convertir(){
    if(!motor){mostrar('Todavía se está cargando el diccionario.');return;}
    const t=texto.value.replace(/\s+/g,' ').trim();
    if(!t){mostrar('Escribí o elegí una frase.');texto.focus();return;}
    if(t.length>280){mostrar('La frase es demasiado larga. Usá hasta 280 caracteres.');return;}
    const r=motor.analizar(t);
    if(!r.tokens.length){mostrar('No encontré palabras. Probá con otro texto.');return;}
    fraseActual=t;fichas=r.tokens.map(f=>({...f,alternativas:(f.alternativas||[]).slice()}));
    revision.hidden=true;resultado.hidden=false;
    dibujarTarjetas();
    const encontrados=fichas.filter(f=>f.pic).length,pendientes=fichas.filter(f=>f.estado==='sin'||f.estado==='revisar').length;
    mostrar('Listo: '+encontrados+' pictogramas encontrados.'+
      (pendientes?' Revisá '+pendientes+' palabra(s) sin imagen o con más de un significado.':''));
    resultado.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  convertirBtn.addEventListener('click',convertir);
  texto.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();convertir();}});
  function opcion(label,pic,estadoFinal){
    const b=nodo('button','pictos-alternativa');b.type='button';
    if(pic){
      const im=document.createElement('img');im.src=pic.src;im.width=85;im.height=85;im.alt='';
      im.crossOrigin='anonymous';im.addEventListener('error',()=>im.replaceWith(nodo('span','pictos-falta','Imagen no disponible')));
      b.append(im);
    }
    b.append(nodo('span','',label));
    b.addEventListener('click',()=>{
      const anterior=fichas[indice];
      fichas[indice]={...anterior,pic:pic||null,estado:estadoFinal};
      revision.hidden=true;dibujarTarjetas();
      mostrar('La tarjeta «'+anterior.orig+'» se actualizó. Revisá que comunique lo que querés decir.');
    });
    alternativas.append(b);
  }
  function arasaac(e){return {id:e.id,src:'https://static.arasaac.org/pictograms/'+e.id+'/'+e.id+'_300.png',palabras:e.palabras,significado:e.significado||null,origen:'local'};}
  function ofrecerBusqueda(term){
    const n=window.ClariaPictos?.normalizar(String(term||''))||'';
    const hits=n.length<2?[]:dic.entradas.filter(e=>{
      const keys=[e.lema,...(e.formas||[]),...(e.palabras||[])];
      return keys.some(k=>window.ClariaPictos.normalizar(k).includes(n));
    }).slice(0,18);
    alternativas.replaceChildren();
    const elegidos=new Set();
    for(const e of hits){if(elegidos.has(e.id))continue;elegidos.add(e.id);opcion(e.lema,arasaac(e),'elegido');}
    if(!hits.length)alternativas.append(nodo('p','pictos-revision__ninguno','No hay un pictograma verificado para esa palabra. Podés dejarla escrita.'));
    opcion('Dejar solo texto',null,'texto');
    return hits.length;
  }
  function abrirRevision(i){
    indice=i;revision.hidden=false;
    const f=fichas[i];revisionTitulo.textContent='Elegí una imagen para «'+f.orig+'»';
    alternativas.replaceChildren();
    const caja=nodo('div','pictos-buscar');
    const label=nodo('label','','Buscar otra palabra');
    const input=document.createElement('input');input.type='search';input.maxLength=40;
    input.value=f.lema||f.orig;input.id='pictos-buscar-dinamico';label.htmlFor=input.id;
    caja.append(label,input);revision.insertBefore(caja,alternativas);
    revision.querySelectorAll('.pictos-buscar').forEach((e,j)=>{if(j>0)e.remove();});
    const sugerencias=()=>{
      const a=ofrecerBusqueda(input.value);
      if(!a&&f.pic){opcion('Usar la imagen anterior',f.pic,'elegido');}
    };
    input.addEventListener('input',sugerencias);
    sugerencias();
    revision.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  $('pictos-cerrar-revision').addEventListener('click',()=>revision.hidden=true);
  function mostrarCategoria(id){
    if(!tablero)return;
    const item=tablero.categorias.find(c=>c.id===id);if(!item)return;
    categoriaActual=id;opciones.replaceChildren();
    categorias.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.categoria===id)));
    opciones.append(nodo('h4','',item.nombre));
    const t=nodo('p','pictos-explica','Frases rápidas');opciones.append(t);
    const rapidas=nodo('div','pictos-frases-rapidas');
    for(const frase of item.frases||[]){
      const btn=nodo('button','',frase.texto);btn.type='button';
      btn.addEventListener('click',()=>{
        texto.value=frase.texto;convertir();
      });rapidas.append(btn);
    }
    opciones.append(rapidas,nodo('p','pictos-explica','O armá tu frase tocando palabras'));
    const palabras=nodo('div','pictos-palabras');
    for(const w of item.palabras||[]){
      const e=dic.entradas.find(e=>window.ClariaPictos.normalizar(e.lema)===window.ClariaPictos.normalizar(w));
      const b=nodo('button','pictos-palabra');b.type='button';
      if(e){
        const img=document.createElement('img');img.src=arasaac(e).src;img.alt='';img.width=72;img.height=72;img.loading='lazy';
        img.addEventListener('error',()=>img.replaceWith(nodo('span','pictos-falta','')));
        b.append(img);
      }
      b.append(nodo('span','',w));
      b.addEventListener('click',()=>{
        texto.value=(texto.value.trim()+' '+w).trim();
        mostrar('Frase: '+texto.value+'. Tocá «Mostrar mi frase».');
        $('pictos-frase-componer').textContent=texto.value;
      });
      palabras.append(b);
    }
    opciones.append(palabras);
    const construir=nodo('div','pictos-componer');
    const textoActual=nodo('p','pictos-frase-componer','');
    textoActual.id='pictos-frase-componer';textoActual.textContent=texto.value;
    const ver=nodo('button','pictos-primario','Mostrar mi frase');ver.type='button';ver.addEventListener('click',convertir);
    const borrar=nodo('button','','Borrar frase');borrar.type='button';borrar.addEventListener('click',()=>{
      texto.value='';textoActual.textContent='';mostrar('Podés comenzar una frase nueva.');
    });
    construir.append(textoActual,ver,borrar);opciones.append(construir);
  }
  function dibujarCategorias(){
    categorias.replaceChildren();
    for(const c of tablero.categorias){
      const b=nodo('button','pictos-categoria',c.icono+' '+c.nombre);b.type='button';b.dataset.categoria=c.id;
      b.addEventListener('click',()=>mostrarCategoria(c.id));categorias.append(b);
    }
  }
  $('pictos-escuchar').addEventListener('click',()=>lecturaFrase(fraseActual));
  $('pictos-mostrar').addEventListener('click',()=>{
    if(!fraseActual)return;
    try{pantalla.showModal();}catch(_){mostrar('No se pudo abrir la vista grande en este navegador.');}
  });
  $('pictos-pantalla-cerrar').addEventListener('click',()=>pantalla.close());
  $('pictos-pantalla-decir').addEventListener('click',()=>lecturaFrase(fraseActual));
  pantalla.addEventListener('click',e=>{if(e.target===pantalla)pantalla.close();});
  async function exportar(tipo){
    if(ocupado||!fichas.length)return;
    if(!window.ClariaExport){mostrar('No se pudo cargar el módulo para descargar materiales.');return;}
    ocupado=true;$('pictos-png').disabled=true;$('pictos-pdf').disabled=true;
    mostrar('Preparando tu '+(tipo==='pdf'?'PDF':'imagen')+' con los pictogramas…');
    try{
      const paginas=await window.ClariaExport.dibujarPaginas({titulo:'CLARIA · Mi mensaje',texto:fraseActual,
        fichas:fichas,tamano:185,mayus:false});
      const blob=tipo==='pdf'?window.ClariaExport.aPDF(paginas):await window.ClariaExport.aPNG(paginas);
      window.ClariaExport.descargar(blob,'CLARIA_mensaje_pictogramas.'+tipo);
      mostrar('Descarga lista. Revisá la imagen antes de utilizarla o compartirla.');
    }catch(e){mostrar('No se pudo descargar el material: '+e.message+'. Probá con menos palabras o descargá el PDF.');}
    finally{ocupado=false;$('pictos-png').disabled=false;$('pictos-pdf').disabled=false;}
  }
  $('pictos-png').addEventListener('click',()=>exportar('png'));
  $('pictos-pdf').addEventListener('click',()=>exportar('pdf'));
  $('pictos-dictar').addEventListener('click',()=>{
    const Rec=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Rec){mostrar('El dictado no está disponible en este navegador. Podés escribir o elegir imágenes.');return;}
    if(reconocimiento){try{reconocimiento.abort();}catch(_){}reconocimiento=null;}
    const r=new Rec();reconocimiento=r;r.lang='es-AR';r.interimResults=false;r.continuous=false;
    mostrar('Permití el micrófono y decí la frase que querés comunicar.');
    r.onresult=e=>{
      const t=e.results?.[0]?.[0]?.transcript||'';if(!t.trim())return;
      texto.value=t.slice(0,280);setForma('escribir');mostrar('Tu frase está escrita. Revisala antes de convertirla.');
    };
    r.onerror=e=>mostrar('No pude reconocer la voz ('+(e.error||'sin permiso')+'). Podés escribir la frase.');
    r.onend=()=>{reconocimiento=null;};
    try{r.start();}catch(_){mostrar('El navegador no pudo activar el micrófono.');}
  });
  Promise.all([
    fetch('data/claria-pictogramas.json').then(r=>{if(!r.ok)throw new Error('diccionario');return r.json();}),
    fetch('data/claria-tablero.json').then(r=>{if(!r.ok)throw new Error('tablero');return r.json();})
  ]).then(([d,t])=>{
    if(!window.ClariaPictos)throw new Error('motor de pictogramas no disponible');
    dic=d;tablero=t;motor=window.ClariaPictos.crearMotor(d);
    convertirBtn.disabled=false;dibujarCategorias();
    mostrar('Listo. Escribí una frase o elegí imágenes para comunicarte.');
  }).catch(e=>mostrar('No pude cargar los pictogramas ('+e.message+'). Actualizá la página e intentá nuevamente.'));
});
})();