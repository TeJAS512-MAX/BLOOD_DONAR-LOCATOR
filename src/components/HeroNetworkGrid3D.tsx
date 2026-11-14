import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { COMPATIBILITY_MAP, type BloodGroup } from "../data/bloodlinkData";

export interface GridNodeInfo {
  id: string;
  label: string;
  role: "donor" | "bank" | "hospital";
  title: string;
  detail: string;
  metricLabel: string;
  bloodGroup?: BloodGroup;
  position: [number, number, number];
}

export const HERO_GRID_NODES: GridNodeInfo[] = [
  {
    id: "H1",
    label: "H1",
    role: "hospital",
    title: "Southern Regional Trauma & Critical Care Hub",
    detail: "Active hospital transfusion desk · Cross-match verified",
    metricLabel: "Primary receiving hospital",
    position: [0, 0.28, 0.2],
  },
  {
    id: "BK1",
    label: "BK1",
    role: "bank",
    title: "Bengaluru Regional Blood Centre",
    detail: "107 PRBC units · 18 platelet units · 42 plasma units",
    metricLabel: "24/7 Automated Cold-Chain Vault",
    position: [-1.45, 0.45, -0.75],
  },
  {
    id: "BK2",
    label: "BK2",
    role: "bank",
    title: "Western Regional Blood Centre — Parel",
    detail: "130 PRBC units · 26 platelet units · 54 plasma units",
    metricLabel: "Autonomous Drone Dispatch Hub",
    position: [1.55, 0.38, -0.55],
  },
  {
    id: "O-",
    label: "O-",
    role: "donor",
    title: "Group O− Voluntary Donor Registry",
    detail: "Universal red-cell donor group for emergency trauma release",
    metricLabel: "Compatible with all 8 groups",
    bloodGroup: "O-",
    position: [-2.25, 0.72, 0.75],
  },
  {
    id: "O+",
    label: "O+",
    role: "donor",
    title: "Group O+ Voluntary Donor Registry",
    detail: "Compatible with O+, A+, B+, and AB+ red-cell requisitions",
    metricLabel: "Rh-positive red-cell donor",
    bloodGroup: "O+",
    position: [-1.55, 0.55, 1.65],
  },
  {
    id: "B-",
    label: "B-",
    role: "donor",
    title: "Group B− Voluntary Donor Registry",
    detail: "Rh-negative donor group supporting B−, B+, AB−, and AB+ patients",
    metricLabel: "Rh-negative reserve group",
    bloodGroup: "B-",
    position: [2.2, 0.8, 0.7],
  },
  {
    id: "A+",
    label: "A+",
    role: "donor",
    title: "Group A+ Voluntary Donor Registry",
    detail: "Compatible with A+ and AB+ red-cell requisitions",
    metricLabel: "Donates to A+ and AB+",
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
    renderer.toneMappingExposure = 1.35;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, w / h, 0.1, 40);
    camera.position.set(0, 2.45, 5.5);
    camera.lookAt(0, 0.15, 0);

    scene.add(new THREE.AmbientLight(0x38bdf8, 1.8));
    const rubyLight = new THREE.PointLight(0xff1a53, 20, 18, 1.4);
    rubyLight.position.set(1.4, 2.6, 2.2);
    scene.add(rubyLight);
    const cyanLight = new THREE.PointLight(0x00f0ff, 18, 18, 1.3);
    cyanLight.position.set(-2.5, 2.4, -1.5);
    scene.add(cyanLight);
    const rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
    rimLight.position.set(-3, 5, -3);
    scene.add(rimLight);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 1. Futuristic 3D Coordinate Grid & Topographical Digital Matrix
    const grid = new THREE.GridHelper(12, 28, 0x00f0ff, 0x1e293b);
    grid.position.y = -0.35;
    worldGroup.add(grid);

    // 2. Holographic Topographical Digital Twin District Blocks
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x0284c7,
      emissiveIntensity: 0.15,
      roughness: 0.25,
      metalness: 0.75,
      transparent: true,
      opacity: 0.72,
    });

    const buildingCoords: [number, number, number, number, number, number][] = [
      [-2.8, -0.35, -2.0, 0.45, 0.65, 0.45],
      [-2.2, -0.35, -2.4, 0.5, 0.85, 0.5],
      [2.5, -0.35, -2.1, 0.45, 0.75, 0.45],
      [3.0, -0.35, -1.6, 0.55, 0.95, 0.55],
      [-3.2, -0.35, 0.8, 0.4, 0.55, 0.4],
      [3.1, -0.35, 1.2, 0.45, 0.7, 0.45],
    ];

    const disposables: { dispose: () => void }[] = [buildingMat];

    buildingCoords.forEach(([x, y, z, wB, hB, dB]) => {
      const bGeo = new THREE.BoxGeometry(wB, hB, dB);
      const bMesh = new THREE.Mesh(bGeo, buildingMat);
      bMesh.position.set(x, y + hB * 0.5, z);
      worldGroup.add(bMesh);
      disposables.push(bGeo);

      const edgeGeo = new THREE.EdgesGeometry(bGeo);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.45 });
      const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
      bMesh.add(edgeLines);
      disposables.push(edgeGeo, edgeMat);
    });

    // 3. Central Hospital Medical Citadel (Multi-Tier Crystalline Hub)
    const hubBaseGeo = new THREE.CylinderGeometry(0.38, 0.48, 0.25, 6);
    const hubBaseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0xff1a53,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.8,
    });
    const hubBaseMesh = new THREE.Mesh(hubBaseGeo, hubBaseMat);
    hubBaseMesh.position.set(0, -0.22, 0.2);
    worldGroup.add(hubBaseMesh);
    disposables.push(hubBaseGeo, hubBaseMat);

    const hubSpireGeo = new THREE.CylinderGeometry(0.24, 0.34, 0.35, 6);
    const hubSpireMat = new THREE.MeshPhysicalMaterial({
      color: 0xff1a53,
      emissive: 0x880822,
      roughness: 0.12,
      metalness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });
    const hubSpireMesh = new THREE.Mesh(hubSpireGeo, hubSpireMat);
    hubSpireMesh.position.set(0, 0.08, 0.2);
    worldGroup.add(hubSpireMesh);
    disposables.push(hubSpireGeo, hubSpireMat);

    // 3D Laser Cross Beacon above Hospital Spire
    const crossGroup = new THREE.Group();
    const crossBarVGeo = new THREE.BoxGeometry(0.09, 0.28, 0.09);
    const crossBarHGeo = new THREE.BoxGeometry(0.28, 0.09, 0.09);
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    crossGroup.add(new THREE.Mesh(crossBarVGeo, crossMat));
    crossGroup.add(new THREE.Mesh(crossBarHGeo, crossMat));
    crossGroup.position.set(0, 0.48, 0.2);
    worldGroup.add(crossGroup);
    disposables.push(crossBarVGeo, crossBarHGeo, crossMat);

    // Holographic Radar Sector Sweep around Central Hospital
    const sweepGeo = new THREE.RingGeometry(0.2, 4.0, 48, 1, 0, Math.PI * 0.42);
    const sweepMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    const sweepMesh = new THREE.Mesh(sweepGeo, sweepMat);
    sweepMesh.rotation.x = -Math.PI / 2;
    sweepMesh.position.set(0, -0.33, 0.2);
    worldGroup.add(sweepMesh);
    disposables.push(sweepGeo, sweepMat);

    // Expanding Concentric Distance Range Rings
    const radarRings: THREE.Mesh[] = [];
    const radarMats: THREE.MeshBasicMaterial[] = [];
    const radarGeo = new THREE.RingGeometry(0.95, 1.0, 64);
    disposables.push(radarGeo);

    for (let r = 0; r < 3; r += 1) {
      const rMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
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
      disposables.push(rMat);
    }

    // 4. Ambient Holographic Telemetry Micro-Photons
    const particleCount = 80;
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      particlePos[i * 3] = (Math.random() - 0.5) * 8.0;
      particlePos[i * 3 + 1] = -0.15 + Math.random() * 2.5;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 6.0;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.04,
      transparent: true,
      opacity: 0.55,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    worldGroup.add(particleSystem);
    disposables.push(particleGeo, particleMat);

    // 5. Live 3D Holographic Telemetry Ribbon across Grid Foreground
    const ecgPointsCount = 110;
    const ecgPositions = new Float32Array(ecgPointsCount * 3);
    const ecgGeo = new THREE.BufferGeometry();
    ecgGeo.setAttribute("position", new THREE.BufferAttribute(ecgPositions, 3));
    const ecgMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.95 });
    const ecgLine = new THREE.Line(ecgGeo, ecgMat);
    worldGroup.add(ecgLine);
    disposables.push(ecgGeo, ecgMat);

    // 6. Interactive 3D Network Nodes with Elevated Laser Pedestals & Halos
    const nodeGeo = new THREE.SphereGeometry(0.13, 24, 24);
    const bankTowerGeo = new THREE.OctahedronGeometry(0.18, 1);
    const pedestalGeo = new THREE.CylinderGeometry(0.016, 0.016, 1, 10);
    const nodeRingGeo = new THREE.RingGeometry(0.18, 0.22, 32);
    disposables.push(nodeGeo, bankTowerGeo, pedestalGeo, nodeRingGeo);

    const nodeObjects: {
      info: GridNodeInfo;
      mesh: THREE.Mesh;
      ring: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
    }[] = [];

    HERO_GRID_NODES.forEach((info) => {
      const color =
        info.role === "donor" ? 0xff1a53 : info.role === "bank" ? 0x00f0ff : 0xffffff;
      const emissive =
        info.role === "donor" ? 0x9f1239 : info.role === "bank" ? 0x0284c7 : 0xe11d48;
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: 0.85,
        roughness: 0.2,
      });
      disposables.push(mat);

      const mesh = new THREE.Mesh(info.role === "bank" ? bankTowerGeo : nodeGeo, mat);
      mesh.position.set(...info.position);
      mesh.userData = { nodeId: info.id };
      worldGroup.add(mesh);

      const heightToFloor = info.position[1] - -0.35;
      if (heightToFloor > 0.05) {
        const pedMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.35,
        });
        disposables.push(pedMat);
        const ped = new THREE.Mesh(pedestalGeo, pedMat);
        ped.scale.set(1, heightToFloor, 1);
        ped.position.set(info.position[0], -0.35 + heightToFloor * 0.5, info.position[2]);
        worldGroup.add(ped);
      }

      const floorRingMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.52,
        side: THREE.DoubleSide,
      });
      disposables.push(floorRingMat);
      const floorRing = new THREE.Mesh(nodeRingGeo, floorRingMat);
      floorRing.rotation.x = -Math.PI / 2;
      floorRing.position.set(info.position[0], -0.33, info.position[2]);
      worldGroup.add(floorRing);

      nodeObjects.push({ info, mesh, ring: floorRing, mat });
    });

    // 7. Hyper-Velocity Laser Conduits from Donors -> Banks -> Hospital
    const signalRoutes: {
      fromId: string;
      toId: string;
      curve: THREE.QuadraticBezierCurve3;
      packet: THREE.Mesh;
      packet2: THREE.Mesh;
      tubeMat: THREE.MeshBasicMaterial;
      offset: number;
    }[] = [];

    const packetGeo = new THREE.SphereGeometry(0.065, 14, 14);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    disposables.push(packetGeo, packetMat);

    const routePairs: [string, string][] = [
      ["O-", "BK1"],
      ["O+", "BK1"],
      ["B-", "BK2"],
      ["A+", "BK2"],
      ["BK1", "H1"],
      ["BK2", "H1"],
      ["O-", "H1"],
    ];

    routePairs.forEach(([fromId, toId], idx) => {
      const from = HERO_GRID_NODES.find((n) => n.id === fromId)!;
      const to = HERO_GRID_NODES.find((n) => n.id === toId)!;
      const a = new THREE.Vector3(...from.position);
      const b = new THREE.Vector3(...to.position);
      const mid = new THREE.Vector3(
        (a.x + b.x) * 0.5,
        Math.max(a.y, b.y) + (toId === "H1" && fromId === "O-" ? 0.85 : 0.52),
        (a.z + b.z) * 0.5,
      );
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);

      const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.018, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: from.role === "donor" ? 0xff1a53 : 0x00f0ff,
        transparent: true,
        opacity: 0.38,
      });
      disposables.push(tubeGeo, tubeMat);
      worldGroup.add(new THREE.Mesh(tubeGeo, tubeMat));

      const packet = new THREE.Mesh(packetGeo, packetMat);
      const packet2 = new THREE.Mesh(packetGeo, packetMat);
      worldGroup.add(packet);
      worldGroup.add(packet2);
      signalRoutes.push({ fromId, toId, curve, packet, packet2, tubeMat, offset: idx * 0.15 });
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
        targetYaw = Math.max(-0.6, Math.min(0.6, targetYaw + dx * 0.006));
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
    const tmpPt2 = new THREE.Vector3();
    const projVec = new THREE.Vector3();
    const desiredCamPos = new THREE.Vector3(0, 2.45, 5.5);
    const desiredLookAt = new THREE.Vector3(0, 0.25, 0);
    const currentLookAt = new THREE.Vector3(0, 0.25, 0);
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

      desiredCamPos.set(0, 2.35, 5.35);
      desiredLookAt.set(0, 0.25, 0);
      camera.position.lerp(desiredCamPos, 0.06);
      currentLookAt.lerp(desiredLookAt, 0.08);
      camera.lookAt(currentLookAt);

      // Animate Holographic Radar Sector Sweep around Hospital Citadel
      sweepMesh.rotation.z = -elapsed * 1.15 * speedMult;

      // Animate Hospital Cross Crown
      crossGroup.rotation.y = elapsed * 1.1;
      crossGroup.position.y = 0.48 + Math.sin(elapsed * 2.5) * 0.03;

      // Animate expanding floor radar rings
      radarRings.forEach((ring, idx) => {
        const p = (elapsed * 0.45 * speedMult + idx * 0.33) % 1;
        ring.scale.setScalar(0.5 + p * 2.8);
        radarMats[idx].opacity = (1 - p) * 0.48;
      });

      particleSystem.rotation.y = elapsed * 0.06 * speedMult;

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

      // Animate photon packets & highlight active route
      const curSel = selectedIdRef.current;
      signalRoutes.forEach((route) => {
        const u = (elapsed * 0.52 * speedMult + route.offset) % 1;
        const u2 = (u + 0.5) % 1;
        route.curve.getPointAt(u, tmpPt);
        route.curve.getPointAt(u2, tmpPt2);
        route.packet.position.copy(tmpPt);
        route.packet2.position.copy(tmpPt2);
        const isHighlighted = route.fromId === curSel || route.toId === curSel || curSel === "H1";
        route.tubeMat.opacity = isHighlighted ? 0.9 : 0.24;
        route.packet.scale.setScalar(isHighlighted ? 1.4 : 0.85);
        route.packet2.scale.setScalar(isHighlighted ? 1.1 : 0.65);
      });

      nodeObjects.forEach((obj, idx) => {
        const isSel = obj.info.id === curSel;
        obj.mat.emissiveIntensity = isSel ? 1.6 : 0.75;
        obj.ring.scale.setScalar(isSel ? 1.5 + Math.sin(elapsed * 4) * 0.15 : 1 + Math.sin(elapsed * 2 + idx) * 0.05);
        if (obj.info.role === "bank") {
          obj.mesh.rotation.y = elapsed * 0.9 + idx;
        }
      });

      hubSpireMesh.scale.setScalar(1 + Math.sin(elapsed * 3.2) * 0.04 + ecgBoostRef.current * 0.08);
      renderer.render(scene, camera);

      // Project 3D nodes into sharp 2D UI interactive pills
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
      {/* High-Tech Telemetry Top Bar */}
      <div className="hero-3d-topbar">
        <div className="hero-3d-status">
          <span className="pulse-dot" />
          <span>AUTONOMOUS TRANSFUSION DIGITAL TWIN · QUANTUM ROUTING</span>
        </div>
        <span className="hero-3d-sub">UHD LIVE · 7 ACTIVE NODES</span>
      </div>

      <div className="hero-grid3d-canvas" ref={mountRef} />

      {/* Interactive 3D projected holographic pills */}
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
                aria-label={`Inspect ${node.label} node`}
              >
                {node.label}
              </button>
            ),
        )}
      </div>

      {/* Futuristic Telemetry Route Readout */}
      <div className="hero-grid3d-readout">
        <span className={`readout-badge is-${activeNode.role}`}>{activeNode.label}</span>
        <div className="readout-copy">
          <strong>{activeNode.title}</strong>
          <small>{activeNode.detail}</small>
        </div>
        <span className="readout-metric-pill">
          {activeNode.bloodGroup
            ? `Recipients: ${COMPATIBILITY_MAP[activeNode.bloodGroup].donateRedCellsTo.join(", ")}`
            : activeNode.metricLabel}
        </span>
      </div>
    </div>
  );
}
