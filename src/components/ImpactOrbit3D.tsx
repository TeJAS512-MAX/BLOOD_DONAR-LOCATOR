import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { BloodComponentStory } from "../data/bloodlinkData";

interface ImpactOrbit3DProps {
  activeComponent: BloodComponentStory["id"];
  unitCount: number;
  onSelectComponent: (id: BloodComponentStory["id"]) => void;
}

function createBiconcaveCellGeo(radius = 0.14): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(radius, 24, 16);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) / radius;
    const y = pos.getY(i) / radius;
    const z = pos.getZ(i) / radius;
    const r2 = Math.min(1, x * x + z * z);
    const signY = y >= 0 ? 1 : -1;
    const env = Math.sqrt(Math.max(0, 1 - r2));
    const poly = 0.21 + 1.98 * r2 - 1.12 * r2 * r2;
    pos.setXYZ(i, x * radius, signY * 0.52 * env * poly * radius, z * radius);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export function ImpactOrbit3D({
  activeComponent,
  unitCount,
  onSelectComponent,
}: ImpactOrbit3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeCompRef = useRef(activeComponent);
  activeCompRef.current = activeComponent;
  const unitsRef = useRef(unitCount);
  unitsRef.current = unitCount;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return;
    }

    const w = container.clientWidth || 380;
    const h = container.clientHeight || 380;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 30);
    camera.position.set(0, 2.2, 5.4);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0x475569, 2.2));
    const keyLight = new THREE.PointLight(0xff4d6d, 18, 16, 1.3);
    keyLight.position.set(2.5, 3.2, 3.0);
    scene.add(keyLight);
    const goldLight = new THREE.PointLight(0xfbbf24, 14, 16, 1.3);
    goldLight.position.set(-2.8, 2.0, 2.0);
    scene.add(goldLight);
    const emeraldLight = new THREE.PointLight(0x34d399, 14, 16, 1.3);
    emeraldLight.position.set(0, -2.5, 2.8);
    scene.add(emeraldLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Central Whole-Blood Centrifuge Chamber Core
    const coreGeo = new THREE.SphereGeometry(0.52, 36, 36);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xd90429,
      emissive: 0x4c0519,
      roughness: 0.2,
      metalness: 0.1,
      clearcoat: 0.9,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    rootGroup.add(coreMesh);

    const shellGeo = new THREE.IcosahedronGeometry(0.74, 2);
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0xff758f,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    rootGroup.add(shellMesh);

    // 3 Orbital Component Rings: Red Cells (inner), Plasma (middle), Platelets (outer)
    const orbitConfigs: {
      id: BloodComponentStory["id"];
      radius: number;
      color: number;
      tiltX: number;
      tiltZ: number;
    }[] = [
      { id: "red-cells", radius: 1.25, color: 0xff4d6d, tiltX: 0.32, tiltZ: -0.18 },
      { id: "plasma", radius: 1.72, color: 0xfbbf24, tiltX: -0.28, tiltZ: 0.24 },
      { id: "platelets", radius: 2.15, color: 0x34d399, tiltX: 0.18, tiltZ: 0.35 },
    ];

    const disposables: { dispose: () => void }[] = [coreGeo, coreMat, shellGeo, shellMat];
    const ringObjects: {
      id: BloodComponentStory["id"];
      group: THREE.Group;
      torusMat: THREE.MeshBasicMaterial;
      hitMesh: THREE.Mesh;
      radius: number;
    }[] = [];

    orbitConfigs.forEach((cfg) => {
      const g = new THREE.Group();
      g.rotation.set(cfg.tiltX, 0, cfg.tiltZ);
      rootGroup.add(g);

      const torusGeo = new THREE.TorusGeometry(cfg.radius, 0.022, 16, 96);
      const torusMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.55,
      });
      const torusMesh = new THREE.Mesh(torusGeo, torusMat);
      torusMesh.rotation.x = Math.PI / 2;
      g.add(torusMesh);

      // Invisible thicker torus for easy click picking
      const hitGeo = new THREE.TorusGeometry(cfg.radius, 0.18, 10, 48);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.rotation.x = Math.PI / 2;
      hitMesh.userData = { compId: cfg.id };
      g.add(hitMesh);

      disposables.push(torusGeo, torusMat, hitGeo, hitMat);
      ringObjects.push({ id: cfg.id, group: g, torusMat, hitMesh, radius: cfg.radius });
    });

    // Max 50 units -> up to 48 instances per component ring
    const maxInstances = 48;
    const rbcGeo = createBiconcaveCellGeo(0.14);
    const rbcMat = new THREE.MeshPhysicalMaterial({
      color: 0xe11d48,
      emissive: 0x4c0519,
      roughness: 0.28,
      clearcoat: 0.85,
    });
    const rbcInstanced = new THREE.InstancedMesh(rbcGeo, rbcMat, maxInstances);
    ringObjects[0].group.add(rbcInstanced);

    const plasmaGeo = new THREE.SphereGeometry(0.1, 20, 20);
    const plasmaMat = new THREE.MeshPhysicalMaterial({
      color: 0xfbbf24,
      emissive: 0x78350f,
      roughness: 0.18,
      clearcoat: 0.9,
    });
    const plasmaInstanced = new THREE.InstancedMesh(plasmaGeo, plasmaMat, maxInstances);
    ringObjects[1].group.add(plasmaInstanced);

    const plateletGeo = new THREE.OctahedronGeometry(0.095, 0);
    const plateletMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x065f46,
      roughness: 0.3,
    });
    const plateletInstanced = new THREE.InstancedMesh(plateletGeo, plateletMat, maxInstances);
    ringObjects[2].group.add(plateletInstanced);

    disposables.push(rbcGeo, rbcMat, plasmaGeo, plasmaMat, plateletGeo, plateletMat);

    // Pointer drag & click raycasting
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let dragDist = 0;
    let userYaw = 0;
    let userPitch = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      dragDist = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      dragDist += Math.abs(dx) + Math.abs(dy);
      userYaw += dx * 0.007;
      userPitch = Math.max(-0.5, Math.min(0.5, userPitch + dy * 0.005));
      startX = e.clientX;
      startY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isDragging && dragDist < 6) {
        const rect = container.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(
          ringObjects.map((r) => r.hitMesh),
          false,
        );
        if (hits.length > 0) {
          const compId = hits[0].object.userData.compId as BloodComponentStory["id"];
          onSelectComponent(compId);
        }
      }
      isDragging = false;
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);

    const onResize = () => {
      const nw = container.clientWidth || 380;
      const nh = container.clientHeight || 380;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    const dummy = new THREE.Object3D();
    let frameId = 0;

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const elapsed = reducedMotion ? 1.5 : clock.getElapsedTime();
      const activeId = activeCompRef.current;
      const units = unitsRef.current;
      const visibleCount = Math.min(maxInstances, Math.max(8, Math.round(6 + (units / 50) * 42)));

      rootGroup.rotation.y = elapsed * 0.18 + userYaw;
      rootGroup.rotation.x = userPitch;

      coreMesh.scale.setScalar(1 + Math.sin(elapsed * 3.0) * 0.045);
      shellMesh.rotation.y = -elapsed * 0.35;
      shellMesh.rotation.z = elapsed * 0.2;

      ringObjects.forEach((r) => {
        const isFocused = r.id === activeId;
        r.torusMat.opacity = isFocused ? 0.92 : 0.24;
        const targetScale = isFocused ? 1.06 : 0.96;
        r.group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
      });

      // Update instanced meshes along each orbital ring
      const updateOrbitInstances = (
        mesh: THREE.InstancedMesh,
        radius: number,
        speed: number,
        isFocused: boolean,
      ) => {
        for (let i = 0; i < maxInstances; i += 1) {
          if (i >= visibleCount) {
            dummy.scale.setScalar(0);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
            continue;
          }
          const angle = (i / visibleCount) * Math.PI * 2 + elapsed * speed;
          const waveY = Math.sin(angle * 3 + elapsed * 2) * 0.06;
          dummy.position.set(Math.cos(angle) * radius, waveY, Math.sin(angle) * radius);
          dummy.rotation.set(elapsed * 0.9 + i, angle, elapsed * 0.5);
          dummy.scale.setScalar(isFocused ? 1.22 : 0.78);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      };

      updateOrbitInstances(rbcInstanced, 1.25, 0.55, activeId === "red-cells");
      updateOrbitInstances(plasmaInstanced, 1.72, -0.42, activeId === "plasma");
      updateOrbitInstances(plateletInstanced, 2.15, 0.68, activeId === "platelets");

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", onResize);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onSelectComponent]);

  return (
    <div className="impact-3d-shell">
      <div
        ref={mountRef}
        className="impact-3d-canvas"
        aria-label="Interactive model of one donation separating into red cells, plasma and platelets"
      />
      <div className="impact-3d-hint">
        Drag to rotate · click a ring to inspect
      </div>
    </div>
  );
}
