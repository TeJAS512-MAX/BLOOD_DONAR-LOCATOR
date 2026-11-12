import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface BloodstreamScrollUniverse3DProps {
  scrollProgress: number; // 0 to 1 across entire page
  boostFlow?: boolean;
}

function createBokehTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const h = size / 2;
    const grad = ctx.createRadialGradient(h, h, 0, h, h, h);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.28, "rgba(255,175,190,0.82)");
    grad.addColorStop(0.6, "rgba(255,77,109,0.28)");
    grad.addColorStop(1, "rgba(255,77,109,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  return new THREE.CanvasTexture(canvas);
}

function createBiologicalErythrocyteGeo(): THREE.BufferGeometry {
  const radius = 0.62;
  const geo = new THREE.SphereGeometry(radius, 40, 26);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) / radius;
    const y = pos.getY(i) / radius;
    const z = pos.getZ(i) / radius;

    const r2 = Math.min(1, x * x + z * z);
    const r = Math.sqrt(r2);
    const factor = 0.34 + 1.48 * r2 - 0.84 * r2 * r2;
    const wave = 0.014 * Math.sin(x * 6 + z * 5);

    pos.setXYZ(
      i,
      x * radius * 1.18 * (1 + wave * 0.4),
      y * radius * factor * 0.56,
      z * radius * 1.18 * (1 + wave * 0.4),
    );

    const shade = 0.46 + 0.54 * Math.pow(r, 1.25);
    colors[i * 3] = shade;
    colors[i * 3 + 1] = shade * 0.82;
    colors[i * 3 + 2] = shade * 0.86;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Full-viewport fixed 3D WebGL backdrop creating a continuous scroll-driven
 * camera flight through a living bloodstream and arterial connection network.
 */
export function BloodstreamScrollUniverse3D({
  scrollProgress,
  boostFlow = false,
}: BloodstreamScrollUniverse3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(scrollProgress);
  const boostRef = useRef(boostFlow);
  const [disabled, setDisabled] = useState(false);

  scrollRef.current = scrollProgress;
  boostRef.current = boostFlow;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setDisabled(true);
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
      setDisabled(true);
      return;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090d16, 0.048);

    const camera = new THREE.PerspectiveCamera(46, w / h, 0.1, 80);

    // Dynamic lighting carried along with camera flight
    scene.add(new THREE.AmbientLight(0x281320, 1.4));
    const camKeyLight = new THREE.PointLight(0xffd4dc, 18, 28, 1.4);
    scene.add(camKeyLight);
    const camCrimsonLight = new THREE.PointLight(0xff2e54, 22, 26, 1.4);
    scene.add(camCrimsonLight);
    const coolAccentLight = new THREE.DirectionalLight(0x38bdf8, 0.75);
    coolAccentLight.position.set(-4, 6, 4);
    scene.add(coolAccentLight);

    // Continuous 3D vascular flight spline from z = +6 down to z = -56
    const flightCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.2, 6),
      new THREE.Vector3(1.8, -0.4, -4),
      new THREE.Vector3(-1.6, 0.7, -15),
      new THREE.Vector3(1.5, -0.5, -27),
      new THREE.Vector3(-1.2, 0.6, -39),
      new THREE.Vector3(0.4, 0.0, -52),
    ]);

    // Delicate glowing vascular tunnel wireframe rings + dual helical light ribbons
    const ribbonPointsA: THREE.Vector3[] = [];
    const ribbonPointsB: THREE.Vector3[] = [];
    const steps = 160;
    const tmp = new THREE.Vector3();
    for (let i = 0; i <= steps; i += 1) {
      const u = i / steps;
      flightCurve.getPointAt(u, tmp);
      const angle = u * Math.PI * 8;
      const rad = 3.2 + Math.sin(u * Math.PI * 4) * 0.45;
      ribbonPointsA.push(new THREE.Vector3(tmp.x + Math.cos(angle) * rad, tmp.y + Math.sin(angle) * rad, tmp.z));
      ribbonPointsB.push(
        new THREE.Vector3(
          tmp.x + Math.cos(angle + Math.PI) * rad,
          tmp.y + Math.sin(angle + Math.PI) * rad,
          tmp.z,
        ),
      );
    }

    const curveA = new THREE.CatmullRomCurve3(ribbonPointsA);
    const curveB = new THREE.CatmullRomCurve3(ribbonPointsB);
    const tubeGeoA = new THREE.TubeGeometry(curveA, 180, 0.018, 6, false);
    const tubeGeoB = new THREE.TubeGeometry(curveB, 180, 0.015, 6, false);
    const tubeMatA = new THREE.MeshBasicMaterial({
      color: 0xff4d6d,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const tubeMatB = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(tubeGeoA, tubeMatA));
    scene.add(new THREE.Mesh(tubeGeoB, tubeMatB));

    // Biological Red Blood Cells distributed along the 3D flight corridor
    const rbcCount = 46;
    const rbcGeo = createBiologicalErythrocyteGeo();
    const rbcMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      color: new THREE.Color(0xb81430),
      emissive: new THREE.Color(0x28030a),
      emissiveIntensity: 0.45,
      roughness: 0.58,
      metalness: 0.02,
      clearcoat: 0.24,
    });
    const instancedRbcs = new THREE.InstancedMesh(rbcGeo, rbcMat, rbcCount);
    scene.add(instancedRbcs);

    const rbcStates = Array.from({ length: rbcCount }, (_, i) => {
      const u = i / rbcCount;
      const angle = i * 2.1;
      const dist = 1.6 + (i % 5) * 0.72;
      return {
        u,
        angle,
        dist,
        scale: 0.45 + (i % 4) * 0.22,
        speed: 0.008 + (i % 3) * 0.004,
        rotSpeed: 0.35 + (i % 5) * 0.12,
      };
    });

    // Connection beacons (Donors / Banks / Hospitals) pulsing along the corridor
    const beaconCount = 18;
    const beaconGeo = new THREE.SphereGeometry(0.11, 14, 14);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xffe4e8,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const instancedBeacons = new THREE.InstancedMesh(beaconGeo, beaconMat, beaconCount);
    scene.add(instancedBeacons);

    // 420 Round Bokeh Plasma Light Orbs streaming along the arterial flight path
    const bokehSprite = createBokehTexture();
    const particleCount = 420;
    const pPositions = new Float32Array(particleCount * 3);
    const pMeta = Array.from({ length: particleCount }, (_, i) => ({
      u: Math.random(),
      angle: Math.random() * Math.PI * 2,
      radius: 1.2 + Math.random() * 4.4,
      speed: 0.01 + Math.random() * 0.022,
      phase: i * 0.13,
    }));
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      map: bokehSprite,
      color: 0xff8fa3,
      size: 0.24,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      alphaTest: 0.001,
    });
    scene.add(new THREE.Points(pGeo, pMat));

    let pointerX = 0;
    let pointerY = 0;
    let targetPtrX = 0;
    let targetPtrY = 0;

    const onPointerMove = (e: PointerEvent) => {
      targetPtrX = (e.clientX / window.innerWidth) * 2 - 1;
      targetPtrY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    const dummy = new THREE.Object3D();
    const camPos = new THREE.Vector3();
    const camLook = new THREE.Vector3();
    const pathPt = new THREE.Vector3();
    const clock = new THREE.Clock();
    let smoothScroll = scrollRef.current;
    let flowPhase = 0;
    let frameId = 0;

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      const boost = boostRef.current ? 2.1 : 1.0;
      flowPhase += dt * boost;

      pointerX += (targetPtrX - pointerX) * 0.04;
      pointerY += (targetPtrY - pointerY) * 0.04;
      smoothScroll += (scrollRef.current - smoothScroll) * 0.07;

      // Map scroll [0..1] to camera travel [0.02..0.88] along the 3D vascular curve
      const camU = 0.02 + smoothScroll * 0.84;
      const lookU = Math.min(0.99, camU + 0.085);

      flightCurve.getPointAt(camU, camPos);
      flightCurve.getPointAt(lookU, camLook);

      // Subtle continuous breathing video-motion sway
      camera.position.set(
        camPos.x + pointerX * 0.55 + Math.sin(elapsed * 0.45) * 0.18,
        camPos.y - pointerY * 0.38 + Math.cos(elapsed * 0.38) * 0.14,
        camPos.z,
      );
      camera.lookAt(camLook.x + pointerX * 0.25, camLook.y - pointerY * 0.2, camLook.z);
      camera.rotation.z += Math.sin(elapsed * 0.3 + smoothScroll * 4) * 0.04;

      camKeyLight.position.set(camera.position.x + 2, camera.position.y + 2, camera.position.z - 2);
      camCrimsonLight.position.set(camera.position.x - 2.5, camera.position.y - 1.5, camera.position.z - 6);

      // Move Erythrocytes continuously forward through the 3D bloodstream
      for (let i = 0; i < rbcCount; i += 1) {
        const s = rbcStates[i];
        const u = (s.u + flowPhase * s.speed) % 1;
        flightCurve.getPointAt(u, pathPt);
        const a = s.angle + flowPhase * 0.14;

        dummy.position.set(
          pathPt.x + Math.cos(a) * s.dist,
          pathPt.y + Math.sin(a) * s.dist * 0.72,
          pathPt.z,
        );
        dummy.rotation.set(
          elapsed * s.rotSpeed + i,
          elapsed * s.rotSpeed * 1.2 + i,
          elapsed * 0.25,
        );
        dummy.scale.setScalar(s.scale);
        dummy.updateMatrix();
        instancedRbcs.setMatrixAt(i, dummy.matrix);
      }
      instancedRbcs.instanceMatrix.needsUpdate = true;

      // Update connection beacons along helical ribbons
      for (let i = 0; i < beaconCount; i += 1) {
        const u = ((i / beaconCount) + flowPhase * 0.015) % 1;
        const targetCurve = i % 2 === 0 ? curveA : curveB;
        targetCurve.getPointAt(u, pathPt);
        dummy.position.copy(pathPt);
        const pulse = 0.85 + Math.sin(elapsed * 3.5 + i) * 0.3;
        dummy.scale.setScalar(pulse);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        instancedBeacons.setMatrixAt(i, dummy.matrix);
      }
      instancedBeacons.instanceMatrix.needsUpdate = true;

      // Update bokeh plasma particles
      const posAttr = pGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i += 1) {
        const pm = pMeta[i];
        pm.u = (pm.u + dt * pm.speed * boost) % 1;
        flightCurve.getPointAt(pm.u, pathPt);
        const a = pm.angle + elapsed * 0.25;
        posAttr.setXYZ(
          i,
          pathPt.x + Math.cos(a) * pm.radius,
          pathPt.y + Math.sin(a) * pm.radius * 0.78,
          pathPt.z,
        );
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);

      tubeGeoA.dispose();
      tubeGeoB.dispose();
      tubeMatA.dispose();
      tubeMatB.dispose();
      rbcGeo.dispose();
      rbcMat.dispose();
      beaconGeo.dispose();
      beaconMat.dispose();
      bokehSprite.dispose();
      pGeo.dispose();
      pMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (disabled) return null;

  return <div ref={mountRef} className="scroll-universe-3d" aria-hidden="true" />;
}
