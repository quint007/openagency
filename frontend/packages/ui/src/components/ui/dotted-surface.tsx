"use client";

import { type ReactNode, useEffect, useRef } from "react";

import { cn } from "../../lib/utils";

type DottedSurfaceProps = {
  className?: string;
  children?: ReactNode;
};

function getThemeColor(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  return value || fallback;
}

function DottedSurface({ className, children }: DottedSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const resizeRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = {
      primary: getThemeColor("--brand-primary", "#00daf3"),
      primaryLight: getThemeColor("--brand-primary-light", "#33e4f6"),
      tertiary: getThemeColor("--brand-tertiary", "#00ffaa"),
      surface: getThemeColor("--surface", "#0b1020"),
      surfaceLow: getThemeColor("--surface-container-low", "#131b2e"),
      surfaceLowest: getThemeColor("--surface-container-lowest", "#060e20"),
    };

    const DPR = Math.max(window.devicePixelRatio || 1, 1);
    const spacing = 22;

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * DPR));
      canvas.height = Math.max(1, Math.floor(height * DPR));
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    resize();

    const start = performance.now();
    const render = (now: number) => {
      const elapsed = (now - start) / 1000;
      const { width, height } = canvas.getBoundingClientRect();

      ctx.clearRect(0, 0, width, height);

      const background = ctx.createLinearGradient(0, 0, 0, height);
      background.addColorStop(0, colors.surfaceLow);
      background.addColorStop(1, colors.surface);
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      const topGlow = ctx.createRadialGradient(width * 0.5, height * 0.18, 0, width * 0.5, height * 0.18, width * 0.7);
      topGlow.addColorStop(0, `${colors.primaryLight}22`);
      topGlow.addColorStop(0.45, `${colors.primary}0f`);
      topGlow.addColorStop(1, "transparent");
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, width, height);

      const planeY = height * 0.52;
      const rows = Math.ceil(height / spacing) + 8;
      const cols = Math.ceil(width / spacing) + 8;
      const centerX = width / 2;

      ctx.globalCompositeOperation = "lighter";

      for (let row = 0; row < rows; row += 1) {
        const depth = row / rows;
        const wave = Math.sin(elapsed * 1.2 + row * 0.28) * 6 + Math.sin(elapsed * 0.55 + row * 0.12) * 3;
        const rowY = planeY + (row - rows * 0.18) * spacing * 0.78 + wave;

        for (let col = 0; col < cols; col += 1) {
          const offset = Math.sin(elapsed * 0.9 + col * 0.32 + row * 0.18) * 5;
          const x = col * spacing - spacing * 2 + offset;

          const perspective = 1 - depth * 0.66;
          const px = centerX + (x - centerX) * perspective;
          const py = rowY + (depth * depth) * 220;

          if (px < -20 || px > width + 20 || py < -20 || py > height + 20) continue;

          const pulse = 0.5 + 0.5 * Math.sin(elapsed * 2 + row * 0.12 + col * 0.08);
          const radius = 0.9 + depth * 0.75 + pulse * 0.55;
          const alpha = Math.max(0.08, 0.78 - depth * 0.7);
          const useAlt = (row + col) % 11 === 0;

          ctx.fillStyle = useAlt ? colors.tertiary : colors.primaryLight;

          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.globalAlpha = alpha;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      const glow = ctx.createRadialGradient(width * 0.5, height * 0.25, 0, width * 0.5, height * 0.25, width * 0.36);
      glow.addColorStop(0, `${colors.primary}18`);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      frameRef.current = window.requestAnimationFrame(render);
    };

    frameRef.current = window.requestAnimationFrame(render);

    resizeRef.current = new ResizeObserver(resize);
    resizeRef.current.observe(canvas);

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      resizeRef.current?.disconnect();
      resizeRef.current = null;
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("relative isolate size-full overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 size-full"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,color-mix(in_srgb,var(--brand-primary)_18%,transparent)_0%,transparent_42%),radial-gradient(circle_at_20%_80%,color-mix(in_srgb,var(--brand-tertiary)_12%,transparent)_0%,transparent_34%)]"
      />

      {children ? <div className="absolute inset-0 z-10">{children}</div> : null}
    </div>
  );
}

export { DottedSurface };
