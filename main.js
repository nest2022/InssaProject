// main.js
import * as THREE from "./build/three.module.js";
import { GLTFLoader } from "./controladores/GLTFLoader.js";
import { OrbitControls } from "./controladores/OrbitControls.js";
import { RGBELoader } from "./controladores/RGBELoader.js";
import { modelos } from "./modelos.js";
import {
  createTextSprite,
  createDropdownSpecifications,
  createPurchaseOverlay,
  toggleDarkOverlay,
} from "./textos.js";
import {
  setupAnimationControls,
  updateAnimationMixer,
  setCommentIndex,
} from "./controlAnimaciones.js";
import { showVideo, hideVideo } from "./tutoriales.js";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.layers.enable(0);
camera.layers.enable(1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

renderer.setClearColor(0x292929);
renderer.setClearAlpha(1);

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 20;

const rgbeLoader = new RGBELoader();
rgbeLoader.setPath("TEXTURAS/");
rgbeLoader.load("empty_play_room_4k.hdr", (textureHDR) => {
  textureHDR.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = textureHDR;
});

const clock = new THREE.Clock();
const sprites = [];
let modeloActual = null;
let mostrarTextos = true;

const raycaster = new THREE.Raycaster();

let comentariosModelo = [];
let indiceComentarioActual = 0;
let lastCommentIndexBeforeChange = -1;
let commentOverlayContainer = null;
let specificationsOverlayContainer = null;
let purchaseOverlay = null;

const domElements = {
  navLeftButton: document.getElementById("nav-left"),
  navRightButton: document.getElementById("nav-right"),
  toggleOrbitButton: document.getElementById("toggle-orbit"),
  toggleTextosButton: document.getElementById("toggle-textos"),
  volverButton: document.getElementById("volver-menu"),
  specificationsListElement: document.getElementById("specifications-list"),

  specificationsToggleBar: document.getElementById("specifications-toggle-bar"),
  commentOverlayContainer: document.getElementById("comment-overlay-container"),
  specificationsOverlayContainer: document.getElementById(
    "specifications-overlay-container"
  ),
  closeCommentOverlayButton: document.getElementById("close-comment-overlay"),
  closeSpecificationsOverlayButton: document.getElementById(
    "close-specifications-overlay"
  ),
  commentTextElement: document.getElementById("comment-text"),
  floatingInfoButton: document.getElementById("floating-info-button"),
  welcomeOverlay: document.getElementById("welcome-overlay"),
  welcomeOkButton: document.getElementById("welcome-ok-button"),
};

let mixer = null;
const animationsMap = new Map();

function updateCameraPosition() {
  const aspect = window.innerWidth / window.innerHeight;
  let newZPosition;

  if (window.innerWidth > window.innerHeight) {
    if (window.innerWidth <= 812) {
      newZPosition = 14;
    } else if (window.innerWidth <= 1024) {
      newZPosition = 16;
    } else {
      newZPosition = 18;
    }
  } else {
    if (aspect > 1.5) {
      newZPosition = 12;
    } else if (aspect > 1.0) {
      newZPosition = 14;
    } else if (aspect > 0.7) {
      newZPosition = 16;
    } else {
      newZPosition = 18;
    }
  }

  camera.position.set(0, 2, newZPosition);
  controls.target.set(0, 0, 0);
  controls.update();
}

function displayErrorMessage(title, message) {
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

function actualizarComentario() {
  if (comentariosModelo.length === 0 || !domElements.commentTextElement) {
    if (domElements.navLeftButton)
      domElements.navLeftButton.style.display = "none";
    if (domElements.navRightButton)
      domElements.navRightButton.style.display = "none";
    hideVideo();
    return;
  }

  domElements.commentTextElement.textContent =
    comentariosModelo[indiceComentarioActual];

  updateNavigationButtonsState();
  setCommentIndex(indiceComentarioActual);

  if (modeloActual && modeloSeleccionado.visibleObjectsConfig) {
    modeloSeleccionado.initialHiddenObjects.forEach((objName) => {
      const obj = modeloActual.getObjectByName(objName);
      if (obj) {
        obj.visible = false;
      }
    });

    modeloSeleccionado.visibleObjectsConfig.forEach((config) => {
      if (config.commentIndex === indiceComentarioActual) {
        const obj = modeloActual.getObjectByName(config.objectName);
        if (obj) {
          obj.visible = true;
        }
      }
    });
  }

  sprites.forEach((spriteGroup, index) => {
    const ocultarConfig = spriteGroup.userData.ocultar; 

    let intendedVisibility = mostrarTextos; 

    if (ocultarConfig !== undefined && ocultarConfig !== null) {
        if (Array.isArray(ocultarConfig)) {
            if (ocultarConfig.includes(indiceComentarioActual)) {
                intendedVisibility = false;
            }
        } else {
            if (ocultarConfig === indiceComentarioActual) {
                intendedVisibility = false;
            }
        }
    }

    spriteGroup.userData.baseVisible = intendedVisibility;

    spriteGroup.visible = intendedVisibility;
  });


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
    hideVideo();
  }

  const purchaseCommentIndex = modeloSeleccionado.purchaseCommentIndex;
  const isPurchaseComment = indiceComentarioActual === purchaseCommentIndex;
  const isComingFromPrevious = lastCommentIndexBeforeChange < indiceComentarioActual;


  if (isPurchaseComment && isComingFromPrevious && purchaseOverlay) {
    purchaseOverlay.classList.remove("hidden");
    toggleDarkOverlay(true);
  } else if (purchaseOverlay) {
    purchaseOverlay.classList.add("hidden");
    toggleDarkOverlay(false);
  }
  
  lastCommentIndexBeforeChange = indiceComentarioActual;
}

function updateNavigationButtonsState() {
  if (comentariosModelo.length === 0) {
    if (domElements.navLeftButton) {
      domElements.navLeftButton.disabled = true;
      domElements.navLeftButton.classList.add("disabled-nav-button");
      domElements.navLeftButton.style.display = "none";
    }
    if (domElements.navRightButton) {
      domElements.navRightButton.disabled = true;
      domElements.navRightButton.classList.add("disabled-nav-button");
      domElements.navRightButton.style.display = "none";
    }
    return;
  } else {
    if (domElements.navLeftButton) domElements.navLeftButton.style.display = "";
    if (domElements.navRightButton)
      domElements.navRightButton.style.display = "";
  }

  if (domElements.navLeftButton) {
    domElements.navLeftButton.disabled = indiceComentarioActual === 0;
    domElements.navLeftButton.classList.toggle(
      "disabled-nav-button",
      indiceComentarioActual === 0
    );
  }

  if (domElements.navRightButton) {
    domElements.navRightButton.disabled =
      indiceComentarioActual === comentariosModelo.length - 1;
    domElements.navRightButton.classList.toggle(
      "disabled-nav-button",
      indiceComentarioActual === comentariosModelo.length - 1
    );
  }
}

function setInitialVisibility(model, initialHiddenObjects) {
  initialHiddenObjects.forEach((objName) => {
    const obj = model.getObjectByName(objName);
    if (obj) {
      obj.visible = false;
    }
  });
}

const urlParams = new URLSearchParams(window.location.search);
const modeloKey = urlParams.get("modelo");
const modeloSeleccionado = modelos[modeloKey];

if (!modeloSeleccionado) {
  displayErrorMessage(
    "Error: Modelo no válido",
    "Asegúrate de pasar un modelo válido en la URL (ej. ?modelo=cafetera)."
  );
  throw new Error("Modelo inválido");
}

const gltfLoader = new GLTFLoader();
gltfLoader.load(
  modeloSeleccionado.url,
  (gltf) => {
    modeloActual = gltf.scene;
    scene.add(modeloActual);

    mixer = new THREE.AnimationMixer(modeloActual);

    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.clampWhenFinished = true;
      action.loop = THREE.LoopOnce;
      action.repetitions = 0;
      animationsMap.set(clip.name, action);
    });

    if (modeloSeleccionado.posicionInicial) {
      modeloActual.position.set(...modeloSeleccionado.posicionInicial);
    } else {
      modeloActual.position.set(0, 0, 0);
    }

    modeloActual.traverse((object) => {
      object.layers.set(0);
    });

    if (
      modeloSeleccionado.initialHiddenObjects &&
      modeloSeleccionado.initialHiddenObjects.length > 0
    ) {
      setInitialVisibility(
        modeloActual,
        modeloSeleccionado.initialHiddenObjects
      );
    }

    updateCameraPosition();

    setupAnimationControls(
      mixer,
      animationsMap,
      camera,
      modeloActual,
      renderer.domElement,
      modeloSeleccionado.animacionesInteractivas,
      modeloSeleccionado.comentarios,
      actualizarComentario
    );

    modeloSeleccionado.textos.forEach((t) => {
      const spriteGroup = createTextSprite(t.label, t.ocultar); 
      spriteGroup.position.set(...t.position);
      modeloActual.add(spriteGroup);
      sprites.push(spriteGroup);
    });

    if (
      modeloSeleccionado.especificaciones &&
      modeloSeleccionado.especificaciones.length > 0
    ) {
      createDropdownSpecifications(modeloSeleccionado.especificaciones);
    }

    if (
      modeloSeleccionado.comentarios &&
      modeloSeleccionado.comentarios.length > 0
    ) {
      comentariosModelo = modeloSeleccionado.comentarios;
    } else {
    }

    purchaseOverlay = createPurchaseOverlay(
      () => {
        const returnIndex = modeloSeleccionado.returnCommentIndexOnKeepExploring !== undefined
                            ? modeloSeleccionado.returnCommentIndexOnKeepExploring
                            : modeloSeleccionado.purchaseCommentIndex - 1;
        
        indiceComentarioActual = Math.max(0, returnIndex);
        actualizarComentario();
      },
      () => {
        const purchaseUrl = modeloSeleccionado.purchaseUrl;
        if (purchaseUrl) {
          window.open(purchaseUrl, "_blank");
        } else {
        }
        purchaseOverlay.classList.add("hidden");
        toggleDarkOverlay(false);
      }
    );

    if (domElements.welcomeOverlay) {
        domElements.welcomeOverlay.classList.remove("hidden");
        renderer.domElement.style.pointerEvents = 'none';
        document.body.classList.add('no-scroll');
    }
  },
  (xhr) => {
  },
  (error) => {
    displayErrorMessage(
      "Error al cargar el modelo",
      "No se pudo cargar el modelo 3D. Por favor, inténtalo de nuevo más tarde."
    );
  }
);

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (mixer) {
    updateAnimationMixer(mixer, delta);
  }
  controls.update();

  sprites.forEach((spriteGroup) => {
    spriteGroup.visible = spriteGroup.userData.baseVisible !== undefined ? spriteGroup.userData.baseVisible : true; 

    if (spriteGroup.visible === true) { 
      const spriteWorldPos = new THREE.Vector3();
      const textSprite = spriteGroup.children.find((child) => child.isSprite);
      if (textSprite) {
        textSprite.getWorldPosition(spriteWorldPos);
      } else {
        spriteGroup.getWorldPosition(spriteWorldPos);
      }

      raycaster.set(
        camera.position,
        spriteWorldPos.clone().sub(camera.position).normalize()
      );

      if (modeloActual) {
        camera.layers.set(0);
        let objetosParaRaycast = [];
        modeloActual.traverse((obj) => {
          if (obj.isMesh && obj.name !== "pared1") {
            objetosParaRaycast.push(obj);
          }
        });

        const intersects = raycaster.intersectObjects(objetosParaRaycast, true);

        if (
          intersects.length > 0 &&
          intersects[0].distance < camera.position.distanceTo(spriteWorldPos)
        ) {
          spriteGroup.visible = false;
        } 
      }
    }
  });
  if (modeloActual) {
    const localCamPos = modeloActual.worldToLocal(camera.position.clone());
    const camEnFrente = localCamPos.z < 0;

    const pared = modeloActual.getObjectByName("pared1");

    if (pared && pared.isMesh && pared.material) {
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

  
  camera.layers.set(0); 
  renderer.render(scene, camera);
  camera.layers.set(1); 
  renderer.autoClear = false; 
  renderer.render(scene, camera);
  renderer.autoClear = true; 
}


animate();


function setVhVariable() {
  document.documentElement.style.setProperty(
    "--vh",
    `${window.innerHeight * 0.01}px`
  );
}


function setVwVariable() {
  document.documentElement.style.setProperty(
    "--vw",
    `${window.innerWidth * 0.01}px`
  );
}


setVhVariable();
setVwVariable();


window.addEventListener("resize", () => {
 
  setVhVariable();
  setVwVariable();

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateCameraPosition(); 
});


window.addEventListener("orientationchange", () => {

  setTimeout(() => {
    
    setVhVariable();
    setVwVariable();

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateCameraPosition(); 
  }, 300); 
});



if (domElements.toggleOrbitButton) {
  domElements.toggleOrbitButton.addEventListener("click", () => {
    controls.enabled = !controls.enabled;
    domElements.toggleOrbitButton.classList.toggle(
      "button-active",
      controls.enabled
    );
  });
}


if (domElements.toggleTextosButton) {
  domElements.toggleTextosButton.addEventListener("click", () => {
    mostrarTextos = !mostrarTextos;
    domElements.toggleTextosButton.classList.toggle(
      "button-active",
      !mostrarTextos
    );

    actualizarComentario(); 
  });
}


if (domElements.volverButton) {
  domElements.volverButton.addEventListener("click", () => {
    history.back(); 
  });
}


if (domElements.navLeftButton) {
  domElements.navLeftButton.addEventListener("click", () => {
    if (indiceComentarioActual > 0) {
      indiceComentarioActual--;
      actualizarComentario();
    } else {
    }
  });
}

if (domElements.navRightButton) {
  domElements.navRightButton.addEventListener("click", () => {
    if (indiceComentarioActual < comentariosModelo.length - 1) {
      indiceComentarioActual++;
      actualizarComentario();
    } else {
    }
  });
}


if (
  domElements.commentOverlayContainer &&
  domElements.closeCommentOverlayButton &&
  domElements.floatingInfoButton
) {

  domElements.closeCommentOverlayButton.addEventListener("click", () => {
    domElements.commentOverlayContainer.classList.add("hidden");
    domElements.floatingInfoButton.classList.remove("hidden"); 
    hideVideo(); 
  });

 
  domElements.floatingInfoButton.addEventListener("click", () => {
    domElements.commentOverlayContainer.classList.remove("hidden");
    domElements.floatingInfoButton.classList.add("hidden"); 
    actualizarComentario();
  });
}


if (
  domElements.specificationsToggleBar &&
  domElements.specificationsOverlayContainer &&
  domElements.closeSpecificationsOverlayButton
) {
  domElements.specificationsToggleBar.addEventListener("click", () => {
    domElements.specificationsOverlayContainer.classList.remove("hidden");

  });

  domElements.closeSpecificationsOverlayButton.addEventListener("click", () => {
    domElements.specificationsOverlayContainer.classList.add("hidden");
  });
}


if (domElements.welcomeOverlay && domElements.welcomeOkButton) {
  domElements.welcomeOkButton.addEventListener("click", () => {
    domElements.welcomeOverlay.classList.add("hidden"); 

    renderer.domElement.style.pointerEvents = 'auto';
    document.body.classList.remove('no-scroll');


    domElements.commentOverlayContainer.classList.remove("hidden");
    domElements.floatingInfoButton.classList.add("hidden");
    actualizarComentario();
  });
}
