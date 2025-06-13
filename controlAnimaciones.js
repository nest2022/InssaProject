import * as THREE from "./build/three.module.js";

let isAnimating = false;
let currentPhaseMap = new Map();
let animationsPlayingCount = 0;
let currentCommentIndex = 0;
let animacionesInteractivasConfigGlobal = [];
let playedAnimationsInCurrentComment = new Map();

export function setupAnimationControls(mixer, animationsMap, camera, model, domElement, animacionesInteractivasConfig) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  animacionesInteractivasConfigGlobal = animacionesInteractivasConfig;
  currentCommentIndex = 0;

  animacionesInteractivasConfig.forEach(config => {
    currentPhaseMap.set(config.objetoActivador, 0);
  });

  mixer.addEventListener('finished', (e) => {
    const clipName = e.action.getClip().name;
    console.log(`Una animación ha terminado: ${clipName}.`);
    animationsPlayingCount--;

    if (animationsPlayingCount <= 0) {
      isAnimating = false;
      animationsPlayingCount = 0;
      console.log("Todas las animaciones de la fase actual han terminado. Bandera isAnimating liberada.");
    } else {
      console.log(`Quedan ${animationsPlayingCount} animaciones en curso.`);
    }
  });

  function processAnimationsForPhase(currentPhase, objetoActivador) {
    animationsPlayingCount = currentPhase.animacionesAReproducir.length;

    if (animationsPlayingCount > 0) {
      isAnimating = true;
    } else {
      isAnimating = false;
    }

    console.log(`Iniciando fase: ${currentPhase.nombre || currentPhase.animacionesAReproducir.map(a => a.name).join(', ')}`);

    currentPhase.animacionesAReproducir.forEach(animConfig => {
      const action = animationsMap.get(animConfig.name);
      if (action) {
        const timeScale = currentPhase.reproducirAlReves ? -1 : 1;
        
        action.stop();
        action.setEffectiveTimeScale(timeScale);

        action.time = (timeScale === -1) ? action.getClip().duration : 0;
        
        action.loop = THREE.LoopOnce;
        action.repetitions = 0;

        action.play();
        console.log(`Reproduciendo animación: ${animConfig.name} (dirección: ${timeScale === 1 ? 'adelante' : 'atrás'})`);
      } else {
        console.warn(`Advertencia: Animación '${animConfig.name}' no encontrada para la fase '${currentPhase.nombre}'.`);
        animationsPlayingCount--;
      }
    });

    const animationKey = `${objetoActivador}-${currentPhase.nombre || currentPhaseMap.get(objetoActivador)}`;
    playedAnimationsInCurrentComment.set(animationKey, true);

    const nextPhaseIndex = (currentPhaseMap.get(objetoActivador) + 1) % animacionesInteractivasConfigGlobal.find(c => c.objetoActivador === objetoActivador).fases.length;
    currentPhaseMap.set(objetoActivador, nextPhaseIndex);
    console.log(`Próxima fase para ${objetoActivador}: ${nextPhaseIndex}`);
  }

  function onMouseClick(event) {
    if (isAnimating) {
      console.log("Ya hay una animación en curso, por favor espere a que todas terminen.");
      return;
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(model, true);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      console.log("¡Objeto clickeado!", clickedObject.name);

      const interactiveConfig = animacionesInteractivasConfigGlobal.find(aniConfig => {
        let currentObject = clickedObject;
        while (currentObject) {
          if (currentObject.name.startsWith(aniConfig.objetoActivador)) {
            return true;
          }
          currentObject = currentObject.parent;
        }
        return false;
      });

      if (interactiveConfig) {
        const currentPhaseIndex = currentPhaseMap.get(interactiveConfig.objetoActivador);
        const currentPhase = interactiveConfig.fases[currentPhaseIndex];

        const requiredCommentIndex = currentPhase?.comentarioActivaFase;
        if (requiredCommentIndex !== undefined && requiredCommentIndex !== currentCommentIndex) {
            console.log(`Animación para '${interactiveConfig.objetoActivador}' en la fase '${currentPhase.nombre || "desconocida"}' requiere el comentario ${requiredCommentIndex}. El comentario actual es ${currentCommentIndex}. Bloqueando clic.`);
            return;
        }

        const animationKey = `${interactiveConfig.objetoActivador}-${currentPhase?.nombre || currentPhaseIndex}`;
        if (playedAnimationsInCurrentComment.has(animationKey)) {
            console.log(`La animación para '${interactiveConfig.objetoActivador}' en la fase '${currentPhase.nombre}' ya se reprodujo para el comentario actual (${currentCommentIndex}). Ignorando clic.`);
            return;
        }

        if (currentPhase) {
          processAnimationsForPhase(currentPhase, interactiveConfig.objetoActivador);
        } else {
          console.warn(`Error: Fase ${currentPhaseIndex} no encontrada para ${interactiveConfig.objetoActivador}.`);
          isAnimating = false;
        }
      }
    }
  }

  domElement.addEventListener("click", onMouseClick, false);
  console.log("Controles de animación configurados.");
}

export function updateAnimationMixer(mixer, delta) {
  if (mixer) {
    mixer.update(delta);
  }
}

export function setCommentIndex(index) {
    currentCommentIndex = index;
    playedAnimationsInCurrentComment.clear(); 
    console.log(`Índice de comentario actualizado en controlAnimaciones: ${currentCommentIndex}. Registro de animaciones reproducidas reiniciado.`);
}
