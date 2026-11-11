import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { NetworkPartner } from "../data/bloodlinkData";

interface NetworkTopology3DProps {
  partners: NetworkPartner[];
  selectedPartnerId: string | null;
  onSelectPartner: (id: string) => void;
}

export function NetworkTopology3D({
  partners,
  selectedPartnerId,
  onSelectPartner,
}: NetworkTopology3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<string | null>(selectedPartnerId);
  selectedRef.current = selectedPartnerId;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return;
    }

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 340;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 40);
    camera.position.set(0, 3.6, 5.4);
    camera.lookAt(0, 0.2, 0);

    scene.add(new THREE.AmbientLight(0x475569, 2.0));
    const dirLight = new THREE.DirectionalLight(0xf8fafc, 2.2);
    dirLight.position.set(3, 6, 4);
    scene.add(dirLight);

    const mapGroup = new THREE.Group();
    scene.add(mapGroup);

    // Architectural topographic grid base
    const gridHelper = new THREE.GridHelper(6.8, 16, 0x334155, 0x1e293b);
    gridHelper.position.y = -0.02;
    mapGroup.add(gridHelper);

    const baseRingGeo = new THREE.RingGeometry(2.65, 2.7, 72);
    const baseRingMat = new THREE.MeshBasicMaterial({
      color: 0xff4d6d,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
    baseRing.rotation.x = -Math.PI / 2;
    mapGroup.add(baseRing);

    const beaconGeo = new THREE.SphereGeometry(0.14, 24, 24);
    const pillarGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.65, 12);
    const ringMarkerGeo = new THREE.RingGeometry(0.2, 0.24, 32);

    const disposables: { dispose: () => void }[] = [
      baseRingGeo,
      baseRingMat,
      beaconGeo,
      pillarGeo,
      ringMarkerGeo,
    ];

    const partnerNodes: {
      id: string;
      beacon: THREE.Mesh;
      ring: THREE.Mesh;
      worldPos: THREE.Vector3;
      beaconMat: THREE.MeshStandardMaterial;
    }[] = [];

    partners.forEach((p) => {
      const px = p.coords[0] * 2.1;
      const pz = -p.coords[1] * 2.1;
      const isBank = p.type === "Blood bank";

      const beaconMat = new THREE.MeshStandardMaterial({
        color: isBank ? 0xff4d6d : 0x34d399,
        emissive: isBank ? 0xe11d48 : 0x059669,
        emissiveIntensity: 0.72,
        roughness: 0.25,
      });
      const pillarMat = new THREE.MeshBasicMaterial({
        color: isBank ? 0xff4d6d : 0x34d399,
        transparent: true,
        opacity: 0.45,
      });
      const ringMat = new THREE.MeshBasicMaterial({
        color: isBank ? 0xff4d6d : 0x34d399,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
      });
      disposables.push(beaconMat, pillarMat, ringMat);

      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(px, 0.32, pz);
      mapGroup.add(pillar);

      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(px, 0.72, pz);
      beacon.userData = { partnerId: p.id };
      mapGroup.add(beacon);

      const ring = new THREE.Mesh(ringMarkerGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(px, 0.01, pz);
      mapGroup.add(ring);

      partnerNodes.push({
        id: p.id,
        beacon,
        ring,
        worldPos: new THREE.Vector3(px, 0.72, pz),
        beaconMat,
      });
    });

    // Supply corridor arcs connecting partners
    const arcPairs: [number, number][] = [];
    for (let i = 0; i < partnerNodes.length; i += 1) {
      for (let j = i + 1; j < partnerNodes.length; j += 1) {
        if ((i + j) % 2 === 1 || i === 0) arcPairs.push([i, j]);
      }
    }

    const pulsePackets: { curve: THREE.QuadraticBezierCurve3; mesh: THREE.Mesh; offset: number }[] = [];
    const packetGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0xff9aa7 });
    disposables.push(packetGeo, packetMat);

    arcPairs.forEach(([aIdx, bIdx], idx) => {
      const a = partnerNodes[aIdx].worldPos;
      const b = partnerNodes[bIdx].worldPos;
      const mid = new THREE.Vector3((a.x + b.x) * 0.5, 1.35 + (idx % 2) * 0.35, (a.z + b.z) * 0.5);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const pts = curve.getPoints(32);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xfa6877,
        transparent: true,
        opacity: 0.32,
      });
      disposables.push(lineGeo, lineMat);
      mapGroup.add(new THREE.Line(lineGeo, lineMat));

      const pMesh = new THREE.Mesh(packetGeo, packetMat);
      mapGroup.add(pMesh);
      pulsePackets.push({ curve, mesh: pMesh, offset: idx * 0.23 });
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerOffsetX = 0;
    let pointerOffsetY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      pointerOffsetX = pointer.x * 0.25;
      pointerOffsetY = pointer.y * 0.14;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(partnerNodes.map((n) => n.beacon), false);
      container.style.cursor = hits.length > 0 ? "pointer" : "default";
    };

    const handlePointerDown = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(partnerNodes.map((n) => n.beacon), false);
      if (hits.length > 0) {
        const partnerId = hits[0].object.userData.partnerId as string;
        onSelectPartner(partnerId);
      }
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerdown", handlePointerDown);

    const handleResize = () => {
      const w = container.clientWidth || 560;
      const h = container.clientHeight || 340;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    const clock = new THREE.Clock();
    const tempPt = new THREE.Vector3();
    const targetScaleVec = new THREE.Vector3();
    let frameId = 0;

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const elapsed = reducedMotion ? 1.2 : clock.getElapsedTime();

      mapGroup.rotation.y = Math.sin(elapsed * 0.22) * 0.24 + pointerOffsetX;
      mapGroup.rotation.x = pointerOffsetY * 0.3;

      const activeId = selectedRef.current;
      partnerNodes.forEach((node, idx) => {
        const isSelected = activeId === node.id;
        const targetScale = isSelected ? 1.55 : 1.0 + Math.sin(elapsed * 2 + idx) * 0.08;
        targetScaleVec.setScalar(targetScale);
        node.beacon.scale.lerp(targetScaleVec, 0.12);
        node.beaconMat.emissiveIntensity = isSelected ? 1.35 : 0.6;
        node.ring.scale.setScalar(isSelected ? 1.45 + Math.sin(elapsed * 4) * 0.15 : 1.0);
      });

      pulsePackets.forEach((pkt) => {
        const u = (elapsed * 0.35 + pkt.offset) % 1;
        pkt.curve.getPointAt(u, tempPt);
        pkt.mesh.position.copy(tempPt);
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleResize);
      disposables.forEach((d) => d.dispose());
      gridHelper.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [partners, onSelectPartner]);

  return (
    <div className="network-3d-panel">
      <div className="network-3d-header">
        <div>
          <span className="console-pulse" />
          <span>SPATIAL NETWORK TOPOLOGY (DEMO)</span>
        </div>
        <span>CLICK A 3D BEACON TO INSPECT</span>
      </div>
      <div ref={containerRef} className="network-3d-canvas" aria-label="Interactive 3D topology of illustrative BloodLink partner hospitals and blood banks" />
    </div>
  );
}
