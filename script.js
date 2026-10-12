// RR Studio: interacciones locales con JavaScript puro.
const uno = (selector, raiz = document) => raiz.querySelector(selector);
const varios = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];

// Menú adaptable para todas las páginas.
const botonMenu = uno("#menuBoton");
const menu = uno("#menu");
if (botonMenu && menu) {
  botonMenu.addEventListener("click", () => {
    const abierto = menu.classList.toggle("abierto");
    botonMenu.setAttribute("aria-expanded", String(abierto));
    botonMenu.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
  });
  varios("#menu a", menu).forEach(enlace => enlace.addEventListener("click", () => {
    menu.classList.remove("abierto");
    botonMenu.setAttribute("aria-expanded", "false");
    botonMenu.setAttribute("aria-label", "Abrir menú");
  }));
}

// Ventanas de información para los proyectos.
const fondoModal = uno("#modalFondo");
function abrirModal(titulo, texto) {
  if (!fondoModal) return;
  uno("#modalTitulo").textContent = titulo;
  uno("#modalTexto").textContent = texto;
  fondoModal.classList.add("abierto");
  uno("#cerrarModal")?.focus();
}
function cerrarModal() {
  if (!fondoModal) return;
  fondoModal.classList.remove("abierto");
}
varios(".detalleBoton").forEach(boton => boton.addEventListener("click", () => abrirModal(boton.dataset.titulo, boton.dataset.texto)));
varios(".detalleVisual").forEach(visual => {
  const mostrar = () => abrirModal(visual.dataset.titulo, visual.dataset.texto);
  visual.addEventListener("click", mostrar);
  visual.addEventListener("keydown", evento => {
    if (evento.key === "Enter" || evento.key === " ") { evento.preventDefault(); mostrar(); }
  });
});
const cerrar = uno("#cerrarModal");
if (cerrar) cerrar.addEventListener("click", cerrarModal);
if (fondoModal) fondoModal.addEventListener("click", evento => { if (evento.target === fondoModal) cerrarModal(); });
document.addEventListener("keydown", evento => { if (evento.key === "Escape") cerrarModal(); });

// Formularios: guardan los registros en el almacenamiento local del navegador.
function guardarEnvioFormulario(tipo, formulario) {
  const campos = Object.fromEntries(new FormData(formulario).entries());
  const nombre = campos.nombre || "Sin nombre";
  const correo = campos.correo || "Sin correo";
  const detalle = `${tipo} | Correo: ${correo} | ${Object.entries(campos).filter(([clave]) => !["nombre", "correo"].includes(clave)).map(([clave, valor]) => `${clave}: ${valor}`).join(" | ")}`;
  try {
    const datos = JSON.parse(localStorage.getItem("rrStudioDatos") || "{}");
    if (!Array.isArray(datos.mensajes)) datos.mensajes = [];
    datos.mensajes.unshift({nombre, detalle, fecha: new Date().toLocaleString("es-CO")});
    localStorage.setItem("rrStudioDatos", JSON.stringify(datos));
    return true;
  } catch { return false; }
}
function activarFormulario(id, tipo, mensaje) {
  const formulario = uno(id);
  if (!formulario) return;
  formulario.addEventListener("submit", evento => {
    evento.preventDefault();
    if (!formulario.reportValidity()) return;
    const guardado = guardarEnvioFormulario(tipo, formulario);
    const resultado = uno(".resultado", formulario);
    if (resultado) {
      resultado.textContent = guardado ? mensaje : "No se pudo guardar. Revisa la configuración del navegador.";
      resultado.setAttribute("role", "status");
    }
    if (guardado) formulario.reset();
  });
}
activarFormulario("#formTrabajo", "Solicitud de trabajo", "✓ Información guardada. Puedes verla en el Panel de administración, sección Mensajes.");
activarFormulario("#formContacto", "Mensaje de contacto", "✓ Mensaje guardado. Puedes verlo en el Panel de administración, sección Mensajes.");

// Seleccionar automáticamente un área de interés al pulsar una oportunidad.
varios(".trabajoOpcion").forEach(boton => boton.addEventListener("click", () => {
  const selector = uno('select[name="area"]');
  if (selector) {
    const opcion = [...selector.options].find(op => op.value === boton.dataset.area || op.textContent === boton.dataset.area);
    if (opcion) selector.value = opcion.value;
    uno("#formTrabajo")?.scrollIntoView({behavior:"smooth", block:"center"});
  }
}));

// Asistente de respuestas programadas para la página de IA.
function responder(pregunta) {
  const texto = pregunta.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const respuestas = [
    {claves:["inicio", "portada", "pagina principal", "home"], respuesta:"Inicio es la portada de RR. Presenta qué hace el estudio, permite explorar una maqueta interactiva de los servicios y dirige a Servicios, Proyectos y Contacto."},
    {claves:["nosotros", "historia", "mision", "vision", "quienes son", "quienes somos"], respuesta:"Nosotros explica quién está detrás de RR dentro de este proyecto demostrativo, su historia, misión, visión y principios de trabajo. Sirve para entender el propósito y la forma de pensar del estudio."},
    {claves:["servicios", "ofrecen", "que hacen", "que ofrece"], respuesta:"Servicios reúne las áreas que explora RR: desarrollo web, aplicaciones móviles, inteligencia artificial y soluciones digitales. Desde allí puedes entrar a cada área para conocerla con más detalle."},
    {claves:["desarrollo web", "pagina web", "sitio web", "web"], respuesta:"Desarrollo web explica cómo se puede crear un sitio o plataforma: estructura de páginas, diseño adaptable, navegación, formularios y organización de contenido. Es una página informativa de ejemplo; no es un constructor automático de sitios."},
    {claves:["desarrollo movil", "aplicacion movil", "aplicaciones moviles", "app", "celular"], respuesta:"Desarrollo móvil presenta la idea de una aplicación para celular, sus pantallas y las decisiones que ayudan a que sea fácil de usar. El prototipo es visual y no se instala como una app real."},
    {claves:["proyectos", "portafolio", "clientes", "nova", "orbit", "bloom"], respuesta:"Proyectos es el portafolio conceptual. NOVA representa una tienda digital con catálogo; ORBIT, un panel para organizar tareas y avances; y Bloom, una app para crear rutinas personales. En cada caso puedes abrir 'Explorar el caso' para ver el problema, la solución propuesta y las funciones. Son conceptos ficticios, no clientes reales."},
    {claves:["inteligencia artificial", "ia", "asistente", "esta pagina", "esta pagina de ia"], respuesta:"Esta página explica el uso de inteligencia artificial y contiene este asistente de orientación. Puedes preguntarme por las secciones de RR y te explicaré qué hace cada una. Importante: aquí las respuestas están programadas; no soy una IA conectada a un modelo externo."},
    {claves:["contacto", "correo", "mensaje", "escribir", "formulario"], respuesta:"Contacto permite revisar un formulario de ejemplo para escribir el nombre, correo y mensaje. En esta versión solo valida los campos: no envía el mensaje porque el proyecto no tiene servidor conectado."},
    {claves:["trabaja", "trabajar", "empleo", "oportunidades", "hoja de vida", "curriculum"], respuesta:"Trabaja con nosotros presenta oportunidades y un formulario demostrativo para elegir un área de interés y compartir datos. Es una maqueta: no recibe ni almacena postulaciones reales."},
    {claves:["administracion", "admin", "panel", "gestionar", "gestiona"], respuesta:"El Panel de administración es una simulación para explorar cómo se podrían organizar proyectos, clientes, servicios y mensajes. Los cambios se guardan localmente en ese navegador; no hay servidor, inicio de sesión ni seguridad real. No introduzcas información privada."},
    {claves:["seguridad", "datos", "guarda", "guardar", "se envia", "envia", "real"], respuesta:"RR es un proyecto demostrativo. Algunos cambios del panel se guardan solo en el navegador, pero los formularios no envían información a un servidor. No uses datos privados ni contraseñas en esta maqueta."},
    {claves:["precio", "cuanto cuesta", "contratar", "presupuesto"], respuesta:"La web muestra ideas y servicios de ejemplo, pero no tiene precios ni contratación real configurados. Puedes usar Contacto para explorar el formulario demostrativo."}
  ];
  for (const grupo of respuestas) {
    if (grupo.claves.some(clave => texto.includes(clave))) return grupo.respuesta;
  }
  return "Puedo orientarte por las páginas de RR. Pregúntame '¿Qué hace Proyectos?', '¿Qué hay en Desarrollo web?', '¿Para qué sirve el panel?' o elige una de las opciones de esta pantalla. Esta versión usa respuestas programadas y solo explica el contenido de esta web.";
}
function agregarMensaje(contenedor, texto, clase) {
  const mensaje = document.createElement("div");
  mensaje.className = `mensaje ${clase}`;
  mensaje.textContent = texto;
  contenedor.appendChild(mensaje);
  contenedor.scrollTop = contenedor.scrollHeight;
}
const formularioIA = uno("#formIA");
if (formularioIA) {
  const entrada = uno("#entradaIA");
  const mensajes = uno("#mensajesIA");
  function enviarIA(texto = entrada.value) {
    texto = texto.trim();
    if (!texto) return;
    agregarMensaje(mensajes, texto, "usuario");
    agregarMensaje(mensajes, responder(texto), "bot");
    entrada.value = "";
  }
  formularioIA.addEventListener("submit", evento => { evento.preventDefault(); enviarIA(); });
  varios("[data-pregunta]").forEach(boton => boton.addEventListener("click", () => enviarIA(boton.dataset.pregunta)));
}

// Contadores animados en la página de clientes: cifras ilustrativas.
const contadores = varios("[data-contador]");
if (contadores.length) {
  const observador = new IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
      if (!entrada.isIntersecting) return;
      const elemento = entrada.target;
      const meta = Number(elemento.dataset.contador);
      let actual = 0;
      const paso = Math.max(1, Math.ceil(meta / 25));
      const temporizador = setInterval(() => {
        actual = Math.min(meta, actual + paso);
        elemento.textContent = actual;
        if (actual >= meta) clearInterval(temporizador);
      }, 35);
      observador.unobserve(elemento);
    });
  }, {threshold:.5});
  contadores.forEach(contador => observador.observe(contador));
}

// Panel administrativo simulado: los cambios se guardan en localStorage del navegador.
const areaAdmin = uno("#contenidoAdmin");
if (areaAdmin) {
  // Sin registros precargados: el panel comienza vacío y se alimenta con formularios.
  const datosIniciales = {proyectos:[], clientes:[], servicios:[], mensajes:[]};
  let datos;
  try {
    const guardado = JSON.parse(localStorage.getItem("rrStudioDatos") || "null");
    datos = guardado && typeof guardado === "object" ? {...datosIniciales, ...guardado} : JSON.parse(JSON.stringify(datosIniciales));
    // Evita que datos de demostración de versiones anteriores aparezcan como reales.
    if (!localStorage.getItem("rrStudioDatos")) localStorage.setItem("rrStudioDatos", JSON.stringify(datosIniciales));
  } catch { datos = JSON.parse(JSON.stringify(datosIniciales)); }
  let pestaña = "resumen";
  const titulos = {resumen:"Resumen general",proyectos:"Gestión de proyectos",clientes:"Gestión de clientes",servicios:"Gestión de servicios",mensajes:"Mensajes recibidos"};
  const explicaciones = {
    resumen: "Aquí puedes ver cuántos proyectos, clientes y mensajes hay guardados.",
    proyectos: "Agrega los proyectos que quieres administrar. Escribe un nombre y una descripción y pulsa Guardar proyecto.",
    clientes: "Registra aquí clientes que quieras organizar en este navegador.",
    servicios: "Agrega los servicios que ofrece RR. Escribe el nombre del servicio y una breve descripción.",
    mensajes: "Aquí aparecen los mensajes que llegan desde los formularios Contacto y Trabaja con nosotros. No se crean desde esta sección."
  };
  function guardar() { try { localStorage.setItem("rrStudioDatos", JSON.stringify(datos)); } catch {} }
  function seguro(valor) {
    return String(valor).replace(/[&<>"']/g, caracter => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[caracter]));
  }
  function renderizar() {
    uno("#tituloAdmin").textContent = titulos[pestaña];
    varios(".pestana").forEach(boton => boton.classList.toggle("activa", boton.dataset.tab === pestaña));
    if (pestaña === "resumen") {
      areaAdmin.innerHTML = `<p class="adminNota">${explicaciones.resumen}</p><div class="adminEstadisticas"><article class="adminEstadistica"><small>Proyectos guardados</small><strong>${datos.proyectos.length}</strong><span>Se agregan en Proyectos</span></article><article class="adminEstadistica"><small>Clientes registrados</small><strong>${datos.clientes.length}</strong><span>Se agregan en Clientes</span></article><article class="adminEstadistica"><small>Mensajes recibidos</small><strong>${datos.mensajes.length}</strong><span>Vienen de los formularios</span></article></div><div class="adminCaja"><h3>¿Cómo se usa este panel?</h3><p class="adminNota"><b>Proyectos, Clientes y Servicios:</b> entra en una sección, completa el formulario y pulsa Guardar. Después podrás editar o eliminar cada registro.</p><p class="adminNota"><b>Mensajes:</b> abre Contacto o Trabaja con nosotros en el sitio, envía un formulario de prueba y vuelve aquí para ver la información.</p></div>`;
      return;
    }
    const registros = datos[pestaña];
    const esMensajes = pestaña === "mensajes";
    areaAdmin.innerHTML = `<p class="adminNota">${explicaciones[pestaña]}</p>${esMensajes ? '' : `<div class="adminCaja"><h3>Formulario para ${pestaña === "proyectos" ? "crear un proyecto" : pestaña === "clientes" ? "registrar un cliente" : "agregar un servicio"}</h3><p class="adminNota">Completa los dos campos y pulsa el botón para guardar este registro.</p><div class="adminFormulario"><label for="nombreRegistro">Nombre</label><input id="nombreRegistro" placeholder="${pestaña === "proyectos" ? "Ej. Página web para una tienda" : pestaña === "clientes" ? "Ej. Nombre del cliente" : "Ej. Desarrollo web"}" aria-label="Nombre del registro"><label for="detalleRegistro">Descripción</label><input id="detalleRegistro" placeholder="Escribe una descripción breve" aria-label="Descripción del registro"><button class="boton botonCian" id="guardarRegistro">＋ Guardar ${pestaña === "proyectos" ? "proyecto" : pestaña === "clientes" ? "cliente" : "servicio"}</button></div></div>`}<div class="adminHerramientas"><input id="buscarRegistro" placeholder="Buscar registros..." aria-label="Buscar registros"></div><div class="adminCaja"><h3>${titulos[pestaña]}</h3><table class="tablaAdmin"><thead><tr><th>Nombre</th><th>${esMensajes ? 'Información recibida' : 'Descripción'}</th><th>Acciones</th></tr></thead><tbody id="filasAdmin"></tbody></table></div>`;
    const filas = uno("#filasAdmin");
    function dibujar(filtro = "") {
      const filtrados = registros.map((registro, indice) => ({...registro, indice})).filter(registro => `${registro.nombre} ${registro.detalle}`.toLowerCase().includes(filtro.toLowerCase()));
      filas.innerHTML = filtrados.length ? filtrados.map(registro => `<tr><td>${seguro(registro.nombre)}${registro.fecha ? `<br><small>${seguro(registro.fecha)}</small>` : ''}</td><td>${seguro(registro.detalle)}</td><td><button data-editar="${registro.indice}" ${esMensajes ? 'disabled title="Los mensajes recibidos no se editan aquí"' : ''}>Editar</button><button data-borrar="${registro.indice}">Eliminar</button></td></tr>`).join("") : `<tr><td colspan="3">${esMensajes ? 'Todavía no se han recibido formularios.' : 'No hay registros. Agrega uno si lo necesitas.'}</td></tr>`;
      varios("[data-editar]", filas).forEach(boton => boton.addEventListener("click", () => {
        const registro = registros[Number(boton.dataset.editar)];
        uno("#nombreRegistro").value = registro.nombre;
        uno("#detalleRegistro").value = registro.detalle;
        uno("#guardarRegistro").textContent = "Guardar cambios";
        uno("#guardarRegistro").dataset.editar = boton.dataset.editar;
      }));
      varios("[data-borrar]", filas).forEach(boton => boton.addEventListener("click", () => {
        if (!confirm("¿Seguro que quieres eliminar este registro?")) return;
        registros.splice(Number(boton.dataset.borrar), 1);
        guardar(); renderizar();
      }));
    }
    uno("#buscarRegistro").addEventListener("input", evento => dibujar(evento.target.value));
    if (!esMensajes) uno("#guardarRegistro").addEventListener("click", () => {
      const nombre = uno("#nombreRegistro").value.trim();
      const detalle = uno("#detalleRegistro").value.trim();
      if (!nombre || !detalle) { alert("Escribe el nombre y la descripción antes de guardar."); return; }
      const botonGuardar = uno("#guardarRegistro");
      const indice = botonGuardar.dataset.editar;
      if (indice !== undefined) registros[Number(indice)] = {nombre, detalle};
      else registros.push({nombre, detalle, fecha: new Date().toLocaleString("es-CO")});
      guardar();
      renderizar();
    });
    dibujar();
  }
  varios(".pestana").forEach(boton => boton.addEventListener("click", () => { pestaña = boton.dataset.tab; renderizar(); }));
  uno("#agregarAdmin").addEventListener("click", () => {
    if (pestaña === "mensajes") { alert("Los mensajes solo aparecen cuando alguien envía un formulario de Contacto o Trabaja con nosotros."); return; }
    if (pestaña === "resumen") pestaña = "proyectos";
    renderizar();
    uno("#nombreRegistro")?.focus();
  });
  renderizar();
}


// Portada: menú pequeño y demostración de celular que responde al tocar opciones.
(function () {
  const botonMenuPortada = uno("#menuPortadaBoton");
  const enlacesPortada = uno(".enlacesPortada");
  if (botonMenuPortada && enlacesPortada) {
    botonMenuPortada.addEventListener("click", () => {
      const abierto = enlacesPortada.classList.toggle("abierto");
      botonMenuPortada.setAttribute("aria-expanded", String(abierto));
      botonMenuPortada.textContent = abierto ? "×" : "☰";
    });
  }

  const vistas = {
    web: {etiqueta:"DESARROLLO WEB", titulo:"¿Qué te gustaría crear?", texto:"Selecciona una opción para ver un ejemplo."},
    movil: {etiqueta:"APLICACIONES MÓVILES", titulo:"Una app para tu proyecto", texto:"Un ejemplo de cómo presentar servicios desde el celular."},
    ia: {etiqueta:"INTELIGENCIA ARTIFICIAL", titulo:"Automatizar tareas", texto:"Herramientas que pueden ayudar con tareas repetitivas."}
  };
  const titulo = uno("#demoTitulo");
  const etiqueta = uno("#demoEtiqueta");
  const texto = uno("#demoTexto");
  let textoVistaActual = texto ? texto.textContent : "";
  const opciones = varios("[data-vista]");
  opciones.forEach(opcion => opcion.addEventListener("click", () => {
    const vista = vistas[opcion.dataset.vista];
    if (!vista) return;
    opciones.forEach(item => {
      item.classList.toggle("seleccionada", item === opcion);
      item.setAttribute("aria-pressed", String(item === opcion));
    });
    titulo.textContent = vista.titulo;
    etiqueta.textContent = vista.etiqueta;
    texto.textContent = vista.texto;
    textoVistaActual = vista.texto;
    const menuAyuda = uno("#appMenu");
    if (menuAyuda) menuAyuda.setAttribute("aria-expanded", "false");
    const pantalla = uno(".telefonoPantalla");
    if (pantalla) {
      pantalla.animate([{opacity:.55, transform:"translateY(5px)"},{opacity:1, transform:"translateY(0)"}], {duration:220, easing:"ease-out"});
    }
  }));
  const menuApp = uno("#appMenu");
  if (menuApp) menuApp.addEventListener("click", () => {
    const ayuda = uno("#demoTexto");
    const abierto = menuApp.getAttribute("aria-expanded") !== "true";
    menuApp.setAttribute("aria-expanded", String(abierto));
    if (ayuda) ayuda.textContent = abierto
      ? "Toca una opción para ver un ejemplo."
      : textoVistaActual;
  });
})();


// Slider de destacados: controles manuales, puntos y avance automático.
(function () {
  const slider = document.querySelector('.proyectosSlider');
  if (!slider) return;
  const paneles = Array.from(slider.querySelectorAll('[data-slide]'));
  const puntos = Array.from(slider.querySelectorAll('[data-ir-slide]'));
  const estado = slider.querySelector('#sliderEstado');
  const anterior = slider.querySelector('#sliderAnterior');
  const siguiente = slider.querySelector('#sliderSiguiente');
  if (!paneles.length || !puntos.length) return;
  let actual = 0;
  let intervalo;
  const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function mostrar(indice) {
    actual = (indice + paneles.length) % paneles.length;
    paneles.forEach((panel, i) => panel.classList.toggle('activo', i === actual));
    puntos.forEach((punto, i) => {
      punto.classList.toggle('activo', i === actual);
      punto.setAttribute('aria-pressed', String(i === actual));
    });
    if (estado) estado.textContent = `0${actual + 1} / 0${paneles.length}`;
  }
  function iniciar() {
    clearInterval(intervalo);
    if (!movimientoReducido) intervalo = setInterval(() => mostrar(actual + 1), 6500);
  }
  anterior?.addEventListener('click', () => { mostrar(actual - 1); iniciar(); });
  siguiente?.addEventListener('click', () => { mostrar(actual + 1); iniciar(); });
  puntos.forEach(punto => punto.addEventListener('click', () => { mostrar(Number(punto.dataset.irSlide)); iniciar(); }));
  slider.addEventListener('mouseenter', () => clearInterval(intervalo));
  slider.addEventListener('mouseleave', iniciar);
  slider.addEventListener('focusin', () => clearInterval(intervalo));
  slider.addEventListener('focusout', iniciar);
  mostrar(0);
  iniciar();
})();

// Prototipo de celular: los elementos responden al toque y cambian el contenido.
(function () {
  const pantalla = uno('.telefonoPremium');
  if (!pantalla) return;
  const titulo = uno('#telefonoTitulo', pantalla);
  const subtitulo = uno('#telefonoSubtitulo', pantalla);
  const saludo = uno('#saludoAppTexto', pantalla);
  const aviso = uno('#telefonoToast', pantalla);
  const botonesNav = varios('[data-phone-tab]', pantalla);
  const vistas = {
    inicio: {titulo:'Haz que tus<br>ideas sucedan.', subtitulo:'Descubrir espacio ', saludo:'¿Qué vamos a crear hoy?', aviso:'Inicio: aquí encontrarías un resumen de tu espacio.'},
    proyectos: {titulo:'Tus proyectos<br>en un solo lugar.', subtitulo:'Ver proyectos ', saludo:'Tus ideas van tomando forma.', aviso:'Proyectos: consulta avances y tareas pendientes.'},
    ideas: {titulo:'Guarda cada<br>buena idea.', subtitulo:'Abrir mis ideas ', saludo:'No pierdas ninguna idea.', aviso:'Ideas: aquí puedes reunir notas e inspiración.'},
    perfil: {titulo:'Tu espacio,<br>a tu manera.', subtitulo:'Ver perfil ', saludo:'Personaliza tu experiencia.', aviso:'Perfil: aquí estarían tus preferencias y datos de cuenta.'},
    enfoque: {titulo:'Un paso a la<br>vez.', subtitulo:'Ver mi enfoque ', saludo:'Organiza tu próxima tarea.', aviso:'Enfoque: divide el trabajo en tareas pequeñas y claras.'}
  };
  let avisoTemporizador;
  function mostrarAviso(mensaje) {
    if (!aviso) return;
    aviso.textContent = mensaje;
    aviso.classList.add('visible');
    clearTimeout(avisoTemporizador);
    avisoTemporizador = setTimeout(() => aviso.classList.remove('visible'), 3200);
  }
  function cambiarVista(nombre) {
    const vista = vistas[nombre];
    if (!vista) return;
    if (titulo) titulo.innerHTML = vista.titulo;
    if (subtitulo) subtitulo.textContent = vista.subtitulo;
    if (saludo) saludo.textContent = vista.saludo;
    botonesNav.forEach(boton => boton.classList.toggle('navActivo', boton.dataset.phoneTab === nombre || (nombre === 'enfoque' && boton.dataset.phoneTab === 'inicio')));
    mostrarAviso(vista.aviso);
  }
  botonesNav.forEach(boton => boton.addEventListener('click', () => cambiarVista(boton.dataset.phoneTab)));
  varios('[data-phone-action]', pantalla).forEach(boton => boton.addEventListener('click', () => {
    const acciones = {
      featured: 'Espacio digital: desde aquí podrías abrir tus accesos y tareas favoritas.',
      actividad: 'Actividad reciente: revisa las tareas que has actualizado últimamente.',
      tarea: 'Tarea seleccionada: “Organizar proyecto”. En una app real podrías marcarla como completada.',
      idea: 'Idea seleccionada: puedes abrirla para editarla o añadir más detalles.'
    };
    if (boton.dataset.phoneAction === 'featured') cambiarVista('proyectos');
    else mostrarAviso(acciones[boton.dataset.phoneAction] || 'Elemento seleccionado.');
  }));
})();

// Demo de desarrollo web: el botón de la maqueta alterna entre vistas de ejemplo.
(function () {
  const boton = uno('[data-web-demo]');
  if (!boton) return;
  const titulo = uno('.browserMain h2');
  const texto = uno('[data-web-demo-text]');
  const ejemplos = [
    {titulo:'Less noise.<br><em>More meaning.</em>', texto:'Una experiencia digital pensada para destacar.', boton:'Explorar '},
    {titulo:'Todo claro.<br><em>Todo cerca.</em>', texto:'Una navegación sencilla que ayuda a encontrar lo importante.', boton:'Ver catálogo '},
    {titulo:'Diseño útil.<br><em>Mejor recorrido.</em>', texto:'Cada sección tiene un objetivo y una acción fácil de entender.', boton:'Volver al inicio '}
  ];
  let actual = 0;
  boton.addEventListener('click', () => {
    actual = (actual + 1) % ejemplos.length;
    titulo.innerHTML = ejemplos[actual].titulo;
    texto.textContent = ejemplos[actual].texto;
    boton.textContent = ejemplos[actual].boton;
    const panel = uno('[data-web-demo-panel]');
    if (panel && panel.animate) panel.animate([{opacity:.55, transform:'translateY(5px)'},{opacity:1, transform:'translateY(0)'}], {duration:220, easing:'ease-out'});
  });
})();

// Ejemplos prácticos en la página de inteligencia artificial; no llama a servicios externos.
(function () {
  const resultado = uno('#iaEjemploResultado');
  if (!resultado) return;
  const ejemplos = {
    organizar: 'Ejemplo: una lista de tareas se puede agrupar por fecha, prioridad y estado para saber por dónde empezar.',
    resumir: 'Ejemplo: un texto largo se puede convertir en una lista de ideas principales que después debe revisar una persona.',
    consultar: 'Ejemplo: una guía puede responder preguntas frecuentes sobre horarios, servicios o pasos de un proceso.'
  };
  varios('[data-ia-ejemplo]').forEach(boton => boton.addEventListener('click', () => {
    varios('[data-ia-ejemplo]').forEach(opcion => opcion.classList.toggle('seleccionada', opcion === boton));
    resultado.textContent = ejemplos[boton.dataset.iaEjemplo] || 'Selecciona una tarea para ver un ejemplo.';
  }));
})();
