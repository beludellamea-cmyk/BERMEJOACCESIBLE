# Bermejo Accesible

**La información a tu manera.**

Bermejo Accesible es una web para sacar el texto de un material (texto pegado, PDF o foto) y leerlo de la forma que mejor le sirva a cada estudiante. También tiene un espacio para docentes con:
- una consulta por situación,
- una guía para detectar barreras,
- ideas prácticas,
- normativa provincial y nacional, con la Resolución 2481/24 de Formosa destacada.

Proyecto creado para una hackatón en Formosa sobre barreras de acceso a la información y la educación. Antes se llamaba «Abrapalabra».

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

### Acceder a mi material (`material.html`)

Funciona en tres pasos:

1. **Cargar el material.** Se puede pegar texto, subir un PDF, subir una foto o sacarla con la cámara. También hay un ejemplo.
2. **Revisar el texto.** El texto extraído se puede editar. Se puede volver al texto extraído, descargarlo como `.txt` y ver el original.
3. **Elegir cómo leer**, entre seis formas:

   - lectura ajustable,
   - alto contraste,
   - lectura en voz alta con controles,
   - por partes,
   - texto con imágenes (dibujos propios, solo si corresponden),
   - texto con pictogramas de ARASAAC (solo si hay uno con esa misma palabra).

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
index.html              Portada: dos caminos y «¿Usás un lector de pantalla?»
material.html           Recorrido del estudiante
docente.html            Espacio docente
icono.svg               Ícono de la pestaña (símbolo del logo)
img/logo-bermejo-accesible.svg   Logo con el nombre (para presentaciones)
css/estilos.css         Estilos
js/preferencias.js      Letra, tamaño y contraste de todo el sitio
js/material.js          Extracción de texto, revisión y los seis modos
js/ilustraciones.js     Dibujos para «Texto con imágenes»
js/docente.js           Guía, revisor y filtro de normativa
js/consulta.js          «Contame qué pasa en tu aula»
fuentes/                Fuente «Bermejo Mayúscula» (regular y negrita) y su licencia
ejemplos/               Materiales de prueba (TXT, PDF y foto)
_partes/                Fuentes de las páginas y scripts para regenerarlas
.nojekyll               Evita que GitHub Pages procese el sitio con Jekyll
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

La cabecera y el pie se comparten entre las tres páginas.
- **Páginas:** editar los archivos de `_partes/` y ejecutar `python3 _partes/construir.py` para regenerar `index.html`, `material.html` y `docente.html`.
- **Fuente de mayúsculas:** se regenera con `python3 _partes/fuente_mayuscula.py`, que necesita `fontTools` y DejaVu Sans.

## Privacidad y dependencias externas

- **Sin cuentas ni servidor propio.** Los materiales y las consultas docentes se procesan en el navegador y no se guardan.
- **Qué se guarda.** Solo las preferencias de letra, tamaño y contraste, en `localStorage`.
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
