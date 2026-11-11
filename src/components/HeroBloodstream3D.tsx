import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface HeroBloodstream3DProps {
  interactiveBoost?: boolean;
  freeExplore?: boolean;
  onPulse?: () => void;
}

/**
 * Generates a soft circular radial bokeh sprite texture so Three.js Points
 * render as luminous round particles rather than sharp square pixels.
 */
function createGlowParticleTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const half = size / 2;
    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0, "rgba(255, 255, 255, 1)");
    grad.addColorStop(0.22, "rgba(255, 195, 204, 0.92)");
    grad.addColorStop(0.5, "rgba(255, 77, 109, 0.42)");
    grad.addColorStop(1, "rgba(255, 77, 109, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates procedural biological lipid-membrane textures (albedo, bump, roughness)
 * so red blood cells have realistic organic micro-variation instead of smooth plastic shading.
 */
function createBiologicalMembraneMaps() {
  const size = 512;

  const albedoCanvas = document.createElement("canvas");
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const aCtx = albedoCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext("2d")!;

  // Deterministic pseudo-random multi-octave value noise
  const hash = (x: number, y: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  };

  const smoothNoise = (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy);
    const b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1);
    const d = hash(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };

  const fbm = (x: number, y: number) => {
    let v = 0;
    let amp = 0.5;
    let freq = 1;
    for (let o = 0; o < 5; o += 1) {
      v += amp * smoothNoise(x * freq, y * freq);
      freq *= 2.12;
      amp *= 0.5;
    }
    return v;
  };

  const aImg = aCtx.createImageData(size, size);
  const bImg = bCtx.createImageData(size, size);

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      // Tileable-ish organic domain coordinates
      const u = (px / size) * 14;
      const v = (py / size) * 14;
      const n1 = fbm(u, v);
      const n2 = fbm(u * 2.7 + 13.4, v * 2.7 + 7.1);
      const fine = smoothNoise(u * 9.5, v * 9.5);
      const height = Math.max(0, Math.min(1, n1 * 0.55 + n2 * 0.3 + fine * 0.15));

      const idx = (py * size + px) * 4;

      // Deep oxygenated hemoglobin palette with organic mottling
      const r = Math.round(132 + height * 78);
      const g = Math.round(10 + height * 24);
      const b = Math.round(24 + height * 26);

      aImg.data[idx] = r;
      aImg.data[idx + 1] = g;
      aImg.data[idx + 2] = b;
      aImg.data[idx + 3] = 255;

      const bumpVal = Math.round(height * 255);
      bImg.data[idx] = bumpVal;
      bImg.data[idx + 1] = bumpVal;
      bImg.data[idx + 2] = bumpVal;
      bImg.data[idx + 3] = 255;
    }
  }

  aCtx.putImageData(aImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);

  const albedoMap = new THREE.CanvasTexture(albedoCanvas);
  albedoMap.wrapS = THREE.RepeatWrapping;
  albedoMap.wrapT = THREE.RepeatWrapping;
  albedoMap.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { albedoMap, bumpMap };
}

/**
 * Generates an accurate biconcave erythrocyte (red blood cell) geometry
 * with natural organic dimple shading baked into vertex colors.
 */
function createErythrocyteGeometry(radius = 1, widthSegments = 96, heightSegments = 64): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const tempColor = new THREE.Color();

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) / radius;
    const y = pos.getY(i) / radius;
    const z = pos.getZ(i) / radius;

    const r2 = Math.min(1, x * x + z * z);
    const r = Math.sqrt(r2);

    // Biological Evans & Fung (1972) biconcave profile
    const biconcaveFactor = 0.24 + 1.86 * r2 - 1.02 * r2 * r2;
    const organicWave =
      0.016 * Math.sin(x * 7.2 + z * 5.4) + 0.008 * Math.cos(z * 11.3 - x * 8.1);

    const newX = x * radius * 1.24 * (1 + organicWave * 0.5);
    const newY = y * radius * biconcaveFactor * 0.58 + organicWave * 0.04 * r;
    const newZ = z * radius * 1.24 * (1 + organicWave * 0.5);

    pos.setXYZ(i, newX, newY, newZ);

    // Darker hemoglobin optical thickness in concave center, brighter oxygenated rim
    const rimShade = 0.42 + 0.58 * Math.pow(r, 1.35);
    tempColor.setRGB(rimShade, rimShade * 0.85, rimShade * 0.88);
    colors[i * 3] = tempColor.r;
    colors[i * 3 + 1] = tempColor.g;
    colors[i * 3 + 2] = tempColor.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function HeroBloodstream3D({
  interactiveBoost = false,
  freeExplore = false,
  onPulse,
}: HeroBloodstream3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pulseTriggerRef = useRef<(() => void) | null>(null);
  const boostRef = useRef(interactiveBoost);
  const freeExploreRef = useRef(freeExplore);
  const onPulseRef = useRef(onPulse);
  const [webglFailed, setWebglFailed] = useState(false);

  boostRef.current = interactiveBoost;
  freeExploreRef.current = freeExplore;
  onPulseRef.current = onPulse;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setWebglFailed(true);
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0f17, 0.085);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 60);
    camera.position.set(0, 0.15, 9.2);

    // Three-point biological macro lighting (warm key, arterial subsurface back, cool slate fill)
    const ambientLight = new THREE.AmbientLight(0x28131d, 1.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffe1dc, 2.35);
    keyLight.position.set(4.5, 5.2, 4.8);
    scene.add(keyLight);

    const subsurfaceBackLight = new THREE.PointLight(0xff2e4c, 18, 16, 1.6);
    subsurfaceBackLight.position.set(3.4, -1.6, -2.4);
    scene.add(subsurfaceBackLight);

    const rimWarmLight = new THREE.PointLight(0xff8fa3, 10, 14, 1.5);
    rimWarmLight.position.set(1.2, 3.2, -1.5);
    scene.add(rimWarmLight);

    const coolSlateFill = new THREE.DirectionalLight(0x3b4d6b, 0.9);
    coolSlateFill.position.set(-5.5, -2.5, 3.0);
    scene.add(coolSlateFill);

    // Procedural organic membrane maps & glow bokeh texture
    const { albedoMap, bumpMap } = createBiologicalMembraneMaps();
    const glowSprite = createGlowParticleTexture();

    // Focal hero erythrocyte — sized & positioned cleanly on the right so left copy breathes
    const heroGeometry = createErythrocyteGeometry(1.18, 104, 68);
    const heroMaterial = new THREE.MeshPhysicalMaterial({
      map: albedoMap,
      bumpMap,
      bumpScale: 0.038,
      vertexColors: true,
      color: new THREE.Color(0xc91a36),
      emissive: new THREE.Color(0x2a030b),
      emissiveIntensity: 0.55,
      roughness: 0.54,
      metalness: 0.02,
      clearcoat: 0.34,
      clearcoatRoughness: 0.45,
      sheen: 0.85,
      sheenRoughness: 0.58,
      sheenColor: new THREE.Color(0xff5c77),
    });

    // Inject natural view-dependent subsurface rim scatter directly into material shader (no double-shell halo!)
    heroMaterial.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <dithering_fragment>",
        `
          vec3 sssViewDir = normalize(vViewPosition);
          float sssRim = pow(1.0 - max(0.0, dot(normal, sssViewDir)), 2.6);
          gl_FragColor.rgb += vec3(0.68, 0.09, 0.19) * sssRim * 0.55;
          #include <dithering_fragment>
        `,
      );
    };

    const heroCell = new THREE.Mesh(heroGeometry, heroMaterial);
    heroCell.position.set(2.55, 0.12, 0.0);
    heroCell.rotation.set(0.68, -0.42, 0.24);
    scene.add(heroCell);

    // Instanced bloodstream cells receding softly in depth
    const cellCount = 30;
    const swarmGeometry = createErythrocyteGeometry(0.42, 42, 28);
    const swarmMaterial = new THREE.MeshPhysicalMaterial({
      map: albedoMap,
      bumpMap,
      bumpScale: 0.025,
      vertexColors: true,
      color: new THREE.Color(0x9a1128),
      emissive: new THREE.Color(0x1b0208),
      emissiveIntensity: 0.4,
      roughness: 0.62,
      metalness: 0.02,
      clearcoat: 0.22,
      clearcoatRoughness: 0.55,
    });
    const instancedCells = new THREE.InstancedMesh(swarmGeometry, swarmMaterial, cellCount);
    scene.add(instancedCells);

    interface CellOrbitState {
      baseX: number;
      baseY: number;
      baseZ: number;
      scale: number;
      speed: number;
      phase: number;
      rotX: number;
      rotY: number;
      rotZ: number;
    }

    const cellStates: CellOrbitState[] = [];
    for (let i = 0; i < cellCount; i += 1) {
      const biasRight = i < 22 ? 0.5 + Math.random() * 5.8 : -3.4 + Math.random() * 3.8;
      cellStates.push({
        baseX: biasRight,
        baseY: (Math.random() - 0.5) * 6.0,
        baseZ: -7.5 + Math.random() * 7.2,
        scale: 0.38 + Math.random() * 0.85,
        speed: 0.2 + Math.random() * 0.34,
        phase: Math.random() * Math.PI * 2,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
      });
    }

    // Delicate organic glowing arterial light trails orbiting the focal cell
    const filamentCurves = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.4, -2.1, -1.6),
        new THREE.Vector3(1.6, -1.25, 0.85),
        new THREE.Vector3(3.15, -0.35, 1.35),
        new THREE.Vector3(4.35, 0.85, 0.15),
        new THREE.Vector3(5.6, 2.1, -1.6),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.7, 2.3, -2.2),
        new THREE.Vector3(1.85, 1.15, 0.9),
        new THREE.Vector3(3.35, 0.1, 1.1),
        new THREE.Vector3(4.2, -1.25, -0.45),
        new THREE.Vector3(5.4, -2.3, -2.0),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.3, 0.2, -2.4),
        new THREE.Vector3(1.4, -0.65, 0.55),
        new THREE.Vector3(2.95, 1.05, 0.95),
        new THREE.Vector3(4.9, 1.5, -1.1),
      ]),
    ];

    const filamentGeometries: THREE.TubeGeometry[] = [];
    const filamentMaterials: THREE.MeshBasicMaterial[] = [];
    filamentCurves.forEach((curve, index) => {
      const tubeGeo = new THREE.TubeGeometry(curve, 96, index === 0 ? 0.006 : 0.004, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: index === 0 ? 0xff758f : 0xe11d48,
        transparent: true,
        opacity: index === 0 ? 0.24 : 0.14,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      filamentGeometries.push(tubeGeo);
      filamentMaterials.push(tubeMat);
      scene.add(new THREE.Mesh(tubeGeo, tubeMat));
    });

    // Soft round glowing light orbs flowing along arterial curves
    const signalParticleCount = 240;
    const signalPositions = new Float32Array(signalParticleCount * 3);
    const signalMeta = Array.from({ length: signalParticleCount }, (_, idx) => ({
      curveIndex: idx % filamentCurves.length,
      t: Math.random(),
      speed: 0.04 + Math.random() * 0.075,
      jitterRadius: 0.04 + Math.random() * 0.22,
      jitterAngle: Math.random() * Math.PI * 2,
    }));

    const signalGeo = new THREE.BufferGeometry();
    signalGeo.setAttribute("position", new THREE.BufferAttribute(signalPositions, 3));
    const signalMat = new THREE.PointsMaterial({
      map: glowSprite,
      color: 0xffa6b5,
      size: 0.14,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      alphaTest: 0.001,
    });
    const signalPoints = new THREE.Points(signalGeo, signalMat);
    scene.add(signalPoints);

    // Soft distant plasma bokeh sparks
    const dustCount = 160;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i += 1) {
      dustPositions[i * 3] = (Math.random() - 0.35) * 14;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      dustPositions[i * 3 + 2] = -7 + Math.random() * 8.5;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      map: glowSprite,
      color: 0xff5c77,
      size: 0.095,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      alphaTest: 0.001,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // Expanding soft pulse ring on click
    const pulseRingGeo = new THREE.RingGeometry(0.95, 1.0, 72);
    const pulseRingMat = new THREE.MeshBasicMaterial({
      color: 0xff758f,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pulseRing = new THREE.Mesh(pulseRingGeo, pulseRingMat);
    pulseRing.position.copy(heroCell.position);
    pulseRing.rotation.set(0.55, -0.35, 0);
    scene.add(pulseRing);

    // Soft glowing beacon spheres travelling along arterial filaments
    const beaconGeo = new THREE.SphereGeometry(0.048, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xffe4e8,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const beacons = [0, 1, 2].map((curveIdx) => {
      const m = new THREE.Mesh(beaconGeo, beaconMat);
      scene.add(m);
      return { mesh: m, curveIdx, offset: curveIdx * 0.33 };
    });

    let pulseStrength = 0;
    pulseTriggerRef.current = () => {
      pulseStrength = 1;
      onPulseRef.current?.();
    };

    // Pointer interaction (parallax + 360 drag orbit + click pulse)
    let pointerX = 0;
    let pointerY = 0;
    let targetPointerX = 0;
    let targetPointerY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragDist = 0;
    let orbitYaw = 0;
    let orbitPitch = 0;
    let targetOrbitYaw = 0;
    let targetOrbitPitch = 0;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      targetPointerX = nx;
      targetPointerY = ny;

      if (isDragging) {
        const dx = event.clientX - dragStartX;
        const dy = event.clientY - dragStartY;
        dragDist += Math.hypot(dx, dy);
        targetOrbitYaw += dx * 0.008;
        targetOrbitPitch = Math.max(-0.9, Math.min(0.9, targetOrbitPitch + dy * 0.006));
        dragStartX = event.clientX;
        dragStartY = event.clientY;
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if ((event.target as HTMLElement)?.closest("button, a, input, select")) return;
      isDragging = true;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      dragDist = 0;
      container.style.cursor = "grabbing";
    };

    const handlePointerUp = () => {
      if (isDragging && dragDist < 7) {
        pulseTriggerRef.current?.();
      }
      isDragging = false;
      container.style.cursor = freeExploreRef.current ? "grab" : "crosshair";
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    container.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);

    const handleResize = () => {
      if (!container) return;
      const nextWidth = container.clientWidth || window.innerWidth;
      const nextHeight = container.clientHeight || window.innerHeight;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    };
    window.addEventListener("resize", handleResize);

    const dummy = new THREE.Object3D();
    const tempVec = new THREE.Vector3();
    const clock = new THREE.Clock();
    let simPhase = 0;
    let smoothCellX = 2.55;
    let smoothCamZ = 9.2;
    let smoothLookX = 0.6;
    let frameId = 0;

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      pointerX += (targetPointerX - pointerX) * 0.045;
      pointerY += (targetPointerY - pointerY) * 0.045;
      orbitYaw += (targetOrbitYaw - orbitYaw) * 0.08;
      orbitPitch += (targetOrbitPitch - orbitPitch) * 0.08;
      if (!isDragging && !freeExploreRef.current) {
        targetOrbitYaw *= 0.96;
        targetOrbitPitch *= 0.96;
      }

      if (pulseStrength > 0) {
        pulseStrength = Math.max(0, pulseStrength - dt * 0.85);
        const expansion = 1 + (1 - pulseStrength) * 3.4;
        pulseRing.scale.setScalar(expansion);
        pulseRingMat.opacity = pulseStrength * 0.42;
      } else {
        pulseRingMat.opacity = 0;
      }

      const boostMult = boostRef.current ? 1.75 : 1.0;
      simPhase += dt * boostMult;
      const speedMult = (1 + pulseStrength * 1.9) * boostMult;

      // Keep focal red blood cell framed comfortably on right; center in Full 3D View
      const isNarrow = (container.clientWidth || window.innerWidth) < 820;
      const exploring = freeExploreRef.current;
      const targetCellX = exploring ? 0.1 : isNarrow ? 1.05 : 2.55;
      const targetCellScale = exploring ? 1.15 : isNarrow ? 0.72 : 1.0;
      const targetCamZ = exploring ? 7.4 : 9.2;
      const targetLookX = exploring ? 0.1 : 0.6;

      smoothCellX += (targetCellX - smoothCellX) * 0.06;
      smoothCamZ += (targetCamZ - smoothCamZ) * 0.06;
      smoothLookX += (targetLookX - smoothLookX) * 0.06;

      heroCell.position.x = smoothCellX + pointerX * 0.22;
      heroCell.position.y = 0.14 + Math.sin(elapsed * 0.6) * 0.12 - pointerY * 0.18;
      heroCell.scale.setScalar(targetCellScale * (1 + Math.sin(elapsed * 1.2) * 0.015 + pulseStrength * 0.035));

      heroCell.rotation.x = 0.68 + Math.sin(elapsed * 0.34) * 0.1 + pointerY * 0.22 + orbitPitch;
      heroCell.rotation.y = -0.42 + simPhase * 0.15 + pointerX * 0.3 + orbitYaw;
      heroCell.rotation.z = 0.24 + Math.cos(elapsed * 0.28) * 0.07;

      pulseRing.position.copy(heroCell.position);
      subsurfaceBackLight.intensity = 18 + Math.sin(elapsed * 1.6) * 2.4 + pulseStrength * 12;

      // Update signal beacons along curves
      beacons.forEach((b) => {
        const u = (simPhase * 0.14 + b.offset) % 1;
        filamentCurves[b.curveIdx].getPointAt(u, tempVec);
        b.mesh.position.copy(tempVec);
        b.mesh.scale.setScalar(0.85 + Math.sin(elapsed * 4 + b.curveIdx) * 0.25 + pulseStrength * 0.5);
      });

      // Update instanced bloodstream cells
      for (let i = 0; i < cellCount; i += 1) {
        const c = cellStates[i];
        const drift = (simPhase * c.speed + c.phase) % (Math.PI * 2);
        const yOffset = Math.sin(drift) * 0.5;
        const xDrift = Math.cos(drift * 0.5 + c.phase) * 0.35;

        dummy.position.set(
          c.baseX + xDrift + pointerX * (0.07 * c.scale),
          c.baseY + yOffset - pointerY * (0.07 * c.scale),
          c.baseZ,
        );
        dummy.rotation.set(
          c.rotX + elapsed * c.speed * 0.48,
          c.rotY + elapsed * c.speed * 0.62,
          c.rotZ + elapsed * c.speed * 0.28,
        );
        dummy.scale.setScalar(c.scale);
        dummy.updateMatrix();
        instancedCells.setMatrixAt(i, dummy.matrix);
      }
      instancedCells.instanceMatrix.needsUpdate = true;

      // Update soft bokeh particles along arterial curves
      const posAttr = signalGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < signalParticleCount; i += 1) {
        const meta = signalMeta[i];
        meta.t = (meta.t + dt * meta.speed * speedMult) % 1;
        filamentCurves[meta.curveIndex].getPointAt(meta.t, tempVec);

        const swirl = elapsed * 1.4 + meta.jitterAngle + meta.t * 10;
        posAttr.setXYZ(
          i,
          tempVec.x + Math.cos(swirl) * meta.jitterRadius,
          tempVec.y + Math.sin(swirl) * meta.jitterRadius,
          tempVec.z + Math.sin(swirl * 0.7) * meta.jitterRadius * 0.6,
        );
      }
      posAttr.needsUpdate = true;

      dustPoints.rotation.y = elapsed * 0.02 + pointerX * 0.04;
      dustPoints.rotation.x = pointerY * 0.03;

      camera.position.x += (pointerX * 0.34 - camera.position.x) * 0.04;
      camera.position.y += (0.15 - pointerY * 0.22 - camera.position.y) * 0.04;
      camera.position.z = smoothCamZ;
      camera.lookAt(smoothLookX, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("resize", handleResize);

      albedoMap.dispose();
      bumpMap.dispose();
      glowSprite.dispose();
      beaconGeo.dispose();
      beaconMat.dispose();
      heroGeometry.dispose();
      heroMaterial.dispose();
      swarmGeometry.dispose();
      swarmMaterial.dispose();
      filamentGeometries.forEach((g) => g.dispose());
      filamentMaterials.forEach((m) => m.dispose());
      signalGeo.dispose();
      signalMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      pulseRingGeo.dispose();
      pulseRingMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const bgStyle = { backgroundImage: "url('./images/bloodlink-world.jpg')" };

  if (webglFailed) {
    return <div className="hero-visual hero-visual-fallback" style={bgStyle} aria-hidden="true" />;
  }

  return (
    <div className="hero-webgl-wrap" aria-hidden="true">
      <div className="hero-visual hero-visual-underlay" style={bgStyle} />
      <div ref={containerRef} className="hero-webgl-canvas" />
    </div>
  );
}
