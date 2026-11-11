import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { BloodComponentStory } from "../data/bloodlinkData";

interface ImpactOrbit3DProps {
  selectedId: BloodComponentStory["id"];
  donationCount: number;
  onSelectComponent: (id: BloodComponentStory["id"]) => void;
}

function createGlowSprite(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const h = size / 2;
    const grad = ctx.createRadialGradient(h, h, 0, h, h, h);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.3, "rgba(255,180,192,0.85)");
    grad.addColorStop(1, "rgba(255,77,109,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  return new THREE.CanvasTexture(canvas);
}

function createMiniRbcGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.42, 56, 36);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) / 0.42;
    const y = pos.getY(i) / 0.42;
    const z = pos.getZ(i) / 0.42;
    const r2 = Math.min(1, x * x + z * z);
    const r = Math.sqrt(r2);
    const factor = 0.24 + 1.86 * r2 - 1.02 * r2 * r2;
    const micro = 0.014 * Math.sin(x * 7 + z * 5);
    pos.setXYZ(i, x * 0.52 * (1 + micro), y * 0.42 * factor * 0.58, z * 0.52 * (1 + micro));

    const shade = 0.45 + 0.55 * Math.pow(r, 1.3);
    colors[i * 3] = shade;
    colors[i * 3 + 1] = shade * 0.85;
    colors[i * 3 + 2] = shade * 0.88;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

export function ImpactOrbit3D({ selectedId, donationCount, onSelectComponent }: ImpactOrbit3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selectedId);
  const donationCountRef = useRef(donationCount);
  const [webglUnsupported, setWebglUnsupported] = useState(false);

  selectedRef.current = selectedId;
  donationCountRef.current = donationCount;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      setWebglUnsupported(true);
      return;
    }

    const width = container.clientWidth || 520;
    const height = container.clientHeight || 520;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 40);
    camera.position.set(0, 0.5, 7.6);

    scene.add(new THREE.AmbientLight(0x521827, 1.8));
    const keyLight = new THREE.DirectionalLight(0xffcfc9, 2.5);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const coreLight = new THREE.PointLight(0xff3c5c, 12, 14, 1.4);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Central whole-blood sphere core
    const coreGeo = new THREE.SphereGeometry(0.92, 48, 48);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xb81a38),
      emissive: new THREE.Color(0x4f0817),
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.08,
      clearcoat: 0.95,
      clearcoatRoughness: 0.15,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    rootGroup.add(coreMesh);

    const haloGeo = new THREE.SphereGeometry(1.06, 36, 36);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xff5e73,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    rootGroup.add(haloMesh);

    // 3 Orbit planes & components
    const orbitSpecs: {
      id: BloodComponentStory["id"];
      radius: number;
      tiltX: number;
      tiltZ: number;
      speed: number;
      phase: number;
      color: number;
    }[] = [
      { id: "red-cells", radius: 2.05, tiltX: 1.05, tiltZ: -0.38, speed: 0.52, phase: 0.4, color: 0xff4d6d },
      { id: "plasma", radius: 2.55, tiltX: 1.18, tiltZ: 0.55, speed: -0.4, phase: 2.6, color: 0xfbbf24 },
      { id: "platelets", radius: 2.95, tiltX: 0.94, tiltZ: -0.82, speed: 0.34, phase: 4.5, color: 0x34d399 },
    ];

    const ringGeos: THREE.TorusGeometry[] = [];
    const ringMats: THREE.MeshBasicMaterial[] = [];
    const nodeMeshes: {
      id: BloodComponentStory["id"];
      mesh: THREE.Mesh;
      pivot: THREE.Group;
      spec: (typeof orbitSpecs)[number];
    }[] = [];

    const rbcGeo = createMiniRbcGeometry();
    const plasmaGeo = new THREE.SphereGeometry(0.36, 36, 36);
    const plateletGeo = new THREE.OctahedronGeometry(0.35, 1);

    const nodeMats: THREE.MeshPhysicalMaterial[] = [];

    orbitSpecs.forEach((spec) => {
      const pivot = new THREE.Group();
      pivot.rotation.set(spec.tiltX, 0, spec.tiltZ);
      rootGroup.add(pivot);

      const ringGeo = new THREE.TorusGeometry(spec.radius, 0.012, 12, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: 0.35,
      });
      ringGeos.push(ringGeo);
      ringMats.push(ringMat);
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      pivot.add(ringMesh);

      const geo =
        spec.id === "red-cells" ? rbcGeo : spec.id === "plasma" ? plasmaGeo : plateletGeo;

      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(spec.color),
        emissive: new THREE.Color(spec.color),
        emissiveIntensity: 0.28,
        roughness: spec.id === "red-cells" ? 0.52 : 0.24,
        metalness: 0.05,
        clearcoat: spec.id === "red-cells" ? 0.35 : 0.85,
        vertexColors: spec.id === "red-cells",
      });
      nodeMats.push(mat);

      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { componentId: spec.id };
      pivot.add(mesh);

      nodeMeshes.push({ id: spec.id, mesh, pivot, spec });
    });

    // Dynamic orbiting impact particles (soft round bokeh glow)
    const glowSprite = createGlowSprite();
    const maxParticles = 240;
    const pPositions = new Float32Array(maxParticles * 3);
    const pMeta = Array.from({ length: maxParticles }, () => ({
      radius: 1.45 + Math.random() * 1.9,
      angle: Math.random() * Math.PI * 2,
      y: (Math.random() - 0.5) * 2.1,
      speed: (0.18 + Math.random() * 0.35) * (Math.random() > 0.5 ? 1 : -1),
    }));
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    const particleMat = new THREE.PointsMaterial({
      map: glowSprite,
      color: 0xff8b99,
      size: 0.13,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      alphaTest: 0.001,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    rootGroup.add(particlePoints);

    // Interactive drag + click raycasting
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let isDragging = false;
    let dragStartX = 0;
    let dragOffsetY = 0;
    let targetDragY = 0;
    let hoverComponent: BloodComponentStory["id"] | null = null;

    const updateNdc = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragStartX = e.clientX;
      updateNdc(e.clientX, e.clientY);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(nodeMeshes.map((n) => n.mesh), false);
      if (hits.length > 0) {
        const componentId = hits[0].object.userData.componentId as BloodComponentStory["id"];
        onSelectComponent(componentId);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) {
        targetDragY += (e.clientX - dragStartX) * 0.008;
        dragStartX = e.clientX;
      }
      updateNdc(e.clientX, e.clientY);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(nodeMeshes.map((n) => n.mesh), false);
      hoverComponent = hits.length > 0 ? (hits[0].object.userData.componentId as BloodComponentStory["id"]) : null;
      container.style.cursor = hoverComponent ? "pointer" : isDragging ? "grabbing" : "grab";
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    container.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp);

    const handleResize = () => {
      const w = container.clientWidth || 520;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    const clock = new THREE.Clock();
    const targetScaleVec = new THREE.Vector3();
    let frameId = 0;

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const elapsed = reducedMotion ? 1.5 : clock.getElapsedTime();

      dragOffsetY += (targetDragY - dragOffsetY) * 0.08;
      rootGroup.rotation.y = elapsed * 0.08 + dragOffsetY;

      const scaleBreath = 1 + Math.sin(elapsed * 2.1) * 0.035;
      coreMesh.scale.setScalar(scaleBreath);
      haloMesh.scale.setScalar(1.06 + Math.sin(elapsed * 2.1) * 0.06);

      const currentSelected = selectedRef.current;
      const activeCount = Math.min(maxParticles, Math.max(30, donationCountRef.current * 5));
      particleGeo.setDrawRange(0, activeCount);

      nodeMeshes.forEach((item, idx) => {
        const angle = elapsed * item.spec.speed + item.spec.phase;
        item.mesh.position.set(
          Math.cos(angle) * item.spec.radius,
          0,
          Math.sin(angle) * item.spec.radius,
        );
        item.mesh.rotation.y = elapsed * 0.9 + idx;
        item.mesh.rotation.x = elapsed * 0.4;

        const isSelected = currentSelected === item.id;
        const isHovered = hoverComponent === item.id;
        const targetScale = isSelected ? 1.38 : isHovered ? 1.22 : 0.95;
        targetScaleVec.setScalar(targetScale);
        item.mesh.scale.lerp(targetScaleVec, 0.1);

        ringMats[idx].opacity = isSelected ? 0.85 : 0.24;
        (item.mesh.material as THREE.MeshPhysicalMaterial).emissiveIntensity = isSelected ? 0.72 : 0.25;
      });

      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const speedFactor = 1 + Math.min(1.8, donationCountRef.current / 35);
      for (let i = 0; i < maxParticles; i += 1) {
        const pm = pMeta[i];
        const a = pm.angle + elapsed * pm.speed * speedFactor;
        posAttr.setXYZ(i, Math.cos(a) * pm.radius, pm.y + Math.sin(elapsed + i) * 0.08, Math.sin(a) * pm.radius);
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      container.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("resize", handleResize);

      coreGeo.dispose();
      coreMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      rbcGeo.dispose();
      plasmaGeo.dispose();
      plateletGeo.dispose();
      nodeMats.forEach((m) => m.dispose());
      ringGeos.forEach((g) => g.dispose());
      ringMats.forEach((m) => m.dispose());
      glowSprite.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onSelectComponent]);

  if (webglUnsupported) {
    return (
      <div className="impact-visual" aria-label="Illustration showing one donation branching into three blood components">
        <div className="orbit-ring orbit-ring-one" />
        <div className="orbit-ring orbit-ring-two" />
        <div className="orbit-ring orbit-ring-three" />
        <div className="impact-core"><span>01</span><small>DONATION</small></div>
        <div className="impact-satellite satellite-one"><span className="satellite-dot" /><strong>RED CELLS</strong><small>OXYGEN CARRIERS</small></div>
        <div className="impact-satellite satellite-two"><span className="satellite-dot" /><strong>PLASMA</strong><small>LIQUID SUPPORT</small></div>
        <div className="impact-satellite satellite-three"><span className="satellite-dot" /><strong>PLATELETS</strong><small>CLOT SUPPORT</small></div>
      </div>
    );
  }

  return (
    <div className="impact-3d-shell" aria-label="Interactive 3D visualization showing one blood donation separating into Red Cells, Plasma and Platelets">
      <div ref={mountRef} className="impact-3d-canvas" />
      <div className="impact-3d-hint">DRAG TO ORBIT · CLICK A 3D COMPONENT NODE</div>
    </div>
  );
}
