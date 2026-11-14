import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { BloodGroup } from "../data/bloodlinkData";

export type BgMotionMode = "auto" | "arterial" | "helix" | "vortex";

interface LiveBiomedicalBg3DProps {
  mode: BgMotionMode;
  boostFlow: boolean;
  activeBloodGroup: "all" | BloodGroup;
  pulseTriggerCount: number;
}

/**
 * Custom GLSL Shaders for the UHD Futuristic Quantum Wave Matrix
 */
const QUANTUM_GRID_VERTEX_SHADER = `
  varying vec3 vWorldPos;
  varying vec2 vUv;
  varying float vElevation;
  uniform float uTime;
  uniform float uSystole;
  uniform vec2 uPointer;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Multi-frequency undulating quantum energy waves
    float w1 = sin(pos.x * 0.42 + uTime * 1.6) * cos(pos.y * 0.36 + uTime * 1.1) * 0.65;
    float w2 = sin(pos.x * 0.88 - uTime * 2.2 + pos.y * 0.65) * 0.32 * (1.0 + uSystole * 0.65);
    float distToPointer = length(pos.xy - uPointer * 3.5);
    float w3 = cos(distToPointer * 0.9 - uTime * 2.8) * 0.24 * (1.0 + uSystole * 0.8);

    float elevation = w1 + w2 + w3;
    pos.z += elevation;
    vElevation = elevation;

    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const QUANTUM_GRID_FRAGMENT_SHADER = `
  varying vec3 vWorldPos;
  varying vec2 vUv;
  varying float vElevation;
  uniform float uTime;
  uniform float uSystole;
  uniform vec3 uCameraPos;

  void main() {
    // Ultra-crisp futuristic cyber-grid pattern with glow
    vec2 gridUv = fract(vUv * 36.0);
    vec2 gridLine = smoothstep(0.05, 0.0, abs(gridUv - 0.5));
    float gridPattern = max(gridLine.x, gridLine.y);

    // Flowing laser pulse ripples along the grid coordinates
    float pulse = sin(vUv.y * 42.0 - uTime * 3.8 + vElevation * 2.2) * 0.5 + 0.5;
    float pulseHighlight = pow(pulse, 5.0) * (0.8 + uSystole * 0.5);

    vec3 cyanBeam = vec3(0.05, 0.88, 1.0);
    vec3 neonCrimson = vec3(1.0, 0.12, 0.36);
    vec3 deepNavy = vec3(0.04, 0.07, 0.14);
    vec3 laserWhite = vec3(1.0, 1.0, 1.0);

    // Dynamic gradient based on elevation and pulse wave
    vec3 col = mix(cyanBeam, neonCrimson, smoothstep(-0.6, 0.6, vElevation));
    col = mix(deepNavy, col, gridPattern * 0.85 + pulseHighlight * 0.7);
    col += laserWhite * pulseHighlight * gridPattern * 0.85;

    // Soft atmospheric depth fade
    float dist = length(uCameraPos - vWorldPos);
    float edgeFade = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x) *
                     smoothstep(0.0, 0.14, vUv.y) * smoothstep(1.0, 0.86, vUv.y);
    float distFade = smoothstep(28.0, 6.0, dist);

    float alpha = (gridPattern * 0.42 + pulseHighlight * 0.55) * edgeFade * distFade * (0.68 + uSystole * 0.28);
    gl_FragColor = vec4(col, alpha);
  }
`;

/**
 * Custom Shaders for UHD Holographic Quantum Photons & Telemetry Beacons
 */
const PHOTON_VERTEX_SHADER = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  attribute float aSpeed;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uTime;
  uniform float uSystole;

  void main() {
    vColor = aColor;
    vec3 pos = position;

    // Fluid forward kinetic motion with systolic burst
    float t = uTime * aSpeed;
    pos.x += sin(t * 1.4 + aPhase) * 0.35;
    pos.y += cos(t * 1.1 + aPhase) * 0.28;
    pos.z += sin(t * 0.9 + aPhase * 2.0) * 0.45;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float dist = -mvPosition.z;
    gl_PointSize = aSize * (320.0 / max(dist, 1.2)) * (1.0 + uSystole * 0.42);

    float pulse = 0.5 + 0.5 * sin(uTime * 3.2 + aPhase * 3.0);
    vAlpha = smoothstep(22.0, 3.0, dist) * (0.55 + 0.45 * pulse) * (0.85 + uSystole * 0.35);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const PHOTON_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float d = length(coord);
    if (d > 0.5) discard;

    // Ultra-sharp laser core with soft bloom halo
    float core = smoothstep(0.12, 0.0, d) * 1.4;
    float halo = smoothstep(0.5, 0.08, d) * 0.8;
    vec3 col = mix(vColor, vec3(1.0, 1.0, 1.0), core);

    gl_FragColor = vec4(col, (core + halo) * vAlpha);
  }
`;

export function LiveBiomedicalBg3D({
  mode,
  boostFlow,
  activeBloodGroup,
  pulseTriggerCount,
}: LiveBiomedicalBg3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);

  const modeRef = useRef<BgMotionMode>(mode);
  modeRef.current = mode;
  const boostRef = useRef(boostFlow);
  boostRef.current = boostFlow;
  const groupRef = useRef(activeBloodGroup);
  groupRef.current = activeBloodGroup;
  const shockwaveRef = useRef(0);

  useEffect(() => {
    if (pulseTriggerCount > 0) {
      shockwaveRef.current = 1.0;
    }
  }, [pulseTriggerCount, activeBloodGroup]);

  useEffect(() => {
    const container = mountRef.current;
    const hudCanvas = hudCanvasRef.current;
    if (!container || !hudCanvas) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    const w = window.innerWidth || 1280;
    const h = window.innerHeight || 800;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x080e1a, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.32;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const hudCtx = hudCanvas.getContext("2d");
    const syncHudSize = () => {
      const cw = window.innerWidth || 1280;
      const ch = window.innerHeight || 800;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      hudCanvas.width = cw * dpr;
      hudCanvas.height = ch * dpr;
      hudCtx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    syncHudSize();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, w / h, 0.1, 50);
    camera.position.set(0, 1.2, 9.2);

    const disposables: { dispose: () => void }[] = [];

    // 1. Futuristic UHD Topographical Quantum Wave Matrix (Floor & Horizon)
    const gridUniforms = {
      uTime: { value: 0 },
      uSystole: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uCameraPos: { value: new THREE.Vector3(0, 1.2, 9.2) },
    };

    const quantumGridGeo = new THREE.PlaneGeometry(36, 22, 96, 64);
    const quantumGridMat = new THREE.ShaderMaterial({
      vertexShader: QUANTUM_GRID_VERTEX_SHADER,
      fragmentShader: QUANTUM_GRID_FRAGMENT_SHADER,
      uniforms: gridUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const quantumGridMesh = new THREE.Mesh(quantumGridGeo, quantumGridMat);
    quantumGridMesh.position.set(0, -1.8, -1.5);
    quantumGridMesh.rotation.set(-1.22, 0.08, 0.15);
    scene.add(quantumGridMesh);
    disposables.push(quantumGridGeo, quantumGridMat);

    // 2. Hyper-Velocity Fiber-Optic Neural Data Conduits (Catmull-Rom 3D Splines)
    const conduitGroup = new THREE.Group();
    scene.add(conduitGroup);

    const travelingPhotons: {
      curve: THREE.CatmullRomCurve3;
      mesh: THREE.Mesh;
      speed: number;
      offset: number;
    }[] = [];

    const photonBeaconGeo = new THREE.SphereGeometry(0.09, 16, 16);
    disposables.push(photonBeaconGeo);

    const conduitPalettes = [
      { tube: 0x00f0ff, pulse: 0xffffff }, // Cyan cold-chain laser
      { tube: 0xff1a53, pulse: 0xffffff }, // Arterial crimson beacon
      { tube: 0x38bdf8, pulse: 0x93c5fd }, // Sapphire telemetry
      { tube: 0x00ffb3, pulse: 0xffffff }, // Quantum emerald reserve
      { tube: 0xf59e0b, pulse: 0xffedd5 }, // Amber emergency priority
    ];

    conduitPalettes.forEach((palette, cIdx) => {
      const pts: THREE.Vector3[] = [];
      const yBase = (cIdx - 2) * 1.35;
      const zBase = -1.8 - (cIdx % 3) * 1.2;
      for (let step = 0; step <= 8; step += 1) {
        const u = step / 8;
        const x = (u - 0.5) * 24.0;
        const y = yBase + Math.sin(u * Math.PI * 2.2 + cIdx * 1.2) * 1.6;
        const z = zBase + Math.cos(u * Math.PI * 1.8 + cIdx) * 1.3;
        pts.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, 96, 0.024, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: palette.tube,
        transparent: true,
        opacity: 0.52,
      });
      conduitGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
      disposables.push(tubeGeo, tubeMat);

      // Add 2 high-speed photon packets per conduit
      for (let p = 0; p < 2; p += 1) {
        const pMat = new THREE.MeshBasicMaterial({ color: palette.pulse });
        const pMesh = new THREE.Mesh(photonBeaconGeo, pMat);
        conduitGroup.add(pMesh);
        disposables.push(pMat);
        travelingPhotons.push({
          curve,
          mesh: pMesh,
          speed: 0.18 + cIdx * 0.03,
          offset: p * 0.5 + cIdx * 0.16,
        });
      }
    });

    // 3. Swarm of 380 UHD Quantum Photons & Spatial Coordinates
    const photonCount = 380;
    const photonPositions = new Float32Array(photonCount * 3);
    const photonSizes = new Float32Array(photonCount);
    const photonColors = new Float32Array(photonCount * 3);
    const photonPhases = new Float32Array(photonCount);
    const photonSpeeds = new Float32Array(photonCount);

    const quantumPalette = [
      new THREE.Color(0x00f0ff), // Cyan photon
      new THREE.Color(0xff1a53), // Crimson dispatch
      new THREE.Color(0x00ffb3), // Emerald verified
      new THREE.Color(0x38bdf8), // Sky telemetry
      new THREE.Color(0xffffff), // Laser core
    ];

    for (let i = 0; i < photonCount; i += 1) {
      photonPositions[i * 3] = (Math.random() - 0.5) * 26.0;
      photonPositions[i * 3 + 1] = (Math.random() - 0.5) * 14.0;
      photonPositions[i * 3 + 2] = -6.0 + Math.random() * 10.0;
      photonSizes[i] = 0.08 + Math.random() * 0.24;
      photonPhases[i] = Math.random() * Math.PI * 2;
      photonSpeeds[i] = 0.4 + Math.random() * 0.8;

      const c = quantumPalette[i % quantumPalette.length];
      photonColors[i * 3] = c.r;
      photonColors[i * 3 + 1] = c.g;
      photonColors[i * 3 + 2] = c.b;
    }

    const photonGeo = new THREE.BufferGeometry();
    photonGeo.setAttribute("position", new THREE.BufferAttribute(photonPositions, 3));
    photonGeo.setAttribute("aSize", new THREE.BufferAttribute(photonSizes, 1));
    photonGeo.setAttribute("aColor", new THREE.BufferAttribute(photonColors, 3));
    photonGeo.setAttribute("aPhase", new THREE.BufferAttribute(photonPhases, 1));
    photonGeo.setAttribute("aSpeed", new THREE.BufferAttribute(photonSpeeds, 1));

    const photonUniforms = {
      uTime: { value: 0 },
      uSystole: { value: 0 },
    };

    const photonMat = new THREE.ShaderMaterial({
      vertexShader: PHOTON_VERTEX_SHADER,
      fragmentShader: PHOTON_FRAGMENT_SHADER,
      uniforms: photonUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const photonSystem = new THREE.Points(photonGeo, photonMat);
    scene.add(photonSystem);
    disposables.push(photonGeo, photonMat);

    // 4. Volumetric 3D Pulse Shockwave Expansion Ring
    const shockwaveRingGeo = new THREE.RingGeometry(0.1, 0.28, 64);
    const shockwaveRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const shockwaveRingMesh = new THREE.Mesh(shockwaveRingGeo, shockwaveRingMat);
    shockwaveRingMesh.rotation.x = -Math.PI / 2;
    shockwaveRingMesh.position.set(0, -0.8, -1.0);
    scene.add(shockwaveRingMesh);
    disposables.push(shockwaveRingGeo, shockwaveRingMat);

    // Mouse Parallax & Cinematic Motion
    let pointerX = 0;
    let pointerY = 0;
    let scrollProgress = 0;

    const onPointerMove = (e: PointerEvent) => {
      pointerX = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
      pointerY = -(e.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
      gridUniforms.uPointer.value.set(pointerX, pointerY);
    };

    const onScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollProgress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const onResize = () => {
      const nw = window.innerWidth || 1280;
      const nh = window.innerHeight || 800;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      syncHudSize();
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    const tmpVec = new THREE.Vector3();
    let frameId = 0;

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = reducedMotion ? 2.0 : clock.getElapsedTime();
      const speedMult = boostRef.current ? 1.85 : 1.0;

      // Realistic cardiac/telemetry cycle spike
      const bpmFreq = boostRef.current ? 2.0 : 1.25;
      const beatCycle = (elapsed * bpmFreq) % 1;
      const systoleSpike =
        Math.exp(-Math.pow((beatCycle - 0.18) * 9.5, 2)) +
        0.35 * Math.exp(-Math.pow((beatCycle - 0.34) * 12.0, 2));

      if (shockwaveRef.current > 0) {
        shockwaveRef.current = Math.max(0, shockwaveRef.current - dt * 1.25);
      }

      const combinedSystole = Math.min(1.4, systoleSpike + shockwaveRef.current * 0.85);

      gridUniforms.uTime.value = elapsed * speedMult;
      gridUniforms.uSystole.value = combinedSystole;
      photonUniforms.uTime.value = elapsed * speedMult;
      photonUniforms.uSystole.value = combinedSystole;

      // Cinematic smooth camera parallax & orbit
      const targetCamX = pointerX * 0.95 + Math.sin(scrollProgress * Math.PI * 2) * 0.65;
      const targetCamY = 1.2 + pointerY * 0.55 - scrollProgress * 0.5;
      const targetCamZ = 9.2 - scrollProgress * 1.5;
      camera.position.x += (targetCamX - camera.position.x) * 0.06;
      camera.position.y += (targetCamY - camera.position.y) * 0.06;
      camera.position.z += (targetCamZ - camera.position.z) * 0.06;
      camera.lookAt(pointerX * 0.35, pointerY * 0.25 - scrollProgress * 0.3, 0);
      gridUniforms.uCameraPos.value.copy(camera.position);

      // Animate traveling photon laser beacons along 3D fiber conduits
      travelingPhotons.forEach((p) => {
        const u = (elapsed * p.speed * speedMult + p.offset) % 1;
        p.curve.getPointAt(u, tmpVec);
        p.mesh.position.copy(tmpVec);
        p.mesh.scale.setScalar(0.9 + combinedSystole * 0.65);
      });

      conduitGroup.rotation.z = Math.sin(elapsed * 0.25) * 0.08;

      // Animate 3D pulse shockwave ring on heartbeat / event
      if (shockwaveRef.current > 0.02) {
        const p = 1.0 - shockwaveRef.current;
        shockwaveRingMesh.scale.setScalar(1 + p * 28.0);
        shockwaveRingMat.opacity = shockwaveRef.current * 0.62;
      } else {
        shockwaveRingMat.opacity = 0;
      }

      renderer.render(scene, camera);

      // Render UHD 2D HUD Cybernetic Telemetry Layer
      if (hudCtx) {
        const cw = window.innerWidth || 1280;
        const ch = window.innerHeight || 800;
        hudCtx.clearRect(0, 0, cw, ch);

        // Futuristic Holographic Waveform along the lower telemetry baseline
        hudCtx.save();
        hudCtx.beginPath();
        const baseY = ch * 0.86;
        for (let x = 0; x <= cw; x += 6) {
          const u = x / cw;
          const wPhase = ((u * 3.6 - elapsed * 0.52 * speedMult) % 1 + 1) % 1;
          let spike = 0;
          if (wPhase > 0.42 && wPhase < 0.46) spike = -12;
          else if (wPhase >= 0.46 && wPhase < 0.50) spike = 48 * (1 + combinedSystole * 0.4);
          else if (wPhase >= 0.50 && wPhase < 0.54) spike = -26;
          else if (wPhase >= 0.54 && wPhase < 0.60) spike = 14;
          const y = baseY - spike;
          if (x === 0) hudCtx.moveTo(x, y);
          else hudCtx.lineTo(x, y);
        }
        hudCtx.strokeStyle = "rgba(0, 240, 255, 0.65)";
        hudCtx.lineWidth = 2.4;
        hudCtx.shadowColor = "#00f0ff";
        hudCtx.shadowBlur = 10;
        hudCtx.stroke();
        hudCtx.restore();

        // High-Tech Ambient Telemetry Crosshairs in Screen Corners
        hudCtx.save();
        hudCtx.strokeStyle = "rgba(0, 240, 255, 0.22)";
        hudCtx.lineWidth = 1.2;
        // Top Left Reticle
        hudCtx.strokeRect(32, 32, 16, 16);
        hudCtx.beginPath();
        hudCtx.moveTo(40, 26);
        hudCtx.lineTo(40, 54);
        hudCtx.moveTo(26, 40);
        hudCtx.lineTo(54, 40);
        hudCtx.stroke();

        // Bottom Right Reticle
        hudCtx.strokeRect(cw - 48, ch - 48, 16, 16);
        hudCtx.beginPath();
        hudCtx.moveTo(cw - 40, ch - 54);
        hudCtx.lineTo(cw - 40, ch - 26);
        hudCtx.moveTo(cw - 54, ch - 40);
        hudCtx.lineTo(cw - 26, ch - 40);
        hudCtx.stroke();
        hudCtx.restore();

        // Expanding 2D shockwave ring on trigger
        if (shockwaveRef.current > 0.01) {
          const p = 1.0 - shockwaveRef.current;
          hudCtx.save();
          hudCtx.beginPath();
          hudCtx.arc(cw * 0.5, ch * 0.48, 80 + p * Math.max(cw, ch) * 0.6, 0, Math.PI * 2);
          hudCtx.strokeStyle = `rgba(0, 240, 255, ${shockwaveRef.current * 0.48})`;
          hudCtx.lineWidth = 2.4;
          hudCtx.shadowColor = "#00f0ff";
          hudCtx.shadowBlur = 12;
          hudCtx.stroke();
          hudCtx.restore();
        }
      }
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="live-biomedical-bg" aria-hidden="true">
      <div ref={mountRef} className="live-biomedical-webgl" />
      <canvas ref={hudCanvasRef} className="live-biomedical-hud" />
      <div className="live-biomedical-vignette" />
    </div>
  );
}
