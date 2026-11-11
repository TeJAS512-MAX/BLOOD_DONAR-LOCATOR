import { useEffect, useRef, useState } from "react";

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
    shortTitle: "The Crisis",
    startSec: 0,
    endSec: 6,
    caption: "During emergencies & surgeries, every minute spent searching carries weight.",
  },
  {
    index: 1,
    label: "02",
    shortTitle: "Fragmentation",
    startSec: 6,
    endSec: 12,
    caption: "Willing donors and authorised blood banks remain separated across disconnected channels.",
  },
  {
    index: 2,
    label: "03",
    shortTitle: "BloodLink Signal",
    startSec: 12,
    endSec: 18,
    caption: "One calm, verified network bridges donors, hospitals and blood banks instantly.",
  },
  {
    index: 3,
    label: "04",
    shortTitle: "Every Drop Connects",
    startSec: 18,
    endSec: 24,
    caption: "One voluntary donation can separate into components that support multiple lives.",
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

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const toggleSound = () => {
    if (!soundEnabled) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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
    const container = containerRef.current;
    if (!canvas || !container) return;

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
    window.addEventListener("resize", syncCanvasSize);

    // Deterministic node network layout for chapters 2 & 3
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
      const localT = (t % 6) / 6; // 0..1 within chapter

      // Subtle heartbeat pulse trigger every 1.2s
      const beatIndex = Math.floor(t / 1.2);
      if (isPlayingRef.current && beatIndex !== lastBeatRef.current) {
        lastBeatRef.current = beatIndex;
        triggerHeartbeatSound();
      }

      // Base cinematic midnight-slate & crimson studio gradient
      const bgGrad = ctx.createRadialGradient(W * 0.54, H * 0.46, 40, W * 0.5, H * 0.5, W * 0.75);
      bgGrad.addColorStop(0, "#24111c");
      bgGrad.addColorStop(0.52, "#111622");
      bgGrad.addColorStop(1, "#090d14");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 3D depth-projected plasma stream motes
      ctx.save();
      for (let m = 0; m < 44; m += 1) {
        const seed = (m * 73.17) % 1;
        const angle = m * 2.39996;
        const z = 1 - (((t * 0.22 + seed) % 1));
        const scale = 0.25 / Math.max(0.08, z);
        const sx = W * 0.5 + Math.cos(angle + t * 0.1) * 140 * scale;
        const sy = H * 0.45 + Math.sin(angle + t * 0.1) * 84 * scale;
        const radius = Math.min(5.5, 0.85 * scale);
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 128, 142, ${Math.min(0.45, (1 - z) * 0.45)})`;
        ctx.fill();
      }
      ctx.restore();

      // Perspective 3D studio floor grid
      ctx.save();
      ctx.strokeStyle = "rgba(250, 104, 119, 0.09)";
      ctx.lineWidth = 1;
      const horizonY = H * 0.64;
      for (let i = -10; i <= 10; i += 1) {
        ctx.beginPath();
        ctx.moveTo(W * 0.5 + i * 36, horizonY);
        ctx.lineTo(W * 0.5 + i * 170, H + 40);
        ctx.stroke();
      }
      for (let r = 0; r < 8; r += 1) {
        const progress = ((r / 8) + ((t * 0.18) % (1 / 8)));
        const y = horizonY + Math.pow(progress, 1.8) * (H - horizonY + 30);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.restore();

      // Subtle film grain / scanline overlay
      ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
      for (let sy = 0; sy < H; sy += 4) {
        ctx.fillRect(0, sy, W, 1);
      }

      // CHAPTER 1: THE CRISIS (0s - 6s)
      if (chapter === 0) {
        const enter = easeOutCubic(Math.min(1, localT * 3.2));
        const pulseCycle = (t * 1.4) % 1;

        // Radar urgency rings
        for (let i = 0; i < 4; i += 1) {
          const p = (pulseCycle + i * 0.25) % 1;
          ctx.beginPath();
          ctx.arc(W * 0.5, H * 0.45, 45 + p * 290, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(250, 104, 119, ${(1 - p) * 0.35})`;
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }

        // Animated EKG / Arterial waveform
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
        ctx.strokeStyle = "#fa6877";
        ctx.lineWidth = 2.8;
        ctx.shadowColor = "#ff455d";
        ctx.shadowBlur = 16;
        ctx.stroke();

        // Phosphor tip dot
        ctx.beginPath();
        ctx.arc(sweepX, waveY, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = "#fff8f5";
        ctx.fill();
        ctx.restore();

        // Kinetic typography
        ctx.save();
        ctx.globalAlpha = enter;
        ctx.fillStyle = "rgba(250, 104, 119, 0.92)";
        ctx.font = '500 15px "JetBrains Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText("SCENE 01  /  THE REAL-WORLD CHALLENGE", W * 0.5, 165);

        ctx.fillStyle = "#fff8f5";
        ctx.font = '600 58px "Outfit", sans-serif';
        ctx.fillText("When every minute matters,", W * 0.5, 232);
        ctx.fillStyle = "#fa6877";
        ctx.fillText("matching donors shouldn't stall.", W * 0.5, 294);

        ctx.fillStyle = "rgba(255, 240, 235, 0.7)";
        ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
        ctx.fillText("Surgeries, trauma & critical treatments demand rapid, trusted donor coordination.", W * 0.5, 535);
        ctx.restore();
      }

      // CHAPTER 2: THE FRAGMENTATION (6s - 12s)
      if (chapter === 1) {
        const enter = easeOutCubic(Math.min(1, localT * 3.0));
        const drift = Math.sin(localT * Math.PI * 2);

        // Broken dashed links between disconnected nodes
        ctx.save();
        ctx.setLineDash([7, 10]);
        ctx.lineDashOffset = -t * 28;
        ctx.strokeStyle = "rgba(250, 104, 119, 0.25)";
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 5; i += 1) {
          const a = networkNodes[i];
          const b = networkNodes[5 + (i % 4)];
          ctx.beginPath();
          ctx.moveTo(a.x + drift * 12, a.y - drift * 8);
          ctx.lineTo((a.x + b.x) * 0.5, (a.y + b.y) * 0.5);
          ctx.stroke();
        }
        ctx.restore();

        // Draw floating fragmented nodes
        networkNodes.forEach((node, idx) => {
          const dx = Math.sin(t * 0.9 + idx * 1.3) * 14;
          const dy = Math.cos(t * 0.7 + idx * 1.7) * 11;
          const nx = node.x + dx;
          const ny = node.y + dy;

          ctx.save();
          ctx.beginPath();
          ctx.arc(nx, ny, node.role === "hub" ? 28 : 22, 0, Math.PI * 2);
          ctx.fillStyle = node.role === "donor" ? "rgba(38, 16, 22, 0.9)" : "rgba(56, 17, 28, 0.9)";
          ctx.strokeStyle = node.role === "donor" ? "rgba(250, 104, 119, 0.55)" : "rgba(255, 212, 204, 0.35)";
          ctx.lineWidth = 1.5;
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#fff8f5";
          ctx.font = '600 14px "JetBrains Mono", monospace';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.id, nx, ny);
          ctx.restore();
        });

        // Kinetic editorial callout box
        ctx.save();
        ctx.globalAlpha = enter;
        ctx.fillStyle = "rgba(250, 104, 119, 0.9)";
        ctx.font = '500 15px "JetBrains Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText("SCENE 02  /  DISCONNECTED SIGNALS", W * 0.5, 116);

        ctx.fillStyle = "#fff8f5";
        ctx.font = '600 44px "Outfit", sans-serif';
        ctx.fillText("Willing donors exist.", W * 0.5, 590);
        ctx.fillStyle = "rgba(255, 228, 224, 0.72)";
        ctx.font = '400 19px "Plus Jakarta Sans", sans-serif';
        ctx.fillText("Finding who is available, compatible, and verified shouldn't depend on guesswork.", W * 0.5, 632);
        ctx.restore();
      }

      // CHAPTER 3: ENTER BLOODLINK (12s - 18s)
      if (chapter === 2) {
        const snapProgress = easeOutCubic(Math.min(1, localT * 1.45));
        const hubX = W * 0.5;
        const hubY = H * 0.46;

        // Expanding coral wave from hub
        const waveR = snapProgress * 490;
        ctx.beginPath();
        ctx.arc(hubX, hubY, waveR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(250, 104, 119, ${Math.max(0, 0.55 - snapProgress * 0.45)})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Animated Bezier signal links snapping every node to the hub
        networkNodes.forEach((node, idx) => {
          if (node.role === "hub") return;
          const nodeDelay = Math.max(0, Math.min(1, (snapProgress - idx * 0.04) * 1.5));
          if (nodeDelay <= 0) return;

          const cx = (hubX + node.x) * 0.5;
          const cy = (hubY + node.y) * 0.5 - 45;
          const curX = (1 - nodeDelay) * (1 - nodeDelay) * hubX + 2 * (1 - nodeDelay) * nodeDelay * cx + nodeDelay * nodeDelay * node.x;
          const curY = (1 - nodeDelay) * (1 - nodeDelay) * hubY + 2 * (1 - nodeDelay) * nodeDelay * cy + nodeDelay * nodeDelay * node.y;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(hubX, hubY);
          ctx.quadraticCurveTo(cx, cy, curX, curY);
          ctx.strokeStyle = node.role === "donor" ? "rgba(250, 104, 119, 0.78)" : "rgba(255, 224, 200, 0.68)";
          ctx.lineWidth = 2;
          ctx.shadowColor = "#fa6877";
          ctx.shadowBlur = 10;
          ctx.stroke();

          // Travelling pulse packet
          const packetT = ((t * 0.9 + idx * 0.17) % 1) * nodeDelay;
          const px = (1 - packetT) * (1 - packetT) * hubX + 2 * (1 - packetT) * packetT * cx + packetT * packetT * node.x;
          const py = (1 - packetT) * (1 - packetT) * hubY + 2 * (1 - packetT) * packetT * cy + packetT * packetT * node.y;
          ctx.beginPath();
          ctx.arc(px, py, 3.8, 0, Math.PI * 2);
          ctx.fillStyle = "#fff8f5";
          ctx.fill();
          ctx.restore();

          // Connected node badge
          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x, node.y, 24, 0, Math.PI * 2);
          ctx.fillStyle = nodeDelay > 0.9 ? "#d62c46" : "#2b1018";
          ctx.strokeStyle = "#ff8c9a";
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#fff8f5";
          ctx.font = '700 13px "JetBrains Mono", monospace';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.id, node.x, node.y);
          ctx.restore();
        });

        // Central BloodLink droplet emblem
        ctx.save();
        ctx.translate(hubX, hubY);
        ctx.beginPath();
        ctx.moveTo(0, -34);
        ctx.bezierCurveTo(24, -4, 30, 26, 0, 34);
        ctx.bezierCurveTo(-30, 26, -24, -4, 0, -34);
        ctx.fillStyle = "#fa6877";
        ctx.shadowColor = "#ff4d67";
        ctx.shadowBlur = 28;
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = "rgba(255, 224, 214, 0.9)";
        ctx.font = '500 15px "JetBrains Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText("SCENE 03  /  ENTER BLOODLINK", W * 0.5, 96);

        ctx.fillStyle = "#fff8f5";
        ctx.font = '600 40px "Outfit", sans-serif';
        ctx.fillText("Donors, hospitals & blood banks — aligned.", W * 0.5, 622);
        ctx.restore();
      }

      // CHAPTER 4: EVERY DROP CONNECTS A LIFE (18s - 24s)
      if (chapter === 3) {
        const enter = easeOutCubic(Math.min(1, localT * 2.4));
        const cx = W * 0.5;
        const cy = H * 0.43;

        // 3D projected rotating component orbits
        const components = [
          { label: "RED CELLS", sub: "Oxygen Delivery", color: "#ff4d6d", angle: t * 0.85 },
          { label: "PLASMA", sub: "Clotting Support", color: "#fbbf24", angle: t * 0.85 + (Math.PI * 2) / 3 },
          { label: "PLATELETS", sub: "Bleeding Shield", color: "#34d399", angle: t * 0.85 + (Math.PI * 4) / 3 },
        ];

        ctx.save();
        ctx.strokeStyle = "rgba(250, 104, 119, 0.28)";
        ctx.lineWidth = 1.4;
        for (let r = 1; r <= 3; r += 1) {
          ctx.beginPath();
          ctx.ellipse(cx, cy, 110 + r * 72, 46 + r * 26, (r - 2) * 0.28, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        components.forEach((comp, idx) => {
          const rx = 250;
          const ry = 95;
          const tilt = (idx - 1) * 0.25;
          const ox = Math.cos(comp.angle) * rx;
          const oy = Math.sin(comp.angle) * ry;
          const px = cx + ox * Math.cos(tilt) - oy * Math.sin(tilt);
          const py = cy + ox * Math.sin(tilt) + oy * Math.cos(tilt);

          // Connecting prism line
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = `${comp.color}88`;
          ctx.lineWidth = 1.6;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.fillStyle = comp.color;
          ctx.shadowColor = comp.color;
          ctx.shadowBlur = 18;
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = "rgba(22, 8, 12, 0.9)";
          ctx.strokeStyle = `${comp.color}88`;
          ctx.lineWidth = 1;
          ctx.fillRect(px - 68, py + 22, 136, 42);
          ctx.strokeRect(px - 68, py + 22, 136, 42);

          ctx.fillStyle = "#fff8f5";
          ctx.font = '600 11px "JetBrains Mono", monospace';
          ctx.textAlign = "center";
          ctx.fillText(comp.label, px, py + 39);
          ctx.fillStyle = "#b89fa2";
          ctx.font = '400 10px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(comp.sub, px, py + 55);
        });

        // Core sphere
        const coreGrad = ctx.createRadialGradient(cx - 12, cy - 12, 6, cx, cy, 48);
        coreGrad.addColorStop(0, "#ff8796");
        coreGrad.addColorStop(0.6, "#c91e3c");
        coreGrad.addColorStop(1, "#450d1b");
        ctx.beginPath();
        ctx.arc(cx, cy, 44, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();

        // Final wordmark reveal
        ctx.save();
        ctx.globalAlpha = enter;
        ctx.fillStyle = "rgba(250, 104, 119, 0.92)";
        ctx.font = '500 14px "JetBrains Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText("SCENE 04  /  ONE DONATION, MULTIPLE LIVES TOUCHED", W * 0.5, 92);

        ctx.fillStyle = "#fff8f5";
        ctx.font = '600 54px "Outfit", sans-serif';
        ctx.fillText("BloodLink — Every drop connects a life.", W * 0.5, 622);
        ctx.restore();
      }

      // Top broadcast film overlay badge
      ctx.save();
      ctx.fillStyle = "rgba(255, 248, 245, 0.64)";
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.textAlign = "left";
      ctx.fillText(
        `BLOODLINK MOTION FILM  //  CH 0${chapter + 1}: ${REEL_CHAPTERS[chapter].shortTitle.toUpperCase()}`,
        32,
        36,
      );
      ctx.textAlign = "right";
      ctx.fillText(`${formatTimecode(t)}  /  00:24:00`, W - 32, 36);
      ctx.restore();

      frameId = window.requestAnimationFrame(renderFrame);
    };

    frameId = window.requestAnimationFrame(renderFrame);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", syncCanvasSize);
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
        <canvas
          ref={canvasRef}
          className="motion-canvas"
          onClick={() => setIsPlaying((prev) => !prev)}
          aria-label="BloodLink interactive motion graphics film explaining the problem statement and solution"
        />
        <button
          type="button"
          className={`motion-center-play ${isPlaying ? "is-playing" : ""}`}
          onClick={() => setIsPlaying((prev) => !prev)}
          aria-label={isPlaying ? "Pause motion film" : "Play motion film"}
        >
          <span className="motion-play-icon">{isPlaying ? "II" : "▶"}</span>
        </button>
        <div className="motion-live-tag">
          <span className="live-dot" />
          <span>{isPlaying ? "MOTION GRAPHIC PLAYING" : "PAUSED"}</span>
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
            aria-label="Seek motion graphics timeline"
            className="motion-range"
            style={{
              background: `linear-gradient(90deg, #fa6877 ${progressPct}%, rgba(255,248,245,0.16) ${progressPct}%)`,
            }}
          />
        </div>

        <div className="motion-toolbar">
          <div className="motion-left-controls">
            <button
              type="button"
              className="motion-btn"
              onClick={() => setIsPlaying((prev) => !prev)}
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              className="motion-btn motion-btn-muted"
              onClick={() => setSpeed((prev) => (prev === 1 ? 1.5 : 1))}
              title="Toggle playback speed"
            >
              {speed}x
            </button>
            <button
              type="button"
              className={`motion-btn motion-btn-muted ${soundEnabled ? "is-active" : ""}`}
              onClick={toggleSound}
              title="Toggle synthetic ambient pulse sound"
            >
              {soundEnabled ? "Pulse Audio: On" : "Audio: Off"}
            </button>
            <button
              type="button"
              className={`motion-btn motion-btn-muted ${isFullscreen ? "is-active" : ""}`}
              onClick={toggleFullscreen}
              title="Toggle cinema fullscreen mode"
            >
              {isFullscreen ? "Exit Full" : "Fullscreen"}
            </button>
            <span className="motion-timecode">
              {formatTimecode(currentTime)} / 00:24:00
            </span>
          </div>

          <div className="motion-chapters" role="tablist" aria-label="Motion film chapters">
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
