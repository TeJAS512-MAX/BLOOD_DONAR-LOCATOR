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
    title: "Manipal Level-1 Trauma & ICU Hub",
    detail: "Immediate spin cross-match · 3 PRBC units active",
    metricLabel: "ETA 14m · 99.4% Cross-Match Ready",
    position: [0, 0.25, 0.2],
  },
  {
    id: "BK1",
    label: "BK1",
    role: "bank",
    title: "Rotary TTK Regional Blood Centre",
    detail: "107 PRBC units · 18 SDP platelet kits in stock",
    metricLabel: "2°C–6°C Cold-Chain Verified",
    position: [-1.45, 0.45, -0.75],
  },
  {
    id: "BK2",
    label: "BK2",
    role: "bank",
    title: "Tata Memorial Component & Cryo Lab",
    detail: "26 Apheresis Platelet units · -30°C FFP reserve",
    metricLabel: "NAT Nucleic Acid Screened",
    position: [1.55, 0.35, -0.55],
  },
  {
    id: "O-",
    label: "O-",
    role: "donor",
    title: "O− Universal Red-Cell Donor Node",
    detail: "Un-crossmatched emergency trauma release compatible",
    metricLabel: "Donates to all 8 ABO/Rh groups",
    bloodGroup: "O-",
    position: [-2.25, 0.72, 0.75],
  },
  {
    id: "O+",
    label: "O+",
    role: "donor",
    title: "O+ High-Volume Clinical Donor Node",
    detail: "Supports O+, A+, B+, and AB+ surgical requisitions",
    metricLabel: "37.4% population compatibility",
    bloodGroup: "O+",
    position: [-1.55, 0.55, 1.65],
  },
  {
    id: "B-",
    label: "B-",
    role: "donor",
    title: "B− Rare Rh-Negative Registry Node",
    detail: "Pre-screened Kell-negative donor pool on standby",
    metricLabel: "1.5% rare phenotype reserve",
    bloodGroup: "B-",
    position: [2.2, 0.8, 0.7],
  },
  {
    id: "A+",
    label: "A+",
    role: "donor",
    title: "A+ Whole Blood & Platelet Apheresis Node",
    detail: "High-yield single-donor platelet & PRBC match",
    metricLabel: "Donates to A+ and AB+ recipients",
    bloodGroup: "A+",
    position: [1.45, 0.48, 1.55],
  },
];

type CameraViewPreset = "network" | "macro" | "radar";

/**
 * Creates an anatomically accurate biconcave erythrocyte (red blood cell) geometry
 * using the Evans-Fung parametric thickness equation.
 */
function createBiconcaveRBCGeometry(radius = 1, widthSegments = 48, heightSegments = 32): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) / radius;
    const y = pos.getY(i) / radius;
    const z = pos.getZ(i) / radius;
    const r2 = Math.min(1, x * x + z * z);
    const signY = y >= 0 ? 1 : -1;
    const radialEnvelope = Math.sqrt(Math.max(0, 1 - r2));
    const poly = 0.21 + 1.98 * r2 - 1.12 * r2 * r2;
    const biconcaveY = signY * 0.52 * radialEnvelope * poly * radius;
    pos.setXYZ(i, x * radius, biconcaveY, z * radius);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

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

  const [cameraPreset, setCameraPreset] = useState<CameraViewPreset>("network");
  const cameraPresetRef = useRef<CameraViewPreset>(cameraPreset);
  cameraPresetRef.current = cameraPreset;

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
    scene.fog = new THREE.FogExp2(0x080b13, 0.062);

    const camera = new THREE.PerspectiveCamera(44, w / h, 0.1, 40);
    camera.position.set(0, 2.35, 5.4);
    camera.lookAt(0, 0.1, 0);

    scene.add(new THREE.AmbientLight(0x334155, 2.1));
    const rubyLight = new THREE.PointLight(0xff3b5c, 22, 18, 1.3);
    rubyLight.position.set(1.2, 2.4, 2.2);
    scene.add(rubyLight);
    const blueLight = new THREE.PointLight(0x38bdf8, 15, 18, 1.4);
    blueLight.position.set(-2.5, 2.2, -1.5);
    scene.add(blueLight);
    const rimLight = new THREE.DirectionalLight(0xffccd5, 1.8);
    rimLight.position.set(-3, 4, -3);
    scene.add(rimLight);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 3D Medical Telemetry Floor Grid + Concentric Range Rings
    const grid = new THREE.GridHelper(12, 28, 0x334155, 0x162032);
    grid.position.y = -0.35;
    worldGroup.add(grid);

    // Sculpted Macro Biconcave Erythrocyte Hero Anchor suspended in the upper arterial stream
    const heroRbcGeo = createBiconcaveRBCGeometry(0.62, 52, 36);
    const heroRbcMat = new THREE.MeshPhysicalMaterial({
      color: 0xd90429,
      emissive: 0x4a0414,
      roughness: 0.26,
      metalness: 0.06,
      clearcoat: 0.9,
      clearcoatRoughness: 0.18,
    });
    const heroRbcMesh = new THREE.Mesh(heroRbcGeo, heroRbcMat);
    heroRbcMesh.position.set(0, 1.25, -0.35);
    heroRbcMesh.rotation.set(0.55, 0.3, -0.25);
    worldGroup.add(heroRbcMesh);

    // Orbital oxygen & plasma micro-ring around the hero erythrocyte
    const haloRingGeo = new THREE.TorusGeometry(0.88, 0.014, 12, 72);
    const haloRingMat = new THREE.MeshBasicMaterial({
      color: 0xff758f,
      transparent: true,
      opacity: 0.45,
    });
    const haloRingMesh = new THREE.Mesh(haloRingGeo, haloRingMat);
    haloRingMesh.position.copy(heroRbcMesh.position);
    haloRingMesh.rotation.x = Math.PI * 0.42;
    worldGroup.add(haloRingMesh);

    // Central Hospital Hub Core + 3D Medical Cross Crown + Radar Rings
    const hubGeo = new THREE.CylinderGeometry(0.34, 0.42, 0.36, 6);
    const hubMat = new THREE.MeshPhysicalMaterial({
      color: 0xe11d48,
      emissive: 0x590d22,
      roughness: 0.22,
      metalness: 0.2,
      clearcoat: 0.8,
    });
    const hubMesh = new THREE.Mesh(hubGeo, hubMat);
    hubMesh.position.set(0, 0.05, 0.2);
    worldGroup.add(hubMesh);

    // 3D Medical Cross above Hospital Hub
    const crossGroup = new THREE.Group();
    const crossBarVGeo = new THREE.BoxGeometry(0.09, 0.28, 0.09);
    const crossBarHGeo = new THREE.BoxGeometry(0.28, 0.09, 0.09);
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    crossGroup.add(new THREE.Mesh(crossBarVGeo, crossMat));
    crossGroup.add(new THREE.Mesh(crossBarHGeo, crossMat));
    crossGroup.position.set(0, 0.46, 0.2);
    worldGroup.add(crossGroup);

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

    // Stream of 14 anatomical biconcave Erythrocytes flowing across the 3D field
    const rbcGeo = createBiconcaveRBCGeometry(0.24, 28, 20);
    const rbcMat = new THREE.MeshPhysicalMaterial({
      color: 0xb91c1c,
      emissive: 0x380610,
      roughness: 0.32,
      clearcoat: 0.72,
    });
    const rbcCoords: [number, number, number, number][] = [
      [-1.3, 1.35, -1.5, 0.95],
      [1.35, 1.22, -1.35, 1.05],
      [0.55, 0.98, -1.0, 0.82],
      [-1.85, 1.05, -0.35, 0.9],
      [1.95, 1.18, 0.15, 0.88],
      [-0.75, 1.68, -0.65, 0.72],
      [0.85, 1.62, -0.45, 0.76],
      [-2.35, 1.38, -1.1, 0.68],
      [2.3, 1.42, -0.95, 0.74],
      [0.0, 1.85, -1.4, 0.65],
    ];
    const rbcMeshes = rbcCoords.map(([x, y, z, scale]) => {
      const m = new THREE.Mesh(rbcGeo, rbcMat);
      m.position.set(x, y, z);
      m.scale.setScalar(scale);
      worldGroup.add(m);
      return { mesh: m, baseX: x, baseY: y, baseZ: z };
    });

    // Ambient plasma & platelet bioparticles (Points)
    const particleCount = 90;
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      particlePos[i * 3] = (Math.random() - 0.5) * 7.2;
      particlePos[i * 3 + 1] = -0.15 + Math.random() * 2.5;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 5.2;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfda4af,
      size: 0.045,
      transparent: true,
      opacity: 0.55,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    worldGroup.add(particleSystem);

    // Live 3D ECG Heartbeat Line across the foreground of the grid
    const ecgPointsCount = 110;
    const ecgPositions = new Float32Array(ecgPointsCount * 3);
    const ecgGeo = new THREE.BufferGeometry();
    ecgGeo.setAttribute("position", new THREE.BufferAttribute(ecgPointsCount > 0 ? ecgPositions : new Float32Array(), 3));
    const ecgMat = new THREE.LineBasicMaterial({ color: 0xff4d6d, transparent: true, opacity: 0.95 });
    const ecgLine = new THREE.Line(ecgGeo, ecgMat);
    worldGroup.add(ecgLine);

    // Interactive 3D Network Nodes with Pedestal Pillars & Base Rings
    const nodeGeo = new THREE.SphereGeometry(0.13, 24, 24);
    const bankTowerGeo = new THREE.OctahedronGeometry(0.17, 1);
    const pedestalGeo = new THREE.CylinderGeometry(0.018, 0.018, 1, 10);
    const nodeRingGeo = new THREE.RingGeometry(0.18, 0.22, 32);
    const disposables: { dispose: () => void }[] = [
      heroRbcGeo,
      heroRbcMat,
      haloRingGeo,
      haloRingMat,
      hubGeo,
      hubMat,
      crossBarVGeo,
      crossBarHGeo,
      crossMat,
      radarGeo,
      rbcGeo,
      rbcMat,
      particleGeo,
      particleMat,
      ecgGeo,
      ecgMat,
      nodeGeo,
      bankTowerGeo,
      pedestalGeo,
      nodeRingGeo,
    ];
    const nodeObjects: {
      info: GridNodeInfo;
      mesh: THREE.Mesh;
      ring: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
    }[] = [];

    HERO_GRID_NODES.forEach((info) => {
      const color =
        info.role === "donor" ? 0xff4d6d : info.role === "bank" ? 0x38bdf8 : 0xffffff;
      const emissive =
        info.role === "donor" ? 0x9f1239 : info.role === "bank" ? 0x0369a1 : 0xe11d48;
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: 0.75,
        roughness: 0.25,
      });
      disposables.push(mat);

      const mesh = new THREE.Mesh(info.role === "bank" ? bankTowerGeo : nodeGeo, mat);
      mesh.position.set(...info.position);
      mesh.userData = { nodeId: info.id };
      worldGroup.add(mesh);

      // Vertical light pedestal down to grid floor (-0.35)
      const heightToFloor = info.position[1] - -0.35;
      if (heightToFloor > 0.05) {
        const pedMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.28,
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
        opacity: 0.42,
        side: THREE.DoubleSide,
      });
      disposables.push(floorRingMat);
      const floorRing = new THREE.Mesh(nodeRingGeo, floorRingMat);
      floorRing.rotation.x = -Math.PI / 2;
      floorRing.position.set(info.position[0], -0.33, info.position[2]);
      worldGroup.add(floorRing);

      nodeObjects.push({ info, mesh, ring: floorRing, mat });
    });

    // 3D Tubular Conduits from Donors -> Banks -> H1 Hub + Dual Flowing Signal Packets
    const signalRoutes: {
      fromId: string;
      toId: string;
      curve: THREE.QuadraticBezierCurve3;
      packet: THREE.Mesh;
      packet2: THREE.Mesh;
      tubeMat: THREE.MeshBasicMaterial;
      offset: number;
    }[] = [];

    const packetGeo = new THREE.SphereGeometry(0.06, 14, 14);
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

      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.016, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: from.role === "donor" ? 0xff4d6d : 0x38bdf8,
        transparent: true,
        opacity: 0.36,
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
    const tmpPt2 = new THREE.Vector3();
    const projVec = new THREE.Vector3();
    const desiredCamPos = new THREE.Vector3(0, 2.35, 5.4);
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

      // Smoothly transition camera between live 3D view presets
      const preset = cameraPresetRef.current;
      if (preset === "macro") {
        desiredCamPos.set(0.35, 1.55, 2.55);
        desiredLookAt.set(0, 1.2, -0.35);
      } else if (preset === "radar") {
        desiredCamPos.set(0, 5.5, 2.2);
        desiredLookAt.set(0, 0, 0.2);
      } else {
        desiredCamPos.set(0, 2.25, 5.25);
        desiredLookAt.set(0, 0.25, 0);
      }
      camera.position.lerp(desiredCamPos, 0.06);
      currentLookAt.lerp(desiredLookAt, 0.08);
      camera.lookAt(currentLookAt);

      // Animate Hero Biconcave Erythrocyte & Orbital Ring
      heroRbcMesh.rotation.y = elapsed * 0.48;
      heroRbcMesh.rotation.x = 0.52 + Math.sin(elapsed * 0.9) * 0.14;
      heroRbcMesh.position.y = 1.25 + Math.sin(elapsed * 1.4) * 0.06;
      haloRingMesh.position.copy(heroRbcMesh.position);
      haloRingMesh.rotation.z = elapsed * 0.65;

      // Animate Hospital Cross Crown
      crossGroup.rotation.y = elapsed * 0.9;
      crossGroup.position.y = 0.46 + Math.sin(elapsed * 2.5) * 0.03;

      // Animate expanding floor radar rings
      radarRings.forEach((ring, idx) => {
        const p = (elapsed * 0.42 * speedMult + idx * 0.33) % 1;
        ring.scale.setScalar(0.5 + p * 2.7);
        radarMats[idx].opacity = (1 - p) * 0.45;
      });

      // Gently float companion red blood cells
      rbcMeshes.forEach((item, idx) => {
        item.mesh.position.y = item.baseY + Math.sin(elapsed * 1.05 + idx) * 0.09;
        item.mesh.position.x = item.baseX + Math.cos(elapsed * 0.45 + idx) * 0.06;
        item.mesh.rotation.y = elapsed * 0.42 + idx;
        item.mesh.rotation.x = 0.35 + Math.sin(elapsed * 0.6 + idx) * 0.18;
      });

      particleSystem.rotation.y = elapsed * 0.05 * speedMult;

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
        const u2 = (u + 0.5) % 1;
        route.curve.getPointAt(u, tmpPt);
        route.curve.getPointAt(u2, tmpPt2);
        route.packet.position.copy(tmpPt);
        route.packet2.position.copy(tmpPt2);
        const isHighlighted = route.fromId === curSel || route.toId === curSel || curSel === "H1";
        route.tubeMat.opacity = isHighlighted ? 0.82 : 0.22;
        route.packet.scale.setScalar(isHighlighted ? 1.3 : 0.78);
        route.packet2.scale.setScalar(isHighlighted ? 1.0 : 0.6);
      });

      nodeObjects.forEach((obj, idx) => {
        const isSel = obj.info.id === curSel;
        obj.mat.emissiveIntensity = isSel ? 1.4 : 0.65;
        obj.ring.scale.setScalar(isSel ? 1.45 + Math.sin(elapsed * 4) * 0.14 : 1 + Math.sin(elapsed * 2 + idx) * 0.05);
        if (obj.info.role === "bank") {
          obj.mesh.rotation.y = elapsed * 0.8 + idx;
        }
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
      {/* Top 3D Camera Preset & Live Telemetry Bar */}
      <div className="hero-3d-topbar">
        <div className="hero-3d-status">
          <span className="pulse-dot" />
          <span>LIVE DONOR NETWORK</span>
        </div>
        <div className="hero-3d-cam-tabs" role="group" aria-label="Camera view">
          <button
            type="button"
            className={`cam-tab ${cameraPreset === "network" ? "is-active" : ""}`}
            onClick={() => setCameraPreset("network")}
          >
            Network
          </button>
          <button
            type="button"
            className={`cam-tab ${cameraPreset === "macro" ? "is-active" : ""}`}
            onClick={() => setCameraPreset("macro")}
          >
            Red cell
          </button>
          <button
            type="button"
            className={`cam-tab ${cameraPreset === "radar" ? "is-active" : ""}`}
            onClick={() => setCameraPreset("radar")}
          >
            Top view
          </button>
        </div>
      </div>

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
