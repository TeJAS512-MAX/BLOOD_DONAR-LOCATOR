import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface HeroBloodstream3DProps {
  interactiveBoost?: boolean;
  onPulse?: () => void;
}

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
    grad.addColorStop(0.25, "rgba(255, 196, 206, 0.9)");
    grad.addColorStop(0.55, "rgba(255, 77, 109, 0.35)");
    grad.addColorStop(1, "rgba(255, 77, 109, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  return new THREE.CanvasTexture(canvas);
}

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
    return (
      hash(ix, iy) +
      (hash(ix + 1, iy) - hash(ix, iy)) * ux +
      (hash(ix, iy + 1) - hash(ix, iy)) * uy +
      (hash(ix, iy) - hash(ix + 1, iy) - hash(ix, iy + 1) + hash(ix + 1, iy + 1)) * ux * uy
    );
  };

  const fbm = (x: number, y: number) => {
    let v = 0;
    let amp = 0.5;
    let freq = 1;
    for (let o = 0; o < 5; o += 1) {
      v += amp * smoothNoise(x * freq, y * freq);
      freq *= 2.1;
      amp *= 0.5;
    }
    return v;
  };

  const aImg = aCtx.createImageData(size, size);
  const bImg = bCtx.createImageData(size, size);

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const u = (px / size) * 16;
      const v = (py / size) * 16;
      const h = Math.max(0, Math.min(1, fbm(u, v) * 0.6 + fbm(u * 2.8 + 9.2, v * 2.8 + 4.7) * 0.4));
      const idx = (py * size + px) * 4;

      aImg.data[idx] = Math.round(126 + h * 76);
      aImg.data[idx + 1] = Math.round(10 + h * 22);
      aImg.data[idx + 2] = Math.round(22 + h * 24);
      aImg.data[idx + 3] = 255;

      const bVal = Math.round(h * 255);
      bImg.data[idx] = bVal;
      bImg.data[idx + 1] = bVal;
      bImg.data[idx + 2] = bVal;
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

function createErythrocyteGeometry(radius = 1, widthSegments = 80, heightSegments = 52): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) / radius;
    const y = pos.getY(i) / radius;
    const z = pos.getZ(i) / radius;

    const r2 = Math.min(1, x * x + z * z);
    const r = Math.sqrt(r2);

    // Subtle biological biconcave depression (soft central pallor, never harsh torus donut hole)
    const biconcaveFactor = 0.34 + 1.48 * r2 - 0.84 * r2 * r2;
    const organicWave = 0.015 * Math.sin(x * 6.5 + z * 5.2) + 0.008 * Math.cos(z * 10.1 - x * 7.4);

    pos.setXYZ(
      i,
      x * radius * 1.18 * (1 + organicWave * 0.4),
      y * radius * biconcaveFactor * 0.56 + organicWave * 0.025 * r,
      z * radius * 1.18 * (1 + organicWave * 0.4),
    );

    const rimShade = 0.48 + 0.52 * Math.pow(r, 1.25);
    colors[i * 3] = rimShade;
    colors[i * 3 + 1] = rimShade * 0.84;
    colors[i * 3 + 2] = rimShade * 0.87;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function HeroBloodstream3D({ interactiveBoost = false, onPulse }: HeroBloodstream3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pulseTriggerRef = useRef<(() => void) | null>(null);
  const boostRef = useRef(interactiveBoost);
  const onPulseRef = useRef(onPulse);
  const [webglFailed, setWebglFailed] = useState(false);

  boostRef.current = interactiveBoost;
  onPulseRef.current = onPulse;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
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

    const width = container.clientWidth || 520;
    const height = container.clientHeight || 520;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 40);
    camera.position.set(0, 0.1, 6.8);

    // Balanced realistic biological lighting
    scene.add(new THREE.AmbientLight(0x2e1722, 1.5));

    const keyLight = new THREE.DirectionalLight(0xffe4e0, 2.3);
    keyLight.position.set(4, 5, 4.5);
    scene.add(keyLight);

    const subsurfaceLight = new THREE.PointLight(0xff2e4c, 14, 14, 1.5);
    subsurfaceLight.position.set(2.4, -1.8, -2.2);
    scene.add(subsurfaceLight);

    const coolFill = new THREE.DirectionalLight(0x38bdf8, 0.7);
    coolFill.position.set(-4.5, 2.0, 2.5);
    scene.add(coolFill);

    const { albedoMap, bumpMap } = createBiologicalMembraneMaps();
    const glowSprite = createGlowParticleTexture();

    const clusterGroup = new THREE.Group();
    scene.add(clusterGroup);

    // Realistic tilted focal red blood cell (right-column centerpiece, crisp biological scale)
    const focalGeo = createErythrocyteGeometry(0.86, 84, 56);
    const cellMat = new THREE.MeshPhysicalMaterial({
      map: albedoMap,
      bumpMap,
      bumpScale: 0.035,
      vertexColors: true,
      color: new THREE.Color(0xc41834),
      emissive: new THREE.Color(0x28030b),
      emissiveIntensity: 0.48,
      roughness: 0.56,
      metalness: 0.02,
      clearcoat: 0.28,
      clearcoatRoughness: 0.5,
      sheen: 0.75,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color(0xff5c77),
    });

    cellMat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <dithering_fragment>",
        `
          vec3 sssViewDir = normalize(vViewPosition);
          float sssRim = pow(1.0 - max(0.0, dot(normal, sssViewDir)), 2.5);
          gl_FragColor.rgb += vec3(0.65, 0.09, 0.18) * sssRim * 0.48;
          #include <dithering_fragment>
        `,
      );
    };

    const focalCell = new THREE.Mesh(focalGeo, cellMat);
    focalCell.rotation.set(0.78, -0.52, 0.34);
    clusterGroup.add(focalCell);

    // Companion erythrocytes orbiting at varying angles and depths
    const companionSpecs = [
      { pos: [-1.45, 0.95, -0.75], scale: 0.46, rot: [0.4, 0.8, -0.3] },
      { pos: [1.35, -0.92, -0.55], scale: 0.42, rot: [-0.6, 0.4, 0.5] },
      { pos: [-1.15, -1.05, 0.45], scale: 0.34, rot: [0.9, -0.4, 0.2] },
      { pos: [1.22, 1.05, 0.35], scale: 0.3, rot: [-0.3, -0.9, 0.7] },
      { pos: [0.15, 1.55, -1.2], scale: 0.38, rot: [0.6, 0.2, -0.5] },
    ];

    const companionGeo = createErythrocyteGeometry(0.75, 48, 32);
    const companionCells = companionSpecs.map((spec) => {
      const m = new THREE.Mesh(companionGeo, cellMat);
      m.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
      m.scale.setScalar(spec.scale);
      m.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);
      clusterGroup.add(m);
      return { mesh: m, basePos: new THREE.Vector3(...spec.pos), baseRot: [...spec.rot] };
    });

    // 3D Connection Nodes (representing Donors, Blood Banks & Hospitals) + curved signal links
    const networkNodeCoords: [number, number, number, number][] = [
      [-1.75, 0.35, 0.65, 0xff4d6d],
      [1.75, 0.45, 0.55, 0x38bdf8],
      [-0.45, -1.55, 0.75, 0x34d399],
      [0.65, 1.48, 0.45, 0xff4d6d],
      [1.45, -1.25, -0.85, 0x38bdf8],
      [-1.35, 1.35, -0.65, 0x34d399],
    ];

    const nodeGeo = new THREE.SphereGeometry(0.085, 20, 20);
    const nodeRingGeo = new THREE.RingGeometry(0.13, 0.16, 32);
    const disposables: { dispose: () => void }[] = [nodeGeo, nodeRingGeo];

    const nodePositions: THREE.Vector3[] = [];
    const nodeRings: THREE.Mesh[] = [];

    networkNodeCoords.forEach(([x, y, z, hex]) => {
      const mat = new THREE.MeshBasicMaterial({ color: hex });
      const ringMat = new THREE.MeshBasicMaterial({
        color: hex,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      });
      disposables.push(mat, ringMat);

      const sphere = new THREE.Mesh(nodeGeo, mat);
      sphere.position.set(x, y, z);
      clusterGroup.add(sphere);

      const ring = new THREE.Mesh(nodeRingGeo, ringMat);
      ring.position.set(x, y, z);
      clusterGroup.add(ring);

      nodePositions.push(new THREE.Vector3(x, y, z));
      nodeRings.push(ring);
    });

    // Curved filament arcs linking network nodes around the focal cell
    const curves: THREE.QuadraticBezierCurve3[] = [];
    for (let i = 0; i < nodePositions.length; i += 1) {
      const a = nodePositions[i];
      const b = nodePositions[(i + 1) % nodePositions.length];
      const mid = new THREE.Vector3((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, (a.z + b.z) * 0.5).multiplyScalar(1.35);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      curves.push(curve);

      const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(36));
      const lineMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0xff758f : 0x38bdf8,
        transparent: true,
        opacity: 0.34,
      });
      disposables.push(lineGeo, lineMat);
      clusterGroup.add(new THREE.Line(lineGeo, lineMat));
    }

    // Soft round glowing light orbs travelling along curves + ambient dust
    const sparkCount = 150;
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkMeta = Array.from({ length: sparkCount }, (_, idx) => ({
      curveIdx: idx % curves.length,
      t: Math.random(),
      speed: 0.08 + Math.random() * 0.12,
      jitter: 0.03 + Math.random() * 0.08,
      angle: Math.random() * Math.PI * 2,
    }));
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      map: glowSprite,
      color: 0xffb3c1,
      size: 0.13,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      alphaTest: 0.001,
    });
    clusterGroup.add(new THREE.Points(sparkGeo, sparkMat));

    // Pulse shockwave ring
    const pulseRingGeo = new THREE.RingGeometry(0.92, 0.98, 64);
    const pulseRingMat = new THREE.MeshBasicMaterial({
      color: 0xff758f,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pulseRing = new THREE.Mesh(pulseRingGeo, pulseRingMat);
    clusterGroup.add(pulseRing);

    let pulseStrength = 0;
    pulseTriggerRef.current = () => {
      pulseStrength = 1;
      onPulseRef.current?.();
    };

    // Drag to rotate 360° + click to pulse
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragDist = 0;
    let targetYaw = 0;
    let targetPitch = 0;
    let yaw = 0;
    let pitch = 0;

    const onDown = (e: PointerEvent) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragDist = 0;
      container.style.cursor = "grabbing";
    };

    const onMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      dragDist += Math.hypot(dx, dy);
      targetYaw += dx * 0.008;
      targetPitch = Math.max(-0.85, Math.min(0.85, targetPitch + dy * 0.006));
      dragStartX = e.clientX;
      dragStartY = e.clientY;
    };

    const onUp = () => {
      if (isDragging && dragDist < 6) {
        pulseTriggerRef.current?.();
      }
      isDragging = false;
      container.style.cursor = "grab";
    };

    container.style.cursor = "grab";
    container.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);

    const onResize = () => {
      const w = container.clientWidth || 520;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    const tempPt = new THREE.Vector3();
    let simPhase = 0;
    let frameId = 0;

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      const boostMult = boostRef.current ? 1.85 : 1.0;
      simPhase += dt * boostMult;

      yaw += (targetYaw - yaw) * 0.08;
      pitch += (targetPitch - pitch) * 0.08;

      clusterGroup.rotation.y = simPhase * 0.18 + yaw;
      clusterGroup.rotation.x = Math.sin(elapsed * 0.35) * 0.08 + pitch;

      focalCell.rotation.y = -0.52 + simPhase * 0.25;
      focalCell.rotation.x = 0.78 + Math.sin(elapsed * 0.45) * 0.1;

      companionCells.forEach((c, idx) => {
        c.mesh.position.y = c.basePos.y + Math.sin(elapsed * 0.9 + idx) * 0.1;
        c.mesh.rotation.y = c.baseRot[1] + simPhase * 0.45;
      });

      nodeRings.forEach((ring, idx) => {
        ring.lookAt(camera.position);
        ring.scale.setScalar(1 + Math.sin(elapsed * 2.5 + idx) * 0.14);
      });

      if (pulseStrength > 0) {
        pulseStrength = Math.max(0, pulseStrength - dt * 0.95);
        pulseRing.scale.setScalar(1 + (1 - pulseStrength) * 2.4);
        pulseRingMat.opacity = pulseStrength * 0.52;
      } else {
        pulseRingMat.opacity = 0;
      }

      const posAttr = sparkGeo.attributes.position as THREE.BufferAttribute;
      const speedFactor = (1 + pulseStrength * 2.0) * boostMult;
      for (let i = 0; i < sparkCount; i += 1) {
        const m = sparkMeta[i];
        m.t = (m.t + dt * m.speed * speedFactor) % 1;
        curves[m.curveIdx].getPointAt(m.t, tempPt);
        posAttr.setXYZ(
          i,
          tempPt.x + Math.cos(elapsed * 2 + m.angle) * m.jitter,
          tempPt.y + Math.sin(elapsed * 2 + m.angle) * m.jitter,
          tempPt.z,
        );
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      container.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", onResize);

      albedoMap.dispose();
      bumpMap.dispose();
      glowSprite.dispose();
      focalGeo.dispose();
      companionGeo.dispose();
      cellMat.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
      pulseRingGeo.dispose();
      pulseRingMat.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglFailed) {
    return (
      <div
        className="hero-3d-fallback"
        style={{ backgroundImage: "url('./images/bloodlink-world.jpg')" }}
        aria-label="BloodLink blood connection visualization"
      />
    );
  }

  return <div ref={containerRef} className="hero-3d-stage" aria-label="Interactive 3D blood cell and donor connection network" />;
}
