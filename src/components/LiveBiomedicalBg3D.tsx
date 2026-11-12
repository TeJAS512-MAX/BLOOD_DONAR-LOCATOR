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
 * High-resolution Evans–Fung parametric biconcave red blood cell geometry
 * with thickness attribute stored in UV.x for subsurface scattering in GLSL.
 */
function createSubsurfaceRBCGeometry(radius = 1, wSeg = 52, hSeg = 34): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(radius, wSeg, hSeg);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) / radius;
    const y = pos.getY(i) / radius;
    const z = pos.getZ(i) / radius;
    const r2 = Math.min(1, x * x + z * z);
    const signY = y >= 0 ? 1 : -1;
    const radialEnv = Math.sqrt(Math.max(0, 1 - r2));
    const poly = 0.207 + 2.003 * r2 - 1.123 * r2 * r2;
    const biconcaveY = signY * 0.52 * radialEnv * poly * radius;
    pos.setXYZ(i, x * radius, biconcaveY, z * radius);
    // Store normalized radial distance (0 = thin center dimple, 1 = thick outer torus) in uv.x
    uv.setXY(i, Math.sqrt(r2), (y + 1) * 0.5);
  }

  pos.needsUpdate = true;
  uv.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

const RBC_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uSystole;

  void main() {
    vUv = uv;
    vec3 pos = position;
    // Subtle elastic cell membrane shear deformation during systolic pulse
    float membraneWave = sin(pos.x * 3.8 + uTime * 3.2) * 0.025 * (1.0 + uSystole * 0.8);
    pos.y += membraneWave;

    #ifdef USE_INSTANCING
      vec4 worldPosition = modelMatrix * instanceMatrix * vec4(pos, 1.0);
      mat3 normalMat = mat3(modelMatrix * instanceMatrix);
    #else
      vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
      mat3 normalMat = normalMatrix;
    #endif

    vWorldPos = worldPosition.xyz;
    vNormal = normalize(normalMat * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const RBC_FRAGMENT_SHADER = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  uniform vec3 uCameraPos;
  uniform float uSystole;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCameraPos - vWorldPos);
    vec3 L1 = normalize(vec3(2.8, 3.6, 4.2));
    vec3 L2 = normalize(vec3(-3.2, -1.8, -2.5));

    float diff1 = max(dot(N, L1), 0.0);
    float diff2 = max(dot(N, L2), 0.0);
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.65);

    // Subsurface hemoglobin translucency: center dimple (vUv.x near 0) transmits more light
    float dimpleTranslucency = smoothstep(0.75, 0.12, vUv.x);
    float backLight = pow(max(dot(-V, L1), 0.0), 2.0) * 0.65 + 0.35;

    vec3 deepOxblood = vec3(0.24, 0.015, 0.055);
    vec3 arterialCrimson = vec3(0.84, 0.05, 0.19);
    vec3 sssCoral = vec3(1.0, 0.28, 0.40);
    vec3 rimGlow = vec3(1.0, 0.48, 0.58);

    vec3 baseCol = mix(deepOxblood, arterialCrimson, diff1 * 0.82 + diff2 * 0.25);
    // Add warm subsurface scattering in thin biconcave center & backlit edges
    baseCol += sssCoral * dimpleTranslucency * backLight * (0.34 + uSystole * 0.18);
    // Silky Fresnel rim light
    baseCol += rimGlow * fresnel * (0.62 + uSystole * 0.25);

    // Specular clearcoat highlight
    vec3 H = normalize(L1 + V);
    float spec = pow(max(dot(N, H), 0.0), 36.0);
    baseCol += vec3(1.0, 0.85, 0.88) * spec * 0.38;

    // Atmospheric depth fade
    float depthDist = length(uCameraPos - vWorldPos);
    float fogFactor = smoothstep(16.0, 4.5, depthDist);
    vec3 fogColor = vec3(0.035, 0.045, 0.08);
    vec3 finalCol = mix(fogColor, baseCol, fogFactor);

    gl_FragColor = vec4(finalCol, 0.96);
  }
`;

const BOKEH_VERTEX_SHADER = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uTime;
  uniform float uSystole;

  void main() {
    vColor = aColor;
    vec3 pos = position;
    pos.y += sin(uTime * 1.1 + aPhase) * 0.18;
    pos.x += cos(uTime * 0.85 + aPhase) * 0.14;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float dist = -mvPosition.z;
    gl_PointSize = aSize * (240.0 / max(dist, 1.5)) * (1.0 + uSystole * 0.28);
    vAlpha = smoothstep(18.0, 3.0, dist) * (0.45 + 0.3 * sin(uTime * 2.2 + aPhase));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const BOKEH_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    float softRing = smoothstep(0.5, 0.08, d);
    gl_FragColor = vec4(vColor, softRing * vAlpha);
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h);
    renderer.setClearColor(0x070a12, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
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
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 45);
    camera.position.set(0, 0.3, 8.2);

    const disposables: { dispose: () => void }[] = [];

    // Shared Custom GLSL Subsurface-Scattering Material for Red Blood Cells
    const rbcUniforms = {
      uTime: { value: 0 },
      uSystole: { value: 0 },
      uCameraPos: { value: new THREE.Vector3(0, 0.3, 8.2) },
    };

    const rbcShaderMat = new THREE.ShaderMaterial({
      vertexShader: RBC_VERTEX_SHADER,
      fragmentShader: RBC_FRAGMENT_SHADER,
      uniforms: rbcUniforms,
      transparent: true,
    });
    const rbcInstancedMat = new THREE.ShaderMaterial({
      vertexShader: `#define USE_INSTANCING\n${RBC_VERTEX_SHADER}`,
      fragmentShader: RBC_FRAGMENT_SHADER,
      uniforms: rbcUniforms,
      transparent: true,
    });
    disposables.push(rbcShaderMat, rbcInstancedMat);

    // 1. Flagship Hero Macro Biconcave Erythrocyte (sculpted high-poly anchor)
    const heroCellGeo = createSubsurfaceRBCGeometry(1.38, 64, 42);
    const heroCellMesh = new THREE.Mesh(heroCellGeo, rbcShaderMat);
    heroCellMesh.position.set(-2.9, 0.65, 1.6);
    heroCellMesh.rotation.set(0.68, 0.42, -0.35);
    scene.add(heroCellMesh);
    disposables.push(heroCellGeo);

    // 2. Instanced Swarm of 42 Biconcave Erythrocytes with Systolic/Helix/Vortex morphing
    const swarmCount = 42;
    const swarmGeo = createSubsurfaceRBCGeometry(0.46, 36, 24);
    const swarmMesh = new THREE.InstancedMesh(swarmGeo, rbcInstancedMat, swarmCount);
    scene.add(swarmMesh);
    disposables.push(swarmGeo);

    const cellSeeds = Array.from({ length: swarmCount }, (_, idx) => ({
      u: idx / swarmCount,
      radial: 1.1 + (idx % 7) * 0.52,
      angleOffset: idx * 0.87,
      ySpread: ((idx % 9) - 4) * 0.68,
      zSpread: ((idx % 6) - 2.5) * 1.15,
      scale: 0.58 + (idx % 5) * 0.14,
      rotSpeed: 0.35 + (idx % 4) * 0.18,
    }));

    // 3. 5 Luminous 3D Bio-Optical Vascular Signal Ribbons + Traveling Pulse Capsules
    const ribbonGroup = new THREE.Group();
    scene.add(ribbonGroup);

    const pulseCapsules: {
      curve: THREE.CatmullRomCurve3;
      mesh: THREE.Mesh;
      speed: number;
      offset: number;
    }[] = [];

    const capsuleGeo = new THREE.SphereGeometry(0.085, 16, 16);
    disposables.push(capsuleGeo);

    const ribbonColors = [0xff4d6d, 0x38bdf8, 0xfbbf24, 0xff4d6d, 0x34d399];
    ribbonColors.forEach((col, rIdx) => {
      const pts: THREE.Vector3[] = [];
      const yBase = (rIdx - 2) * 1.05;
      const zBase = -1.2 - (rIdx % 3) * 1.1;
      for (let step = 0; step <= 8; step += 1) {
        const u = step / 8;
        const x = (u - 0.5) * 18.0;
        const y = yBase + Math.sin(u * Math.PI * 2 + rIdx * 1.1) * 1.25;
        const z = zBase + Math.cos(u * Math.PI * 1.5 + rIdx) * 1.1;
        pts.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, 72, 0.018, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.22,
      });
      ribbonGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
      disposables.push(tubeGeo, tubeMat);

      for (let p = 0; p < 2; p += 1) {
        const capMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const capMesh = new THREE.Mesh(capsuleGeo, capMat);
        ribbonGroup.add(capMesh);
        disposables.push(capMat);
        pulseCapsules.push({
          curve,
          mesh: capMesh,
          speed: 0.14 + rIdx * 0.025,
          offset: p * 0.5 + rIdx * 0.17,
        });
      }
    });

    // 4. Custom Shader Bokeh Plasma, Oxygen & Platelet Micro-Particles
    const bokehCount = 160;
    const bokehPos = new Float32Array(bokehCount * 3);
    const bokehSizes = new Float32Array(bokehCount);
    const bokehColors = new Float32Array(bokehCount * 3);
    const bokehPhases = new Float32Array(bokehCount);

    const palette = [
      new THREE.Color(0xff4d6d), // Erythrocyte ruby
      new THREE.Color(0xfbbf24), // Golden plasma
      new THREE.Color(0x38bdf8), // Cold-chain cyan
      new THREE.Color(0x34d399), // Platelet emerald
    ];

    for (let i = 0; i < bokehCount; i += 1) {
      bokehPos[i * 3] = (Math.random() - 0.5) * 18;
      bokehPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      bokehPos[i * 3 + 2] = -4.5 + Math.random() * 8.5;
      bokehSizes[i] = 0.08 + Math.random() * 0.22;
      bokehPhases[i] = Math.random() * Math.PI * 2;
      const c = palette[i % palette.length];
      bokehColors[i * 3] = c.r;
      bokehColors[i * 3 + 1] = c.g;
      bokehColors[i * 3 + 2] = c.b;
    }

    const bokehGeo = new THREE.BufferGeometry();
    bokehGeo.setAttribute("position", new THREE.BufferAttribute(bokehPos, 3));
    bokehGeo.setAttribute("aSize", new THREE.BufferAttribute(bokehSizes, 1));
    bokehGeo.setAttribute("aColor", new THREE.BufferAttribute(bokehColors, 3));
    bokehGeo.setAttribute("aPhase", new THREE.BufferAttribute(bokehPhases, 1));

    const bokehUniforms = {
      uTime: { value: 0 },
      uSystole: { value: 0 },
    };

    const bokehMat = new THREE.ShaderMaterial({
      vertexShader: BOKEH_VERTEX_SHADER,
      fragmentShader: BOKEH_FRAGMENT_SHADER,
      uniforms: bokehUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const bokehPoints = new THREE.Points(bokehGeo, bokehMat);
    scene.add(bokehPoints);
    disposables.push(bokehGeo, bokehMat);

    // Mouse Parallax & Scroll Tracking
    let pointerX = 0;
    let pointerY = 0;
    let scrollProgress = 0;

    const onPointerMove = (e: PointerEvent) => {
      pointerX = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
      pointerY = -(e.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
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
    const dummy = new THREE.Object3D();
    const tmpVec = new THREE.Vector3();
    let arterialPhase = 0;
    let frameId = 0;

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = reducedMotion ? 2.4 : clock.getElapsedTime();
      const speedMult = boostRef.current ? 1.75 : 1.0;

      // Realistic cardiac cycle: sharp systolic upstroke + dicrotic notch + diastolic decay
      const bpmFreq = boostRef.current ? 2.0 : 1.23; // ~74 BPM normal, 120 BPM boosted
      const beatCycle = (elapsed * bpmFreq) % 1;
      const systoleSpike =
        Math.exp(-Math.pow((beatCycle - 0.18) * 9.5, 2)) +
        0.38 * Math.exp(-Math.pow((beatCycle - 0.34) * 12.0, 2));

      if (shockwaveRef.current > 0) {
        shockwaveRef.current = Math.max(0, shockwaveRef.current - dt * 1.15);
      }

      const combinedSystole = Math.min(1.4, systoleSpike + shockwaveRef.current * 0.8);
      // Pulsatile forward velocity: faster during systole, gentle drift in diastole
      arterialPhase += dt * speedMult * (0.22 + combinedSystole * 0.42);

      rbcUniforms.uTime.value = elapsed;
      rbcUniforms.uSystole.value = combinedSystole;
      bokehUniforms.uTime.value = elapsed;
      bokehUniforms.uSystole.value = combinedSystole;

      // Determine active 3D formation mode (either explicit or scroll-choreographed)
      let activeFormation: "arterial" | "helix" | "vortex" = "arterial";
      if (modeRef.current !== "auto") {
        activeFormation = modeRef.current;
      } else if (scrollProgress < 0.34) {
        activeFormation = "arterial";
      } else if (scrollProgress < 0.68) {
        activeFormation = "helix";
      } else {
        activeFormation = "vortex";
      }

      // Smoothly choreograph camera position with mouse parallax & scroll depth
      const targetCamX = pointerX * 0.75 + Math.sin(scrollProgress * Math.PI * 2) * 0.55;
      const targetCamY = 0.25 + pointerY * 0.45 - scrollProgress * 0.4;
      const targetCamZ = activeFormation === "vortex" ? 7.4 : 8.2;
      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;
      camera.position.z += (targetCamZ - camera.position.z) * 0.05;
      camera.lookAt(pointerX * 0.25, pointerY * 0.18, 0);
      rbcUniforms.uCameraPos.value.copy(camera.position);

      // Animate Flagship Macro Hero Erythrocyte
      heroCellMesh.position.x = -2.85 + Math.cos(elapsed * 0.45) * 0.22 - scrollProgress * 1.4;
      heroCellMesh.position.y = 0.68 + Math.sin(elapsed * 0.75) * 0.16 + combinedSystole * 0.05;
      heroCellMesh.rotation.y = elapsed * 0.34;
      heroCellMesh.rotation.x = 0.62 + Math.sin(elapsed * 0.6) * 0.18;
      heroCellMesh.rotation.z = -0.3 + Math.cos(elapsed * 0.5) * 0.14;
      const heroScale = Math.max(0.45, 1.0 - scrollProgress * 0.45);
      heroCellMesh.scale.setScalar(heroScale * (1 + combinedSystole * 0.035));

      // Animate 42 Instanced Biconcave Erythrocytes according to active 3D mode
      for (let i = 0; i < swarmCount; i += 1) {
        const seed = cellSeeds[i];
        const flowU = (seed.u + arterialPhase * 0.12) % 1;

        if (activeFormation === "arterial") {
          // Laminar pulsatile bloodstream from left-deep to right-foreground
          const x = (flowU - 0.5) * 16.5;
          const archY = Math.sin(flowU * Math.PI * 2 + seed.angleOffset) * 1.15 + seed.ySpread * 0.55;
          const z = seed.zSpread + Math.cos(flowU * Math.PI + seed.angleOffset) * 0.9;
          dummy.position.set(x, archY, z);
        } else if (activeFormation === "helix") {
          // Double-helix ABO/Rh vascular strand
          const strand = i % 2 === 0 ? 1 : -1;
          const theta = flowU * Math.PI * 4 + (strand === 1 ? 0 : Math.PI);
          const x = (flowU - 0.5) * 15.0;
          const y = Math.sin(theta) * 2.15;
          const z = Math.cos(theta) * 2.15 - 1.0;
          dummy.position.set(x, y, z);
        } else {
          // Tri-layer centrifuge component vortex
          const theta = elapsed * 0.65 * speedMult + seed.angleOffset + flowU * Math.PI * 2;
          const ringRadius = 1.6 + (i % 3) * 1.35;
          const x = Math.cos(theta) * ringRadius * 1.35;
          const y = Math.sin(theta) * ringRadius * 0.85;
          const z = -1.2 + Math.sin(theta * 2 + i) * 1.1;
          dummy.position.set(x, y, z);
        }

        dummy.rotation.set(
          elapsed * seed.rotSpeed + seed.angleOffset,
          elapsed * (seed.rotSpeed * 0.8) + i,
          Math.sin(elapsed + i) * 0.5,
        );
        dummy.scale.setScalar(seed.scale * (1 + combinedSystole * 0.05));
        dummy.updateMatrix();
        swarmMesh.setMatrixAt(i, dummy.matrix);
      }
      swarmMesh.instanceMatrix.needsUpdate = true;

      // Animate traveling bio-optical signal capsules along 3D vascular tubes
      pulseCapsules.forEach((cap) => {
        const u = (elapsed * cap.speed * speedMult + cap.offset) % 1;
        cap.curve.getPointAt(u, tmpVec);
        cap.mesh.position.copy(tmpVec);
        cap.mesh.scale.setScalar(0.85 + combinedSystole * 0.55);
      });

      ribbonGroup.rotation.z = Math.sin(elapsed * 0.18) * 0.06;
      renderer.render(scene, camera);

      // Render Subtle 2D Broadcast Telemetry & Systolic Shockwave Overlay
      if (hudCtx) {
        const cw = window.innerWidth || 1280;
        const ch = window.innerHeight || 800;
        hudCtx.clearRect(0, 0, cw, ch);

        // Continuous ambient ECG / Arterial PPG waveform along the lower background
        hudCtx.save();
        hudCtx.beginPath();
        const baseY = ch * 0.84;
        for (let x = 0; x <= cw; x += 6) {
          const u = x / cw;
          const wPhase = ((u * 3.5 - elapsed * 0.48 * speedMult) % 1 + 1) % 1;
          let spike = 0;
          if (wPhase > 0.42 && wPhase < 0.46) spike = -10;
          else if (wPhase >= 0.46 && wPhase < 0.50) spike = 44 * (1 + combinedSystole * 0.35);
          else if (wPhase >= 0.50 && wPhase < 0.54) spike = -24;
          else if (wPhase >= 0.54 && wPhase < 0.60) spike = 11;
          const y = baseY - spike;
          if (x === 0) hudCtx.moveTo(x, y);
          else hudCtx.lineTo(x, y);
        }
        hudCtx.strokeStyle = "rgba(255, 77, 109, 0.22)";
        hudCtx.lineWidth = 1.6;
        hudCtx.stroke();
        hudCtx.restore();

        // Expanding systolic shockwave ring when user triggers a pulse or switches blood group
        if (shockwaveRef.current > 0.01) {
          const p = 1.0 - shockwaveRef.current;
          hudCtx.save();
          hudCtx.beginPath();
          hudCtx.arc(cw * 0.5, ch * 0.48, 60 + p * Math.max(cw, ch) * 0.55, 0, Math.PI * 2);
          hudCtx.strokeStyle = `rgba(255, 77, 109, ${shockwaveRef.current * 0.42})`;
          hudCtx.lineWidth = 2.2;
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
