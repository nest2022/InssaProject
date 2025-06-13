// main.js
import * as THREE from "./build/three.module.js";
import { GLTFLoader } from "./controladores/GLTFLoader.js";
import { OrbitControls } from "./controladores/OrbitControls.js";
import { RGBELoader } from "./controladores/RGBELoader.js";
import { modelos } from "./modelos.js";
import {
  createTextSprite,
  createDropdownSpecifications,
  createPurchaseOverlay, // Importar la nueva función
  toggleDarkOverlay, // Importar la nueva función
} from "./textos.js";
import {
  setupAnimationControls,
  updateAnimationMixer,
  setCommentIndex,
} from "./controlAnimaciones.js";
import { showVideo, hideVideo } from "./tutoriales.js"; // Importa las funciones de tutoriales.js

/* --- 1. CONFIGURACIÓN INICIAL DE THREE.JS --- */

// Escena
const scene = new THREE.Scene();

// Cámara
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.layers.enable(0); // Capa para el modelo
camera.layers.enable(1); // Capa para los textos (sprites)

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

renderer.setClearColor(0x292929); // Establece el color de fondo del renderizador (gris muy claro)
renderer.setClearAlpha(1);

// Configuración del mapeo de tono para un renderizado más realista
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// OrbitControls (control de cámara)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false; // Inicia deshabilitado por defecto
controls.enableDamping = true; // Suaviza el movimiento
controls.dampingFactor = 0.05;
controls.minDistance = 10; // Distancia mínima de zoom (acercamiento)
controls.maxDistance = 20; // Distancia máxima de zoom (alejamiento)

// HDRI para el entorno (iluminación basada en imagen)
const rgbeLoader = new RGBELoader();
rgbeLoader.setPath("TEXTURAS/");
rgbeLoader.load("empty_play_room_4k.hdr", (textureHDR) => {
  textureHDR.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = textureHDR; // Establece el entorno para iluminación
});

/* --- 2. VARIABLES GLOBALES Y ESTADO --- */

const clock = new THREE.Clock(); // Para el tiempo del mixer de animaciones
const sprites = []; // Array para almacenar los sprites de texto
let modeloActual = null; // Referencia al modelo 3D cargado
let mostrarTextos = true; // Bandera para controlar la visibilidad de los textos

const raycaster = new THREE.Raycaster(); // Para detectar intersecciones con objetos 3D

// Variables para el sistema de comentarios
let comentariosModelo = [];
let indiceComentarioActual = 0;
let lastCommentIndexBeforeChange = -1; // Para detectar si se viene de un comentario anterior
let commentOverlayContainer = null;
let specificationsOverlayContainer = null;
let purchaseOverlay = null; // Referencia al nuevo overlay de compra

// Referencias a elementos del DOM
const domElements = {
  navLeftButton: document.getElementById("nav-left"),
  navRightButton: document.getElementById("nav-right"),
  toggleOrbitButton: document.getElementById("toggle-orbit"),
  toggleTextosButton: document.getElementById("toggle-textos"),
  volverButton: document.getElementById("volver-menu"),
  specificationsListElement: document.getElementById("specifications-list"),

  // Nuevos elementos de UI
  specificationsToggleBar: document.getElementById("specifications-toggle-bar"),
  commentOverlayContainer: document.getElementById("comment-overlay-container"),
  specificationsOverlayContainer: document.getElementById(
    "specifications-overlay-container"
  ),
  closeCommentOverlayButton: document.getElementById("close-comment-overlay"),
  closeSpecificationsOverlayButton: document.getElementById(
    "close-specifications-overlay"
  ),
  commentTextElement: document.getElementById("comment-text"), // Referencia al texto del comentario en el overlay
  floatingInfoButton: document.getElementById("floating-info-button"), // Nuevo botón flotante
  welcomeOverlay: document.getElementById("welcome-overlay"), // Referencia al nuevo overlay de bienvenida
  welcomeOkButton: document.getElementById("welcome-ok-button"), // Botón OK del overlay de bienvenida
};

// Variables para el mezclador de animaciones y las acciones de animación
let mixer = null;
const animationsMap = new Map();

/* --- 3. FUNCIONES DE UTILIDAD --- */

/**
 * Ajusta la posición Z de la cámara según el aspect ratio de la ventana.
 * Esto ayuda a que el modelo se vea bien en diferentes tamaños de pantalla.
 */
function updateCameraPosition() {
  const aspect = window.innerWidth / window.innerHeight;
  let newZPosition;

  // Detectar orientación horizontal (ancho > alto)
  if (window.innerWidth > window.innerHeight) {
    // Lógica específica para orientación horizontal de móviles
    // Los valores son más grandes para alejar la cámara del modelo,
    // ya que el campo de visión es más estrecho en el eje vertical
    if (window.innerWidth <= 812) {
      // Móviles en horizontal (ej. iPhone X/SE en horizontal)
      newZPosition = 14; // Aumentado para alejar más la cámara
    } else if (window.innerWidth <= 1024) {
      // Tablets en horizontal
      newZPosition = 16; // Aumentado para alejar más la cámara
    } else {
      // Desktops o pantallas muy grandes en horizontal
      newZPosition = 18; // También ajustado para ser consistente
    }
  } else {
    // Orientación vertical
    if (aspect > 1.5) {
      // Pantallas muy anchas
      newZPosition = 12;
    } else if (aspect > 1.0) {
      // Pantallas medianas
      newZPosition = 14;
    } else if (aspect > 0.7) {
      // Pantallas casi cuadradas
      newZPosition = 16;
    } else {
      // Pantallas muy estrechas (móviles en vertical)
      newZPosition = 18;
    }
  }

  camera.position.set(0, 2, newZPosition);
  controls.target.set(0, 0, 0); // Asegura que la cámara siempre apunte al origen
  controls.update(); // Actualiza los controles de órbita
}

/**
 * Muestra un mensaje de error en la interfaz de usuario y proporciona un botón para volver al menú.
 * @param {string} title - Título del mensaje de error.
 * @param {string} message - Contenido del mensaje de error.
 */
function displayErrorMessage(title, message) {
  // Ahora el mensaje de error se mostrará directamente en el body, cubriendo todo.
  document.body.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; background-color: rgba(0, 0, 0, 0.8); z-index: 100;">
          <div style="text-align: center; padding: 30px; color: #333; background-color: #fdea14; border-radius: 12px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4); max-width: 90%; width: 400px;">
              <h2 style="color: #333; margin-top: 0;">${title}</h2>
              <p style="margin-bottom: 25px;">${message}</p>
              <button onclick="window.location.href='index.html'" style="background-color: #333; color: white; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-size: 1.1em; border: none; transition: background-color 0.2s, transform 0.2s;">Volver al Menú</button>
          </div>
      </div>
  `;
}

/**
 * Actualiza el contenido y la visibilidad del comentario actual.
 * También actualiza el estado de los botones de navegación.
 * Controla la visibilidad de objetos 3D según el comentario actual.
 * Y muestra/oculta videos según la configuración.
 */
function actualizarComentario() {
  if (comentariosModelo.length === 0 || !domElements.commentTextElement) {
    // Oculta los botones de navegación si no hay comentarios
    if (domElements.navLeftButton)
      domElements.navLeftButton.style.display = "none";
    if (domElements.navRightButton)
      domElements.navRightButton.style.display = "none";
    hideVideo(); // Oculta cualquier video si no hay comentarios
    return;
  }

  // Actualiza el texto del comentario en el overlay
  domElements.commentTextElement.textContent =
    comentariosModelo[indiceComentarioActual];

  // Actualiza el estado de los botones de navegación (habilitado/deshabilitado)
  updateNavigationButtonsState();
  // Notifica a controlAnimaciones el índice del comentario actual
  setCommentIndex(indiceComentarioActual);

  // Lógica para controlar la visibilidad de objetos 3D según el comentario actual
  if (modeloActual && modeloSeleccionado.visibleObjectsConfig) {
    // Primero, oculta todos los objetos que están en initialHiddenObjects
    // Esto es importante para asegurar que si un objeto se hizo visible en un comentario anterior,
    // se oculte de nuevo si no debe ser visible en el comentario actual.
    modeloSeleccionado.initialHiddenObjects.forEach((objName) => {
      const obj = modeloActual.getObjectByName(objName);
      if (obj) {
        obj.visible = false;
      }
    });

    // Luego, hace visible los objetos que deben aparecer en el comentario actual
    modeloSeleccionado.visibleObjectsConfig.forEach((config) => {
      if (config.commentIndex === indiceComentarioActual) {
        const obj = modeloActual.getObjectByName(config.objectName);
        if (obj) {
          obj.visible = true;
          console.log(
            `Objeto '${config.objectName}' hecho visible para el comentario ${indiceComentarioActual}.`
          );
        } else {
          console.warn(
            `Advertencia: Objeto '${config.objectName}' no encontrado para hacer visible en el comentario ${indiceComentarioActual}.`
          );
        }
      }
    });
  }

  // Lógica para controlar la visibilidad de los textos (sprites)
  // Se itera sobre los sprites que ya están en la escena
  sprites.forEach((spriteGroup, index) => {
    // Se obtiene el índice de ocultamiento desde los datos de usuario del grupo del sprite
    const ocultarConfig = spriteGroup.userData.ocultar; 

    // La visibilidad base se determina primero por el estado del botón "Info. Text"
    let intendedVisibility = mostrarTextos; 

    // Si la propiedad 'ocultar' está definida para este texto...
    if (ocultarConfig !== undefined && ocultarConfig !== null) {
        if (Array.isArray(ocultarConfig)) {
            // Si es un arreglo, oculta si el índice actual está en el arreglo
            if (ocultarConfig.includes(indiceComentarioActual)) {
                intendedVisibility = false;
            }
        } else {
            // Si es un solo número, oculta si el índice actual coincide
            if (ocultarConfig === indiceComentarioActual) {
                intendedVisibility = false;
            }
        }
    }

    // Almacena la visibilidad deseada en userData.baseVisible
    spriteGroup.userData.baseVisible = intendedVisibility;

    // Se establece la visibilidad inicial del grupo de sprites para este fotograma.
    // El bucle 'animate' ajustará esto aún más si hay oclusión.
    spriteGroup.visible = intendedVisibility;
  });


  // Lógica para mostrar videos según el comentario actual
  let videoToShow = null;
  if (
    modeloSeleccionado.videosConfig &&
    modeloSeleccionado.videosConfig.length > 0
  ) {
    videoToShow = modeloSeleccionado.videosConfig.find(
      (videoConfig) => videoConfig.commentIndex === indiceComentarioActual
    );
  }

  if (videoToShow) {
    showVideo(videoToShow.videoUrl);
  } else {
    hideVideo(); // Si no hay video para el comentario actual, oculta cualquier video abierto
  }

  // Lógica para mostrar la ventana de compra en el comentario final
  const purchaseCommentIndex = modeloSeleccionado.purchaseCommentIndex;
  const isPurchaseComment = indiceComentarioActual === purchaseCommentIndex;
  // Solo se muestra si se viene de un comentario anterior
  const isComingFromPrevious = lastCommentIndexBeforeChange < indiceComentarioActual;


  if (isPurchaseComment && isComingFromPrevious && purchaseOverlay) {
    purchaseOverlay.classList.remove("hidden");
    toggleDarkOverlay(true); // Oscurecer el fondo
    console.log("Mostrando ventana de compra.");
  } else if (purchaseOverlay) {
    purchaseOverlay.classList.add("hidden"); // Asegurarse de que esté oculto si no es el comentario de compra o se fue hacia atrás
    toggleDarkOverlay(false); // Asegurarse de que el fondo no esté oscurecido
  }
  
  // Actualizar el índice del comentario anterior para la próxima vez
  lastCommentIndexBeforeChange = indiceComentarioActual;
}

/**
 * Actualiza el estado (habilitado/deshabilitado) de los botones "Anterior" y "Siguiente".
 */
function updateNavigationButtonsState() {
  if (comentariosModelo.length === 0) {
    // Deshabilita y oculta los botones si no hay comentarios
    if (domElements.navLeftButton) {
      domElements.navLeftButton.disabled = true;
      domElements.navLeftButton.classList.add("disabled-nav-button");
      domElements.navLeftButton.style.display = "none"; // Ocultar si no hay comentarios
    }
    if (domElements.navRightButton) {
      domElements.navRightButton.disabled = true;
      domElements.navRightButton.classList.add("disabled-nav-button");
      domElements.navRightButton.style.display = "none"; // Ocultar si no hay comentarios
    }
    return;
  } else {
    // Asegurarse de que estén visibles si hay comentarios
    if (domElements.navLeftButton) domElements.navLeftButton.style.display = "";
    if (domElements.navRightButton)
      domElements.navRightButton.style.display = "";
  }

  // Habilita/deshabilita el botón "Anterior"
  if (domElements.navLeftButton) {
    domElements.navLeftButton.disabled = indiceComentarioActual === 0;
    domElements.navLeftButton.classList.toggle(
      "disabled-nav-button",
      indiceComentarioActual === 0
    );
  }

  // Habilita/deshabilita el botón "Siguiente"
  if (domElements.navRightButton) {
    domElements.navRightButton.disabled =
      indiceComentarioActual === comentariosModelo.length - 1;
    domElements.navRightButton.classList.toggle(
      "disabled-nav-button",
      indiceComentarioActual === comentariosModelo.length - 1
    );
  }
}

/**
 * Establece la visibilidad inicial de los objetos especificados.
 * Esta función es llamada una sola vez al cargar el modelo.
 * @param {THREE.Object3D} model - El modelo 3D principal.
 * @param {string[]} initialHiddenObjects - Array de nombres de objetos que deben estar inicialmente ocultos.
 */
function setInitialVisibility(model, initialHiddenObjects) {
  initialHiddenObjects.forEach((objName) => {
    const obj = model.getObjectByName(objName);
    if (obj) {
      obj.visible = false;
      console.log(`Objeto '${objName}' inicialmente desactivado.`);
    } else {
      console.warn(
        `Advertencia: Objeto inicial oculto '${objName}' no encontrado en el modelo.`
      );
    }
  });
}

/* --- 4. CARGA DEL MODELO Y DATOS --- */

// Obtiene el modelo a cargar desde la URL
const urlParams = new URLSearchParams(window.location.search);
const modeloKey = urlParams.get("modelo");
const modeloSeleccionado = modelos[modeloKey];

if (!modeloSeleccionado) {
  displayErrorMessage(
    "Error: Modelo no válido",
    "Asegúrate de pasar un modelo válido en la URL (ej. ?modelo=cafetera)."
  );
  throw new Error("Modelo inválido"); // Detiene la ejecución del script
}

// Carga el modelo GLTF
const gltfLoader = new GLTFLoader(); // Asegúrate de que gltfLoader esté definido aquí
gltfLoader.load(
  modeloSeleccionado.url,
  (gltf) => {
    modeloActual = gltf.scene;
    scene.add(modeloActual);

    // Inicializa el AnimationMixer con el modelo cargado
    mixer = new THREE.AnimationMixer(modeloActual);

    // Llena el mapa de animaciones con los clips del modelo
    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.clampWhenFinished = true; // Mantiene el estado final de la animación
      action.loop = THREE.LoopOnce; // Por defecto, reproduce una sola vez
      action.repetitions = 0; // Asegura que no haya repeticiones infinitas
      animationsMap.set(clip.name, action);
    });

    // Establece la posición inicial del modelo si está definida
    if (modeloSeleccionado.posicionInicial) {
      modeloActual.position.set(...modeloSeleccionado.posicionInicial);
      console.log(
        `Modelo '${modeloKey}' cargado en la posición: [${modeloSeleccionado.posicionInicial.join(
          ", "
        )}]`
      );
    } else {
      modeloActual.position.set(0, 0, 0);
      console.log(
        `Modelo '${modeloKey}' cargado en la posición por defecto: [0, 0, 0]`
      );
    }

    // Asigna la capa 0 a todos los objetos del modelo
    modeloActual.traverse((object) => {
      object.layers.set(0);
    });

    // Establece la visibilidad inicial de los objetos
    // Esta función solo oculta los objetos al inicio.
    // La visibilidad controlada por comentarios se gestiona en actualizarComentario.
    if (
      modeloSeleccionado.initialHiddenObjects &&
      modeloSeleccionado.initialHiddenObjects.length > 0
    ) {
      setInitialVisibility(
        modeloActual,
        modeloSeleccionado.initialHiddenObjects
      );
    }

    // **********************************************
    // NEW: Ensure camera and controls are updated AFTER model is loaded and positioned
    updateCameraPosition(); // This will set camera position and call controls.update()
    // **********************************************

    // Configura los controles de animación interactivos (controlAnimaciones.js)
    // Se pasan mixer y animationsMap para que controlAnimaciones pueda gestionarlos
    // Se pasa la función 'actualizarComentario' como callback para que se llame al finalizar las animaciones
    setupAnimationControls(
      mixer,
      animationsMap,
      camera,
      modeloActual,
      renderer.domElement,
      modeloSeleccionado.animacionesInteractivas,
      modeloSeleccionado.comentarios,
      actualizarComentario // Pasa la función como callback
    );

    // Crea y añade los sprites de texto al modelo
    // Pasa la propiedad 'ocultar' si existe para que createTextSprite la almacene
    modeloSeleccionado.textos.forEach((t) => {
      const spriteGroup = createTextSprite(t.label, t.ocultar); 
      spriteGroup.position.set(...t.position);
      modeloActual.add(spriteGroup);
      sprites.push(spriteGroup);
    });

    // Rellena la lista de especificaciones
    if (
      modeloSeleccionado.especificaciones &&
      modeloSeleccionado.especificaciones.length > 0
    ) {
      createDropdownSpecifications(modeloSeleccionado.especificaciones);
    }

    // Inicializa el sistema de comentarios
    if (
      modeloSeleccionado.comentarios &&
      modeloSeleccionado.comentarios.length > 0
    ) {
      comentariosModelo = modeloSeleccionado.comentarios;
      // La actualización inicial del comentario ahora se hace a través de actualizarComentario
      // después de configurar los listeners de los overlays.
    } else {
      console.log("No hay comentarios para este modelo.");
    }

    // Al cargar el modelo, mostramos el overlay de comentarios por defecto
    // Esto se moverá al callback del overlay de bienvenida para que solo aparezca después de cerrarlo
    // domElements.commentOverlayContainer.classList.remove("hidden");
    // domElements.floatingInfoButton.classList.add("hidden"); // Ocultar el botón flotante
    // actualizarComentario();

    // Inicializar el overlay de compra
    purchaseOverlay = createPurchaseOverlay(
      () => {
        // Callback para "Seguir mirando"
        // Determina el índice de retorno. Si no está definido en modelos.js, vuelve al penúltimo.
        const returnIndex = modeloSeleccionado.returnCommentIndexOnKeepExploring !== undefined
                            ? modeloSeleccionado.returnCommentIndexOnKeepExploring
                            : modeloSeleccionado.purchaseCommentIndex - 1; // Default to penultimate comment
        
        // Asegura que el índice de retorno sea válido (no menor que 0)
        indiceComentarioActual = Math.max(0, returnIndex);
        actualizarComentario(); // Actualiza el comentario y esconde la ventana de compra (ya lo hace el listener)
        console.log(`Regresando al comentario: ${indiceComentarioActual}`);
      },
      () => {
        // Callback para "¡Sí, la quiero!"
        const purchaseUrl = modeloSeleccionado.purchaseUrl;
        if (purchaseUrl) {
          window.open(purchaseUrl, "_blank"); // Abrir en nueva pestaña
          console.log(`Redirigiendo a: ${purchaseUrl}`);
        } else {
          console.warn("URL de compra no definida para este modelo.");
          // Opcional: Mostrar un mensaje al usuario
        }
        purchaseOverlay.classList.add("hidden"); // Ocultar el overlay
        toggleDarkOverlay(false); // Quitar el oscurecimiento
      }
    );

    // Muestra el overlay de bienvenida cuando el modelo ha cargado
    if (domElements.welcomeOverlay) {
        domElements.welcomeOverlay.classList.remove("hidden");
        // Deshabilitar la interacción con el fondo mientras el overlay está activo
        renderer.domElement.style.pointerEvents = 'none';
        document.body.classList.add('no-scroll'); // Prevenir el scroll en el body
    }
  },
  (xhr) => {
    // Progreso de carga del modelo
    console.log(`${((xhr.loaded / xhr.total) * 100).toFixed(2)}% cargado`);
  },
  (error) => {
    // Manejo de errores de carga del modelo
    console.error("Error al cargar el modelo GLB:", error);
    displayErrorMessage(
      "Error al cargar el modelo",
      "No se pudo cargar el modelo 3D. Por favor, inténtalo de nuevo más tarde."
    );
  }
);

/* --- 5. BUCLE DE ANIMACIÓN --- */

/**
 * Bucle principal de animación de Three.js.
 * Se llama recursivamente usando requestAnimationFrame.
 */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta(); // Tiempo transcurrido desde el último frame
  // Asegúrate de que el mixer esté inicializado antes de actualizarlo
  if (mixer) {
    updateAnimationMixer(mixer, delta); // Pasa el mixer a updateAnimationMixer
  }
  controls.update(); // Actualiza los controles de órbita

  // Lógica para ocultar/mostrar textos si están ocluidos por el modelo
  sprites.forEach((spriteGroup) => {
    // Primero, restablece la visibilidad del sprite a su estado base (según comentarios y botón "Info. Text").
    // Si userData.baseVisible aún no está definido, asumimos 'true' o la visibilidad actual del sprite.
    spriteGroup.visible = spriteGroup.userData.baseVisible !== undefined ? spriteGroup.userData.baseVisible : true; 

    // Solo realiza la comprobación de oclusión si el sprite está actualmente visible (baseVisible es true).
    if (spriteGroup.visible === true) { 
      const spriteWorldPos = new THREE.Vector3();
      const textSprite = spriteGroup.children.find((child) => child.isSprite);
      if (textSprite) {
        textSprite.getWorldPosition(spriteWorldPos);
      } else {
        spriteGroup.getWorldPosition(spriteWorldPos);
      }

      // Se utiliza el raycaster declarado globalmente
      raycaster.set(
        camera.position,
        spriteWorldPos.clone().sub(camera.position).normalize()
      );

      if (modeloActual) {
        camera.layers.set(0); // Raycast solo contra el modelo (capa 0)
        let objetosParaRaycast = [];
        modeloActual.traverse((obj) => {
          if (obj.isMesh && obj.name !== "pared1") {
            objetosParaRaycast.push(obj);
          }
        });

        const intersects = raycaster.intersectObjects(objetosParaRaycast, true);

        // Si el rayo intersecta el modelo antes de llegar al sprite, el sprite está ocluido
        if (
          intersects.length > 0 &&
          intersects[0].distance < camera.position.distanceTo(spriteWorldPos)
        ) {
          spriteGroup.visible = false; // Oculta el sprite si está ocluido
        } 
        // Si no está ocluido, su visibilidad actual (true) se mantiene.
      }
    }
  });
  if (modeloActual) {
    const localCamPos = modeloActual.worldToLocal(camera.position.clone());
    const camEnFrente = localCamPos.z < 0; // Ajustado para tu orientación

    const pared = modeloActual.getObjectByName("pared1");

    if (pared && pared.isMesh && pared.material) {
      // Clonar material sólo si aún no se ha hecho
      if (!pared.userData.materialClonado) {
        pared.material = pared.material.clone();
        pared.userData.materialClonado = true;
      }

      pared.material.transparent = true;

      const opacidadObjetivo = camEnFrente ? 0.0 : 1.0;
      pared.material.opacity +=
        (opacidadObjetivo - pared.material.opacity) * 0.1;
    }
  }

  // Renderiza la escena
  camera.layers.set(0); // Renderiza la capa del modelo
  renderer.render(scene, camera);
  camera.layers.set(1); // Renderiza la capa de los textos
  renderer.autoClear = false; // Evita borrar el frame anterior
  renderer.render(scene, camera);
  renderer.autoClear = true; // Restaura el autoClear
}

// Inicia el bucle de animación
animate();

/* --- 6. MANEJO DE EVENTOS DE UI --- */

// Función para ajustar la variable CSS --vh
function setVhVariable() {
  document.documentElement.style.setProperty(
    "--vh",
    `${window.innerHeight * 0.01}px`
  );
}

// Función para ajustar la variable CSS --vw
function setVwVariable() {
  document.documentElement.style.setProperty(
    "--vw",
    `${window.innerWidth * 0.01}px`
  );
}

// Llama a las funciones al cargar
setVhVariable();
setVwVariable();

// Event listener para el evento 'resize' y 'orientationchange'
window.addEventListener("resize", () => {
  // Asegurarse de que las variables CSS se actualizan en cada redimensionamiento
  setVhVariable();
  setVwVariable();

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateCameraPosition(); // Ajusta la posición de la cámara y los controles
});

// Listener específico para cambios de orientación en dispositivos móviles
window.addEventListener("orientationchange", () => {
  // Retrasar la ejecución para permitir que el navegador actualice las dimensiones del viewport
  // Esto es crucial para la estabilidad en algunos dispositivos móviles.
  setTimeout(() => {
    // Asegurarse de que las variables CSS se actualizan
    setVhVariable();
    setVwVariable();

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateCameraPosition(); // Ajusta la posición de la cámara y los controles
    console.log("Orientación cambiada. Dimensiones actualizadas.");
  }, 300); // Pequeño retraso (300ms) para mayor fiabilidad
});


// Event listener para el botón de órbita
if (domElements.toggleOrbitButton) {
  domElements.toggleOrbitButton.addEventListener("click", () => {
    controls.enabled = !controls.enabled;
    domElements.toggleOrbitButton.classList.toggle(
      "button-active",
      controls.enabled
    );
    console.log(
      `OrbitControls ${controls.enabled ? "ACTIVADO" : "DESACTIVADO"}`
    );
  });
}

// Event listener para el botón de textos
if (domElements.toggleTextosButton) {
  domElements.toggleTextosButton.addEventListener("click", () => {
    mostrarTextos = !mostrarTextos;
    domElements.toggleTextosButton.classList.toggle(
      "button-active",
      !mostrarTextos
    );
    // Vuelve a actualizar los comentarios para recalcular la visibilidad de los textos
    actualizarComentario(); 
    console.log(`Textos ${mostrarTextos ? "Visibles" : "Ocultos"}`);
  });
}

// Event listener para el botón de volver al menú
if (domElements.volverButton) {
  domElements.volverButton.addEventListener("click", () => {
    console.log("Click en Volver al Menú");
    history.back(); // Vuelve a la página anterior (menu.html)
  });
}

// Lógica para los botones de navegación de comentarios (dentro del overlay)
if (domElements.navLeftButton) {
  domElements.navLeftButton.addEventListener("click", () => {
    if (indiceComentarioActual > 0) {
      indiceComentarioActual--;
      actualizarComentario();
      console.log(
        `Comentario anterior. Índice actual: ${indiceComentarioActual}`
      );
    } else {
      console.log(
        "Ya estás en el primer comentario. El botón 'Anterior' está deshabilitado."
      );
    }
  });
}

if (domElements.navRightButton) {
  domElements.navRightButton.addEventListener("click", () => {
    if (indiceComentarioActual < comentariosModelo.length - 1) {
      indiceComentarioActual++;
      actualizarComentario();
      console.log(
        `Comentario siguiente. Índice actual: ${indiceComentarioActual}`
      );
    } else {
      console.log(
        "Ya estás en el último comentario. El botón 'Siguiente' está deshabilitado."
      );
    }
  });
}

// Lógica para mostrar/ocultar el overlay de Comentarios
if (
  domElements.commentOverlayContainer &&
  domElements.closeCommentOverlayButton &&
  domElements.floatingInfoButton
) {
  // Al cerrar el overlay de comentarios, se oculta el overlay y se muestra el botón flotante
  domElements.closeCommentOverlayButton.addEventListener("click", () => {
    domElements.commentOverlayContainer.classList.add("hidden");
    domElements.floatingInfoButton.classList.remove("hidden"); // Mostrar el botón flotante
    hideVideo(); // Asegura que el video se oculte también si se cierra el overlay de comentarios
    console.log("Overlay de Comentarios oculto y botón flotante visible.");
  });

  // Al hacer clic en el botón flotante, se muestra el overlay de comentarios y se oculta el botón
  domElements.floatingInfoButton.addEventListener("click", () => {
    domElements.commentOverlayContainer.classList.remove("hidden");
    domElements.floatingInfoButton.classList.add("hidden"); // Ocultar el botón flotante
    actualizarComentario();
    console.log("Overlay de Comentarios visible y botón flotante oculto.");
  });
}

// Lógica para mostrar/ocultar el overlay de Especificaciones
if (
  domElements.specificationsToggleBar &&
  domElements.specificationsOverlayContainer &&
  domElements.closeSpecificationsOverlayButton
) {
  domElements.specificationsToggleBar.addEventListener("click", () => {
    domElements.specificationsOverlayContainer.classList.remove("hidden");
    // Las especificaciones ya deberían estar cargadas por createDropdownSpecifications al inicio.
    console.log("Overlay de Especificaciones visible.");
  });

  domElements.closeSpecificationsOverlayButton.addEventListener("click", () => {
    domElements.specificationsOverlayContainer.classList.add("hidden");
    console.log("Overlay de Especificaciones oculto.");
  });
}

// Lógica para el overlay de bienvenida
if (domElements.welcomeOverlay && domElements.welcomeOkButton) {
  domElements.welcomeOkButton.addEventListener("click", () => {
    domElements.welcomeOverlay.classList.add("hidden"); // Oculta el overlay de bienvenida
    // Re-habilitar la interacción con el canvas y el scroll del body
    renderer.domElement.style.pointerEvents = 'auto';
    document.body.classList.remove('no-scroll');

    // Muestra el overlay de comentarios y oculta el botón flotante después de cerrar la bienvenida
    domElements.commentOverlayContainer.classList.remove("hidden");
    domElements.floatingInfoButton.classList.add("hidden");
    actualizarComentario();
    console.log("Overlay de bienvenida cerrado. Se muestran comentarios iniciales.");
  });
}
