import * as THREE from "./build/three.module.js";

export function createTextSprite(text, ocultarIndex = null) { 
  const maxWidthLogical = 400;
  const lineHeightLogical = 48;
  const paddingYLogical = 10;
  const fontSizeLogical = 36;
  const cornerRadiusLogical = 10;
  const borderWidthLogical = 3;
  const shadowBlurLogical = 10;
  const shadowOffsetLogical = 5;

  const devicePixelRatio = window.devicePixelRatio || 1;

  const scaleProperty = (prop) => prop * devicePixelRatio;

  const maxWidthPx = scaleProperty(maxWidthLogical);
  const lineHeightPx = scaleProperty(lineHeightLogical);
  const paddingYPx = scaleProperty(paddingYLogical);
  const fontSizePx = scaleProperty(fontSizeLogical);
  const cornerRadiusPx = scaleProperty(cornerRadiusLogical);
  const borderWidthPx = scaleProperty(borderWidthLogical);
  const shadowBlurPx = scaleProperty(shadowBlurLogical);
  const shadowOffsetXPx = scaleProperty(shadowOffsetLogical);
  const shadowOffsetYPx = scaleProperty(shadowOffsetLogical);

  const tempCanvasForMeasurement = document.createElement("canvas");
  const tempCtxForMeasurement = tempCanvasForMeasurement.getContext("2d");
  tempCtxForMeasurement.font = `bold ${fontSizePx}px Arial`;
  tempCtxForMeasurement.textBaseline = "top";

  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + " " + words[i];
    if (tempCtxForMeasurement.measureText(testLine).width > maxWidthPx) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  let maxLineWidthLogical = 0;
  lines.forEach((line) => {
    const lineWidth = tempCtxForMeasurement.measureText(line).width / devicePixelRatio;
    if (lineWidth > maxLineWidthLogical) {
      maxLineWidthLogical = lineWidth;
    }
  });

  const canvasLogicalWidth = Math.max(
    maxWidthLogical,
    maxLineWidthLogical + paddingYLogical * 2
  );
  const canvasLogicalHeight = lines.length * lineHeightLogical + paddingYLogical * 2;

  const canvas = document.createElement("canvas");
  canvas.width = canvasLogicalWidth * devicePixelRatio;
  canvas.height = canvasLogicalHeight * devicePixelRatio;
  const context = canvas.getContext("2d");

  context.font = `bold ${fontSizePx}px Arial`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  context.fillStyle = "rgba(0, 0, 0, 0.7)";
  context.strokeStyle = "#fdea14";
  context.lineWidth = borderWidthPx;
  context.shadowColor = "rgba(0, 0, 0, 0.5)";
  context.shadowBlur = shadowBlurPx;
  context.shadowOffsetX = shadowOffsetXPx;
  context.shadowOffsetY = shadowOffsetYPx;

  context.beginPath();
  context.roundRect(0, 0, canvas.width, canvas.height, cornerRadiusPx);
  context.fill();
  context.stroke();

  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;

  context.fillStyle = "white";
  lines.forEach((line, i) => {
    const y = paddingYPx + i * lineHeightPx + lineHeightPx / 2;
    context.fillText(line, canvas.width / 2, y);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    depthWrite: false,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);

  const desired3DHeight = 0.5;
  const aspectLogical = canvasLogicalWidth / canvasLogicalHeight;
  const finalSpriteWidthIn3D = desired3DHeight * aspectLogical;
  const finalSpriteHeightIn3D = desired3DHeight;

  sprite.scale.set(finalSpriteWidthIn3D, finalSpriteHeightIn3D, 1);
  sprite.renderOrder = 999;
  sprite.layers.set(1);

  const markerRadius = 0.2;
  const haloRadius = markerRadius * 1.5;
  const gap = 0;

  const createCircleMesh = (radius, materialProps, renderOrder, layers) => {
    const geometry = new THREE.CircleGeometry(radius, 32);
    const material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      ...materialProps,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = renderOrder;
    mesh.layers.set(layers);
    return mesh;
  };

  const circleMarker = createCircleMesh(markerRadius, { color: 0xffd700, opacity: 0.9 }, 999, 1);
  const haloMarker = createCircleMesh(haloRadius, { color: 0xffd700, opacity: 0.3 }, 998, 1);

  circleMarker.position.set(3.3, 1, 0);
  haloMarker.position.set(3.3, 1, 0);

  const group = new THREE.Group();
  group.add(haloMarker);
  group.add(circleMarker);

  sprite.position.set(
    circleMarker.position.x,
    circleMarker.position.y - markerRadius - gap - finalSpriteHeightIn3D / 2,
    0
  );
  group.add(sprite);

  // Almacena el índice de ocultamiento en los datos de usuario del grupo
  group.userData = {
    ocultar: ocultarIndex 
  };

  return group;
}

export function createDropdownSpecifications(specifications) {
  const specificationsList = document.getElementById("specifications-list");

  if (specificationsList) {
    specificationsList.innerHTML = "";
    specifications.forEach((spec) => {
      const listItem = document.createElement("li");
      listItem.textContent = spec;
      specificationsList.appendChild(listItem);
    });
  }
}

export function createPurchaseOverlay(onKeepExploring, onWantIt) {
  const overlay = document.createElement("div");
  overlay.id = "purchase-overlay";
  overlay.classList.add("purchase-overlay-container", "hidden");

  overlay.innerHTML = `
    <div class="purchase-overlay-content">
      <h3>¿Deseas adquirir este producto?</h3>
      <div class="purchase-buttons-group">
        <button id="keep-exploring-button" class="purchase-button grey-button">Seguir mirando</button>
        <button id="want-it-button" class="purchase-button yellow-button">¡Sí, la quiero!</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("keep-exploring-button").addEventListener("click", () => {
    overlay.classList.add("hidden");
    toggleDarkOverlay(false);
    onKeepExploring();
  });

  document.getElementById("want-it-button").addEventListener("click", () => {
    onWantIt();
  });

  return overlay;
}

export function toggleDarkOverlay(show) {
  let darkOverlay = document.getElementById("dark-background-overlay");

  if (!darkOverlay) {
    darkOverlay = document.createElement("div");
    darkOverlay.id = "dark-background-overlay";
    darkOverlay.classList.add("dark-background-overlay");
    document.body.appendChild(darkOverlay);
  }

  darkOverlay.classList.toggle("hidden", !show);
}
