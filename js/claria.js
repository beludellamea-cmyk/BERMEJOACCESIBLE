/* CLARIA · asistente conversacional de Bermejo Accesible.
   La guía local funciona sin red. La conversación libre con IA requiere /asistente en el Worker.
   Nunca se envían consultas sin consentimiento expreso. No se guardan preguntas. */
(function(){
'use strict';
document.addEventListener('DOMContentLoaded', function(){
  var $ = function(id){return document.getElementById(id);};
  var mensajes=$('claria-mensajes'),atajos=$('claria-atajos'),form=$('claria-form'),texto=$('claria-texto'),
      autorizar=$('claria-autorizar'),estado=$('claria-estado'),enviar=$('claria-enviar'),
      etiqueta=$('claria-etiqueta'),vozBoton=$('claria-voz');
  if(!mensajes||!form) return;
  var ruta=String(window.BERMEJO_CHAT_ENDPOINT||'').replace(/\/$/,'');
  var rostro='https://raw.githubusercontent.com/beludellamea-cmyk/claria-/main/assets/claria-avatar.png';
  var rol='estudiante', historial=[], ocupada=false, voz=false, plan=null;
  var normativas=[
    {nombre:'Resolución 2481/24 · Formosa',url:'https://archivos.formosa.gob.ar/media/uploads/documentos/documento_1720711093.pdf'},
    {nombre:'Resolución CFE 311/16',url:'https://bnm.educacion.gob.ar/digital/normas/RCFE_311-16.pdf'},
    {nombre:'Ley de Educación Nacional 26.206',url:'https://www.argentina.gob.ar/normativa/nacional/ley-26206-123542/actualizacion'},
    {nombre:'DUA 3.0 · CAST',url:'https://udlguidelines.cast.org/'}
  ];
  var entradas=[
    {nombre:'Abrir Comprender',url:'comprender.html'},
    {nombre:'Probar el mismo material de cuatro maneras',url:'comprender.html#demo-titulo'},
    {nombre:'Crear adaptación o actividades',url:'crear.html'},
    {nombre:'Recursos docentes y situaciones del aula',url:'docente.html#consulta'},
    {nombre:'Ver normativa y fuentes',url:'docente.html#normativa'},
    {nombre:'Explorar juegos educativos',url:'juegos.html'}
  ];
  function normalizar(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
  function enlaceValido(x){return normativas.concat(entradas).find(function(y){return y.url===x.url&&y.nombre===x.nombre;})||null;}
  function completarLinks(items){return (items||[]).map(enlaceValido).filter(Boolean).slice(0,5);}
  function burbuja(quien,contenido,links){
    var fila=document.createElement('div');fila.className='claria-mensaje claria-mensaje--'+(quien==='yo'?'yo':'claria');
    var avatar=document.createElement('span');avatar.className='claria-mensaje__avatar';avatar.setAttribute('aria-hidden','true');
    if(quien==='claria'){var img=document.createElement('img');img.src=rostro;img.alt='';img.loading='lazy';avatar.appendChild(img);}
    else avatar.textContent='●';
    var burb=document.createElement('div');burb.className='claria-mensaje__burbuja';
    var cab=document.createElement('span');cab.className='claria-mensaje__nombre';cab.textContent=quien==='yo'?'Vos':'CLARIA';
    var p=document.createElement('p');p.className='claria-mensaje__texto';p.textContent=contenido;
    burb.append(cab,p);
    if(links&&links.length){
      var caja=document.createElement('div');caja.className='claria-mensaje__enlaces';
      completarLinks(links).forEach(function(en){
        var a=document.createElement('a');a.href=en.url;a.textContent=en.nombre+' →';
        if(/^https:\/\//.test(en.url)){a.target='_blank';a.rel='noopener noreferrer';}
        caja.appendChild(a);
      });
      burb.appendChild(caja);
    }
    fila.append(avatar,burb);mensajes.appendChild(fila);mensajes.scrollTop=mensajes.scrollHeight;
    if(quien==='claria'&&voz&&'speechSynthesis' in window){
      speechSynthesis.cancel();var utter=new SpeechSynthesisUtterance(contenido.slice(0,1200));utter.lang='es-AR';utter.rate=.93;
      speechSynthesis.speak(utter);
    }
  }
  function deClaria(r){burbuja('claria',r.texto,r.links||[]);}
  function acceso(nombre){return entradas.find(function(x){return x.nombre===nombre;});}
  function norm(inds){return inds.map(function(i){return normativas[i];});}
  var opciones={
    estudiante:[
      {titulo:'Quiero subir un PDF o foto',consulta:'¿Cómo subo una foto o PDF y elijo cómo comprenderlo?'},
      {titulo:'Escuchar un texto',consulta:'Quiero escuchar un texto que suba'},
      {titulo:'Leer con pictogramas',consulta:'Quiero ver un texto con pictogramas'},
      {titulo:'Probar una demostración',consulta:'Quiero probar las cuatro formas de lectura'},
      {titulo:'Quiero jugar y aprender',consulta:'Quiero explorar juegos educativos'}
    ],
    docente:[
      {titulo:'Conversar para planificar',accion:'clase',consulta:'Quiero planificar una clase'},
      {titulo:'Trabajar con una fotocopia',accion:'material',consulta:'Quiero subir un material'},
      {titulo:'Consultar normativa de Formosa',consulta:'Quiero conocer la Resolución 2481/24 y la normativa inclusiva'},
      {titulo:'Tengo una situación en el aula',consulta:'Necesito orientación sobre una situación de participación en el aula'}
    ]
  };
  function botones(){
    atajos.replaceChildren();
    opciones[rol].forEach(function(o){
      var b=document.createElement('button');b.type='button';b.textContent=o.titulo;
      b.addEventListener('click',function(){
        if(ocupada)return;
        if(o.accion){
          var area=document.getElementById('claria-asesoria');
          if(area){
            area.scrollIntoView({behavior:'smooth',block:'start'});
            var inp=document.getElementById('asesoria-texto');
            if(o.accion==='material'){
              var adjunto=document.getElementById('asesoria-adjunto');
              if(adjunto)adjunto.open=true;
              var f=document.getElementById('asesoria-archivo');if(f)f.focus({preventScroll:true});
            }else if(inp){inp.value=o.consulta;inp.focus({preventScroll:true});}
            return;
          }
        }
        procesar(o.consulta);
      });atajos.appendChild(b);
    });
  }
  function ayudaLocal(pregunta){
    var p=normalizar(pregunta);
    if(rol==='estudiante'){
      if(/jueg|mixlab|detectiv|interactiv/.test(p)) return {texto:'¡También podés aprender jugando! En Juegos y experiencias vas a encontrar MixLab, Detectives del Aula y las propuestas que iremos agregando. Cada experiencia tiene un objetivo para aprender y explorar.',links:[acceso('Explorar juegos educativos')]};
      if(/pictogra|dibujos|imagenes|visual/.test(p))return {texto:'Para leer con pictogramas: entrá en Comprender, elegí Texto, PDF o Foto, revisá el texto y tocá «Con pictogramas». Después elegí Pocos, Equilibrados o Muchos y buscá en ARASAAC. También podés agregar pictogramas a mano.',links:[acceso('Abrir Comprender')]};
      if(/pdf|foto|imagen|carg|subir|texto|escuch|leer/.test(p))return {texto:'Vamos paso a paso:\n1. Abrí Comprender.\n2. Elegí si querés escribir un texto, subir un PDF o sacar una foto.\n3. Revisá que el texto se haya reconocido bien.\n4. Elegí Escuchar, Leer por partes, Con imágenes o Con pictogramas.\nPodés cambiar de opción sin subir el material de nuevo.',links:[acceso('Abrir Comprender')]};
      if(/demostr|probar|cuatro|opciones/.test(p))return {texto:'Para la demostración entrá en Comprender y tocá «Probar una demostración». Se carga el ejemplo del ciclo del agua y podés observar sus cuatro formas de lectura.',links:[acceso('Probar el mismo material de cuatro maneras')]};
      return {texto:'Puedo guiarte para cargar un texto, PDF o foto y elegir cómo comprenderlo. Elegí un botón de arriba o contame qué material tenés. Para explicaciones libres con IA, marcá el permiso de envío cuando el servicio esté disponible.',links:[acceso('Abrir Comprender')]};
    }
    if(/normativ|resolucion|2481|311|ley|ppi|derech|obligac|certificac|inclusion legal/.test(p)){
      return {texto:'Estas son las fuentes que conviene consultar antes de tomar una decisión institucional:\n\n• Resolución 2481/24 de Formosa: marco provincial de orientaciones para la inclusión de estudiantes con discapacidad.\n• Resolución CFE 311/16: orientaciones federales para promoción, acreditación y trayectorias escolares de estudiantes con discapacidad.\n• Ley 26.206: marco nacional de educación.\n\nPuedo ayudarte a localizar los documentos. Para saber qué corresponde en un caso concreto hay que leer los artículos completos y consultar con la institución o supervisión. En modo guía no interpreto obligaciones legales ni invento artículos.',links:norm([0,1,2])};
    }
    if(/dua|clase|planific|secuencia|ensenar|enseñar/.test(p)) {
      return {texto:'Para planificar con DUA: conversá directamente con CLARIA en la sección docente. Podés contarle tu idea, el grado, la materia y cómo es el grupo; ella sugiere opciones y hace preguntas útiles. Cuando esté claro, tocá «Crear propuesta de clase y recurso visual» para obtener un Word y un prompt pedagógico.\n\n• Compromiso: ofrecer opciones para participar y conectar el contenido con experiencias significativas.\n• Representación: combinar explicación oral, texto, imágenes, modelos y vocabulario clave.\n• Acción y expresión: permitir demostrar lo aprendido de distintas maneras, con criterios comunes.\n\nPodés generar la propuesta directamente o entrar a Crear para preparar actividades a partir de un material.',links:[acceso('Crear adaptación o actividades'),normativas[3]]};
    }
    if(/adapt|actividad|fotocopia|material|ejercicio|apoyo|pictogra/.test(p)){
      return {texto:'Para crear una adaptación: entrá a Crear y cargá el material. Elegí materia, grado, objetivos y tipos de apoyos. Podés orientar la propuesta hacia una adaptación o una clase siguiendo el DUA. La IA genera un borrador, que después revisás y editás antes de descargar.',links:[acceso('Crear adaptación o actividades'),normativas[3]]};
    }
    if(/barrera|particip|situacion|aula|frustr|atencion|conducta|evaluacion/.test(p)){
      return {texto:'Empecemos por el entorno de enseñanza, no por el diagnóstico: ¿qué consigna, material, tiempo, forma de comunicación o participación está generando una barrera? Podés probar anticipación, apoyos visuales, opciones para responder oralmente y tiempos flexibles.\n\nLa guía «Contame qué pasa en tu aula» ofrece situaciones preparadas y fuentes para seguir explorando.',links:[acceso('Recursos docentes y situaciones del aula')]};
    }
    return {texto:'Puedo ayudarte a organizar una clase siguiendo el DUA, preparar actividades y adaptaciones, identificar barreras de los materiales o localizar normativa de Formosa y Argentina. Elegí una de las opciones o describí tu consulta sin datos personales. Las respuestas abiertas con IA requieren activar el servicio externo.',links:[acceso('Crear adaptación o actividades'),acceso('Recursos docentes y situaciones del aula')]};
  }
  function planPaso(entrada){
    var t=entrada.trim();
    if(plan.paso==='materia'){
      plan.datos.materia=t.slice(0,80);plan.paso='grado';
      return {texto:'Perfecto. ¿Para qué grado o año querés preparar la clase? Por ejemplo: 6.º grado o 1.º año de secundaria.'};
    }
    if(plan.paso==='grado'){
      plan.datos.grado=t.slice(0,80);plan.paso='tema';
      return {texto:'Ahora contame el tema de la clase. Por ejemplo: tipos de mezclas, fracciones o recursos naturales.'};
    }
    var datos=plan.datos;datos.tema=t.slice(0,120);plan=null;
    return {
      texto:'Esta es una estructura inicial para tu clase (guía local, no generada por IA):\n\nMATERIA: '+datos.materia+'\nNIVEL: '+datos.grado+'\nTEMA: '+datos.tema+'\n\nOBJETIVO: Definir qué concepto o proceso debe comprender el grupo.\n\nINICIO: Recuperar ideas previas y ofrecer opciones para anticipar de qué se tratará.\n\nDESARROLLO: Presentar el contenido de más de una forma (texto claro, imágenes, explicación oral o demostración). Permitir participación individual o colaborativa.\n\nCIERRE: Ofrecer varias maneras de expresar lo aprendido (oral, escrita, gráfica o práctica) con los mismos criterios de logro.\n\nEVALUACIÓN: Observar el aprendizaje con apoyos y devoluciones ajustadas a la tarea.\n\nEsta es una plantilla general: para desarrollar el contenido específico, materiales y actividades utilizá Crear o la conversación con IA cuando esté conectada.',
      links:[acceso('Crear adaptación o actividades'),normativas[3]]
    };
  }
  function parecenDatosPersonales(t){
    return /[\w.+-]+@[\w-]+\.[\w.-]+|\b(?:dni|documento|telefono|teléfono|celular)\s*[:#]?\s*\d{6,}|\b\d{8,11}\b/i.test(t);
  }
  async function solicitarIA(pregunta){
    if(!ruta) throw new Error('No está configurado el servicio externo.');
    var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},27000);
    try{
      var r=await fetch(ruta+'/asistente',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        texto:pregunta,perfil:rol,confirmacion:true,
        historial:historial.slice(-6).map(function(h){return {rol:h.rol,texto:h.texto.slice(0,700)};})
      }),signal:controller.signal});
      var data=await r.json().catch(function(){return {};});
      if(!r.ok || !data || typeof data.respuesta!=='string' || !data.respuesta.trim())
        throw new Error(typeof data.error==='string'?data.error:'El asistente de IA todavía no está disponible.');
      return data.respuesta.slice(0,3200);
    }finally{clearTimeout(timer);}
  }
  async function procesar(entrada){
    if(ocupada)return;
    var q=entrada.trim();if(!q)return;
    if(rol==='docente' && q.length<135 && /(?:planific|preparar|armar|organizar).*(?:clase|secuencia)|(?:clase|secuencia).*(?:planific|preparar|armar)/i.test(normalizar(q))){
      var conversacion=document.getElementById('claria-asesoria');
      if(conversacion){conversacion.scrollIntoView({block:'start',behavior:'smooth'});var campo=document.getElementById('asesoria-texto');if(campo){campo.value=q;campo.focus({preventScroll:true});}estado.textContent='Contale tu idea a CLARIA y conversen antes de crear la propuesta.';return;}
    }
    if(rol==='docente' && q.length<135 && /(?:adapt|resum|simplific|subir).*(?:texto|material|fotocopia|documento|pdf)|(?:texto|material|fotocopia|documento|pdf).*(?:adapt|resum|subir)/i.test(normalizar(q))){
      var adjunto=document.getElementById('asesoria-adjunto');
      if(adjunto){adjunto.open=true;adjunto.scrollIntoView({block:'start',behavior:'smooth'});estado.textContent='Podés adjuntar el material de forma opcional y seguir conversando con CLARIA.';return;}
    }
    if(q.length>1500){estado.textContent='La pregunta es demasiado larga (máximo 1500 caracteres).';return;}
    if(parecenDatosPersonales(q)){estado.textContent='Quitá nombres, DNI, teléfonos y otros datos personales antes de continuar.';return;}
    texto.value='';burbuja('yo',q);
    if(plan && !autorizar.checked){
      deClaria(planPaso(q));estado.textContent='Modo guía local: no se enviaron datos.';return;
    }
    if(!autorizar.checked){
      var g=ayudaLocal(q);deClaria(g);
      estado.textContent='Respuesta guiada local. No se envió tu pregunta.';
      return;
    }
    ocupada=true;enviar.disabled=true;estado.textContent='Consultando la IA…';
    var contexto=historial.slice();
    try{
      var respuesta=await solicitarIA(q);
      var links=rol==='docente' && /normativ|resolucion|ley|2481|311|ppi|obligac|derech/i.test(normalizar(q))?norm([0,1,2]):[];
      if(rol==='docente' && /dua|planific|clase/.test(normalizar(q)))links.push(normativas[3]);
      deClaria({texto:respuesta,links:links});
      historial=contexto.concat([{rol:'usuario',texto:q},{rol:'modelo',texto:respuesta}]).slice(-6);
      estado.textContent='Respuesta de IA. Revisá el contenido antes de usarlo.';
      etiqueta.textContent='Conversación con IA';
    }catch(err){
      var mensaje=String(err.message||'');
      deClaria({texto:'No tengo disponible la conversación libre con IA en este momento. Mientras tanto, te dejo una orientación guiada.\n\n'+ayudaLocal(q).texto,links:ayudaLocal(q).links});
      estado.textContent='IA no disponible: '+(mensaje.includes('Ruta no disponible')?'falta publicar la ruta del asistente en Cloudflare.':mensaje.slice(0,170))+' La guía local sigue funcionando.';
      etiqueta.textContent='Guía interactiva';
    }finally{ocupada=false;enviar.disabled=false;texto.focus({preventScroll:true});}
  }
  function elegirRol(nuevo){
    if(ocupada)return;
    rol=nuevo;historial=[];plan=null;mensajes.replaceChildren();autorizar.checked=false;
    etiqueta.textContent=rol==='docente'?'CLARIA · asistente docente':'Guía interactiva';
    document.querySelectorAll('.claria-rol').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.rol===rol));});
    botones();
    deClaria({texto:rol==='docente'
      ?'¡Hola, profe! Soy CLARIA. Podemos planificar una clase con DUA, buscar ideas de apoyo, preparar adaptaciones y localizar normativa. ¿Qué necesitás resolver hoy?'
      :'¡Hola! Soy CLARIA. ¿Qué te gustaría aprender hoy?'});
    estado.textContent=rol==='docente'
      ?'Para conversar, usá el panel docente. Si querés verificar Gemini, tocá «Comprobar IA» junto al micrófono.'
      :'Guía local disponible. Para hacer preguntas con IA, activá la autorización y comprobá que el servicio responda.';
  }
  document.querySelectorAll('.claria-rol').forEach(function(b){b.addEventListener('click',function(){elegirRol(b.dataset.rol);});});
  form.addEventListener('submit',function(e){e.preventDefault();procesar(texto.value);});
  texto.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();procesar(texto.value);}});
  $('claria-reiniciar').addEventListener('click',function(){elegirRol(rol);texto.value='';});
  if(vozBoton)vozBoton.addEventListener('click',function(){
    if(!('speechSynthesis' in window)){estado.textContent='La lectura por voz no está disponible en este dispositivo.';return;}
    voz=!voz;vozBoton.setAttribute('aria-pressed',String(voz));
    vozBoton.textContent=voz?'🔈 Dejar de escuchar':'🔊 Escuchar a CLARIA';
    if(!voz)speechSynthesis.cancel();
  });
  window.addEventListener('pagehide',function(){if('speechSynthesis' in window)speechSynthesis.cancel();});
  elegirRol('estudiante');
});
})();