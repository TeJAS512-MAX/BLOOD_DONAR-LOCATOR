import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface MotionVideoReelProps {
  externalChapterRequest?: number | null;
  onChapterChange?: (chapterIndex: number) => void;
}

interface ChapterInfo {
  index: number;
  label: string;
  shortTitle: string;
  startSec: number;
  endSec: number;
  caption: string;
}

const TOTAL_DURATION = 24;

export const REEL_CHAPTERS: ChapterInfo[] = [
  {
    index: 0,
    label: "01",
    shortTitle: "Trauma Alert",
    startSec: 0,
    endSec: 6,
    caption: "Level-1 trauma & surgical hemorrhage require verified ABO/Rh blood within the golden hour.",
  },
  {
    index: 1,
    label: "02",
    shortTitle: "Registry Scan",
    startSec: 6,
    endSec: 12,
    caption: "Spatial scan queries regional NABH blood banks and pre-screened compatible voluntary donors.",
  },
  {
    index: 2,
    label: "03",
    shortTitle: "Cross-Match Lock",
    startSec: 12,
    endSec: 18,
    caption: "Automated ABO/Rh compatibility matrix locks compatible donors and cold-chain corridors.",
  },
  {
    index: 3,
    label: "04",
    shortTitle: "3x Component Yield",
    startSec: 18,
    endSec: 24,
    caption: "Centrifugation separates one 450 mL unit into Packed Red Cells, Plasma, and Platelets.",
  },
];

function easeOutCubic(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 3);
}

function easeInOutQuad(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function formatTimecode(seconds: number): string {
  const clamped = Math.max(0, Math.min(TOTAL_DURATION, seconds));
  const whole = Math.floor(clamped);
  const frames = Math.floor((clamped - whole) * 30);
  const ss = String(whole).padStart(2, "0");
  const ff = String(frames).padStart(2, "0");
  return `00:${ss}:${ff}`;
}

export function MotionVideoReel({ externalChapterRequest, onChapterChange }: MotionVideoReelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const threeLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const timeRef = useRef(0);
  const lastUiSyncRef = useRef(0);
  const lastChapterRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastBeatRef = useRef(-1);

  const [isPlaying, setIsPlaying] = useState(() => {
    if (typeof window === "undefined") return true;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<1 | 1.5>(1);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);
  const soundEnabledRef = useRef(soundEnabled);
  isPlayingRef.current = isPlaying;
  speedRef.current = speed;
  soundEnabledRef.current = soundEnabled;

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  };

  const activeChapterIndex = Math.min(3, Math.floor((currentTime / TOTAL_DURATION) * 4));

  useEffect(() => {
    if (externalChapterRequest == null) return;
    const target = REEL_CHAPTERS[externalChapterRequest];
    if (target) {
      timeRef.current = target.startSec + 0.08;
      lastUiSyncRef.current = timeRef.current;
      setCurrentTime(timeRef.current);
      setIsPlaying(true);
    }
  }, [externalChapterRequest]);

  useEffect(() => {
    if (lastChapterRef.current !== activeChapterIndex) {
      lastChapterRef.current = activeChapterIndex;
      onChapterChange?.(activeChapterIndex);
    }
  }, [activeChapterIndex, onChapterChange]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const toggleSound = () => {
    if (!soundEnabled) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx && !audioCtxRef.current) {
        audioCtxRef.current = new Ctx();
      }
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
      setSoundEnabled(true);
    } else {
      setSoundEnabled(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const threeHost = threeLayerRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !threeHost) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1280;
    const H = 720;

    const syncCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    syncCanvasSize();

    // Live Three.js 3D Cinema Stage Layer beneath the broadcast 2D HUD
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let threeDisposables: { dispose: () => void }[] = [];
    let coreOrb: THREE.Mesh | null = null;
    let ringGroup: THREE.Group | null = null;
    let cellSwarm: THREE.InstancedMesh | null = null;
    let floorGrid: THREE.GridHelper | null = null;

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      const hostW = threeHost.clientWidth || 720;
      const hostH = threeHost.clientHeight || 405;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(hostW, hostH);
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      threeHost.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, hostW / hostH, 0.1, 60);
      camera.position.set(0, 1.8, 7.5);

      scene.add(new THREE.AmbientLight(0x3a1825, 1.8));
      const keyL = new THREE.PointLight(0xff4d6d, 18, 20, 1.4);
      keyL.position.set(2, 3, 4);
      scene.add(keyL);
      const blueL = new THREE.PointLight(0x38bdf8, 12, 20, 1.4);
      blueL.position.set(-4, 2, -2);
      scene.add(blueL);

      floorGrid = new THREE.GridHelper(22, 26, 0xff4d6d, 0x1e293b);
      floorGrid.position.y = -2.2;
      scene.add(floorGrid);

      const coreGeo = new THREE.IcosahedronGeometry(0.85, 3);
      const coreMat = new THREE.MeshPhysicalMaterial({
        color: 0xe11d48,
        emissive: 0x4c0519,
        roughness: 0.3,
        clearcoat: 0.5,
      });
      coreOrb = new THREE.Mesh(coreGeo, coreMat);
      scene.add(coreOrb);

      ringGroup = new THREE.Group();
      scene.add(ringGroup);

      const ringColors = [0xff4d6d, 0xfbbf24, 0x34d399];
      ringColors.forEach((col, idx) => {
        const tGeo = new THREE.TorusGeometry(2.1 + idx * 0.65, 0.02, 12, 72);
        const tMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.45 });
        const tMesh = new THREE.Mesh(tGeo, tMat);
        tMesh.rotation.set(1.1 + idx * 0.25, idx * 0.5, 0);
        ringGroup?.add(tMesh);
        threeDisposables.push(tGeo, tMat);
      });

      const cellGeo = new THREE.SphereGeometry(0.28, 22, 16);
      const pos = cellGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i) / 0.28;
        const y = pos.getY(i) / 0.28;
        const z = pos.getZ(i) / 0.28;
        const r2 = Math.min(1, x * x + z * z);
        const signY = y >= 0 ? 1 : -1;
        const env = Math.sqrt(Math.max(0, 1 - r2));
        const poly = 0.21 + 1.98 * r2 - 1.12 * r2 * r2;
        pos.setXYZ(i, x * 0.28, signY * 0.52 * env * poly * 0.28, z * 0.28);
      }
      pos.needsUpdate = true;
      cellGeo.computeVertexNormals();
      const cellMat = new THREE.MeshPhysicalMaterial({
        color: 0xd90429,
        emissive: 0x3b040e,
        roughness: 0.28,
        clearcoat: 0.85,
      });
      cellSwarm = new THREE.InstancedMesh(cellGeo, cellMat, 24);
      scene.add(cellSwarm);

      threeDisposables.push(coreGeo, coreMat, cellGeo, cellMat);
    } catch {
      renderer = null;
    }

    const onResize = () => {
      syncCanvasSize();
      if (renderer && camera && threeHost) {
        const nw = threeHost.clientWidth || 720;
        const nh = threeHost.clientHeight || 405;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      }
    };
    window.addEventListener("resize", onResize);

    const networkNodes = [
      { id: "O-", x: 260, y: 210, role: "donor" },
      { id: "A+", x: 380, y: 470, role: "donor" },
      { id: "B-", x: 960, y: 195, role: "donor" },
      { id: "AB+", x: 1030, y: 485, role: "donor" },
      { id: "O+", x: 225, y: 375, role: "donor" },
      { id: "H1", x: 640, y: 360, role: "hub" },
      { id: "BK1", x: 465, y: 270, role: "bank" },
      { id: "BK2", x: 840, y: 315, role: "bank" },
      { id: "HP1", x: 815, y: 475, role: "hospital" },
      { id: "HP2", x: 485, y: 530, role: "hospital" },
    ];

    const triggerHeartbeatSound = () => {
      if (!soundEnabledRef.current || !audioCtxRef.current || audioCtxRef.current.state !== "running") return;
      const actx = audioCtxRef.current;
      const now = actx.currentTime;
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(68, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + 0.14);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    };

    const dummy = new THREE.Object3D();
    let lastTimestamp = performance.now();
    let frameId = 0;

    const renderFrame = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.05);
      lastTimestamp = now;

      if (isPlayingRef.current) {
        timeRef.current = (timeRef.current + dt * speedRef.current) % TOTAL_DURATION;
        if (Math.abs(timeRef.current - lastUiSyncRef.current) > 0.065) {
          lastUiSyncRef.current = timeRef.current;
          setCurrentTime(timeRef.current);
        }
      }

      const t = timeRef.current;
      const chapter = Math.min(3, Math.floor(t / 6));
      const localT = (t % 6) / 6;

      const beatIndex = Math.floor(t / 1.2);
      if (isPlayingRef.current && beatIndex !== lastBeatRef.current) {
        lastBeatRef.current = beatIndex;
        triggerHeartbeatSound();
      }

      // Render Live 3D WebGL Cinema Stage Camera Moves
      if (renderer && scene && camera) {
        if (chapter === 0) {
          camera.position.set(Math.sin(t * 0.4) * 2.2, 1.5, 7.8 - localT * 1.2);
        } else if (chapter === 1) {
          camera.position.set(Math.cos(t * 0.5) * 4.5, 2.2, Math.sin(t * 0.5) * 4.5);
        } else if (chapter === 2) {
          camera.position.set(0, 0.8 + Math.sin(localT * Math.PI) * 1.4, 7.2 - localT * 2.1);
        } else {
          camera.position.set(Math.sin(t * 0.35) * 1.8, 3.0, 6.2);
        }
        camera.lookAt(0, 0, 0);

        if (coreOrb) {
          const s = chapter >= 2 ? 1 + Math.sin(t * 3.5) * 0.08 : 0.45;
          coreOrb.scale.setScalar(s);
          coreOrb.rotation.y = t * 0.5;
        }
        if (ringGroup) {
          ringGroup.visible = chapter >= 2;
          ringGroup.rotation.y = t * 0.4;
          ringGroup.rotation.z = t * 0.15;
        }
        if (cellSwarm) {
          for (let i = 0; i < 24; i += 1) {
            const angle = (i / 24) * Math.PI * 2 + t * 0.25;
            const spread = chapter === 1 ? 4.4 : 3.1;
            dummy.position.set(
              Math.cos(angle) * spread,
              Math.sin(t * 0.8 + i) * 1.6,
              Math.sin(angle) * spread,
            );
            dummy.rotation.set(t + i, t * 0.7, i);
            dummy.scale.setScalar(chapter === 3 ? 0.55 : 0.9);
            dummy.updateMatrix();
            cellSwarm.setMatrixAt(i, dummy.matrix);
          }
          cellSwarm.instanceMatrix.needsUpdate = true;
        }
        renderer.render(scene, camera);
      }

      // Clear 2D Overlay & Draw Soft Scrim + Broadcast Motion Graphics
      ctx.clearRect(0, 0, W, H);
      if (!renderer) {
        const bgGrad = ctx.createRadialGradient(W * 0.54, H * 0.46, 40, W * 0.5, H * 0.5, W * 0.75);
        bgGrad.addColorStop(0, "#24111c");
        bgGrad.addColorStop(0.52, "#111622");
        bgGrad.addColorStop(1, "#090d14");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);
      } else {
        ctx.fillStyle = "rgba(9, 13, 20, 0.42)";
        ctx.fillRect(0, 0, W, H);
      }

      // CHAPTER 1: THE CRISIS
      if (chapter === 0) {
        const enter = easeOutCubic(Math.min(1, localT * 3.2));
        const pulseCycle = (t * 1.4) % 1;

        for (let i = 0; i < 4; i += 1) {
          const p = (pulseCycle + i * 0.25) % 1;
          ctx.beginPath();
          ctx.arc(W * 0.5, H * 0.45, 45 + p * 290, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(250, 104, 119, ${(1 - p) * 0.38})`;
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }

        ctx.save();
        ctx.beginPath();
        const waveY = H * 0.45;
        const sweepX = W * (0.1 + easeInOutQuad(Math.min(1, localT * 1.15)) * 0.8);
        for (let x = W * 0.1; x <= sweepX; x += 4) {
          const norm = ((x - W * 0.1) / (W * 0.8)) * 4;
          const phase = norm % 1;
          let spike = 0;
          if (phase > 0.38 && phase < 0.43) spike = -22;
          else if (phase >= 0.43 && phase < 0.48) spike = 92;
          else if (phase >= 0.48 && phase < 0.53) spike = -56;
          else if (phase >= 0.53 && phase < 0.6) spike = 18;
          const y = waveY - spike * (0.7 + 0.3 * Math.sin(t * 3));
          if (x === W * 0.1) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "#ff4d6d";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#ff4d6d";
        ctx.shadowBlur = 16;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sweepX, waveY, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = enter;
        ctx.fillStyle = "#fda4af";
        ctx.font = '600 15px "IBM Plex Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText("3D SCENE 01  /  THE REAL-WORLD CHALLENGE", W * 0.5, 138, W - 120);

        ctx.fillStyle = "#ffffff";
        ctx.font = '700 46px "Syne", sans-serif';
        ctx.fillText("When every minute matters,", W * 0.5, 198, W - 140);
        ctx.fillStyle = "#ff4d6d";
        ctx.fillText("matching donors shouldn't stall.", W * 0.5, 254, W - 140);

        // Elaborated live telemetry bars below ECG waveform
        const metrics = [
          { label: "HEMOGLOBIN THRESHOLD", val: "Hb < 6.8 g/dL · LEVEL-1 TRAUMA" },
          { label: "IMMEDIATE RELEASE", val: "O- UN-CROSSMATCHED PRBC" },
          { label: "TARGET DISPATCH WINDOW", val: "< 18 MIN COLD-CHAIN RELAY" },
        ];
        metrics.forEach((m, i) => {
          const bx = W * (0.24 + i * 0.26);
          ctx.fillStyle = "rgba(15, 23, 42, 0.84)";
          ctx.strokeStyle = "rgba(255, 77, 109, 0.45)";
          ctx.lineWidth = 1;
          ctx.fillRect(bx - 130, 520, 260, 56);
          ctx.strokeRect(bx - 130, 520, 260, 56);

          ctx.fillStyle = "#fda4af";
          ctx.font = '600 11px "IBM Plex Mono", monospace';
          ctx.fillText(m.label, bx, 542, 240);
          ctx.fillStyle = "#f8fafc";
          ctx.font = '600 13px "DM Sans", sans-serif';
          ctx.fillText(m.val, bx, 562, 240);
        });

        ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
        ctx.font = '500 19px "DM Sans", sans-serif';
        ctx.fillText(
          "Surgeries, trauma & critical care demand rapid, verified donor coordination.",
          W * 0.5,
          622,
          W - 140,
        );
        ctx.restore();
      }

      // CHAPTER 2: FRAGMENTATION (Elaborated Network Grid)
      if (chapter === 1) {
        const enter = easeOutCubic(Math.min(1, localT * 3.0));
        const drift = Math.sin(localT * Math.PI * 2);

        ctx.save();
        ctx.setLineDash([7, 10]);
        ctx.lineDashOffset = -t * 28;
        ctx.strokeStyle = "rgba(255, 77, 109, 0.36)";
        ctx.lineWidth = 1.8;
        for (let i = 0; i < 5; i += 1) {
          const a = networkNodes[i];
          const b = networkNodes[5 + (i % 4)];
          ctx.beginPath();
          ctx.moveTo(a.x + drift * 12, a.y - drift * 8);
          ctx.lineTo((a.x + b.x) * 0.5, (a.y + b.y) * 0.5);
          ctx.stroke();
        }
        ctx.restore();

        networkNodes.forEach((node, idx) => {
          const dx = Math.sin(t * 0.9 + idx * 1.3) * 14;
          const dy = Math.cos(t * 0.7 + idx * 1.7) * 11;
          const nx = node.x + dx;
          const ny = node.y + dy;

          ctx.save();
          // Outer soft pulse halo
          ctx.beginPath();
          ctx.arc(nx, ny, (node.role === "hub" ? 36 : 28) + Math.sin(t * 3 + idx) * 3, 0, Math.PI * 2);
          ctx.strokeStyle = node.role === "donor" ? "rgba(255, 77, 109, 0.24)" : "rgba(56, 189, 248, 0.24)";
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(nx, ny, node.role === "hub" ? 28 : 22, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
          ctx.strokeStyle = node.role === "donor" ? "#ff4d6d" : "#38bdf8";
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = '600 14px "IBM Plex Mono", monospace';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.id, nx, ny);
          ctx.restore();
        });

        ctx.save();
        ctx.globalAlpha = enter;
        ctx.fillStyle = "#7dd3fc";
        ctx.font = '600 15px "IBM Plex Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText("3D SCENE 02  /  DISCONNECTED DONOR & BANK TOPOLOGY", W * 0.5, 108, W - 120);

        ctx.fillStyle = "#ffffff";
        ctx.font = '700 42px "Syne", sans-serif';
        ctx.fillText("Willing donors & blood banks exist.", W * 0.5, 588, W - 140);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = '500 19px "DM Sans", sans-serif';
        ctx.fillText(
          "Without a live compatibility bridge, O-, A+, BK1 & H1 stay separated.",
          W * 0.5,
          630,
          W - 140,
        );
        ctx.restore();
      }

      // CHAPTER 3: ENTER BLOODLINK (Live Lock-On Packets)
      if (chapter === 2) {
        const snapProgress = easeOutCubic(Math.min(1, localT * 1.45));
        const hubX = W * 0.5;
        const hubY = H * 0.46;

        networkNodes.forEach((node, idx) => {
          if (node.role === "hub") return;
          const nodeDelay = Math.max(0, Math.min(1, (snapProgress - idx * 0.04) * 1.5));
          if (nodeDelay <= 0) return;

          const cx = (hubX + node.x) * 0.5;
          const cy = (hubY + node.y) * 0.5 - 45;
          const curX =
            (1 - nodeDelay) * (1 - nodeDelay) * hubX +
            2 * (1 - nodeDelay) * nodeDelay * cx +
            nodeDelay * nodeDelay * node.x;
          const curY =
            (1 - nodeDelay) * (1 - nodeDelay) * hubY +
            2 * (1 - nodeDelay) * nodeDelay * cy +
            nodeDelay * nodeDelay * node.y;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(hubX, hubY);
          ctx.quadraticCurveTo(cx, cy, curX, curY);
          ctx.strokeStyle = node.role === "donor" ? "#ff4d6d" : "#38bdf8";
          ctx.lineWidth = 2.4;
          ctx.stroke();

          // Travelling bright signal packet along snapped arc
          const packetT = ((t * 0.95 + idx * 0.16) % 1) * nodeDelay;
          const px =
            (1 - packetT) * (1 - packetT) * node.x +
            2 * (1 - packetT) * packetT * cx +
            packetT * packetT * hubX;
          const py =
            (1 - packetT) * (1 - packetT) * node.y +
            2 * (1 - packetT) * packetT * cy +
            packetT * packetT * hubY;
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.restore();

          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x, node.y, 24, 0, Math.PI * 2);
          ctx.fillStyle = nodeDelay > 0.9 ? "#e11d48" : "#0f172a";
          ctx.strokeStyle = node.role === "donor" ? "#fda4af" : "#7dd3fc";
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = '700 13px "IBM Plex Mono", monospace';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.id, node.x, node.y);
          ctx.restore();
        });

        ctx.save();
        ctx.fillStyle = "#34d399";
        ctx.font = '600 15px "IBM Plex Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText("3D SCENE 03  /  COMPATIBILITY LOCK-ON & VERIFIED ROUTING", W * 0.5, 96, W - 120);

        ctx.fillStyle = "#ffffff";
        ctx.font = '700 40px "Syne", sans-serif';
        ctx.fillText("Donors, blood banks & H1 trauma hubs — aligned.", W * 0.5, 622, W - 140);
        ctx.restore();
      }

      // CHAPTER 4: COMPONENT SEPARATION
      if (chapter === 3) {
        const enter = easeOutCubic(Math.min(1, localT * 2.4));
        const cx = W * 0.5;
        const cy = H * 0.43;

        const components = [
          { label: "RED CELLS", sub: "Oxygen Delivery", color: "#ff4d6d", angle: t * 0.85 },
          { label: "PLASMA", sub: "Clotting Support", color: "#fbbf24", angle: t * 0.85 + (Math.PI * 2) / 3 },
          { label: "PLATELETS", sub: "Bleeding Shield", color: "#34d399", angle: t * 0.85 + (Math.PI * 4) / 3 },
        ];

        components.forEach((comp, idx) => {
          const rx = 250;
          const ry = 95;
          const tilt = (idx - 1) * 0.25;
          const ox = Math.cos(comp.angle) * rx;
          const oy = Math.sin(comp.angle) * ry;
          const px = cx + ox * Math.cos(tilt) - oy * Math.sin(tilt);
          const py = cy + ox * Math.sin(tilt) + oy * Math.cos(tilt);

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = `${comp.color}99`;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.fillStyle = comp.color;
          ctx.fill();

          ctx.fillStyle = "rgba(11, 15, 25, 0.92)";
          ctx.strokeStyle = comp.color;
          ctx.lineWidth = 1.2;
          ctx.fillRect(px - 68, py + 22, 136, 42);
          ctx.strokeRect(px - 68, py + 22, 136, 42);

          ctx.fillStyle = "#ffffff";
          ctx.font = '600 12px "IBM Plex Mono", monospace';
          ctx.textAlign = "center";
          ctx.fillText(comp.label, px, py + 39);
          ctx.fillStyle = "#cbd5e1";
          ctx.font = '500 11px "DM Sans", sans-serif';
          ctx.fillText(comp.sub, px, py + 55);
        });

        ctx.save();
        ctx.globalAlpha = enter;
        ctx.fillStyle = "#fda4af";
        ctx.font = '600 15px "IBM Plex Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText("3D SCENE 04  /  ONE DONATION, MULTIPLE LIVES TOUCHED", W * 0.5, 92, W - 120);

        ctx.fillStyle = "#ffffff";
        ctx.font = '700 46px "Syne", sans-serif';
        ctx.fillText("BloodLink — Every drop connects a life.", W * 0.5, 622, W - 140);
        ctx.restore();
      }

      // Broadcast timecode HUD
      ctx.save();
      ctx.fillStyle = "rgba(248, 250, 252, 0.78)";
      ctx.font = '600 12px "IBM Plex Mono", monospace';
      ctx.textAlign = "left";
      ctx.fillText(
        `3D TELEMETRY SIMULATION  //  CH 0${chapter + 1}: ${REEL_CHAPTERS[chapter].shortTitle.toUpperCase()}`,
        28,
        34,
      );
      ctx.textAlign = "right";
      ctx.fillText(`${formatTimecode(t)}  /  00:24:00`, W - 28, 34);
      ctx.restore();

      frameId = window.requestAnimationFrame(renderFrame);
    };

    frameId = window.requestAnimationFrame(renderFrame);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      floorGrid?.dispose();
      threeDisposables.forEach((d) => d.dispose());
      renderer?.dispose();
      if (renderer && renderer.domElement.parentElement === threeHost) {
        threeHost.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleScrub = (nextSeconds: number) => {
    timeRef.current = nextSeconds;
    lastUiSyncRef.current = nextSeconds;
    setCurrentTime(nextSeconds);
  };

  const progressPct = (currentTime / TOTAL_DURATION) * 100;

  return (
    <div className="motion-reel-shell" ref={containerRef}>
      <div className="motion-stage">
        <div ref={threeLayerRef} className="motion-3d-underlay" aria-hidden="true" />
        <canvas
          ref={canvasRef}
          className="motion-canvas"
          onClick={() => setIsPlaying((prev) => !prev)}
          aria-label="BloodLink live 3D video motion graphics film"
        />
        <button
          type="button"
          className={`motion-center-play ${isPlaying ? "is-playing" : ""}`}
          onClick={() => setIsPlaying((prev) => !prev)}
          aria-label={isPlaying ? "Pause 3D motion film" : "Play 3D motion film"}
        >
          <span>{isPlaying ? "II" : "▶"}</span>
        </button>
        <div className="motion-live-tag">
          <span className="pulse-dot" />
          <span>{isPlaying ? "LIVE 3D VIDEO MOTION" : "PAUSED"}</span>
        </div>
      </div>

      <div className="motion-controls">
        <div className="motion-scrubber-row">
          <input
            type="range"
            min={0}
            max={TOTAL_DURATION}
            step={0.05}
            value={currentTime}
            onChange={(event) => handleScrub(Number(event.target.value))}
            aria-label="Seek 3D motion film timeline"
            className="motion-range"
            style={{
              background: `linear-gradient(90deg, #ff4d6d ${progressPct}%, rgba(248,250,252,0.16) ${progressPct}%)`,
            }}
          />
        </div>

        <div className="motion-toolbar">
          <div className="motion-left-controls">
            <button type="button" className="motion-btn" onClick={() => setIsPlaying((prev) => !prev)}>
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              className="motion-btn motion-btn-muted"
              onClick={() => setSpeed((prev) => (prev === 1 ? 1.5 : 1))}
            >
              {speed}x
            </button>
            <button
              type="button"
              className={`motion-btn motion-btn-muted ${soundEnabled ? "is-active" : ""}`}
              onClick={toggleSound}
            >
              {soundEnabled ? "Pulse Audio: On" : "Audio: Off"}
            </button>
            <button
              type="button"
              className={`motion-btn motion-btn-muted ${isFullscreen ? "is-active" : ""}`}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? "Exit Full" : "Fullscreen"}
            </button>
            <span className="motion-timecode">{formatTimecode(currentTime)} / 00:24:00</span>
          </div>

          <div className="motion-chapters" role="tablist" aria-label="3D Film chapters">
            {REEL_CHAPTERS.map((ch) => (
              <button
                key={ch.label}
                type="button"
                role="tab"
                aria-selected={activeChapterIndex === ch.index}
                className={`motion-chapter-tab ${activeChapterIndex === ch.index ? "is-active" : ""}`}
                onClick={() => {
                  handleScrub(ch.startSec + 0.05);
                  setIsPlaying(true);
                }}
              >
                <span>{ch.label}</span> {ch.shortTitle}
              </button>
            ))}
          </div>
        </div>

        <p className="motion-caption" aria-live="polite">
          <strong>Chapter {REEL_CHAPTERS[activeChapterIndex].label}:</strong>{" "}
          {REEL_CHAPTERS[activeChapterIndex].caption}
        </p>
      </div>
    </div>
  );
}
