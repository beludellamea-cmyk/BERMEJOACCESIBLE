/* Mi ciudad, más accesible · Bermejo Accesible
   Guía comunitaria basada en datos públicos de CLARIA; no representa a instituciones.
   Sin geolocalización ni envíos de consultas personales. */
(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded',function(){
    const $=id=>document.getElementById(id);
    const lista=$('ciudad-lista'),inicio=$('ciudad-inicio'),detalle=$('ciudad-detalle'),
          estado=$('ciudad-estado'),nombre=$('ciudad-nombre'),
          servicios=$('ciudad-servicios'),pasos=$('ciudad-pasos'),
          frases=$('ciudad-frases'),referencia=$('ciudad-referencia'),
          advertencia=$('ciudad-advertencia'),
          volver=$('ciudad-volver');
    if(!lista||!inicio||!detalle||!volver)return;
    let institutos=[],sintesis=null;
    const texto=(v)=>typeof v==='string'?v.trim():'';
    const nodo=(tag,clase,contenido)=>{
      const e=document.createElement(tag);if(clase)e.className=clase;
      if(contenido!==undefined)e.textContent=contenido;
      return e;
    };
    function actualizarEstado(s){estado.textContent=s;}
    function detenerAudio(){
      if('speechSynthesis' in window){try{window.speechSynthesis.cancel();}catch(_){}}
    }
    function leer(s){
      if(!('speechSynthesis' in window)){
        actualizarEstado('La voz no está disponible en este dispositivo. Podés leer o mostrar el mensaje.');
        return;
      }
      detenerAudio();
      try{
        const u=new SpeechSynthesisUtterance(s);u.lang='es-AR';u.rate=.91;u.pitch=1;
        const voces=window.speechSynthesis.getVoices()||[];
        const argentina=voces.find(v=>String(v.lang).toLowerCase()==='es-ar');
        const español=voces.find(v=>/^es/i.test(v.lang));
        if(argentina||español)u.voice=argentina||español;
        u.onerror=()=>actualizarEstado('El navegador no pudo reproducir la voz. También podés leer el mensaje.');
        window.speechSynthesis.speak(u);
        if(typeof window.speechSynthesis.resume==='function')window.speechSynthesis.resume();
      }catch(_){actualizarEstado('No se pudo activar el sonido en este navegador.');}
    }
    function agregarTexto(target,tag,className,textoValor){
      const e=nodo(tag,className,textoValor);
      target.appendChild(e);return e;
    }
    function abrirLugar(id){
      const i=institutos.find(x=>x.id===id);
      if(!i)return;
      detenerAudio();
      nombre.textContent=i.nombre;
      $('ciudad-icono').textContent=i.icono||'🏛️';
      $('ciudad-fecha').textContent='Fuentes consultadas: '+fecha(i.fechaFuente);
      servicios.replaceChildren();pasos.replaceChildren();frases.replaceChildren();referencia.replaceChildren();
      const serv=Array.isArray(i.serviciosReferencia)?i.serviciosReferencia:[];
      if(serv.length)serv.forEach(t=>agregarTexto(servicios,'li','',t));
      else agregarTexto(servicios,'li','','Consultá al personal de la institución.');
      const orientacion=Array.isArray(i.orientacion)?i.orientacion:[];
      if(orientacion.length)orientacion.forEach((p)=>agregarTexto(pasos,'li','',texto(p.texto)));
      else agregarTexto(pasos,'li','','Consultá al personal cómo realizar tu consulta.');
      const lines=Array.isArray(i.frases)?i.frases.slice(0,6):[];
      lines.forEach(f=>{
        const oracion=texto(f);if(!oracion)return;
        const fila=nodo('li','ciudad-frase');
        const p=nodo('p','ciudad-frase__texto',oracion);
        const acciones=nodo('div','ciudad-frase__acciones');
        const decir=nodo('button','ciudad-secundario','🔊 Decir');
        decir.type='button';decir.setAttribute('aria-label','Escuchar: '+oracion);
        decir.addEventListener('click',()=>leer(oracion));
        const pictos=nodo('a','ciudad-frase__pictos','Ver con pictogramas');
        pictos.href='claria.html?modo=pictogramas&frase='+encodeURIComponent(oracion);
        pictos.setAttribute('aria-label','Mostrar con pictogramas la frase: '+oracion);
        acciones.append(decir,pictos);fila.append(p,acciones);frases.append(fila);
      });
      if(!lines.length)agregarTexto(frases,'li','','No hay ejemplos disponibles. Podés usar Decilo con pictogramas.');
      const address=texto(i.direccionReferencia);
      if(address){
        const bloque=nodo('div','ciudad-referencia__direccion');
        agregarTexto(bloque,'strong','','Dirección de referencia');
        agregarTexto(bloque,'p','',address);
        agregarTexto(bloque,'p','ciudad-referencia__cuidado','Confirmá la ubicación antes de desplazarte.');
        const mapa=nodo('a','ciudad-enlace','Ver en OpenStreetMap');
        mapa.href='https://www.openstreetmap.org/search?query='+encodeURIComponent(address+', Argentina');
        mapa.target='_blank';mapa.rel='noopener noreferrer';
        bloque.append(mapa);referencia.append(bloque);
      }
      const url=texto(i.fuenteOficial);
      if(/^https:\/\//.test(url)){
        const link=nodo('a','ciudad-enlace','Consultar fuente pública');
        link.href=url;link.target='_blank';link.rel='noopener noreferrer';
        referencia.append(link);
      }
      advertencia.textContent='Esta orientación se elaboró con información pública consultada el '+fecha(i.fechaFuente)+
        '. No es una comunicación oficial ni implica aprobación de '+i.nombre+
        '. Verificá los horarios, direcciones y requisitos antes de realizar cualquier gestión.';
      inicio.hidden=true;detalle.hidden=false;
      actualizarEstado('Estás viendo '+i.nombre+'.');
      detalle.scrollIntoView({block:'start',behavior:'smooth'});
      nombre.focus({preventScroll:true});
    }
    function fecha(iso){
      const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(texto(iso));
      return m?m[3]+'/'+m[2]+'/'+m[1]:'fecha no disponible';
    }
    volver.addEventListener('click',()=>{
      detenerAudio();detalle.hidden=true;inicio.hidden=false;
      actualizarEstado('Elegí otro lugar para ver su guía.');
      $('ciudad-titulo').focus({preventScroll:true});
      inicio.scrollIntoView({block:'start',behavior:'smooth'});
    });
    function render(){
      lista.replaceChildren();
      for(const i of institutos){
        const b=nodo('button','ciudad-lugar');
        b.type='button';
        const icono=nodo('span','ciudad-lugar__icono',i.icono||'🏛️');icono.setAttribute('aria-hidden','true');
        const cuerpo=nodo('span','ciudad-lugar__contenido');
        cuerpo.append(nodo('strong','',i.nombre),nodo('span','','Ver servicios y cómo pedir ayuda'));
        const arrow=nodo('span','ciudad-lugar__flecha','→');arrow.setAttribute('aria-hidden','true');
        b.append(icono,cuerpo,arrow);
        b.addEventListener('click',()=>abrirLugar(i.id));
        lista.append(b);
      }
      actualizarEstado('Elegí uno de los '+institutos.length+' lugares. Las guías son orientativas.');
    }
    fetch('data/ciudad-lugares.json',{cache:'no-store'})
      .then(r=>{if(!r.ok)throw new Error('No se pudo cargar el directorio.');return r.json();})
      .then(j=>{
        institutos=(Array.isArray(j.instituciones)?j.instituciones:[]).filter(x=>x&&
          /^[a-z0-9-]{1,60}$/.test(x.id)&&texto(x.nombre)&&Array.isArray(x.serviciosReferencia));
        if(!institutos.length)throw new Error('No hay lugares disponibles.');
        render();
      })
      .catch(e=>actualizarEstado(e.message+' Actualizá la página o intentá más tarde.'));
    window.addEventListener('pagehide',detenerAudio);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)detenerAudio();});
  });
})();