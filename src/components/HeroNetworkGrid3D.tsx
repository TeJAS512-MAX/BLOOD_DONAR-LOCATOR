import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { BloodGroup } from "../data/bloodlinkData";

export interface GridNodeInfo {
  id: string;
  label: string;
  role: "donor" | "bank" | "hospital";
  detail: string;
  bloodGroup?: BloodGroup;
  position: [number, number, number];
}

export const HERO_GRID_NODES: GridNodeInfo[] = [
  {
    id: "H1",
    label: "H1",
    role: "hospital",
    detail: "Central Trauma Hub · Active Match Relay",
    position: [0, 0.25, 0.2],
  },
  {
    id: "BK1",
    label: "BK1",
    role: "bank",
    detail: "Authorised Blood Bank · Cross-Match Ready",
    position: [-1.45, 0.45, -0.75],
  },
  {
    id: "BK2",
    label: "BK2",
    role: "bank",
    detail: "Regional Component Lab · Platelets & Plasma",
    position: [1.55, 0.35, -0.55],
  },
  {
    id: "O-",
    label: "O-",
    role: "donor",
    detail: "Universal Red-Cell Donor · Ready This Week",
    bloodGroup: "O-",
    position: [-2.25, 0.72, 0.75],
  },
  {
    id: "O+",
    label: "O+",
    role: "donor",
    detail: "Voluntary Donor · Compatible Group Match",
    bloodGroup: "O+",
    position: [-1.55, 0.55, 1.65],
  },
  {
    id: "B-",
    label: "B-",
    role: "donor",
    detail: "Rare Rh-Negative Donor · Verified Profile",
    bloodGroup: "B-",
    position: [2.2, 0.8, 0.7],
  },
  {
    id: "A+",
    label: "A+",
    role: "donor",
    detail: "Voluntary Donor · Whole Blood & Platelets",
    bloodGroup: "A+",
    position: [1.45, 0.48, 1.55],
  },
];

interface HeroNetworkGrid3DProps {
  boostFlow?: boolean;
  onSelectDonorGroup?: (group: BloodGroup) => void;
  onSelectBankView?: () => void;
}

interface ProjectedLabel {
  id: string;
  label: string;
  role: GridNodeInfo["role"];
  x: number;
  y: number;
  visible: boolean;
}

export function HeroNetworkGrid3D({
  boostFlow = false,
  onSelectDonorGroup,
  onSelectBankView,
}: HeroNetworkGrid3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const boostRef = useRef(boostFlow);
  boostRef.current = boostFlow;

  const [selectedNodeId, setSelectedNodeId] = useState<string>("O-");
  const selectedIdRef = useRef(selectedNodeId);
  selectedIdRef.current = selectedNodeId;

  const [projectedLabels, setProjectedLabels] = useState<ProjectedLabel[]>([]);
  const [ecgSpikeBoost, setEcgSpikeBoost] = useState(0);
  const ecgBoostRef = useRef(0);
  ecgBoostRef.current = ecgSpikeBoost;

  const activeNode = HERO_GRID_NODES.find((n) => n.id === selectedNodeId) ?? HERO_GRID_NODES[0];

  const triggerNodeSelection = (node: GridNodeInfo) => {
    setSelectedNodeId(node.id);
    setEcgSpikeBoost(1);
    if (node.bloodGroup && onSelectDonorGroup) {
      onSelectDonorGroup(node.bloodGroup);
    } else if (node.role === "bank" && onSelectBankView) {
      onSelectBankView();
    }
  };

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

    const w = container.clientWidth || 540;
    const h = container.clientHeight || 460;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090d16, 0.07);

    const camera = new THREE.PerspectiveCamera(44, w / h, 0.1, 40);
    camera.position.set(0, 2.35, 5.4);
    camera.lookAt(0, 0.1, 0);

    scene.add(new THREE.AmbientLight(0x334155, 1.9));
    const rubyLight = new THREE.PointLight(0xff4d6d, 16, 16, 1.4);
    rubyLight.position.set(0, 1.8, 1.2);
    scene.add(rubyLight);
    const blueLight = new THREE.PointLight(0x38bdf8, 12, 16, 1.4);
    blueLight.position.set(-2.5, 2.2, -1.5);
    scene.add(blueLight);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Signature 3D Perspective Grid matching user's preferred screenshot aesthetic
    const grid = new THREE.GridHelper(12, 24, 0x334155, 0x1e293b);
    grid.position.y = -0.35;
    worldGroup.add(grid);

    // Central crimson Hospital Hub sphere + radar rings on floor
    const hubGeo = new THREE.SphereGeometry(0.42, 36, 36);
    const hubMat = new THREE.MeshPhysicalMaterial({
      color: 0xb91c1c,
      emissive: 0x4c0519,
      roughness: 0.25,
      clearcoat: 0.6,
    });
    const hubMesh = new THREE.Mesh(hubGeo, hubMat);
    hubMesh.position.set(0, 0.25, 0.2);
    worldGroup.add(hubMesh);

    const radarRings: THREE.Mesh[] = [];
    const radarMats: THREE.MeshBasicMaterial[] = [];
    const radarGeo = new THREE.RingGeometry(0.95, 1.0, 64);
    for (let r = 0; r < 3; r += 1) {
      const rMat = new THREE.MeshBasicMaterial({
        color: 0xff4d6d,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const rMesh = new THREE.Mesh(radarGeo, rMat);
      rMesh.rotation.x = -Math.PI / 2;
      rMesh.position.set(0, -0.32, 0.2);
      worldGroup.add(rMesh);
      radarRings.push(rMesh);
      radarMats.push(rMat);
    }

    // Floating companion Erythrocytes above the grid (exactly like Screenshot 1 & 2)
    const rbcGeo = new THREE.SphereGeometry(0.24, 24, 18);
    rbcGeo.scale(1.25, 0.48, 1.25);
    const rbcMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      emissive: 0x2b050b,
      roughness: 0.48,
    });
    const rbcCoords: [number, number, number][] = [
      [-0.9, 1.15, -1.6],
      [1.1, 1.05, -1.4],
      [0.4, 0.85, -0.9],
      [-1.7, 0.95, -0.3],
      [1.85, 1.1, 0.1],
    ];
    const rbcMeshes = rbcCoords.map(([x, y, z]) => {
      const m = new THREE.Mesh(rbcGeo, rbcMat);
      m.position.set(x, y, z);
      worldGroup.add(m);
      return { mesh: m, baseY: y };
    });

    // Live 3D ECG Heartbeat Line across the foreground of the grid
    const ecgPointsCount = 96;
    const ecgPositions = new Float32Array(ecgPointsCount * 3);
    const ecgGeo = new THREE.BufferGeometry();
    ecgGeo.setAttribute("position", new THREE.BufferAttribute(ecgPointsCount > 0 ? ecgPositions : new Float32Array(), 3));
    const ecgMat = new THREE.LineBasicMaterial({ color: 0xff4d6d, transparent: true, opacity: 0.92 });
    const ecgLine = new THREE.Line(ecgGeo, ecgMat);
    worldGroup.add(ecgLine);

    // Interactive 3D Network Nodes (Donors = Ruby, Banks = Blue, Hospital = White/Blue core)
    const nodeGeo = new THREE.SphereGeometry(0.11, 20, 20);
    const disposables: { dispose: () => void }[] = [hubGeo, hubMat, radarGeo, rbcGeo, rbcMat, ecgGeo, ecgMat, nodeGeo];
    const nodeObjects: { info: GridNodeInfo; mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial }[] = [];

    HERO_GRID_NODES.forEach((info) => {
      const color =
        info.role === "donor" ? 0xff4d6d : info.role === "bank" ? 0x38bdf8 : 0xffffff;
      const mat = new THREE.MeshBasicMaterial({ color });
      disposables.push(mat);

      const mesh = new THREE.Mesh(nodeGeo, mat);
      mesh.position.set(...info.position);
      mesh.userData = { nodeId: info.id };
      worldGroup.add(mesh);
      nodeObjects.push({ info, mesh, mat });
    });

    // Curved 3D signal connections from Donors -> Banks -> H1 Hub + flowing data packets
    const signalRoutes: {
      fromId: string;
      curve: THREE.QuadraticBezierCurve3;
      packet: THREE.Mesh;
      lineMat: THREE.LineBasicMaterial;
      offset: number;
    }[] = [];

    const packetGeo = new THREE.SphereGeometry(0.055, 12, 12);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    disposables.push(packetGeo, packetMat);

    const routePairs: [string, string][] = [
      ["O-", "BK1"],
      ["O+", "BK1"],
      ["B-", "BK2"],
      ["A+", "BK2"],
      ["BK1", "H1"],
      ["BK2", "H1"],
    ];

    routePairs.forEach(([fromId, toId], idx) => {
      const from = HERO_GRID_NODES.find((n) => n.id === fromId)!;
      const to = HERO_GRID_NODES.find((n) => n.id === toId)!;
      const a = new THREE.Vector3(...from.position);
      const b = new THREE.Vector3(...to.position);
      const mid = new THREE.Vector3((a.x + b.x) * 0.5, Math.max(a.y, b.y) + 0.55, (a.z + b.z) * 0.5);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);

      const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(32));
      const lineMat = new THREE.LineBasicMaterial({
        color: from.role === "donor" ? 0xff4d6d : 0x38bdf8,
        transparent: true,
        opacity: 0.42,
      });
      disposables.push(lineGeo, lineMat);
      worldGroup.add(new THREE.Line(lineGeo, lineMat));

      const packet = new THREE.Mesh(packetGeo, packetMat);
      worldGroup.add(packet);
      signalRoutes.push({ fromId, curve, packet, lineMat, offset: idx * 0.17 });
    });

    // Pointer drag orbit + raycast click
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let isDragging = false;
    let dragStartX = 0;
    let dragDist = 0;
    let targetYaw = 0;
    let yaw = 0;

    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement)?.closest("button")) return;
      isDragging = true;
      dragStartX = e.clientX;
      dragDist = 0;
    };

    const onMove = (e: PointerEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStartX;
        dragDist += Math.abs(dx);
        targetYaw = Math.max(-0.55, Math.min(0.55, targetYaw + dx * 0.006));
        dragStartX = e.clientX;
      }
    };

    const onUp = (e: PointerEvent) => {
      if (isDragging && dragDist < 6) {
        const rect = container.getBoundingClientRect();
        pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNdc, camera);
        const hits = raycaster.intersectObjects(
          nodeObjects.map((n) => n.mesh),
          false,
        );
        if (hits.length > 0) {
          const hitId = hits[0].object.userData.nodeId as string;
          const node = HERO_GRID_NODES.find((n) => n.id === hitId);
          if (node) triggerNodeSelection(node);
        } else {
          setEcgSpikeBoost(1);
        }
      }
      isDragging = false;
    };

    container.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);

    const onResize = () => {
      const nw = container.clientWidth || 540;
      const nh = container.clientHeight || 460;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    const tmpPt = new THREE.Vector3();
    const projVec = new THREE.Vector3();
    let lastLabelSync = 0;
    let frameId = 0;

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = reducedMotion ? 1.0 : clock.getElapsedTime();

      if (ecgBoostRef.current > 0) {
        ecgBoostRef.current = Math.max(0, ecgBoostRef.current - dt * 1.1);
        setEcgSpikeBoost(ecgBoostRef.current);
      }

      const speedMult = boostRef.current ? 1.9 : 1.0;
      yaw += (targetYaw - yaw) * 0.08;
      worldGroup.rotation.y = Math.sin(elapsed * 0.22) * 0.16 + yaw;

      // Animate expanding floor radar rings
      radarRings.forEach((ring, idx) => {
        const p = (elapsed * 0.42 * speedMult + idx * 0.33) % 1;
        ring.scale.setScalar(0.5 + p * 2.7);
        radarMats[idx].opacity = (1 - p) * 0.45;
      });

      // Gently float companion red blood cells
      rbcMeshes.forEach((item, idx) => {
        item.mesh.position.y = item.baseY + Math.sin(elapsed * 0.9 + idx) * 0.08;
        item.mesh.rotation.y = elapsed * 0.35 + idx;
        item.mesh.rotation.x = 0.25 + Math.sin(elapsed * 0.5 + idx) * 0.12;
      });

      // Animate 3D ECG heartbeat ribbon
      const ecgAttr = ecgGeo.attributes.position as THREE.BufferAttribute;
      const spikeScale = 1 + ecgBoostRef.current * 0.85;
      for (let i = 0; i < ecgPointsCount; i += 1) {
        const u = i / (ecgPointsCount - 1);
        const x = (u - 0.5) * 6.4;
        const phase = (u * 2.6 - elapsed * 0.55 * speedMult) % 1;
        const normP = phase < 0 ? phase + 1 : phase;
        let ySpike = 0;
        if (normP > 0.38 && normP < 0.43) ySpike = -0.12;
        else if (normP >= 0.43 && normP < 0.48) ySpike = 0.55;
        else if (normP >= 0.48 && normP < 0.53) ySpike = -0.32;
        else if (normP >= 0.53 && normP < 0.59) ySpike = 0.11;
        ecgAttr.setXYZ(i, x, -0.28 + ySpike * spikeScale, 1.95);
      }
      ecgAttr.needsUpdate = true;

      // Animate signal packets & highlight active route
      const curSel = selectedIdRef.current;
      signalRoutes.forEach((route) => {
        const u = (elapsed * 0.45 * speedMult + route.offset) % 1;
        route.curve.getPointAt(u, tmpPt);
        route.packet.position.copy(tmpPt);
        const isHighlighted = route.fromId === curSel || curSel === "H1";
        route.lineMat.opacity = isHighlighted ? 0.85 : 0.26;
        route.packet.scale.setScalar(isHighlighted ? 1.35 : 0.85);
      });

      hubMesh.scale.setScalar(1 + Math.sin(elapsed * 3.2) * 0.04 + ecgBoostRef.current * 0.08);
      renderer.render(scene, camera);

      // Update sharp HTML ring badges projected from 3D coordinates (~20fps to minimize React work)
      if (elapsed - lastLabelSync > 0.045) {
        lastLabelSync = elapsed;
        const cw = container.clientWidth || w;
        const ch = container.clientHeight || h;
        const nextLabels: ProjectedLabel[] = nodeObjects.map((item) => {
          item.mesh.getWorldPosition(projVec);
          projVec.project(camera);
          return {
            id: item.info.id,
            label: item.info.label,
            role: item.info.role,
            x: (projVec.x * 0.5 + 0.5) * cw,
            y: (-projVec.y * 0.5 + 0.5) * ch,
            visible: projVec.z < 1,
          };
        });
        setProjectedLabels(nextLabels);
      }
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      container.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", onResize);
      disposables.forEach((d) => d.dispose());
      grid.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="hero-grid3d-shell">
      <div className="hero-grid3d-canvas" ref={mountRef} />

      {/* Crisp interactive projected node badges (O-, O+, B-, A+, BK1, BK2, H1) */}
      <div className="projected-nodes-layer">
        {projectedLabels.map(
          (node) =>
            node.visible && (
              <button
                key={node.id}
                type="button"
                className={`projected-node-pill is-${node.role} ${selectedNodeId === node.id ? "is-selected" : ""}`}
                style={{ left: `${node.x}px`, top: `${node.y}px` }}
                onClick={() => {
                  const found = HERO_GRID_NODES.find((n) => n.id === node.id);
                  if (found) triggerNodeSelection(found);
                }}
                aria-label={`Select ${node.label} network node`}
              >
                {node.label}
              </button>
            ),
        )}
      </div>

      {/* Interactive live route readout bar */}
      <div className="hero-grid3d-readout">
        <span className={`readout-badge is-${activeNode.role}`}>{activeNode.label}</span>
        <div>
          <strong>{activeNode.detail}</strong>
          <small>Click any 3D node (O-, BK1, H1) to pulse &amp; route live</small>
        </div>
      </div>
    </div>
  );
}
