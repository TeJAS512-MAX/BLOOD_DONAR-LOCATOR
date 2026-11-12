import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { NetworkPartner } from "../data/bloodlinkData";

interface NetworkTopology3DProps {
  partners: NetworkPartner[];
  selectedPartnerId: string | null;
  onSelectPartner: (id: string) => void;
}

interface ProjectedPartnerTag {
  id: string;
  city: string;
  shortName: string;
  isBank: boolean;
  oNegUnits: number;
  platelets: number;
  x: number;
  y: number;
  visible: boolean;
}

export function NetworkTopology3D({
  partners,
  selectedPartnerId,
  onSelectPartner,
}: NetworkTopology3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<string | null>(selectedPartnerId);
  selectedRef.current = selectedPartnerId;
  const [projectedTags, setProjectedTags] = useState<ProjectedPartnerTag[]>([]);

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
    const gridHelper = new THREE.GridHelper(7.4, 20, 0x334155, 0x172033);
    gridHelper.position.y = -0.02;
    mapGroup.add(gridHelper);

    const baseRingGeo = new THREE.RingGeometry(2.65, 2.7, 72);
    const baseRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
    baseRing.rotation.x = -Math.PI / 2;
    mapGroup.add(baseRing);

    const bankTowerGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.55, 6);
    const hospTowerGeo = new THREE.BoxGeometry(0.26, 0.52, 0.26);
    const beaconGeo = new THREE.SphereGeometry(0.13, 24, 24);
    const pillarGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.72, 12);
    const ringMarkerGeo = new THREE.RingGeometry(0.24, 0.29, 36);

    const disposables: { dispose: () => void }[] = [
      baseRingGeo,
      baseRingMat,
      bankTowerGeo,
      hospTowerGeo,
      beaconGeo,
      pillarGeo,
      ringMarkerGeo,
    ];

    const partnerNodes: {
      partner: NetworkPartner;
      beacon: THREE.Mesh;
      tower: THREE.Mesh;
      ring: THREE.Mesh;
      worldPos: THREE.Vector3;
      beaconMat: THREE.MeshStandardMaterial;
    }[] = [];

    partners.forEach((p) => {
      const px = p.coords[0] * 2.1;
      const pz = -p.coords[1] * 2.1;
      const isBank = p.type === "Blood bank";

      const beaconMat = new THREE.MeshStandardMaterial({
        color: isBank ? 0x38bdf8 : 0xff4d6d,
        emissive: isBank ? 0x0284c7 : 0xe11d48,
        emissiveIntensity: 0.85,
        roughness: 0.25,
      });
      const towerMat = new THREE.MeshPhysicalMaterial({
        color: isBank ? 0x0f2942 : 0x3b0a18,
        emissive: isBank ? 0x075985 : 0x881337,
        emissiveIntensity: 0.55,
        roughness: 0.3,
        clearcoat: 0.7,
      });
      const pillarMat = new THREE.MeshBasicMaterial({
        color: isBank ? 0x38bdf8 : 0xff4d6d,
        transparent: true,
        opacity: 0.4,
      });
      const ringMat = new THREE.MeshBasicMaterial({
        color: isBank ? 0x38bdf8 : 0xff4d6d,
        transparent: true,
        opacity: 0.52,
        side: THREE.DoubleSide,
      });
      disposables.push(beaconMat, towerMat, pillarMat, ringMat);

      const tower = new THREE.Mesh(isBank ? bankTowerGeo : hospTowerGeo, towerMat);
      tower.position.set(px, 0.26, pz);
      tower.userData = { partnerId: p.id };
      mapGroup.add(tower);

      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(px, 0.45, pz);
      mapGroup.add(pillar);

      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(px, 0.88, pz);
      beacon.userData = { partnerId: p.id };
      mapGroup.add(beacon);

      const ring = new THREE.Mesh(ringMarkerGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(px, 0.01, pz);
      mapGroup.add(ring);

      partnerNodes.push({
        partner: p,
        beacon,
        tower,
        ring,
        worldPos: new THREE.Vector3(px, 0.88, pz),
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
      const tubeGeo = new THREE.TubeGeometry(curve, 28, 0.014, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: idx % 2 === 0 ? 0x38bdf8 : 0xff4d6d,
        transparent: true,
        opacity: 0.3,
      });
      disposables.push(tubeGeo, tubeMat);
      mapGroup.add(new THREE.Mesh(tubeGeo, tubeMat));

      const pMesh = new THREE.Mesh(packetGeo, packetMat);
      mapGroup.add(pMesh);
      pulsePackets.push({ curve, mesh: pMesh, offset: idx * 0.23 });
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerOffsetX = 0;
    let pointerOffsetY = 0;
    const pickTargets = partnerNodes.flatMap((n) => [n.beacon, n.tower]);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      pointerOffsetX = pointer.x * 0.25;
      pointerOffsetY = pointer.y * 0.14;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pickTargets, false);
      container.style.cursor = hits.length > 0 ? "pointer" : "default";
    };

    const handlePointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement)?.closest("button")) return;
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pickTargets, false);
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
    const projVec = new THREE.Vector3();
    const targetScaleVec = new THREE.Vector3();
    let lastSync = 0;
    let frameId = 0;

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const elapsed = reducedMotion ? 1.2 : clock.getElapsedTime();

      const activeId = selectedRef.current;
      const selectedNode = partnerNodes.find((n) => n.partner.id === activeId);
      const panYaw = selectedNode ? -selectedNode.worldPos.x * 0.16 : 0;

      mapGroup.rotation.y += (Math.sin(elapsed * 0.2) * 0.18 + pointerOffsetX + panYaw - mapGroup.rotation.y) * 0.06;
      mapGroup.rotation.x += (pointerOffsetY * 0.26 - mapGroup.rotation.x) * 0.06;

      partnerNodes.forEach((node, idx) => {
        const isSelected = activeId === node.partner.id;
        const targetScale = isSelected ? 1.55 : 1.0 + Math.sin(elapsed * 2 + idx) * 0.08;
        targetScaleVec.setScalar(targetScale);
        node.beacon.scale.lerp(targetScaleVec, 0.12);
        node.beaconMat.emissiveIntensity = isSelected ? 1.45 : 0.65;
        node.ring.scale.setScalar(isSelected ? 1.45 + Math.sin(elapsed * 4) * 0.15 : 1.0);
      });

      pulsePackets.forEach((pkt) => {
        const u = (elapsed * 0.35 + pkt.offset) % 1;
        pkt.curve.getPointAt(u, tempPt);
        pkt.mesh.position.copy(tempPt);
      });

      renderer.render(scene, camera);

      if (elapsed - lastSync > 0.05) {
        lastSync = elapsed;
        const cw = container.clientWidth || width;
        const ch = container.clientHeight || height;
        setProjectedTags(
          partnerNodes.map((n) => {
            n.beacon.getWorldPosition(projVec);
            projVec.project(camera);
            return {
              id: n.partner.id,
              city: n.partner.city,
              shortName: n.partner.name.split("—")[0].split(" ").slice(0, 2).join(" "),
              isBank: n.partner.type === "Blood bank",
              oNegUnits: n.partner.inventory["O-"],
              platelets: n.partner.plateletsUnits,
              x: (projVec.x * 0.5 + 0.5) * cw,
              y: (-projVec.y * 0.5 + 0.5) * ch - 26,
              visible: projVec.z < 1,
            };
          }),
        );
      }
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
          <span>LIVE 3D COLD-CHAIN &amp; FACILITY TOPOLOGY</span>
        </div>
        <span>CLICK ANY 3D TOWER TO INSPECT INVENTORY</span>
      </div>
      <div
        ref={containerRef}
        className="network-3d-canvas"
        aria-label="Interactive 3D topology of BloodLink partner hospitals and blood banks"
      >
        <div className="network-projected-layer">
          {projectedTags.map(
            (tag) =>
              tag.visible && (
                <button
                  key={tag.id}
                  type="button"
                  className={`network-3d-tag ${tag.isBank ? "is-bank" : "is-hosp"} ${selectedPartnerId === tag.id ? "is-selected" : ""}`}
                  style={{ left: `${tag.x}px`, top: `${tag.y}px` }}
                  onClick={() => onSelectPartner(tag.id)}
                >
                  <strong>{tag.city}</strong>
                  <span>O− {tag.oNegUnits}u · SDP {tag.platelets}u</span>
                </button>
              ),
          )}
        </div>
      </div>
    </div>
  );
}
