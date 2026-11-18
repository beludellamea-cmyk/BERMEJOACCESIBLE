# Bermejo Accesible

## CLARIA integrada: «Decilo con pictogramas» (noviembre de 2026)

- CLARIA en `claria.html` ofrece dos caminos visibles: **Conversar con CLARIA** (mantiene las opciones Quiero aprender y Soy docente) y **Decilo con pictogramas**, accesible también con `claria.html?modo=pictogramas`.
- «Decilo» utiliza el **motor de análisis lingüístico original de CLARIA** (`js/claria-pictos-motor.js`) y el diccionario local `data/claria-pictogramas.json` (261 entradas con identificadores ARASAAC verificados). Conserva conjugaciones y expresiones de varias palabras y señala los términos ambiguos o sin pictograma. Los recursos gráficos se cargan desde `static.arasaac.org` usando únicamente IDs del diccionario; no inventar pictogramas ni asociar automáticamente palabras desconocidas a símbolos arbitrarios.
- El usuario puede **escribir una frase** (280 caracteres), **dictarla** cuando el navegador lo permite, o elegir una de **seis categorías** del tablero `data/claria-tablero.json`: Ayuda, Salud, Escuela, Transporte, Compras y Necesidades básicas. Incluye frases rápidas y selección de palabras para componer mensajes.
- La vista de tarjetas permite **revisar/cambiar símbolos** entre los del diccionario validado (o dejar una palabra como texto), **decir el mensaje en voz alta**, **mostrarlo en pantalla completa** y **descargarlo en PNG o PDF** con `js/claria-pictos-exportar.js`, basado en el módulo de CLARIA original.
- Se preservó la página de conversación y el asistente docente. En la portada, CLARIA ahora se presenta también como apoyo para comunicar mensajes, sin sumar otra sección principal: la navegación general continúa Comprender → Crear → CLARIA → Juegos.
- **Privacidad:** la frase no se envía a Gemini ni requiere un Worker de Cloudflare. El diccionario es local; se descargan los archivos pictográficos del servidor ARASAAC, y la opción de dictado puede usar el servicio de reconocimiento de voz del navegador. La aplicación no almacena el mensaje en un servidor.
- **Licencia de pictogramas:** Sergio Palao, ARASAAC, Gobierno de Aragón, CC BY-NC-SA 4.0, uso no comercial. Verificar las imágenes antes de usarlas para comunicación aumentativa.
- El nuevo módulo está en `js/claria-pictogramas.js` y `css/claria-pictogramas.css`; es independiente del módulo docente. Si fallan las imágenes remotas, permanece el texto como apoyo.


## CLARIA conversacional por voz: primera versión (17/11/2026)

- En `claria.html?rol=docente`, bajo el perfil **Soy docente**, se agregó **Conversar con CLARIA**. Un botón solicita permiso de micrófono y activa, cuando el navegador lo admite, reconocimiento de voz de un turno mediante Web Speech API (`SpeechRecognition` o `webkitSpeechRecognition`) en español de Argentina. El texto reconocido se muestra en el chat y se envía al endpoint `POST /asistente` ya existente.
- CLARIA responde con síntesis de voz del navegador (`speechSynthesis`) y, al terminar el audio, intenta escuchar nuevamente para mantener turnos de conversación. La persona puede detenerlo con el mismo botón, cambiar de perfil, desmarcar el consentimiento o cerrar la página. Se suspende si hay errores de permiso, red o servicio, y se muestra texto alternativo. Si falla el reinicio automático (frecuente en móviles), el usuario debe tocar nuevamente para reanudar.
- El avatar existente está acompañado de un **halo y barras de voz animadas** con estados Escuchando/Pensando/Hablando. **No es sincronización labial real, no usa un motor de video ni una voz neuronal premium**. Las animaciones respetan `prefers-reduced-motion` y las transcripciones quedan visibles para accesibilidad.
- El reconocimiento de voz puede transmitir audio a servidores del proveedor del navegador. Se pide autorización explícita junto al botón y se recomienda no mencionar nombres ni datos identificatorios de estudiantes. Las consultas de texto y el historial reciente se envían al Worker de IA con consentimiento; no se guardan grabaciones ni historial persistente en Bermejo Accesible.
- **Cloudflare:** la conversación oral reutiliza la ruta existente `/asistente`, por lo que no requiere volver a desplegar el Worker si esa ruta ya funciona. La función **Crear propuesta de clase y recurso visual** sigue requiriendo desplegar la ruta ampliada `/asesoria-docente` para obtener el documento más extenso y el prompt educativo completo. La interfaz tiene una alternativa breve cuando esa ruta aún no fue publicada.
- Para un humano digital con sincronización labial precisa y voz premium en tiempo real se necesitaría otra integración (servicio de avatar/TTS y autorización/credenciales), que no forma parte de esta implementación. Verificar funcionamiento en navegador y dispositivo real; las API de voz no tienen soporte uniforme.


## CLARIA docente: conversación, planificación y prompt para imagen didáctica (17/11/2026)

- El perfil **Soy docente** ya no obliga a seleccionar grado, materia y tema en un formulario. Muestra el avatar de CLARIA y un chat para conversar libremente sobre una planificación, las características generales de un grupo y los apoyos DUA. Puede hacer preguntas de seguimiento; el historial reciente acompaña cada consulta. La ruta conversacional existente **`POST /asistente`** sigue activa.
- El docente puede describir necesidades de apoyo sin identificar a estudiantes; la página advierte contra enviar nombres, DNI, correos u otros datos personales. Se requiere consentimiento explícito antes de enviar el contenido al servicio de IA. La conversación se mantiene **solo en memoria de la pestaña**; se puede guardar localmente como TXT.
- Como recurso opcional y secundario, se puede pegar un texto o cargar PDF, PNG, JPG, WEBP o TXT. PDF.js y Tesseract.js extraen texto **en el navegador** para que el docente lo revise antes de enviarlo. Solo se usan hasta 6.000 caracteres de material fuente en la generación ampliada y un fragmento contextual en el diálogo.
- Una vez conversada la clase, el botón **Crear propuesta de clase y recurso visual** transforma los mensajes en una planificación editable con contenido explicado, texto accesible, síntesis, inicio, actividades concretas, cierre, evaluación y apoyos DUA. Aparece debajo del chat y permite seguir conversando, actualizar, copiar, descargar en Word o imprimir/guardar como PDF.
- La propuesta incluye **usoImagen** (objetivo, momento de clase, consigna y evidencia) y **promptImagen** para generar una lámina/actividad con función pedagógica, no una ilustración decorativa. El prompt prioriza exactitud conceptual y matemática, espacios para resolver, alta legibilidad y comprobación docente. **No genera una imagen automáticamente**: el texto se copia al servicio de generación que elija el docente.
- La generación ampliada usa la ruta nueva `POST /asesoria-docente` del Worker `backend/chat-worker.js`; **requiere actualizar manualmente `bermejochat` en Cloudflare**. Mientras esa ruta no esté publicada, la interfaz intenta un borrador **breve** y un prompt mediante dos consultas a la ruta `/asistente` ya publicada, identificando claramente su limitación. No confundir el éxito de GitHub Pages con la activación del Worker.
- La nueva interfaz está en `js/claria-asesoria.js` y `css/claria-asesoria.css`. Se conserva `js/claria.js` para el perfil **Quiero aprender**, y las rutas anteriores `/aula`, `/docente` siguen disponibles para compatibilidad. El script antiguo `js/claria-aula.js` ya no se carga en la página.
- Verificar el contenido antes de usarlo: DUA 3.0 es un marco de diseño, las normas son referencias para consulta y el modelo puede equivocarse. No se garantizan pictogramas ni imagen generada sin utilizar la herramienta adecuada.



### Fracciones · Alimentos reales (noviembre de 2026)

- Se incorporó al catálogo de `juegos.html` un enlace a `https://baezkaren113-collab.github.io/Detectives-del-aula/fracciones/`, alojado en el repositorio de Detectives del Aula. Se abre el proyecto original en una pestaña nueva; no se copian ni modifican los archivos externos.
- Recurso de Matemática con estaciones para introducir la fracción como parte de un todo, leer numerador/denominador, unir figuras y fracciones, comprobar verdadero o falso, construir fracciones y trabajar equivalencias. Incluye un laboratorio visual con alimentos.
- El catálogo ahora contiene cuatro experiencias: MixLab, NUMI, Detectives del Aula · LETI y Fracciones. No requiere actualizar el Worker de Cloudflare.


### NUMI · La aventura de las 4 operaciones (noviembre 2026)

- Se incorporó el juego **NUMI** a `juegos/numi.html`, a partir del archivo HTML original proporcionado por la usuaria. La página funciona como juego autónomo, sin backend ni recursos externos obligatorios. Acceso en `juegos.html` mediante tarjeta propia.
- Cuatro mundos: suma, resta, multiplicación y división. Cada uno propone tres misiones con tres niveles de dificultad, manipulación de objetos mediante clic/táctil o arrastre, consignas por voz, pistas, ejemplos, opciones de accesibilidad, pausas y recompensas. Los avances se guardan localmente en el navegador.
- El juego se abre en una pestaña nueva para no interferir con la interfaz de Bermejo Accesible; su estilo visual se mantiene independiente. La experiencia NO usa IA en tiempo real para generar las operaciones.
- No requiere nueva publicación del Worker de Cloudflare. Para próximos juegos, incorporar otro HTML autocontenido en `juegos/` o enlace externo y una tarjeta con objetivos pedagógicos en `juegos.html`.


## Juegos y experiencias interactivas (17/11/2026)

- Nueva sección `juegos.html`, con identidad nocturna de Bermejo Accesible, accesible desde la **portada**, el **menú principal** y **Explorar más**.
- **MixLab · Misión Mezclas:** enlace al proyecto original `https://beludellamea-cmyk.github.io/MixLab/`; portada del proyecto con dos recorridos: Clase (acompañante accesible) y Laboratorio (juego interactivo con Nova y misiones de clasificación y separación de mezclas).
- **Detectives del Aula · LETI:** enlace al proyecto original `https://baezkaren113-collab.github.io/Detectives-del-aula/leti/` como experiencia interactiva externa. No se modifica el código de terceros ni se afirma que todos los juegos usan la misma tecnología.
- Para **agregar nuevos proyectos**, duplicar uno de los `<article class="juego-tarjeta">…</article>` dentro de `<div class="juegos-grilla">` en `juegos.html` y personalizar título, propósito educativo, descripción y URL verificada. Mantener `target="_blank" rel="noopener noreferrer"` para páginas externas, e indicar que se abren en otra pestaña. No poner botones falsos para proyectos futuros.
- Esta colección refuerza el enfoque pedagógico: la IA es una herramienta para construir experiencias significativas y accesibles, pero las actividades siguen necesitando objetivos y revisión docente. Juegos externos pueden tener opciones de accesibilidad diferentes de las de Bermejo.
- No se necesitan cambios en Cloudflare para la sección de Juegos; funciona con enlaces web externos.



## CLARIA Aula: un solo formulario docente (17 de noviembre de 2026)

- En `claria.html?rol=docente` el docente puede escribir **tema** o subir PDF, foto o TXT, escoger **grado/año y materia**, confirmar que el material no incluye datos personales y presionar **Preparar mi clase y materiales**. No tiene que elegir entre «planificar», «adaptar» o «resumir» previamente.
- El resultado aparece en la misma página, por secciones: clase desarrollada, texto adaptado, resumen, actividades, evaluación y apoyos DUA. Pictogramas ARASAAC e ilustraciones locales se muestran junto al texto adaptado cuando hay coincidencias (las palabras del material no se envían completas a ARASAAC).
- Cada sección tiene **Modificar**, edición manual y un campo opcional para pedir cambios a CLARIA; la regeneración afecta solo el apartado seleccionado. Copiar todo, Word editable (texto) e impresión/PDF (contenido visual) están disponibles.
- El nuevo endpoint Cloudflare **`POST /aula`** en `backend/chat-worker.js` genera todo junto y permite modificar una sección. **El frontend publicado en GitHub Pages no basta: actualizar por separado el Worker `bermejochat` en Cloudflare** copiando el archivo completo y haciendo Deploy; mantener `GEMINI_API_KEY` y `ALLOWED_ORIGIN` configurados. Si la ruta `/aula` todavía no existe, la pantalla informa la actualización pendiente sin inventar resultados.
- Las explicaciones deben revisarse por el docente y los fundamentos normativos son referencias para lectura, no artículos verificados automáticamente ni asesoramiento legal. El DUA se trata como marco de diseño, no como ley.



## Diagnóstico de Gemini y CLARIA — 17/11/2026

Si CLARIA dice «La IA no respondió», el Worker alcanzó la API de Gemini pero esta devolvió un error no exitoso; no asumir que se trata de un fallo del HTML. El archivo `backend/chat-worker.js` diferencia ahora errores 400 (configuración/modelo), 401/403 (clave/permisos), 404 (modelo), 429 (cuota), 5xx (servicio saturado) y tiempos de espera en `/docente` y `/asistente`, sin exponer secretos. Se optimizó el presupuesto de razonamiento para modelos Flash compatibles. Para habilitarlo hay que desplegar manualmente el Worker `bermejochat` desde este archivo, conservando los secretos. En Cloudflare: Workers & Pages → bermejochat → Observability → Logs → Live; ejecutar una prueba y consultar el mensaje de `Gemini status (...)` en registros. No enviar a terceros claves, identificadores o texto privado del material.


## CLARIA docente: clases y materiales sin chat largo (17/11/2026)

- En `claria.html?rol=docente`, el perfil docente presenta tres opciones directas: **Preparar una clase**, **Adaptar o resumir** y **Consultar a CLARIA**. No exige responder preguntas una por una.
- **Clase**: seleccionar grado/año, materia y tema; opcionales objetivo y duración; con confirmación de privacidad se genera explicación del tema, actividades, cierre, evaluación y apoyos DUA, en un borrador editable.
- **Material**: seleccionar grado/año, materia; pegar texto o extraerlo de PDF, JPG, PNG, WEBP o TXT en el navegador; revisar OCR; seleccionar adaptar o resumir y presentación (texto, partes, pictogramas ARASAAC o imágenes de la colección local), editar y descargar Word o imprimir/PDF. Los Word descargan texto editable; para conservar imágenes usar impresión/PDF de la vista previa.
- **IA ya desplegada**: la pantalla usa la ruta `/asistente` para clases breves y resúmenes parciales y `/adaptar` para textos adaptados si `/docente` aún no existe. Advierte si solo se procesó parte del material. La API limita la extensión: **NO afirmar que resume archivos enteros hasta desplegar el nuevo Worker**.
- **IA ampliada pendiente de desplegar**: el archivo `backend/chat-worker.js` incluye ahora `POST /docente` para producir clases completas y adaptar/resumir hasta 8.000 caracteres. **Hay que copiar el archivo actualizado a Cloudflare Workers (proyecto bermejochat) y desplegarlo**; GitHub Pages solo publica la interfaz. Conservar `GEMINI_API_KEY` como secreto y `ALLOWED_ORIGIN=https://beludellamea-cmyk.github.io`.
- La guía y el chat general de CLARIA siguen disponibles. La normativa aparece como documentos de consulta: el DUA es un marco de diseño educativo y no equivale a una ley ni a un dictamen jurídico.


## CLARIA: asistente educativa integrada (noviembre 2026)

- **claria.html** presenta a CLARIA con la imagen original de la asistente del repositorio propio `beludellamea-cmyk/claria-`, en dos perfiles: «Quiero aprender» y «Soy docente». Es la puerta principal sugerida desde la portada y está en el menú.
- **Guía local, sin IA**: ofrece recorridos, botones de acceso a Comprender/Crear, orientaciones sobre apoyo DUA y fuentes oficiales de normativa. También guía al docente para preparar un esqueleto de clase (materia, grado/año, tema; inicio, desarrollo, cierre y evaluación). Las respuestas guiadas no se presentan como generación de IA.
- **Conversación con IA, condicionada al despliegue**: el nuevo `POST /asistente` se programó en `backend/chat-worker.js`, pero **editar GitHub no publica el Worker**. Para activar respuestas abiertas, hay que desplegar manualmente el Worker nuevo en Cloudflare, conservar `GEMINI_API_KEY` como secreto y verificar `ALLOWED_ORIGIN`. La web pide consentimiento explícito antes de enviar consultas sin datos personales, ofrece límites y conserva la conversación solo en memoria.
- **Normativa**: las orientaciones incluyen enlaces a la Resolución 2481/24, la Resolución CFE 311/16 y la Ley de Educación Nacional 26.206; verificar siempre el texto oficial y su vigencia. La IA no debe inventar artículos ni ofrecer dictámenes jurídicos.
- **DUA**: la guía docente sigue los tres principios de CAST 3.0: compromiso, representación y acción y expresión. La revisión docente es obligatoria antes de usar propuestas generadas.



## Mejoras para demostrar Comprender y generar propuestas DUA (noviembre 2026)

- En **Comprender**, el botón «Probar una demostración» carga el ejemplo del ciclo del agua y abre directamente la selección de las cuatro formas de lectura: Escuchar, Por partes, Con imágenes y Con pictogramas. La carga real sigue siendo Texto/PDF/Foto y la revisión del contenido permanece.
- En «Con pictogramas», ahora se puede escoger **Pocos (3)**, **Equilibrados (6)** o **Muchos (9)** por bloque; se buscan más palabras, incluidas palabras breves como «sol» y variantes comunes del español, usando la API de búsqueda de ARASAAC. La persona confirma la búsqueda antes de enviar palabras sueltas y puede agregar o quitar pictogramas manualmente. La disponibilidad depende del catálogo y de la conexión; no se garantiza un pictograma por palabra.
- En **Crear**, una guía breve explica las tres dimensiones DUA: representación, acción y expresión, y compromiso/participación. Se puede dar énfasis a una **adaptación del material** o a una **propuesta de enseñanza**. La selección orienta la solicitud enviada al Worker usando el campo de objetivos libres existente; el formato final sigue siendo un borrador revisable y editable.
- La IA debe estar activada en Cloudflare para que el laboratorio genere respuestas reales. No se debe afirmar que hay resultados de IA garantizados sin probar ese servicio.


## Rediseño integral (versión actual)

**Bermejo Accesible: la información a tu manera.** La portada tiene solo dos accesos:

- **Comprender** (`comprender.html`): asistente de tres pasos. 1) Cargar un texto, PDF o foto. 2) Revisar el contenido (con lectura fácil con IA opcional). 3) Elegir cómo acceder: escuchar, leer por partes, con imágenes o con pictogramas. Los ajustes de lectura, letra y colores, y la actividad con IA, están en paneles desplegables.
- **Crear** (`crear.html`): espacio docente de cinco pasos (contenido, ajustes, generar, revisar, descargar) con el Laboratorio de adaptaciones accesibles con IA, pictogramas de ARASAAC, fotos libres de Wikimedia Commons, editor, aprobación docente y descarga en Word, HTML o PDF.
- **Explorar más** (`explorar.html`): recursos para docentes, normativa, chat intercultural, guía de lectores de pantalla y privacidad.

El botón **Accesibilidad** (arriba a la derecha) reúne tamaño de texto, imprenta mayúscula, alto contraste y la ayuda por voz y guía. Ya no hay diálogo de bienvenida ni botón flotante.

`material.html` quedó como aviso de mudanza hacia Comprender y Crear, para no romper enlaces viejos. Se eliminaron `estilos.css`, `renovacion.css`, `laboratorio.css` (ahora todo está en `css/bermejo.css`) y cuatro scripts que ninguna página usaba.

**Para activar la IA:** subí los archivos estáticos a GitHub Pages y actualizá el Worker `bermejochat` con `backend/chat-worker.js`. Las funciones usan `POST /adaptar`, `POST /actividad` y `POST /laboratorio`. Mantené `GEMINI_API_KEY` como secreto y `ALLOWED_ORIGIN` como origen exacto; revisá cuotas y condiciones del proveedor antes del uso escolar. Antes de cada envío se exige confirmar que se quitaron datos personales, y ninguna propuesta de IA se aplica sin revisión docente.

## Laboratorio de adaptaciones accesibles con IA (etapas 1 y 2)

En el paso 3 de `material.html`, debajo de «Trabajar con mi material», hay una sección nueva. No reemplaza nada de lo anterior.

1. **Formulario:** materia, grado o año (1.º–7.º de primaria, 1.º–6.º de secundaria), objetivos pedagógicos, apoyos (pictogramas, vocabulario, anticipación, esquema, ejemplos, repaso), niveles de apoyo en las actividades (autónomo, con pistas, con paso a paso), cantidad de apoyos visuales (pocos, moderados, muchos; por defecto «pocos» desde 5.º grado) y hasta cuatro formatos de actividad.
2. **Propuesta de IA:** ruta nueva `POST /laboratorio` del Worker. Es independiente de `/`, `/adaptar` y `/actividad`. Valida y recorta toda la salida de la IA. El texto del material se trata como dato no confiable. Hay que **volver a publicar `backend/chat-worker.js`** en Cloudflare; la clave sigue siendo un secreto del Worker.
3. **Pictogramas:** `js/pictogramas-arasaac.js` usa la API oficial de ARASAAC (`/v1/pictograms/es/search/{palabra}`). Tras la propuesta se muestran las palabras que se enviarán y recién al pulsar «Buscar pictogramas en ARASAAC» se consultan, una por una. Cada pictograma se puede cambiar eligiendo entre opciones con su significado, buscar otra palabra, agregar o dejar solo texto. Los pictogramas con contenido sexual o violento no se eligen solos; se pueden incluir a mano (ESI, Historia).
4. **Revisión docente:** todo es editable (títulos, textos, vocabulario, actividades, pistas). Para descargar o imprimir hay que marcar la aprobación docente. Se puede ver una vista previa y elegir si se incluyen pistas, paso a paso y la página de respuestas.
5. **Apoyos visuales:** pictogramas de ARASAAC o, como alternativa, fotos reales de Wikimedia Commons (solo licencias libres: CC BY, CC BY-SA, CC0, dominio público). Cada foto lleva su crédito en el archivo. Las consultas a ARASAAC y a Wikimedia se hacen solo cuando la docente pulsa el botón.
6. **Distribución:** tamaño de los apoyos visuales (pequeño, mediano, grande), tamaño de letra, cada actividad en página nueva y botones Subir/Bajar para reordenar partes y actividades.
7. **Salida:** Word editable (`.docx`, con texto alternativo en las imágenes), archivo `.html` autónomo e impresión o «Guardar como PDF» desde el navegador. Se habilita solo tras la aprobación docente.

Límite de uso: el Worker acepta 10 pedidos por IP cada 10 minutos en `/laboratorio` (variable opcional `LAB_LIMITE`). Es un límite aproximado por instancia; para uno estricto, sumá una regla de Rate Limiting en Cloudflare.

Nota: la búsqueda de fotos en Wikimedia Commons se probó con respuestas simuladas; conviene verificarla en vivo una vez publicado. El archivo `js/vendor/docx.umd.js` es la librería docx 8.5.0 (MIT).

Archivos nuevos: `js/laboratorio.js`, `js/laboratorio-exportar.js`, `js/pictogramas-arasaac.js`, `css/laboratorio.css`.

**Privacidad:** el texto y las opciones se envían al Worker y al proveedor de IA solo después de marcar la confirmación. A ARASAAC solo van palabras sueltas, tras otra acción explícita. No se guarda nada en el navegador.

**Probado (Chromium + Playwright, noviembre de 2026):** 12 pruebas del Worker con IA simulada; 44 del recorrido completo con la API real de ARASAAC; 29 de accesibilidad (axe-core WCAG 2.2 AA, teclado, alto contraste, 320/375/640 px, texto al 200 %). **Pendiente:** IA real con la clave configurada y lectores de pantalla reales (NVDA, TalkBack, VoiceOver).

## Chat intercultural con IA (requiere conectar un servicio)

`qom.html` es una conversación presencial en un solo dispositivo. El estudiante puede escribir en qom, wichí, pilagá, nivaclé o guaraní; el docente escribe en español. La IA intenta traducir **cualquier frase nueva**, no usa un repertorio cerrado. Conserva hasta seis turnos de contexto para interpretar respuestas cortas; ambos textos se ven juntos. Cada traducción se identifica como automática y puede corregirse en la página. No es una conversación entre celulares. Los mensajes no se guardan al recargar.

**La traducción no estará activa hasta completar los siguientes pasos.** El ZIP trae todo el código, pero no trae claves de terceros ni un servicio de IA alojado. GitHub Pages no ejecuta `backend/chat-worker.js`. La clave **nunca** se pega en un archivo de GitHub.

1. Creá una clave de la [API de Gemini en Google AI Studio](https://aistudio.google.com/app/apikey). La disponibilidad y los límites del servicio dependen de esa cuenta. No pegues la clave en el chat ni en el repositorio.
2. Creá un [Cloudflare Worker desde el panel](https://developers.cloudflare.com/workers/get-started/dashboard/) y pegá el contenido de `backend/chat-worker.js` como código del Worker. Publicalo para obtener su URL `https://…workers.dev`.
3. En **Settings → Variables and Secrets** del Worker, agregá `GEMINI_API_KEY` como **Secret** (valor: la clave obtenida en Google AI Studio). Agregá `ALLOWED_ORIGIN` como variable de texto con el origen exacto `https://beludellamea-cmyk.github.io`. Si tu repositorio pertenece a otra cuenta, reemplazá el origen. Opcional: `GEMINI_MODEL` con el identificador de un modelo compatible; el código usa `gemini-2.5-flash` si se omite.
4. Este ZIP ya trae en `js/chat-config.js` la URL pública `https://bermejochat.beludellamea.workers.dev/`. Subí los archivos del sitio a GitHub Pages. Si cambiás de Worker en el futuro, actualizá solo esa dirección. Nunca subas la clave.
5. Probá un mensaje nuevo que no esté en ningún diccionario, por ejemplo «Hola, ¿cómo estás?» escrito por el docente. Luego seleccioná «Estudiante» y probá responder en la lengua elegida. **No des por correcta una frase indígena solo porque la IA la generó**: hacela revisar por una persona hablante de la variedad local antes de presentar su contenido como traducción fiable.

El servicio hace una traducción **experimental** con un modelo general. No se probó que Gemini traduzca bien todas las lenguas ofrecidas. La investigación [QomL’aqtaqa (2026)](https://aclanthology.org/2026.americasnlp-6.17/) describe modelos especializados para qom ↔ español, pero tampoco garantiza resultados adecuados para conversaciones escolares locales. Para avanzar conviene evaluar mensajes con docentes bilingües y representantes de cada comunidad. El servicio recibe los mensajes para procesarlos; evitá datos personales y revisá las condiciones de privacidad y cuotas de Google antes de usarlo con estudiantes.

**La información a tu manera.**

**Navegación reorganizada.** En computadora, las secciones están en una lista lateral con la página actual marcada por texto, subrayado y borde. En celular, el botón «Menú» muestra esa misma lista y se puede cerrar con Escape. Los ajustes de accesibilidad se abren desde el botón de la cabecera o el menú lateral. El inicio presenta tres caminos: material, espacio docente y chat intercultural. La información extensa queda dentro de «Más información sobre el sitio y las opciones de lectura». Tres formas principales de lectura se eligen en el paso 3; las seis formas permanecen disponibles, después de cargar y revisar un material. El enlace «Ir al contenido» sigue disponible en todas las páginas.



### Ayuda accesible

La ayuda se reúne en «Estoy perdido». El panel guía por escrito según la página y el paso. «Escuchar indicación» activa la voz cuando se pulsa; también permite repetirla o apagarla. No se usa micrófono.

Bermejo Accesible es una web para sacar el texto de un material (texto pegado, PDF o foto) y leerlo de la forma que mejor le sirva a cada estudiante. También tiene un espacio para docentes con:
- una consulta por situación,
- una guía para detectar barreras,
- ideas prácticas,
- normativa provincial y nacional, con la Resolución 2481/24 de Formosa destacada.

Proyecto creado para una hackatón en Formosa sobre barreras de acceso a la información y la educación. Antes se llamaba «Abrapalabra».

**Ejemplos situados para la demostración:** «Ciencias Sociales: el río Bermejo y El Colorado» es un texto didáctico original, con una página simulada como PNG y el mismo contenido en TXT; no es una página oficial ni de un estudiante real. Su ubicación geográfica se contrastó con la [reseña de El Colorado publicada por el Gobierno de Formosa](https://m.formosa.gob.ar/noticia/10511/61/el_colorado_feriarte__). También se incluye una página auténtica del material de Geografía de Formosa aportado por el equipo (`ejemplos/geografia-formosa-pagina-6.pdf`, módulo 1, página 6), para demostrar la lectura de un PDF real. El ejemplo creado y el PDF real son materiales diferentes.

**Apoyo visual:** el ejemplo de Sociales y la página de Geografía permiten mostrar escenas ilustrativas con texto alternativo dentro de las formas de lectura. Son escenas generales y no mapas precisos.

## Qué hace

### Ajustes de lectura (en todas las páginas)

**Letra: IMPRENTA MAYÚSCULA / Texto habitual.** La web arranca en imprenta mayúscula. Se puede cambiar desde cualquier página, incluida la portada, y la elección se recuerda en ese navegador.

- **Cómo funciona.** El modo mayúscula **no cambia el texto**: usa una fuente propia, «Bermejo Mayúscula», que dibuja cada minúscula con la forma de su mayúscula. Por eso los lectores de pantalla, la lectura en voz alta, la búsqueda, el copiado y el archivo `.txt` descargado reciben el texto original, con nombres, siglas y archivos tal como fueron escritos.
- **Por qué no se usa `text-transform`.** La forma habitual de poner mayúsculas con CSS no sirve acá: al probarla, Chrome le pasaba al lector de pantalla el texto ya transformado.
- **Qué no se transforma.** Los campos donde se escribe o se corrige, los nombres de archivo y la muestra «Aa» se ven siempre como están escritos. Así se puede revisar bien el texto.
- **Tipo de letra en la lectura.** Con imprenta mayúscula activa, el tipo de letra elegido en «Lectura ajustable» no se aplica, y la página lo avisa.

**Tamaño del texto** (del 100 % al 200 %), **contraste** (normal o alto) y **Restablecer ajustes**.

### Ayuda guiada en todas las páginas

El botón «Necesito ayuda» está disponible en la portada, el recorrido del estudiante y el espacio docente. Al abrirlo, muestra orientación y acciones distintas según la página y el paso visible. La voz se activa solo con «Escuchar indicación» y se puede apagar; todo lo dicho está también escrito. No usa micrófono ni interpreta preguntas abiertas.

La ayuda usa símbolos junto al texto; cada botón conserva su nombre escrito. La orientación hablada está dentro del panel y comienza solo cuando se pulsa «Escuchar indicación».

### Acceder a mi material (`material.html`)

Funciona en tres pasos:

1. **Cargar el material.** Se puede pegar texto, subir un PDF, subir una foto o sacarla con la cámara; hay ejemplos opcionales en un apartado desplegable.
2. **Revisar el texto.** El texto extraído se puede editar. Se puede volver al texto extraído, descargarlo como `.txt` y ver el original.
3. **Elegir cómo leer**, entre seis formas:

   - lectura ajustable,
   - alto contraste,
   - lectura en voz alta con controles,
   - por partes,
   - texto con imágenes (dibujos propios, solo si corresponden),
   - texto con pictogramas de ARASAAC (solo si hay uno con esa misma palabra).

Al final del paso 3, **«Descargar esta versión adaptada (.html)»** guarda la forma de lectura elegida en un archivo que se abre con cualquier navegador. Conserva el texto corregido, los ajustes visuales, las partes y los dibujos que se ven en pantalla. Desde el navegador se puede imprimir o guardar como PDF. En modo voz, el archivo incluye botones para escuchar y detener la lectura (depende de las voces del dispositivo); no genera un archivo de audio. Intenta incluir los pictogramas en el archivo; si el navegador no permite descargarlos, algunas imágenes necesitan conexión a internet, y el texto alternativo sigue disponible. La descarga se prepara en el navegador, sin enviar el material a un servidor.


### Espacio docente (`docente.html`)

- **Contame qué pasa en tu aula** (sección nueva, antes de la guía y de la normativa):
  - **Qué hace.** El docente describe la situación sin datos personales. Para cada caso preparado se muestran la **barrera posible**, **acciones pedagógicas concretas** y el **fundamento con enlace**. La **Resolución 2481/24** aparece destacada como norma provincial.
  - **Casos preparados:**
    - le cuesta leer textos largos;
    - no entiende las consignas;
    - no ve bien;
    - estudiante ciego o que usa lector de pantalla;
    - no escucha bien o es sordo;
    - le cuesta escribir o responder por escrito;
    - se distrae en tareas largas;
    - habla otra lengua en su casa;
    - materiales en foto o PDF escaneado.
  - **Si la situación no coincide con ningún caso**, lo dice claramente, no inventa acciones y ofrece los temas preparados.
  - **Si la consulta es legal o administrativa** («¿es obligatorio…?», «¿me pueden sancionar…?»), aclara que no responde eso y deriva a dirección, supervisión o el área legal.
  - **Si detecta algo que parece un dato personal** (documento, teléfono, correo o nombre), avisa que no hace falta y pide borrarlo.
  - **Privacidad.** Todo se procesa en el navegador: la consulta no se envía ni se guarda.
  - **Cómo decide.** Busca palabras clave en la situación descripta. No usa inteligencia artificial ni un servidor.
- **Guía para detectar barreras**: 14 puntos con fuentes.
- **Ideas prácticas.**
- **Revisor de texto.**
- **Biblioteca de normativa**: 10 normas filtrables. El buscador sigue disponible como consulta adicional.

Todo el contenido docente está marcado como **sujeto a revisión docente**.

## Estructura

```
index.html              Portada: Comprender y Crear
comprender.html         Asistente de tres pasos para comprender un material
crear.html              Asistente de cinco pasos para crear adaptaciones con IA
explorar.html           Explorar más: recursos, normativa, chat, guías
docente.html            Recursos para docentes
qom.html                Chat intercultural presencial con traducción de IA
material.html           Aviso de mudanza (redirige a Comprender)
icono.svg               Ícono de la pestaña
img/                    Logo, ilustración de la portada y logo con nombre
css/bermejo.css         Hoja de estilos única (tokens, componentes, herramientas)
js/navegacion.js        Menú, panel de Accesibilidad y acceso a la ayuda
js/preferencias.js      Letra, tamaño y contraste de todo el sitio
js/asistente-global.js  Ayuda escrita y por voz (se abre desde Accesibilidad)
js/material.js          Carga y revisión de texto; los modos de lectura de Comprender
js/crear.js             Indicador de cinco pasos de Crear
js/laboratorio*.js      Laboratorio: adaptación con IA, editor, Word y HTML
js/pictogramas-arasaac.js  Búsqueda y selección de pictogramas y fotos
js/descargar-material.js   Descarga de la versión adaptada como HTML
js/ia-material.js       Lectura fácil y actividad con IA (Comprender)
js/ilustraciones.js     Dibujos para «Texto con imágenes»
js/docente.js, consulta.js, qom.js, chat-config.js
js/vendor/              Librería docx (MIT) para el Word
backend/chat-worker.js  Servicio para Cloudflare Workers (clave en secreto)
fuentes/                Licencia de la fuente «Bermejo Mayúscula»
ejemplos/               Materiales de prueba (TXT, PDF y foto)
```

## El logo

El logo es un libro abierto. Una curva, como un meandro del río Bermejo, cruza sus dos páginas, en un tono rojizo que recuerda el color del agua de ese río. El nombre «Bermejo Accesible» va escrito al lado del símbolo, con la frase «La información a tu manera».

En alto contraste, el libro se dibuja en amarillo y el río en blanco. Se probó en 16, 24, 32, 48 y 96 píxeles, sobre fondo claro y sobre fondo negro.

## Abrir y probar en la computadora

- **Opción rápida:** doble clic en `index.html`.
- **Opción recomendada:** `python3 -m http.server 8000` dentro de la carpeta y abrir `http://localhost:8000`.

La lectura de PDF y fotos, la tipografía Atkinson Hyperlegible y los pictogramas necesitan internet la primera vez. La fuente de mayúsculas está incluida y funciona sin conexión.

## Cómo probar cada función

1. **Portada.**
   - Recorrer con `Tab`: el primer elemento es «Ir al contenido»; después vienen el logo, el menú y los ajustes.
   - Cambiar entre «Imprenta mayúscula» y «Texto habitual», recargar y comprobar que se recuerda.
2. **Estudiante.**
   - Cargar el ejemplo o subir `ejemplos/ciclo-del-agua.pdf` o `ejemplos/ciclo-del-agua-foto.png`.
   - Corregir el texto y recorrer las seis formas de lectura.
   - Para la demostración de Sociales, pulsar «Probar el ejemplo de Sociales», revisar el texto y mostrar voz, partes e imágenes. Después descargar el PNG «página de cuaderno de ejemplo», cargarlo en «Foto de tu material» y corregir cualquier palabra que el reconocimiento automático haya leído mal. Por último descargar la versión adaptada e imprimirla o guardarla como PDF.
   - Para el material real de Geografía, descargar `ejemplos/geografia-formosa-pagina-6.pdf` desde la misma sección, cargarlo en «Subir un PDF» y pulsar «Leer el PDF». Revisar el texto extraído: el original está en dos columnas y su imagen no recibe una descripción automática. Elegir voz o lectura por partes y descargar la adaptación. Verificar los datos históricos y geográficos antes de reutilizarlos en clase; el material es de 2012.
   - En la demostración de Sociales o en el PDF de Geografía, elegir «Texto con imágenes»: aparecen las tres escenas ilustrativas junto al contenido. Comprobar los textos alternativos con lector de pantalla; al descargar el HTML adaptado desde GitHub Pages, se incluyen las escenas. Al abrir la web como archivo local, el navegador puede impedir que la descarga incorpore las imágenes: el texto permanece disponible.
3. **Docente.** En «Contame qué pasa en tu aula», probar:
   - «Tengo un estudiante que no ve bien el pizarrón y las fotocopias le salen con letra chica»: aparece el caso de visión, con la 2481/24 destacada.
   - «Una alumna sorda no entiende los videos porque no tienen subtítulos»: aparece el caso auditivo, con la Ley 27.710.
   - «Problemas con el horario del comedor escolar»: aparece el aviso de que no hay una orientación preparada, con temas relacionados.
   - «¿Es obligatorio hacer un PPI?»: aparece el aviso de que no responde preguntas legales.
   - Enviar el campo vacío: aparece un error anunciado y el foco vuelve al campo.

## Guion de prueba con lectores de pantalla

**Windows: Narrador (tecla de Windows + Ctrl + Enter) o NVDA, con Chrome, Edge o Firefox.**
- `H` para saltar por títulos, `D` o `R` para las regiones y `F` para los formularios.
- Verificar que se anuncien los cambios de ajustes, el progreso de lectura del PDF (cada 25 %), el cambio de paso (el foco va al título del paso nuevo) y los errores (el foco va al resumen y hay un enlace al campo).
- Con «Imprenta mayúscula» activa, verificar que el lector lea las palabras normalmente y no las deletree.

**Android: TalkBack (Ajustes › Accesibilidad) con Chrome.**
- Deslizar para recorrer.
- Probar «Sacar una foto con la cámara».
- En el menú de lectura, elegir «Encabezados».

**iPhone: VoiceOver (Ajustes › Accesibilidad) con Safari.**
- Usar el rotor por encabezados y controles de formulario.
- Verificar que los botones «Imprenta mayúscula» y «Texto habitual» se anuncien como seleccionados o no seleccionados.

## Publicar en GitHub Pages

1. **Crear el repositorio y subir los archivos.** Subir el **contenido** del ZIP a la raíz del repositorio, de modo que `index.html` quede en la raíz.
2. **Activar Pages.** Ir a **Settings → Pages → Deploy from a branch**, elegir la rama **main** y la carpeta **/ (root)**, y guardar.
3. **Abrir la web.** Queda en `https://USUARIO.github.io/NOMBRE-DEL-REPO/`.

GitHub Pages usa HTTPS, que la cámara del celular necesita.

## Editar las páginas

La cabecera y el pie se comparten entre las cuatro páginas.
- **Páginas:** editar los archivos de `_partes/` y ejecutar `python3 _partes/construir.py` para regenerar `index.html`, `material.html`, `docente.html` y `qom.html`.
- **Fuente de mayúsculas:** se regenera con `python3 _partes/fuente_mayuscula.py`, que necesita `fontTools` y DejaVu Sans.

## Privacidad y dependencias externas

- **Materiales y consultas docentes.** Se procesan en el navegador y no se guardan.
- **Chat intercultural.** Al activarlo, los mensajes y hasta seis turnos previos se envían al Worker y al proveedor de IA. El historial visible se borra al cerrar o recargar la página; las políticas y el tratamiento de datos del proveedor requieren revisión antes de uso escolar. El Worker no incluye almacenamiento propio.
- **Qué se guarda en este navegador.** Las preferencias de letra, tamaño y contraste, en `localStorage`; la elección de guía y voz en `sessionStorage` durante esta pestaña.
- **Qué se descarga, y solo cuando hace falta:**
  - PDF.js 3.11.174 desde jsDelivr;
  - Tesseract.js 5.1.1 desde jsDelivr, con los datos del idioma español;
  - Atkinson Hyperlegible desde Google Fonts.
- **ARASAAC.** Al tocar el botón de pictogramas se envían hasta 4 palabras sueltas por párrafo a ARASAAC. La web avisa antes.

## Limitaciones conocidas

- **Lectura automática.** Puede equivocarse con letra manuscrita, tablas, columnas y fotos oscuras o torcidas. Siempre se puede corregir el texto.
- **Límites de archivos.**
  - PDF: hasta 40 páginas y 40 MB, sin contraseña.
  - Fotos: no se aceptan en formato HEIC.
- **Voz.** Depende de las voces instaladas en el dispositivo.
- **Apoyos visuales.**
  - «Texto con imágenes» tiene unos 22 dibujos.
  - Los pictogramas necesitan internet y tienen licencia CC BY-NC-SA.
- **Imprenta mayúscula.** La fuente cubre el alfabeto latino con tildes, ñ y ü. Letras de otros alfabetos se muestran con la tipografía habitual. La letra en mayúscula (DejaVu Sans) es más ancha que Atkinson Hyperlegible, así que los textos ocupan más renglones. Con 320 px de ancho y texto al 200 %, algunas palabras largas pasan de renglón partidas, pero nada queda cortado ni fuera de la pantalla.
- **Consulta docente.**
  - Reconoce palabras clave, no entiende el texto como una persona. Puede no encontrar un caso descripto con otras palabras o mostrar uno de más.
  - Por eso muestra siempre los temas para elegir a mano.
  - No reemplaza a los equipos de la escuela ni responde preguntas legales.
- **Normativa.** Los resúmenes de la Resolución 2481/24 se prepararon con su encabezado y con publicaciones de difusión, porque el PDF oficial no se pudo abrir durante el desarrollo. Hay que leer el documento completo antes de aplicarla.

## Qué se probó y qué no

### Probado de verdad (Chromium automatizado con Playwright, septiembre de 2026)

- **Imprenta mayúscula.**
  - Se ve en mayúscula y el **árbol de accesibilidad** recibe el texto original. Por ejemplo, el título se expone como «Tu material, en la forma en que mejor leés.».
  - La **voz** recibe «La ONU y la UNESCO…» sin transformar.
  - El campo editable muestra «Guia_Ciencias.PDF» tal cual.
- **Portada con teclado.** Orden de `Tab` lógico, el estado de los botones de letra y contraste se informa con `aria-pressed` y la elección se recuerda al recargar y en las otras páginas.
- **Desbordes.** Sin desplazamiento horizontal ni texto cortado a 320 px y 640 px de ancho (equivalente a zoom del 200 %), con texto al 200 % y en imprenta mayúscula. Se probaron:
  - las tres páginas;
  - los pasos 2 y 3 del estudiante, en varios modos;
  - la consulta docente con resultados.

  En esa prueba aparecieron dos problemas, que se corrigieron: «Texto con imágenes» se salía de la pantalla y el botón para elegir archivo quedaba cortado.
- **Formulario docente solo con teclado.**
  - Campo vacío o incompleto: el error se anuncia, el campo queda con `aria-invalid` y el foco vuelve a él.
  - Con resultado: el foco pasa al título del resultado.
  - También se probaron el caso fuera de alcance, el aviso legal, el aviso de datos personales, los botones de tema, «Borrar la consulta», el enlace del índice y el buscador de normativa.
- **Auditoría automática en 13 estados de las tres páginas, sin problemas pendientes.** Se revisó:
  - que todo control tenga nombre accesible y toda etiqueta esté bien asociada;
  - que las referencias ARIA apunten a elementos que existen y que no haya `id` repetidos;
  - el orden de los títulos y las regiones;
  - que imágenes y SVG tengan descripción.
- **Recorrido del estudiante.** El ejemplo y los seis modos funcionan igual que antes. Sin internet, el PDF y los pictogramas muestran mensajes claros.
- **Logo.** Se revisó en tamaño pequeño y en alto contraste.

### Pendiente de probar en un dispositivo real

- **Lectores de pantalla reales:** Narrador, NVDA, TalkBack y VoiceOver. En particular, confirmar que ningún lector deletree palabras en modo mayúscula; se espera que no, porque reciben el texto original.
- **Funciones que necesitan internet**, que no se pudieron probar en el entorno de desarrollo: la lectura de fotos con Tesseract.js, la carga de PDF.js desde jsDelivr y la búsqueda de pictogramas en ARASAAC.
- **Otros navegadores y dispositivos:** la voz en celulares, la cámara en Android y iPhone, Safari, Firefox y el modo de alto contraste de Windows.
- **Enlaces sin verificar:** el enlace a la Ley 26.378 no se volvió a verificar en esta versión.

## Créditos y licencias

- **Pictogramas:** Sergio Palao. Origen: ARASAAC. Licencia CC BY-NC-SA. Propiedad: Gobierno de Aragón.
- **Bibliotecas:** PDF.js (Mozilla, Apache 2.0) y Tesseract.js (Apache 2.0).
- **Tipografías:**
  - Atkinson Hyperlegible, de Braille Institute (SIL Open Font License).
  - «Bermejo Mayúscula», adaptación de DejaVu Sans (licencia Bitstream Vera; ver `fuentes/LICENCIA-DejaVu.txt`). Por esa licencia se renombró la fuente.
- **Creados para este proyecto:** los dibujos de «Texto con imágenes» y el logo.
