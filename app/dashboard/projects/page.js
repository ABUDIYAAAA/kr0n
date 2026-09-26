"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";

const STORAGE_KEY = "kron_canvas_positions_v3";

export default function ProjectsPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  const canvasRef = useRef(null);

  // Keyboard shortcut Ctrl/Cmd + K to focus search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const projects = [
    {
      name: "nucleus-engine",
      repo: "github.com/kron/nucleus",
      status: "Production",
      color: "bg-green-500",
      author: "arpit",
      env: "PROD",
      build: "1M 14S",
      branch: "main",
      title: "feat: enhance refraction engine",
      hash: "72a1bc8f",
      time: "2M AGO",
    },
    {
      name: "quantum-web",
      repo: "github.com/kron/quantum",
      status: "Building",
      color: "bg-yellow-400",
      author: "dev",
      env: "PREVIEW",
      build: "45S",
      branch: "dev",
      title: "fix: token refresh logic",
      hash: "8ab12cd",
      time: "10M AGO",
    },
    {
      name: "auth-service",
      repo: "github.com/kron/auth",
      status: "Production",
      color: "bg-green-500",
      author: "arpit",
      env: "PROD",
      build: "58S",
      branch: "main",
      title: "chore: rotate secrets",
      hash: "f2a991b",
      time: "25M AGO",
    },
    {
      name: "legacy-dash",
      repo: "github.com/kron/legacy",
      status: "Inactive",
      color: "bg-black/30",
      author: "ops",
      env: "PREVIEW",
      build: "2M 08S",
      branch: "maintenance",
      title: "fix: patch legacy deps",
      hash: "d1c4b22",
      time: "2D AGO",
    },
  ];

  // Calculate clean, balanced 2x2 default positions based on available canvas dimensions
  const getDefaultPositions = useCallback((canvasWidth, canvasHeight) => {
    const cardW = 360;
    const cardH = 220;

    // Check if 2 columns can comfortably fit
    if (canvasWidth >= 780) {
      const colGap = Math.min(48, Math.max(24, Math.floor((canvasWidth - 2 * cardW) / 4)));
      const startX = Math.max(36, Math.min(48, Math.floor((canvasWidth - (2 * cardW + colGap)) / 3)));
      const col0X = startX;
      const col1X = startX + cardW + colGap;

      // Vertical layout: start below search bar (search bar top:20px, height:~44px)
      const rowGap = Math.max(16, Math.min(24, Math.floor((canvasHeight - 80 - 2 * cardH) / 3)));
      const row0Y = Math.max(76, Math.min(84, Math.floor((canvasHeight - (2 * cardH + rowGap)) / 2)));
      const row1Y = row0Y + cardH + rowGap;

      return {
        "nucleus-engine": { x: col0X, y: row0Y },
        "quantum-web": { x: col1X, y: row0Y },
        "auth-service": { x: col0X, y: row1Y },
        "legacy-dash": { x: col1X, y: row1Y },
      };
    }

    // Single column for narrow viewports
    const startX = Math.max(16, Math.floor((canvasWidth - cardW) / 2));
    const rowGap = 16;
    return {
      "nucleus-engine": { x: startX, y: 76 },
      "quantum-web": { x: startX, y: 76 + (cardH + rowGap) },
      "auth-service": { x: startX, y: 76 + (cardH + rowGap) * 2 },
      "legacy-dash": { x: startX, y: 76 + (cardH + rowGap) * 3 },
    };
  }, []);

  const [positions, setPositions] = useState({
    "nucleus-engine": { x: 44, y: 80 },
    "quantum-web": { x: 436, y: 80 },
    "auth-service": { x: 44, y: 324 },
    "legacy-dash": { x: 436, y: 324 },
  });

  const [activeDraggingName, setActiveDraggingName] = useState(null);
  const [usageOpen, setUsageOpen] = useState(false);
  const dragInfoRef = useRef(null);

  // Initialize positions from localStorage or smart defaults
  useEffect(() => {
    let animationFrameId;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          animationFrameId = requestAnimationFrame(() => {
            setPositions(parsed);
          });
          return () => cancelAnimationFrame(animationFrameId);
        }
      }
    } catch {}

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        animationFrameId = requestAnimationFrame(() => {
          setPositions(getDefaultPositions(rect.width, rect.height));
        });
      }
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [getDefaultPositions]);

  // Keep cards clamped inside canvas when resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setPositions((prev) => {
            const updated = { ...prev };
            let changed = false;
            for (const name of Object.keys(updated)) {
              const p = updated[name];
              const cardW = 360;
              const cardH = 220;
              const maxX = Math.max(16, width - cardW - 16);
              const maxY = Math.max(16, height - cardH - 16);
              const clampedX = Math.min(Math.max(p.x, 16), maxX);
              const clampedY = Math.min(Math.max(p.y, 16), maxY);
              if (clampedX !== p.x || clampedY !== p.y) {
                updated[name] = { x: clampedX, y: clampedY };
                changed = true;
              }
            }
            return changed ? updated : prev;
          });
        }
      }
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Reset layout handler
  const resetLayout = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const fresh = getDefaultPositions(rect.width, rect.height);
      setPositions(fresh);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      } catch {}
    }
  };

  // Drag interaction handlers
  const handlePointerDown = (e, projectName) => {
    // Only handle primary mouse/touch button
    if (e.button !== 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentPos = positions[projectName] || { x: 44, y: 80 };
    const cardRect = e.currentTarget.getBoundingClientRect();

    dragInfoRef.current = {
      name: projectName,
      startX: e.clientX,
      startY: e.clientY,
      initialCardX: currentPos.x,
      initialCardY: currentPos.y,
      cardWidth: cardRect.width,
      cardHeight: cardRect.height,
      hasMoved: false,
    };

    setActiveDraggingName(projectName);

    const onPointerMove = (moveEvent) => {
      if (!dragInfoRef.current || dragInfoRef.current.name !== projectName) return;

      const deltaX = moveEvent.clientX - dragInfoRef.current.startX;
      const deltaY = moveEvent.clientY - dragInfoRef.current.startY;

      if (!dragInfoRef.current.hasMoved && Math.hypot(deltaX, deltaY) > 4) {
        dragInfoRef.current.hasMoved = true;
      }

      const rawX = dragInfoRef.current.initialCardX + deltaX;
      const rawY = dragInfoRef.current.initialCardY + deltaY;

      const canvasRect = canvas.getBoundingClientRect();
      const cardWidth = dragInfoRef.current.cardWidth || 360;
      const cardHeight = dragInfoRef.current.cardHeight || 220;

      const minX = 16;
      const maxX = Math.max(minX, canvasRect.width - cardWidth - 16);
      const minY = 16;
      const maxY = Math.max(minY, canvasRect.height - cardHeight - 16);

      const clampedX = Math.round(Math.min(Math.max(rawX, minX), maxX));
      const clampedY = Math.round(Math.min(Math.max(rawY, minY), maxY));

      setPositions((prev) => ({
        ...prev,
        [projectName]: { x: clampedX, y: clampedY },
      }));
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);

      setActiveDraggingName(null);

      if (dragInfoRef.current?.hasMoved) {
        setPositions((current) => {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
          } catch {}
          return current;
        });
      }

      // Small delay to allow click handler to detect if movement occurred
      setTimeout(() => {
        dragInfoRef.current = null;
      }, 60);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Card click handler: navigates only if not dragging
  const handleCardClick = (p) => {
    if (dragInfoRef.current?.hasMoved) {
      return;
    }
    router.push(
      `/dashboard/deployments/deploymentdetails?project=${encodeURIComponent(p.name)}&author=${encodeURIComponent(p.author)}&env=${encodeURIComponent(p.env)}&status=${encodeURIComponent(p.status)}&build=${encodeURIComponent(p.build)}&branch=${encodeURIComponent(p.branch)}&title=${encodeURIComponent(p.title)}&hash=${encodeURIComponent(p.hash)}&time=${encodeURIComponent(p.time)}`,
    );
  };

  const isMatched = (p) => {
    if (!q.trim()) return true;
    const term = q.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.repo.toLowerCase().includes(term);
  };

  return (
    <DashboardShell>
      <main className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden bg-[#0d0e0f] text-white">
        {/* TOP BAR - EXACTLY PRESERVED */}
        <div className="flex justify-between items-center px-8 py-4 border-b border-white/10 bg-black/40 backdrop-blur shrink-0">
          <h1 className="text-xl font-bold uppercase">All Projects</h1>

          <Link
            href="/dashboard/projects/importrepo"
            className="bg-white text-black px-6 py-2 text-xs font-bold clipped">
            Add New
          </Link>
        </div>

        {/* FULL-WIDTH CANVAS WORKSPACE */}
        <div
          ref={canvasRef}
          className="relative flex-1 w-full min-h-0 overflow-hidden select-none bg-[#0a0b0c]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255, 255, 255, 0.055) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}>
          {/* FLOATING SEARCH BAR */}
          <div className="absolute top-5 left-8 z-20 w-80 md:w-96">
            <div className="relative group">
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search projects by name or domain..."
                className="w-full bg-[#0a0a0a]/90 backdrop-blur border border-white/12 px-5 py-3 text-xs outline-none placeholder:text-white/20 focus:border-white/30 text-white shadow-xl"
              />

              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] tracking-widest text-white/80 border border-white/10 px-2 py-0.5 pointer-events-none">
                CTRL + K
              </div>

              <div className="absolute inset-0 pointer-events-none opacity-0 group-focus-within:opacity-100 transition bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_70%)]" />
            </div>
          </div>

          {/* DRAGGABLE PROJECT CARDS */}
          {projects.map((p) => {
            const pos = positions[p.name] || { x: 44, y: 80 };
            const isDragging = activeDraggingName === p.name;
            const matched = isMatched(p);

            return (
              <div
                key={p.name}
                tabIndex={0}
                role="button"
                aria-label={`Project ${p.name}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                  touchAction: "none",
                }}
                onPointerDown={(e) => handlePointerDown(e, p.name)}
                onClick={() => handleCardClick(p)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick(p);
                  }
                }}
                className={`
                  w-[360px] max-w-[calc(100vw-32px)]
                  group
                  clipped
                  border border-white/30
                  bg-black/60
                  text-white
                  backdrop-blur-sm
                  transition-colors
                  outline-none
                  focus-visible:ring-1 focus-visible:ring-white/50
                  ${
                    isDragging
                      ? "cursor-grabbing z-30 shadow-[0_20px_40px_rgba(0,0,0,0.9)] border-white/60 bg-black/80"
                      : "cursor-grab z-10 hover:bg-black/70 hover:border-white/50"
                  }
                  ${matched ? "opacity-100" : "opacity-20 pointer-events-none"}
                `}>
                <div className="p-6">
                  <div className="flex justify-between mb-6">
                    <div className="w-10 h-10 bg-white/5 border border-white/15 flex items-center justify-center">
                      <span className="text-xs text-white">□</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs uppercase text-white/70">
                      <div className={`w-2 h-2 ${p.color}`} />
                      {p.status}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mb-1">{p.name}</h3>
                  <p className="text-sm text-white/50 font-mono">{p.repo}</p>

                  <div className="flex justify-between mt-6 pt-4 border-t border-white/10 text-xs text-white/40">
                    <span>Updated recently</span>
                    <span className="group-hover:text-white transition-colors">→</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* CANVAS WORKSPACE CONTROLS */}
          <div className="absolute bottom-5 left-8 z-20 flex items-center gap-4">
            <button
              type="button"
              onClick={resetLayout}
              className="px-3 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur border border-white/10 hover:border-white/30 text-[10px] font-mono uppercase tracking-wider text-white/50 hover:text-white transition cursor-pointer">
              Reset Layout
            </button>
            <span className="text-[10px] font-mono text-white/30 hidden sm:inline">
              Drag cards to rearrange
            </span>
          </div>

          {/* FLOATING USAGE HUD (COLLAPSIBLE TO PRESERVE WORKSPACE AREA) */}
          <div className="absolute bottom-5 right-8 z-20">
            {usageOpen ? (
              <div className="w-72 p-5 border border-white/15 bg-black/85 backdrop-blur-md shadow-2xl">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                      Usage
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/usage"
                      className="text-[10px] text-white/50 hover:text-white transition uppercase font-mono">
                      Details →
                    </Link>
                    <button
                      type="button"
                      onClick={() => setUsageOpen(false)}
                      className="text-white/40 hover:text-white text-xs px-1 cursor-pointer"
                      aria-label="Close usage panel">
                      ✕
                    </button>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {[
                    { label: "Edge Requests", val: "482k / 1M", w: "48%" },
                    { label: "Data Transfer", val: "12GB / 50GB", w: "25%" },
                    { label: "CPU", val: "890m / 1500m", w: "60%" },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1.5 text-[11px]">
                        <span className="text-white/70">{item.label}</span>
                        <span className="font-mono text-white/90">{item.val}</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white"
                          style={{ width: item.w }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setUsageOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-black/80 backdrop-blur border border-white/15 text-xs text-white/70 hover:text-white hover:border-white/30 transition shadow-lg cursor-pointer">
                <span className="w-1.5 h-1.5 bg-emerald-400" />
                <span className="font-mono uppercase tracking-wider text-[10px]">
                  Usage HUD
                </span>
                <span className="text-[9px] text-white/40">▲</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </DashboardShell>
  );
}
