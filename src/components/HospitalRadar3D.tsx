import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  BLOOD_GROUPS,
  COMPATIBILITY_MAP,
  type BloodGroup,
  type DonorProfile,
  type NetworkPartner,
} from "../data/bloodlinkData";

export interface RadarBlipTarget {
  id: string;
  label: string;
  subtitle: string;
  kind: "donor" | "bank" | "ambulance";
  group: BloodGroup;
  distanceKm: number;
  etaMin: number;
  tempC: string;
  angleRad: number;
  radiusNorm: number;
  elevation: number;
}

interface HospitalRadar3DProps {
  donors: DonorProfile[];
  partners: NetworkPartner[];
  activeBloodGroup: "all" | BloodGroup;
  onSelectBloodGroup: (group: BloodGroup) => void;
  onDispatchLocked: (msg: string) => void;
}

export function HospitalRadar3D({
  donors,
  partners,
  activeBloodGroup,
  onSelectBloodGroup,
  onDispatchLocked,
}: HospitalRadar3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("NET-02");
  const [radarRangeKm, setRadarRangeKm] = useState<2 | 5 | 15>(5);
  const [scanMode, setScanMode] = useState<"all" | "compatible" | "corridor">("compatible");
  const [greenCorridorActive, setGreenCorridorActive] = useState(true);
  const [lockedBlipId, setLockedBlipId] = useState<string>("BL-8841");
  const [projectedBlips, setProjectedBlips] = useState<
    {
      id: string;
      label: string;
      group: BloodGroup;
      kind: RadarBlipTarget["kind"];
      distanceKm: number;
      x: number;
      y: number;
      visible: boolean;
      isCompatible: boolean;
      pingIntensity: number;
    }[]
  >([]);

  const targetGroup: BloodGroup = activeBloodGroup === "all" ? "O-" : activeBloodGroup;
  const compatibleGroups = COMPATIBILITY_MAP[targetGroup].receiveRedCellsFrom;

  const activeHospital = useMemo(
    () => partners.find((p) => p.id === selectedHospitalId) ?? partners[1] ?? partners[0],
    [partners, selectedHospitalId],
  );

  const radarTargets = useMemo<RadarBlipTarget[]>(() => {
    const donorTargets: RadarBlipTarget[] = donors.slice(0, 7).map((d, idx) => {
      const angle = (idx / 7) * Math.PI * 2 + 0.35;
      const rNorm = Math.min(0.92, Math.max(0.28, d.distanceKm / 6.0));
      return {
        id: d.id,
        label: `${d.name.split(" ")[0]} (${d.group})`,
        subtitle: `${d.location} · Hb ${d.hemoglobin}`,
        kind: "donor",
        group: d.group,
        distanceKm: d.distanceKm,
        etaMin: Math.max(6, Math.round(d.distanceKm * 4.5)),
        tempC: "37.0°C Vivo",
        angleRad: angle,
        radiusNorm: rNorm,
        elevation: 0.28 + (idx % 3) * 0.14,
      };
    });

    const bankTargets: RadarBlipTarget[] = partners
      .filter((p) => p.id !== activeHospital.id)
      .slice(0, 3)
      .map((b, idx) => {
        const angle = idx * 2.1 + 1.1;
        return {
          id: b.id,
          label: b.name.split(" ")[0] + " Bank",
          subtitle: `${b.licenseId} · O− ${b.inventory["O-"]}u · SDP ${b.plateletsUnits}u`,
          kind: "bank",
          group: "O-",
          distanceKm: b.distanceKm,
          etaMin: Math.max(8, Math.round(b.distanceKm * 3.6)),
          tempC: "4.1°C Cryo",
          angleRad: angle,
          radiusNorm: 0.45 + idx * 0.18,
          elevation: 0.42,
        };
      });

    const ambulanceTargets: RadarBlipTarget[] = [
      {
        id: "AMB-108",
        label: "ALS Cryo-Unit 108",
        subtitle: "Green-Corridor Cold-Chain Van · En Route",
        kind: "ambulance",
        group: "O-",
        distanceKm: 1.4,
        etaMin: 5,
        tempC: "3.8°C PRBC",
        angleRad: 0.78,
        radiusNorm: 0.34,
        elevation: 0.22,
      },
      {
        id: "DRN-04",
        label: "MedDrone SDP-04",
        subtitle: "Autonomous Platelet Apheresis Relay",
        kind: "ambulance",
        group: targetGroup,
        distanceKm: 2.2,
        etaMin: 4,
        tempC: "22.1°C Agitated",
        angleRad: -1.35,
        radiusNorm: 0.52,
        elevation: 0.68,
      },
    ];

    return [...donorTargets, ...bankTargets, ...ambulanceTargets];
  }, [donors, partners, activeHospital.id, targetGroup]);

  const lockedBlip = useMemo(
    () => radarTargets.find((t) => t.id === lockedBlipId) ?? radarTargets[0],
    [radarTargets, lockedBlipId],
  );

  const compatibleGroupsRef = useRef<BloodGroup[]>(compatibleGroups);
  compatibleGroupsRef.current = compatibleGroups;
  const corridorRef = useRef(greenCorridorActive);
  corridorRef.current = greenCorridorActive;
  const lockedIdRef = useRef(lockedBlipId);
  lockedIdRef.current = lockedBlipId;
  const scanModeRef = useRef(scanMode);
  scanModeRef.current = scanMode;

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

    const w = container.clientWidth || 640;
    const h = container.clientHeight || 470;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 45);
    camera.position.set(0, 4.4, 5.6);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0x1e293b, 2.2));
    const tealLight = new THREE.PointLight(0x00f5d4, 18, 16, 1.3);
    tealLight.position.set(0, 3.2, 0);
    scene.add(tealLight);
    const crimsonLight = new THREE.PointLight(0xff2a4b, 16, 16, 1.3);
    crimsonLight.position.set(2.5, 2.2, 2.5);
    scene.add(crimsonLight);

    const radarWorld = new THREE.Group();
    scene.add(radarWorld);

    const disposables: { dispose: () => void }[] = [];

    // 1. Concentric Doppler Radar Range Rings + Crosshair Axes
    const maxRadius = 2.85;
    [0.25, 0.5, 0.75, 1.0].forEach((frac, idx) => {
      const r = maxRadius * frac;
      const ringGeo = new THREE.RingGeometry(r - 0.018, r, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 3 ? 0xff2a4b : 0x00f5d4,
        transparent: true,
        opacity: idx === 3 ? 0.45 : 0.28,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      radarWorld.add(ringMesh);
      disposables.push(ringGeo, ringMat);
    });

    // Hemispherical Geodesic Wireframe Radar Dome
    const domeGeo = new THREE.SphereGeometry(maxRadius, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.48);
    const domeMat = new THREE.MeshBasicMaterial({
      color: 0x00f5d4,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    radarWorld.add(domeMesh);
    disposables.push(domeGeo, domeMat);

    // Polar Azimuth Spokes
    for (let s = 0; s < 6; s += 1) {
      const angle = (s / 6) * Math.PI;
      const pts = [
        new THREE.Vector3(-Math.cos(angle) * maxRadius, 0.01, -Math.sin(angle) * maxRadius),
        new THREE.Vector3(Math.cos(angle) * maxRadius, 0.01, Math.sin(angle) * maxRadius),
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x00f5d4,
        transparent: true,
        opacity: 0.16,
      });
      radarWorld.add(new THREE.Line(lineGeo, lineMat));
      disposables.push(lineGeo, lineMat);
    }

    // 2. Rotating 360° Volumetric Radar Sweep Wedge + Leading Laser Line
    const sweepGroup = new THREE.Group();
    radarWorld.add(sweepGroup);

    const wedgeGeo = new THREE.CircleGeometry(maxRadius, 36, 0, Math.PI * 0.28);
    const wedgeMat = new THREE.MeshBasicMaterial({
      color: 0x00f5d4,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const wedgeMesh = new THREE.Mesh(wedgeGeo, wedgeMat);
    wedgeMesh.rotation.x = -Math.PI / 2;
    wedgeMesh.position.y = 0.02;
    sweepGroup.add(wedgeMesh);

    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.03, 0),
      new THREE.Vector3(maxRadius, 0.03, 0),
    ]);
    const laserMat = new THREE.LineBasicMaterial({ color: 0x72efdd });
    sweepGroup.add(new THREE.Line(laserGeo, laserMat));
    disposables.push(wedgeGeo, wedgeMat, laserGeo, laserMat);

    // 3. Central Hospital Command Tower + Medical Cross
    const centerHexGeo = new THREE.CylinderGeometry(0.24, 0.32, 0.42, 6);
    const centerHexMat = new THREE.MeshPhysicalMaterial({
      color: 0xff2a4b,
      emissive: 0x6b0518,
      roughness: 0.22,
      clearcoat: 0.85,
    });
    const centerTower = new THREE.Mesh(centerHexGeo, centerHexMat);
    centerTower.position.set(0, 0.21, 0);
    radarWorld.add(centerTower);

    const crossGroup = new THREE.Group();
    const cV = new THREE.BoxGeometry(0.08, 0.26, 0.08);
    const cH = new THREE.BoxGeometry(0.26, 0.08, 0.08);
    const cMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    crossGroup.add(new THREE.Mesh(cV, cMat), new THREE.Mesh(cH, cMat));
    crossGroup.position.set(0, 0.58, 0);
    radarWorld.add(crossGroup);
    disposables.push(centerHexGeo, centerHexMat, cV, cH, cMat);

    // 4. Radar Blip Meshes, Ping Rings, and Green-Corridor 3D Spline Arcs
    const blipGeo = new THREE.SphereGeometry(0.11, 20, 20);
    const ambGeo = new THREE.OctahedronGeometry(0.13, 0);
    const pingRingGeo = new THREE.RingGeometry(0.14, 0.19, 32);
    const stalkGeo = new THREE.CylinderGeometry(0.014, 0.014, 1, 8);
    const capsuleGeo = new THREE.SphereGeometry(0.06, 14, 14);
    disposables.push(blipGeo, ambGeo, pingRingGeo, stalkGeo, capsuleGeo);

    const blipObjects: {
      target: RadarBlipTarget;
      mesh: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
      pingRing: THREE.Mesh;
      pingMat: THREE.MeshBasicMaterial;
      corridorMat: THREE.MeshBasicMaterial;
      capsule: THREE.Mesh;
      curve: THREE.QuadraticBezierCurve3;
      worldPos: THREE.Vector3;
      pingIntensity: number;
    }[] = [];

    radarTargets.forEach((t, idx) => {
      const r = t.radiusNorm * (maxRadius * 0.9);
      const wx = Math.cos(t.angleRad) * r;
      const wz = Math.sin(t.angleRad) * r;
      const wy = t.elevation;

      const baseCol =
        t.kind === "ambulance" ? 0xffb703 : t.kind === "bank" ? 0x00f5d4 : 0xff2a4b;

      const mat = new THREE.MeshStandardMaterial({
        color: baseCol,
        emissive: baseCol,
        emissiveIntensity: 0.75,
        roughness: 0.25,
      });
      const mesh = new THREE.Mesh(t.kind === "ambulance" ? ambGeo : blipGeo, mat);
      mesh.position.set(wx, wy, wz);
      mesh.userData = { blipId: t.id };
      radarWorld.add(mesh);

      const stalkMat = new THREE.MeshBasicMaterial({
        color: baseCol,
        transparent: true,
        opacity: 0.35,
      });
      const stalk = new THREE.Mesh(stalkGeo, stalkMat);
      stalk.scale.set(1, wy, 1);
      stalk.position.set(wx, wy * 0.5, wz);
      radarWorld.add(stalk);

      const pingMat = new THREE.MeshBasicMaterial({
        color: baseCol,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const pingRing = new THREE.Mesh(pingRingGeo, pingMat);
      pingRing.rotation.x = -Math.PI / 2;
      pingRing.position.set(wx, 0.02, wz);
      radarWorld.add(pingRing);

      // Green-Corridor 3D trajectory arc from Blip -> Hospital Center (0, 0.3, 0)
      const startVec = new THREE.Vector3(wx, wy, wz);
      const endVec = new THREE.Vector3(0, 0.32, 0);
      const midVec = new THREE.Vector3(wx * 0.5, Math.max(wy, 0.4) + 0.65 + (idx % 2) * 0.25, wz * 0.5);
      const curve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.015, 8, false);
      const corridorMat = new THREE.MeshBasicMaterial({
        color: t.kind === "ambulance" ? 0xffb703 : 0x00f5d4,
        transparent: true,
        opacity: 0.35,
      });
      radarWorld.add(new THREE.Mesh(tubeGeo, corridorMat));

      const capMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const capsule = new THREE.Mesh(capsuleGeo, capMat);
      radarWorld.add(capsule);

      disposables.push(mat, stalkMat, pingMat, tubeGeo, corridorMat, capMat);
      blipObjects.push({
        target: t,
        mesh,
        mat,
        pingRing,
        pingMat,
        corridorMat,
        capsule,
        curve,
        worldPos: startVec,
        pingIntensity: 0,
      });
    });

    // Orbit Drag + Click Picking
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let isDragging = false;
    let startX = 0;
    let dragDist = 0;
    let userYaw = 0;

    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement)?.closest("button")) return;
      isDragging = true;
      startX = e.clientX;
      dragDist = 0;
    };

    const onMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      dragDist += Math.abs(dx);
      userYaw += dx * 0.006;
      startX = e.clientX;
    };

    const onUp = (e: PointerEvent) => {
      if (isDragging && dragDist < 6) {
        const rect = container.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(
          blipObjects.map((b) => b.mesh),
          false,
        );
        if (hits.length > 0) {
          const id = hits[0].object.userData.blipId as string;
          setLockedBlipId(id);
        }
      }
      isDragging = false;
    };

    container.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);

    const onResize = () => {
      const nw = container.clientWidth || 640;
      const nh = container.clientHeight || 470;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    const tmpPt = new THREE.Vector3();
    const projVec = new THREE.Vector3();
    let lastSync = 0;
    let frameId = 0;

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = reducedMotion ? 1.5 : clock.getElapsedTime();

      radarWorld.rotation.y = userYaw + Math.sin(elapsed * 0.16) * 0.12;

      // Rotate 360° Doppler Sweep Beam
      const sweepAngle = (-elapsed * 1.35) % (Math.PI * 2);
      sweepGroup.rotation.y = sweepAngle;

      crossGroup.rotation.y = elapsed * 1.1;
      centerTower.scale.setScalar(1 + Math.sin(elapsed * 3.5) * 0.05);

      const compatList = compatibleGroupsRef.current;
      const lockedId = lockedIdRef.current;
      const corridorOn = corridorRef.current;
      const mode = scanModeRef.current;

      blipObjects.forEach((b, idx) => {
        const isCompat =
          b.target.kind !== "donor" || compatList.includes(b.target.group);
        const isLocked = b.target.id === lockedId;

        // Check if sweep beam just passed over this blip
        const normSweep = ((sweepAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const normBlip = ((b.target.angleRad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const angleDiff = Math.abs(normSweep - normBlip);
        if (angleDiff < 0.22 || angleDiff > Math.PI * 2 - 0.22) {
          b.pingIntensity = 1.0;
        } else {
          b.pingIntensity = Math.max(0, b.pingIntensity - dt * 0.85);
        }

        const visibleInMode =
          mode === "all" ||
          (mode === "compatible" && isCompat) ||
          (mode === "corridor" && (isLocked || b.target.kind === "ambulance"));

        b.mesh.visible = visibleInMode;
        b.pingRing.visible = visibleInMode;

        const scaleVal = isLocked ? 1.5 : 1.0 + b.pingIntensity * 0.45;
        b.mesh.scale.setScalar(scaleVal);
        b.mat.emissiveIntensity = isLocked ? 1.6 : 0.65 + b.pingIntensity * 0.85;

        b.pingRing.scale.setScalar(1.0 + (1.0 - b.pingIntensity) * 1.6);
        b.pingMat.opacity = (0.25 + b.pingIntensity * 0.65) * (isCompat ? 1 : 0.35);

        // Green-corridor arc & traveling ambulance/blood capsule
        const showCorridor = corridorOn && (isLocked || b.target.kind === "ambulance" || isCompat);
        b.corridorMat.opacity = isLocked ? 0.88 : showCorridor ? 0.32 : 0.04;
        b.capsule.visible = showCorridor;
        if (showCorridor) {
          const u = (elapsed * (isLocked ? 0.62 : 0.38) + idx * 0.19) % 1;
          b.curve.getPointAt(u, tmpPt);
          b.capsule.position.copy(tmpPt);
          b.capsule.scale.setScalar(isLocked ? 1.35 : 0.9);
        }
      });

      renderer.render(scene, camera);

      if (elapsed - lastSync > 0.05) {
        lastSync = elapsed;
        const cw = container.clientWidth || w;
        const ch = container.clientHeight || h;
        setProjectedBlips(
          blipObjects.map((b) => {
            b.mesh.getWorldPosition(projVec);
            projVec.project(camera);
            const isCompat =
              b.target.kind !== "donor" || compatList.includes(b.target.group);
            return {
              id: b.target.id,
              label: b.target.label,
              group: b.target.group,
              kind: b.target.kind,
              distanceKm: b.target.distanceKm,
              x: (projVec.x * 0.5 + 0.5) * cw,
              y: (-projVec.y * 0.5 + 0.5) * ch - 22,
              visible: projVec.z < 1 && b.mesh.visible,
              isCompatible: isCompat,
              pingIntensity: b.pingIntensity,
            };
          }),
        );
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
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [radarTargets]);

  return (
    <div className="hospital-radar-shell glass-frost-card">
      <div className="radar-top-toolbar">
        <div className="radar-control-group">
          <span className="radar-eyebrow">
            <span className="radar-teal-dot" /> 3D DOPPLER HOSPITAL RADAR DOME
          </span>
          <div className="radar-hospital-select-wrap">
            <label htmlFor="radar-hosp-select">Command Origin:</label>
            <select
              id="radar-hosp-select"
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
            >
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="radar-pills-bar">
          <div className="radar-range-pills" role="group" aria-label="Radar range">
            {([2, 5, 15] as const).map((km) => (
              <button
                key={km}
                type="button"
                className={`radar-pill ${radarRangeKm === km ? "is-active" : ""}`}
                onClick={() => setRadarRangeKm(km)}
              >
                {km} km Perimeter
              </button>
            ))}
          </div>

          <div className="radar-range-pills" role="group" aria-label="Radar scan mode">
            {(
              [
                { id: "compatible", label: "Compatible Lock" },
                { id: "corridor", label: "Green Corridor" },
                { id: "all", label: "All Blips" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                className={`radar-pill ${scanMode === m.id ? "is-active" : ""}`}
                onClick={() => setScanMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="radar-main-grid">
        {/* Left 3D Doppler Radar Stage */}
        <div className="radar-3d-stage" ref={mountRef}>
          <div className="radar-projected-overlay">
            {projectedBlips.map(
              (blip) =>
                blip.visible && (
                  <button
                    key={blip.id}
                    type="button"
                    className={`radar-blip-tag is-${blip.kind} ${lockedBlip.id === blip.id ? "is-locked" : ""} ${blip.pingIntensity > 0.4 ? "is-pinged" : ""}`}
                    style={{ left: `${blip.x}px`, top: `${blip.y}px` }}
                    onClick={() => setLockedBlipId(blip.id)}
                  >
                    <strong>{blip.label}</strong>
                    <span>{blip.distanceKm} km</span>
                  </button>
                ),
            )}
          </div>

          <div className="radar-hud-corner">
            <span>AZIMUTH SWEEP: 360° ACTIVE</span>
            <span>RANGE: {radarRangeKm}.0 KM RADIUS</span>
            <span>COMPATIBLE: {compatibleGroups.join(" · ")}</span>
          </div>
        </div>

        {/* Right Target Lock & Green-Corridor Dispatch Telemetry Panel */}
        <div className="radar-telemetry-sidebar">
          <div className="radar-group-selector">
            <span>TARGET PATIENT PHENOTYPE</span>
            <div className="radar-group-grid">
              {BLOOD_GROUPS.map((grp) => (
                <button
                  key={grp}
                  type="button"
                  className={`radar-grp-btn ${targetGroup === grp ? "is-active" : ""}`}
                  onClick={() => onSelectBloodGroup(grp)}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>

          <div className="radar-lock-card">
            <div className="radar-lock-head">
              <span className="lock-tag">LOCKED RADAR VECTOR · {lockedBlip.id}</span>
              <span className="lock-group-badge">{lockedBlip.group}</span>
            </div>
            <h3>{lockedBlip.label}</h3>
            <p>{lockedBlip.subtitle}</p>

            <div className="radar-metrics-row">
              <div>
                <span>RADAR DISTANCE</span>
                <strong>{lockedBlip.distanceKm} km</strong>
              </div>
              <div>
                <span>GREEN-CORRIDOR ETA</span>
                <strong className="text-teal">{lockedBlip.etaMin} mins</strong>
              </div>
              <div>
                <span>THERMAL TELEMETRY</span>
                <strong>{lockedBlip.tempC}</strong>
              </div>
            </div>

            <div className="radar-action-stack">
              <button
                type="button"
                className="btn-primary radar-dispatch-btn"
                onClick={() => {
                  setGreenCorridorActive(true);
                  onDispatchLocked(
                    `Green-Corridor Radar Lock engaged: ${lockedBlip.label} -> ${activeHospital.name} (ETA ${lockedBlip.etaMin} mins).`,
                  );
                }}
              >
                Engage Green-Corridor Dispatch
              </button>
              <button
                type="button"
                className="btn-secondary-outline radar-corridor-toggle"
                onClick={() => setGreenCorridorActive((c) => !c)}
              >
                {greenCorridorActive ? "3D Corridor Vectors: Active" : "Enable 3D Corridor Vectors"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
