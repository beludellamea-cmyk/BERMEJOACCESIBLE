/* CLARIA · asesoría docente conversacional.
 * La conversación se mantiene solo en memoria de esta pestaña; no se guarda ni se
 * envía hasta que la persona autoriza expresamente cada sesión. */
(function(){
'use strict';
document.addEventListener('DOMContentLoaded',function(){
  const $=id=>document.getElementById(id);
  const zona=$('claria-asesoria'),chatEstudiantes=$('claria-conversacion');
  if(!zona||!chatEstudiantes)return;
  const mensajes=$('asesoria-mensajes'),entrada=$('asesoria-texto'),form=$('asesoria-form'),
        estado=$('asesoria-estado'),permiso=$('asesoria-permiso'),enviar=$('asesoria-enviar'),
        crear=$('asesoria-crear'),entrega=$('asesoria-entrega'),
        plan=$('asesoria-plan'),uso=$('asesoria-uso-imagen'),prompt=$('asesoria-prompt'),
        fuente=$('asesoria-fuente'),archivo=$('asesoria-archivo'),archivoEstado=$('asesoria-archivo-estado');
  const endpoint=String(window.BERMEJO_CHAT_ENDPOINT||'').replace(/\/$/,'');
  const cara='https://raw.githubusercontent.com/beludellamea-cmyk/claria-/main/assets/claria-avatar.png';
  let historial=[],trabajando=false,escuchar=false,propuestaLista=false,numeroDeRevision=0,fragmentoEnviado=false;
  let modoVoz=false,reconocedor=null,escuchandoMicrofono=false,silencios=0,
      vozVersion=0,vozRespondio=false,transcripcionFinal='',vozPermisoInicial=false;
  const btnVoz=$('asesoria-modo-voz'),vozEstado=$('asesoria-voz-estado'),vozCaptura=$('asesoria-voz-captura'),vozTarjeta=$('asesoria-voz-tarjeta');
  const Reconocimiento=window.SpeechRecognition||window.webkitSpeechRecognition;
  const saludo='¡Hola, profe! Soy CLARIA. Contame qué estás pensando para tu clase. Podés decirme el grado, la materia, qué querés enseñar y cómo es tu grupo. No hace falta que tengas todo resuelto: podemos pensar alternativas juntas. ¿Por dónde empezamos?';
  function textoSeguro(t){return /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\b(?:dni|documento|celular|telefono|teléfono|direccion|dirección)\s*[:#]?\s*[\d\w.-]{6,}|\b\d{8,11}\b/i.test(t);}
  function status(t){estado.textContent=t;}
  function setOcupado(flag,t){
    trabajando=flag;enviar.disabled=flag;crear.disabled=flag||!historial.some(x=>x.rol==='modelo');
    zona.querySelectorAll('[data-ejemplo]').forEach(b=>b.disabled=flag);
    if(t)status(t);
  }
  function say(t){
    if(!escuchar||!('speechSynthesis' in window))return;
    speechSynthesis.cancel();
    const version=vozVersion;
    const u=new SpeechSynthesisUtterance(t.slice(0,1700));
    u.lang='es-AR';u.rate=.91;u.pitch=1.04;
    const voces=speechSynthesis.getVoices();
    u.voice=voces.find(v=>v.lang.toLowerCase()==='es-ar')||
      voces.find(v=>v.lang.toLowerCase().startsWith('es-'))||null;
    u.onstart=()=>{if(modoVoz&&version===vozVersion)estadoVoz('hablando','CLARIA te está respondiendo.');};
    u.onend=()=>{if(modoVoz&&version===vozVersion) {
      estadoVoz('transicion','Terminó la respuesta. Preparando el micrófono…');
      setTimeout(()=>{if(modoVoz&&version===vozVersion&&!trabajando)iniciarEscucha();},500);
    }};
    u.onerror=()=>{if(modoVoz&&version===vozVersion){
      estadoVoz('transicion','No se pudo reproducir la voz. Volvé a tocar el botón del micrófono.');
      detenerVoz(false);
    }};
    speechSynthesis.speak(u);
  }
  function bubble(rol,contenido,hablar=true){
    const fila=document.createElement('div');fila.className='asesoria-burbuja asesoria-burbuja--'+(rol==='usuario'?'usuario':'claria');
    const avatar=document.createElement('span');avatar.className='asesoria-burbuja__avatar';avatar.setAttribute('aria-hidden','true');
    if(rol==='modelo'){
      const img=document.createElement('img');img.src=cara;img.alt='';img.width=40;img.height=40;img.loading='lazy';avatar.append(img);
    }else avatar.textContent='●';
    const cuerpo=document.createElement('div');cuerpo.className='asesoria-burbuja__cuerpo';
    cuerpo.append(document.createElement('strong'),document.createElement('p'));
    cuerpo.firstChild.textContent=rol==='modelo'?'CLARIA':'Vos';
    cuerpo.lastChild.textContent=contenido;
    fila.append(avatar,cuerpo);
    mensajes.append(fila);mensajes.scrollTop=mensajes.scrollHeight;
    if(rol==='modelo'&&hablar)say(contenido);
  }
  /* Voz conversacional: escucha turnos cortos y vuelve a escuchar cuando termina de hablar.
     Sin grabaciones persistentes; el motor de reconocimiento puede procesar audio remotamente. */
  function estadoVoz(estado,descripcion){
    if(!vozTarjeta)return;
    vozTarjeta.dataset.vozEstado=estado;
    vozEstado.textContent=descripcion;
    btnVoz.setAttribute('aria-pressed',String(modoVoz));
    btnVoz.textContent=modoVoz?'■ Terminar conversación por voz':'🎙️ Conversar con CLARIA';
  }
  function detenerVoz(cancelarHabla=true){
    modoVoz=false;escuchandoMicrofono=false;transcripcionFinal='';
    vozVersion++;silencios=0;
    if(reconocedor){
      try{reconocedor.abort();}catch(_){}
      reconocedor=null;
    }
    if(cancelarHabla&&'speechSynthesis' in window)speechSynthesis.cancel();
    escuchar=false;
    const escucharBtn=$('asesoria-escuchar');
    escucharBtn.setAttribute('aria-pressed','false');escucharBtn.textContent='🔊 Escuchar';
    vozCaptura.textContent='';
    estadoVoz('apagado','La conversación por voz está detenida. También podés escribir.');
  }
  function iniciarEscucha(){
    if(!modoVoz||trabajando||zona.hidden)return;
    if(!Reconocimiento){
      estadoVoz('error','Este navegador no permite dictado por voz desde esta página. Podés usar el teclado y escuchar las respuestas.');
      detenerVoz(false);return;
    }
    const version=vozVersion;
    try{
      if(reconocedor){try{reconocedor.abort();}catch(_){ }}
      const r=new Reconocimiento();
      reconocedor=r;r.lang='es-AR';r.continuous=false;r.interimResults=true;r.maxAlternatives=1;
      transcripcionFinal='';vozRespondio=false;
      r.onstart=()=>{
        if(version!==vozVersion||!modoVoz)return;
        escuchandoMicrofono=true;estadoVoz('escuchando','Te escucho. Hablá con naturalidad; cuando termines, te respondo.');
      };
      r.onspeechstart=()=>{if(version===vozVersion&&modoVoz)estadoVoz('escuchando','Escuchando tu consulta…');};
      r.onresult=e=>{
        if(version!==vozVersion||!modoVoz)return;
        let interino='';
        for(let i=e.resultIndex||0;i<e.results.length;i++){
          const t=e.results[i][0]?.transcript||'';
          if(e.results[i].isFinal)transcripcionFinal+=(transcripcionFinal?' ':'')+t;
          else interino+=t;
        }
        vozCaptura.textContent=(transcripcionFinal||interino)?('Vos: '+(transcripcionFinal||interino)):'';
        if(transcripcionFinal){try{r.stop();}catch(_){}}
      };
      r.onerror=e=>{
        if(version!==vozVersion||!modoVoz)return;
        const code=String(e.error||'');
        if(['not-allowed','service-not-allowed','audio-capture','network','language-not-supported'].includes(code)){
          const txt=code==='not-allowed'||code==='service-not-allowed'
            ?'El micrófono no tiene permiso. Permitilo desde el navegador y volvé a intentar.'
            :code==='audio-capture'?'No se detectó un micrófono disponible.':
              code==='network'?'Falló el reconocimiento de voz de tu navegador. Revisá internet.':
                'Tu navegador no reconoce español para dictado.';
          detenerVoz(false);
          estadoVoz('error',txt);status(txt);
        }
      };
      r.onend=()=>{
        if(version!==vozVersion||!modoVoz)return;
        escuchandoMicrofono=false;reconocedor=null;
        const frase=transcripcionFinal.trim();transcripcionFinal='';
        if(frase.length>=3&&!vozRespondio){
          vozRespondio=true;silencios=0;
          estadoVoz('pensando','CLARIA está preparando su respuesta…');
          vozCaptura.textContent='Vos: '+frase;
          conversar(frase);
          return;
        }
        if(++silencios>2){
          detenerVoz(false);
          estadoVoz('pausa','No escuché palabras claras. Tocá «Conversar con CLARIA» para intentar otra vez.');
          return;
        }
        estadoVoz('transicion','No escuché una frase completa. Escuchando otra vez…');
        setTimeout(()=>{if(modoVoz&&version===vozVersion)iniciarEscucha();},800);
      };
      r.start();
    }catch(e){
      detenerVoz(false);
      estadoVoz('error','No se pudo iniciar el micrófono automáticamente. Volvé a tocar «Conversar con CLARIA».');
    }
  }
  function comenzarVoz(){
    if(modoVoz){detenerVoz();return;}
    if(trabajando){status('Terminá la respuesta actual antes de empezar a conversar por voz.');return;}
    if(!permiso.checked){
      const aviso='Marcá la autorización junto al micrófono para comenzar a hablar. No compartas datos identificatorios de estudiantes.';
      status(aviso);estadoVoz('aviso',aviso);
      permiso.focus();return;
    }
    if(!Reconocimiento){
      estadoVoz('error','Tu navegador no admite reconocimiento de voz en esta página. Podés conversar escribiendo y activar «Escuchar» para oír a CLARIA.');
      return;
    }
    if(!('speechSynthesis' in window)){
      estadoVoz('error','El navegador no dispone de voz de respuesta. Podés usar el chat por escrito.');return;
    }
    modoVoz=true;escuchar=true;silencios=0;vozVersion++;
    const escucharBtn=$('asesoria-escuchar');
    escucharBtn.setAttribute('aria-pressed','true');escucharBtn.textContent='🔇 Silenciar';
    estadoVoz('transicion','Solicitando permiso de micrófono…');
    // La primera llamada a start() ocurre directamente tras el toque, para los permisos de Safari.
    iniciarEscucha();
  }
  btnVoz.addEventListener('click',comenzarVoz);
  permiso.addEventListener('change',()=>{if(!permiso.checked&&modoVoz)detenerVoz();});
  function mostrarRol(){
    const docente=$('claria-rol-docente').getAttribute('aria-pressed')==='true';
    zona.hidden=!docente;chatEstudiantes.hidden=docente;
    document.body.classList.toggle('claria-modo-docente',docente);
    if(!docente&&modoVoz)detenerVoz();
    if(docente)zona.scrollIntoView({behavior:'auto',block:'nearest'});
  }
  document.querySelectorAll('.claria-rol').forEach(b=>b.addEventListener('click',mostrarRol));
  async function post(ruta,datos,ms){
    if(!endpoint)throw new Error('No hay una conexión con la IA configurada.');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),ms||40000);
    try{
      const r=await fetch(endpoint+ruta,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(datos),signal:controller.signal});
      const j=await r.json().catch(()=>({}));
      if(!r.ok){
        const e=new Error(j.error||'No se recibió respuesta del servicio (HTTP '+r.status+').');
        e.status=r.status;throw e;
      }
      return j;
    }finally{clearTimeout(timer);}
  }
  async function conversar(q){
    if(trabajando)return;
    const pregunta=q.trim();
    if(pregunta.length<3){entrada.focus();status('Contame un poquito más para empezar.');return;}
    if(pregunta.length>1500){status('Escribí hasta 1.500 caracteres por mensaje.');return;}
    if(textoSeguro(pregunta)||textoSeguro(fuente.value)){status('Quitá datos identificatorios de la consulta o del material antes de enviarlo.');return;}
    if(!permiso.checked){permiso.focus();status('Para conversar con IA, marcá la autorización. Evitá nombres y datos personales de estudiantes.');return;}
    const anterior=historial.slice();
    entrada.value='';bubble('usuario',pregunta);
    setOcupado(true,'CLARIA está pensando una respuesta para tu clase…');
    try{
      const referencia=fuente.value.trim();
      const enviarFuente=Boolean(referencia)&&!fragmentoEnviado;
      const textoParaIA=enviarFuente
        ?(pregunta+'\nMaterial aportado (fragmento): '+referencia.slice(0,Math.max(0,1450-pregunta.length))).slice(0,1490)
        :pregunta;
      const r=await post('/asistente',{
        texto:textoParaIA,perfil:'docente',confirmacion:true,
        historial:anterior.slice(-6).map(x=>({rol:x.rol,texto:x.texto.slice(0,700)}))
      },33000);
      if(typeof r.respuesta!=='string'||!r.respuesta.trim())throw new Error('No llegó una respuesta válida.');
      const respuesta=r.respuesta.trim();
      if(enviarFuente)fragmentoEnviado=true;
      historial=anterior.concat([{rol:'usuario',texto:pregunta},{rol:'modelo',texto:respuesta}]).slice(-24);
      bubble('modelo',respuesta);
      status(propuestaLista?'Podés seguir conversando y luego actualizar la propuesta con lo acordado.':'Si la idea te sirve, tocá «Crear propuesta de clase y recurso visual». También podemos seguir pensando.');
      document.getElementById('asesoria-ejemplos').hidden=true;
      crear.textContent=propuestaLista?'✨ Actualizar propuesta con la conversación':'✨ Crear propuesta de clase y recurso visual';
    }catch(e){
      historial=anterior.concat([{rol:'usuario',texto:pregunta}]).slice(-24);
      bubble('modelo','No pude conectarme a la IA esta vez. Tu consulta sigue acá para que la retomes. Podés volver a intentar cuando el servicio responda.',false);
      if(modoVoz){detenerVoz(false);estadoVoz('error','La IA no respondió. Revisá el servicio y volvé a activar el micrófono.');}
      status(e.name==='AbortError'?'Se agotó el tiempo de espera de Gemini. Probá nuevamente.':'Error del servicio: '+e.message);
    }finally{setOcupado(false);entrada.focus({preventScroll:true});}
  }
  form.addEventListener('submit',e=>{e.preventDefault();conversar(entrada.value);});
  entrada.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();conversar(entrada.value);}});
  zona.querySelectorAll('[data-ejemplo]').forEach(b=>b.addEventListener('click',()=>{
    entrada.value=b.dataset.ejemplo||'';entrada.focus();
    status('Podés ampliar este ejemplo con tus propias palabras y enviarlo cuando autorices la conversación.');
  }));
  // Lectura local de materiales opcionales; nada se envía hasta aceptar el envío en el chat.
  fuente.addEventListener('input',()=>{fragmentoEnviado=false;});
  function scriptLector(url,key){
    if(window[key])return Promise.resolve();
    return new Promise((ok,err)=>{
      const s=document.createElement('script');s.src=url;s.async=true;
      s.onload=()=>window[key]?ok():err(new Error('No se pudo iniciar el lector.'));
      s.onerror=()=>err(new Error('No se pudo descargar el lector. Podés pegar el texto manualmente.'));
      document.head.append(s);
    });
  }
  async function ocrLocal(input){
    await scriptLector('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js','Tesseract');
    const worker=await window.Tesseract.createWorker('spa',1);
    try{const r=await worker.recognize(input);return r.data.text||'';}
    finally{await worker.terminate();}
  }
  async function extraerTexto(file){
    if(file.size>20*1024*1024)throw new Error('El archivo supera los 20 MB.');
    const extension=(file.name.split('.').pop()||'').toLowerCase();
    if(extension==='txt')return file.text();
    if(['png','jpg','jpeg','webp'].includes(extension))return ocrLocal(file);
    if(extension!=='pdf')throw new Error('Se admiten PDF, JPG, PNG, WEBP y TXT.');
    await scriptLector('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js','pdfjsLib');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
    try{
      const bloques=[];let escaneadas=0;
      for(let i=1;i<=Math.min(10,pdf.numPages);i++){
        archivoEstado.textContent='Leyendo página '+i+' de '+Math.min(10,pdf.numPages)+'…';
        const pag=await pdf.getPage(i);
        let t=(await pag.getTextContent()).items.map(x=>x.str||'').join(' ').trim();
        if(t.length<20&&escaneadas<3){
          escaneadas++;
          let v=pag.getViewport({scale:1.5}),factor=Math.min(1,2200/Math.max(v.width,v.height));
          v=pag.getViewport({scale:1.5*factor});
          const canvas=document.createElement('canvas');canvas.width=Math.ceil(v.width);canvas.height=Math.ceil(v.height);
          const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
          await pag.render({canvasContext:ctx,viewport:v}).promise;
          t=await ocrLocal(canvas);canvas.width=canvas.height=0;
        }
        if(t)bloques.push(t);pag.cleanup();
      }
      archivoEstado.dataset.lectura=(pdf.numPages>10?'Se leyeron las primeras 10 páginas. ':'')+
          (escaneadas?'Se usó reconocimiento de texto: revisá posibles errores.':'');
      return bloques.join('\n\n');
    }finally{await pdf.destroy();}
  }
  archivo.addEventListener('change',async function(){
    if(trabajando)return;
    const file=archivo.files&&archivo.files[0];if(!file)return;
    archivo.disabled=true;archivoEstado.dataset.lectura='';
    archivoEstado.textContent='Leyendo '+file.name+' en el dispositivo…';
    try{
      const t=(await extraerTexto(file)).trim();
      if(t.length<20)throw new Error('No se detectó texto suficiente.');
      fuente.value=t.slice(0,6000);fragmentoEnviado=false;
      archivoEstado.textContent='Archivo leído: '+file.name+'. Revisá el texto antes de enviar. '+
        (t.length>6000?'Se conservaron los primeros 6.000 caracteres. ':'')+
        (archivoEstado.dataset.lectura||'');
      status('El texto todavía no se envió a la IA. Podés conversar sobre el material cuando quieras.');
      fuente.focus({preventScroll:true});
    }catch(e){archivoEstado.textContent='Error: '+e.message;status('Podés pegar el material manualmente.');}
    finally{archivo.disabled=false;}
  });
  $('asesoria-escuchar').addEventListener('click',function(){
    if(!('speechSynthesis' in window)){status('La lectura en voz alta no está disponible en este dispositivo.');return;}
    if(modoVoz){detenerVoz();return;}
    escuchar=!escuchar;this.setAttribute('aria-pressed',String(escuchar));
    this.textContent=escuchar?'🔇 Silenciar':'🔊 Escuchar';
    if(!escuchar)speechSynthesis.cancel();
  });
  function reset(){
    if(trabajando)return;
    if(modoVoz)detenerVoz();
    if('speechSynthesis' in window)speechSynthesis.cancel();
    escuchar=false;
    historial=[];propuestaLista=false;numeroDeRevision=0;fragmentoEnviado=false;
    mensajes.replaceChildren();bubble('modelo',saludo);
    entrega.hidden=true;plan.value='';uso.value='';prompt.value='';
    entrada.value='';fuente.value='';archivo.value='';archivoEstado.textContent='El archivo se lee en tu navegador. Revisá el texto antes de enviarlo a la IA.';permiso.checked=false;
    crear.disabled=true;crear.textContent='✨ Crear propuesta de clase y recurso visual';
    document.getElementById('asesoria-ejemplos').hidden=false;
    status('Escribí con tus palabras. CLARIA puede sugerir opciones y hacerte una pregunta a la vez.');
  }
  $('asesoria-reiniciar').addEventListener('click',reset);
  function transcript(){
    return 'CLARIA · Conversación de orientación docente\n' +
      'Este documento se generó con contenido de la conversación, para revisión profesional.\n\n'+
      historial.map(m=>(m.rol==='modelo'?'CLARIA':'DOCENTE')+'\n'+m.texto).join('\n\n');
  }
  function bajar(blob,nombre){
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=nombre;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
  }
  $('asesoria-descargar-chat').addEventListener('click',function(){
    if(!historial.length){status('Cuando converses con CLARIA vas a poder guardar el intercambio.');return;}
    bajar(new Blob([transcript()],{type:'text/plain;charset=utf-8'}),'CLARIA_Conversacion_Docente.txt');
    status('Conversación descargada. Se guarda en tu dispositivo, no en Bermejo Accesible.');
  });
  function armarContexto(){
    return historial.slice(-14).map(m=>({rol:m.rol,texto:m.texto.slice(0,850)}));
  }
  async function prepararConServicioActual(){
    const resumen=historial.slice(-8).filter(m=>m.rol==='usuario').map(m=>m.texto).join(' | ').slice(-650);
    const fuenteBreve=fuente.value.trim().slice(0,400);
    const p1=['Prepará un BORRADOR BREVE para el docente, a partir de esta conversación:',resumen,
      fuenteBreve?'Material fuente: '+fuenteBreve:'',
      'Incluí título, grado/materia si se conocen, objetivo, explicación conceptual, inicio, 2 actividades específicas, cierre, evaluación y apoyos DUA. No inventes datos del grupo. No hagas preguntas: entregá la propuesta.'].join('\n').slice(0,1490);
    const a=await post('/asistente',{texto:p1,perfil:'docente',confirmacion:true,
      historial:armarContexto().slice(-4).map(m=>({rol:m.rol,texto:m.texto.slice(0,700)}))},33000);
    if(!a.respuesta)throw new Error('No se pudo preparar el borrador de clase.');
    const p2=['Creá un PROMPT para una IMAGEN DIDÁCTICA (NO decorativa) basado en esta clase:',
      a.respuesta.slice(0,480),'Tema indicado: '+resumen.slice(0,300),
      'Indicá elementos concretos y cantidades exactas, una tarea visible (clasificar, contar, unir o resolver), formato de lámina horizontal A4, alto contraste, espacios limpios para que el docente agregue consignas. SIN textos generados en la imagen. Explicá también para qué la usaría el alumnado. Entregá el prompt completo directamente.'].join('\n').slice(0,1490);
    const b=await post('/asistente',{texto:p2,perfil:'docente',confirmacion:true,historial:[]},33000);
    if(!b.respuesta)throw new Error('No se pudo preparar el prompt.');
    return {plan:a.respuesta,usoImagen:'Recurso visual para representar el concepto y realizar una actividad de observación, conteo, clasificación o resolución. El docente debe comprobar su correspondencia con el objetivo curricular.',promptImagen:b.respuesta,
      breve:true};
  }
  crear.addEventListener('click',async function(){
    if(trabajando)return;
    if(!historial.some(x=>x.rol==='modelo')){status('Contame primero qué clase querés preparar y conversemos al menos una vez.');return;}
    if(!permiso.checked){permiso.focus();status('Confirmá el envío a IA antes de convertir el diálogo en un material.');return;}
    if(historial.some(m=>textoSeguro(m.texto))||textoSeguro(fuente.value)){status('Revisá que la conversación y el material no contengan información identificatoria.');return;}
    setOcupado(true,'Organizando lo conversado en una planificación y un prompt visual pedagógico…');
    try{
      let respuesta;
      try{
        respuesta=await post('/asesoria-docente',{accion:'propuesta',confirmacion:true,historial:armarContexto(),
          textoFuente:fuente.value.trim().slice(0,6000)},60000);
      }catch(e){
        if(e.status!==404)throw e;
        respuesta=await prepararConServicioActual();
      }
      if(!respuesta||typeof respuesta.plan!=='string'||typeof respuesta.promptImagen!=='string')throw new Error('El servicio devolvió un material incompleto.');
      // No se reemplazan ediciones manuales sin aviso: las actualizaciones se solicitan con el botón.
      plan.value=respuesta.plan;uso.value=respuesta.usoImagen||'Revisá qué tienen que observar y hacer los estudiantes con la imagen.';
      prompt.value=respuesta.promptImagen;propuestaLista=true;numeroDeRevision++;
      entrega.hidden=false;crear.textContent='✨ Actualizar propuesta con la conversación';
      status(respuesta.breve?'Versión breve con el servicio actual. Para obtener una planificación más completa, publicá el Worker actualizado en Cloudflare.':'Propuesta y prompt listos. Podés editar ambos y descargarlos.');
      entrega.scrollIntoView({block:'start',behavior:'smooth'});
    }catch(e){
      status('No pude crear el material: '+(e.name==='AbortError'?'Gemini tardó demasiado en responder.':e.message));
    }finally{setOcupado(false);}
  });
  function todo(){
    return ['CLARIA · PROYECTO DIDÁCTICO PARA REVISIÓN DOCENTE',
      'PLANIFICACIÓN Y ACTIVIDADES',plan.value,
      'FINALIDAD PEDAGÓGICA DEL RECURSO VISUAL',uso.value,
      'PROMPT PARA GENERAR UNA IMAGEN DIDÁCTICA',prompt.value,
      'OBSERVACIÓN: verificar contenido, cantidades, consignas, legibilidad y posibles sesgos antes de imprimir o utilizar.'].join('\n\n');
  }
  async function copiar(t,msj){
    try{await navigator.clipboard.writeText(t);status(msj);}
    catch(_){status('El navegador no permite copiar automáticamente. Seleccioná el texto y copialo manualmente.');}
  }
  $('asesoria-copiar-plan').addEventListener('click',()=>copiar(plan.value,'Planificación copiada.'));
  $('asesoria-copiar-prompt').addEventListener('click',()=>copiar(prompt.value,'Prompt visual copiado. Pegalo en el generador de imágenes que elijas.'));
  $('asesoria-copiar-todo').addEventListener('click',()=>copiar(todo(),'Clase y prompt copiados.'));
  function biblioteca(src,global){
    if(window[global])return Promise.resolve();
    return new Promise((ok,fail)=>{
      const s=document.createElement('script');s.src=src;s.async=true;
      s.onload=()=>window[global]?ok():fail(new Error('No se pudo cargar la biblioteca de Word.'));
      s.onerror=()=>fail(new Error('No se pudo descargar la biblioteca de Word.'));
      document.head.append(s);
    });
  }
  $('asesoria-word').addEventListener('click',async function(){
    if(!propuestaLista)return;
    status('Preparando Word editable…');
    try{
      await biblioteca('js/vendor/docx.umd.js','docx');
      const D=window.docx,pars=[],agregar=(titulo,contenido)=>{
        pars.push(new D.Paragraph({text:titulo,heading:D.HeadingLevel.HEADING_2,spacing:{before:250,after:150}}));
        contenido.split(/\r?\n/).forEach(line=>pars.push(new D.Paragraph({text:line||' ',spacing:{after:115}})));
      };
      agregar('CLARIA · Planificación y actividades',plan.value);
      agregar('Uso pedagógico de la imagen',uso.value);
      agregar('Prompt para imagen educativa',prompt.value);
      agregar('Sobre el material','Borrador para revisión docente. Verificar las representaciones, consignas, cantidades y fundamentos normativos antes de usar.');
      const documento=new D.Document({sections:[{children:pars}]});
      bajar(await D.Packer.toBlob(documento),'CLARIA_Propuesta_e_Imagen_Pedagogica.docx');
      status('Word editable descargado. Podés corregirlo desde tu computadora.');
    }catch(e){status('No se pudo generar el Word: '+e.message);}
  });
  $('asesoria-imprimir').addEventListener('click',function(){
    if(!propuestaLista)return;
    const caja=$('asesoria-impresion');
    caja.replaceChildren();
    [
      ['CLARIA · Propuesta de clase',plan.value],
      ['Uso pedagógico de la imagen',uso.value],
      ['Prompt para generar la imagen didáctica',prompt.value]
    ].forEach(function(par){
      const h=document.createElement('h2'),p=document.createElement('pre');
      h.textContent=par[0];p.textContent=par[1];
      caja.append(h,p);
    });
    status('Usá Imprimir o Guardar como PDF; se incluirán completos la planificación y el prompt.');
    window.print();
  });
  window.addEventListener('pagehide',()=>{if(modoVoz)detenerVoz();if('speechSynthesis' in window)speechSynthesis.cancel();});
  reset();mostrarRol();
  const params=new URLSearchParams(location.search);
  if(params.get('rol')==='docente')$('claria-rol-docente').click();
});
})();