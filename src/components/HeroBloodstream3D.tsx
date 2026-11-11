import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface HeroBloodstream3DProps {
  interactiveBoost?: boolean;
  freeExplore?: boolean;
  onPulse?: () => void;
}

/**
 * Generates a watertight biconcave erythrocyte (red blood cell) geometry
 * by deforming a high-resolution sphere via the Evans & Fung radial profile.
 */
function createErythrocyteGeometry(radius = 1, widthSegments = 72, heightSegments = 48): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  const pos = geometry.attributes.position;

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) / radius;
    const y = pos.getY(i) / radius;
    const z = pos.getZ(i) / radius;

    const r2 = Math.min(1, x * x + z * z);
    const biconcaveFactor = 0.21 + 1.98 * r2 - 1.08 * r2 * r2;
    const microRipple = 0.012 * Math.sin(x * 13 + z * 8) * Math.cos(z * 11 - x * 7);

    const newX = x * radius * 1.28 * (1 + microRipple);
    const newY = y * radius * biconcaveFactor * 0.62;
    const newZ = z * radius * 1.28 * (1 + microRipple);

    pos.setXYZ(i, newX, newY, newZ);
  }

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
    renderer.toneMappingExposure = 1.22;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x16070c, 0.068);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 60);
    camera.position.set(0, 0.1, 8.6);

    // Rich crimson & warm coral atmospheric lighting
    const ambientLight = new THREE.AmbientLight(0x45121e, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffb4aa, 2.8);
    keyLight.position.set(5.5, 4.2, 5.2);
    scene.add(keyLight);

    const crimsonCoreLight = new THREE.PointLight(0xff2c4d, 16, 18, 1.5);
    crimsonCoreLight.position.set(2.8, 0.2, 2.4);
    scene.add(crimsonCoreLight);

    const rimLight = new THREE.PointLight(0xff7d8d, 12, 16, 1.5);
    rimLight.position.set(0.2, -2.8, -2.5);
    scene.add(rimLight);

    const coolBackLight = new THREE.DirectionalLight(0x88203b, 1.2);
    coolBackLight.position.set(-5, -2, -4);
    scene.add(coolBackLight);

    // Focal hero erythrocyte
    const heroGeometry = createErythrocyteGeometry(1.48, 84, 56);
    const heroMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x9b122b),
      emissive: new THREE.Color(0x31040e),
      emissiveIntensity: 0.72,
      roughness: 0.28,
      metalness: 0.05,
      clearcoat: 0.85,
      clearcoatRoughness: 0.22,
      sheen: 0.9,
      sheenRoughness: 0.4,
      sheenColor: new THREE.Color(0xff6b7f),
    });

    const heroCell = new THREE.Mesh(heroGeometry, heroMaterial);
    heroCell.position.set(2.35, 0.12, 0.35);
    heroCell.rotation.set(0.58, -0.45, 0.22);
    scene.add(heroCell);

    // Fresnel atmospheric shell around hero cell for luminous macro edge
    const shellMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(0xff5b71) },
        uIntensity: { value: 0.85 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPosition.xyz);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float fresnel = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 3.2);
          gl_FragColor = vec4(uColor, fresnel * uIntensity * 0.55);
        }
      `,
    });
    const heroGlowShell = new THREE.Mesh(heroGeometry, shellMaterial);
    heroGlowShell.scale.setScalar(1.03);
    heroCell.add(heroGlowShell);

    // Instanced bloodstream swarm of smaller cells
    const cellCount = 34;
    const swarmGeometry = createErythrocyteGeometry(0.45, 36, 24);
    const swarmMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x7c0e23),
      emissive: new THREE.Color(0x220309),
      roughness: 0.36,
      metalness: 0.04,
      clearcoat: 0.6,
      clearcoatRoughness: 0.3,
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
      const biasRight = i < 24 ? 0.6 + Math.random() * 5.6 : -3.8 + Math.random() * 4.5;
      cellStates.push({
        baseX: biasRight,
        baseY: (Math.random() - 0.5) * 6.4,
        baseZ: -6.5 + Math.random() * 7.8,
        scale: 0.42 + Math.random() * 0.92,
        speed: 0.22 + Math.random() * 0.38,
        phase: Math.random() * Math.PI * 2,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
      });
    }

    // Living arterial signal filaments (Catmull-Rom curves + glowing particles)
    const filamentCurves = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.4, -2.1, -1.8),
        new THREE.Vector3(0.6, -1.1, 0.3),
        new THREE.Vector3(2.3, -0.35, 1.45),
        new THREE.Vector3(4.2, 0.75, 0.2),
        new THREE.Vector3(6.2, 2.2, -1.5),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.1, 2.6, -2.6),
        new THREE.Vector3(1.5, 1.3, 0.7),
        new THREE.Vector3(3.1, 0.1, 1.3),
        new THREE.Vector3(4.5, -1.2, -0.4),
        new THREE.Vector3(6.0, -2.5, -2.2),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.6, 0.4, -2.2),
        new THREE.Vector3(1.4, -0.7, 0.5),
        new THREE.Vector3(2.9, 0.9, 1.15),
        new THREE.Vector3(5.4, 1.4, -0.9),
      ]),
    ];

    const filamentGeometries: THREE.TubeGeometry[] = [];
    const filamentMaterials: THREE.MeshBasicMaterial[] = [];
    filamentCurves.forEach((curve, index) => {
      const tubeGeo = new THREE.TubeGeometry(curve, 84, index === 0 ? 0.015 : 0.01, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: index === 0 ? 0xff7082 : 0xd93852,
        transparent: true,
        opacity: index === 0 ? 0.36 : 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      filamentGeometries.push(tubeGeo);
      filamentMaterials.push(tubeMat);
      scene.add(new THREE.Mesh(tubeGeo, tubeMat));
    });

    // Signal particles moving smoothly along filaments + ambient plasma motes
    const signalParticleCount = 260;
    const signalPositions = new Float32Array(signalParticleCount * 3);
    const signalMeta = Array.from({ length: signalParticleCount }, (_, idx) => ({
      curveIndex: idx % filamentCurves.length,
      t: Math.random(),
      speed: 0.045 + Math.random() * 0.085,
      jitterRadius: 0.05 + Math.random() * 0.18,
      jitterAngle: Math.random() * Math.PI * 2,
    }));

    const signalGeo = new THREE.BufferGeometry();
    signalGeo.setAttribute("position", new THREE.BufferAttribute(signalPositions, 3));
    const signalMat = new THREE.PointsMaterial({
      color: 0xff8b98,
      size: 0.068,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const signalPoints = new THREE.Points(signalGeo, signalMat);
    scene.add(signalPoints);

    // Ambient plasma stardust
    const dustCount = 220;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i += 1) {
      dustPositions[i * 3] = (Math.random() - 0.35) * 14;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      dustPositions[i * 3 + 2] = -7 + Math.random() * 9;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xff6276,
      size: 0.036,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // Expanding pulse shockwave ring
    const pulseRingGeo = new THREE.RingGeometry(0.92, 1.0, 64);
    const pulseRingMat = new THREE.MeshBasicMaterial({
      color: 0xff7a8a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pulseRing = new THREE.Mesh(pulseRingGeo, pulseRingMat);
    pulseRing.position.copy(heroCell.position);
    pulseRing.rotation.set(0.4, -0.35, 0);
    scene.add(pulseRing);

    // 3D Signal Beacon Nodes travelling along arterial curves
    const beaconGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xffe4df,
      transparent: true,
      opacity: 0.92,
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
    let smoothCellX = 2.38;
    let smoothCamZ = 8.6;
    let smoothLookX = 0.55;
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
        const expansion = 1 + (1 - pulseStrength) * 3.8;
        pulseRing.scale.setScalar(expansion);
        pulseRingMat.opacity = pulseStrength * 0.52;
      } else {
        pulseRingMat.opacity = 0;
      }

      const boostMult = boostRef.current ? 1.75 : 1.0;
      simPhase += dt * boostMult;
      const speedMult = (1 + pulseStrength * 1.9) * boostMult;

      // Responsive & free-explore placement
      const isNarrow = (container.clientWidth || window.innerWidth) < 820;
      const exploring = freeExploreRef.current;
      const targetCellX = exploring ? 0.15 : isNarrow ? 1.15 : 2.38;
      const targetCellScale = exploring ? 1.14 : isNarrow ? 0.84 : 1.0;
      const targetCamZ = exploring ? 6.9 : 8.6;
      const targetLookX = exploring ? 0.1 : 0.55;

      smoothCellX += (targetCellX - smoothCellX) * 0.06;
      smoothCamZ += (targetCamZ - smoothCamZ) * 0.06;
      smoothLookX += (targetLookX - smoothLookX) * 0.06;

      heroCell.position.x = smoothCellX + pointerX * 0.25;
      heroCell.position.y = 0.14 + Math.sin(elapsed * 0.65) * 0.14 - pointerY * 0.2;
      heroCell.scale.setScalar(targetCellScale * (1 + Math.sin(elapsed * 1.3) * 0.018 + pulseStrength * 0.04));

      heroCell.rotation.x = 0.58 + Math.sin(elapsed * 0.34) * 0.12 + pointerY * 0.26 + orbitPitch;
      heroCell.rotation.y = -0.45 + simPhase * 0.16 + pointerX * 0.34 + orbitYaw;
      heroCell.rotation.z = 0.22 + Math.cos(elapsed * 0.28) * 0.08;

      pulseRing.position.copy(heroCell.position);
      crimsonCoreLight.intensity = 16 + Math.sin(elapsed * 1.6) * 2.4 + pulseStrength * 14;
      shellMaterial.uniforms.uIntensity.value = 0.85 + pulseStrength * 0.7;

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
        const yOffset = Math.sin(drift) * 0.55;
        const xDrift = Math.cos(drift * 0.5 + c.phase) * 0.38;

        dummy.position.set(
          c.baseX + xDrift + pointerX * (0.08 * c.scale),
          c.baseY + yOffset - pointerY * (0.08 * c.scale),
          c.baseZ,
        );
        dummy.rotation.set(
          c.rotX + elapsed * c.speed * 0.55,
          c.rotY + elapsed * c.speed * 0.7,
          c.rotZ + elapsed * c.speed * 0.3,
        );
        dummy.scale.setScalar(c.scale);
        dummy.updateMatrix();
        instancedCells.setMatrixAt(i, dummy.matrix);
      }
      instancedCells.instanceMatrix.needsUpdate = true;

      // Update glowing arterial signal particles along curves
      const posAttr = signalGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < signalParticleCount; i += 1) {
        const meta = signalMeta[i];
        meta.t = (meta.t + dt * meta.speed * speedMult) % 1;
        filamentCurves[meta.curveIndex].getPointAt(meta.t, tempVec);

        const swirl = elapsed * 1.6 + meta.jitterAngle + meta.t * 10;
        posAttr.setXYZ(
          i,
          tempVec.x + Math.cos(swirl) * meta.jitterRadius,
          tempVec.y + Math.sin(swirl) * meta.jitterRadius,
          tempVec.z + Math.sin(swirl * 0.7) * meta.jitterRadius * 0.6,
        );
      }
      posAttr.needsUpdate = true;

      dustPoints.rotation.y = elapsed * 0.025 + pointerX * 0.05;
      dustPoints.rotation.x = pointerY * 0.04;

      camera.position.x += (pointerX * 0.38 - camera.position.x) * 0.04;
      camera.position.y += (0.1 - pointerY * 0.26 - camera.position.y) * 0.04;
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

      beaconGeo.dispose();
      beaconMat.dispose();

      heroGeometry.dispose();
      heroMaterial.dispose();
      shellMaterial.dispose();
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
