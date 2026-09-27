import { useEffect, useRef } from "react";
import { terrainNoise } from "@/lib/noise";

export interface InteractiveBackgroundProps {
  intensity?: number;
  colorScheme?: "auto" | "light" | "dark";
  off?: boolean;
}

type Ripple = { x: number; y: number; born: number };

export function InteractiveBackground({
  intensity = 0.7,
  colorScheme = "auto",
  off = false,
}: InteractiveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || off) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dark = window.matchMedia("(prefers-color-scheme: dark)");
    const mobile = window.matchMedia("(max-width: 640px), (pointer: coarse)");
    const boundedIntensity = Math.max(0, Math.min(1.5, intensity));
    const ripples: Ripple[] = [];
    let pointer = { x: -10000, y: -10000 };
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastDraw = 0;
    let lastRipple = 0;
    let frameCount = 0;
    let visible = true;
    let disposed = false;

    const resize = () => {
      const scale = mobile.matches ? 0.65 : Math.min(window.devicePixelRatio || 1, 1.25);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      context.setTransform(scale, 0, 0, scale, 0, 0);
      draw(performance.now(), true);
    };

    const draw = (now: number, staticFrame = false) => {
      if (disposed || !width || !height) return;
      context.clearRect(0, 0, width, height);
      const scheme = colorScheme === "auto" ? (dark.matches ? "dark" : "light") : colorScheme;
      const token = getComputedStyle(canvas).getPropertyValue("--retro-contour").trim();
      context.strokeStyle =
        token || (scheme === "dark" ? "rgba(126, 177, 179, 0.25)" : "rgba(35, 81, 94, 0.2)");
      context.lineWidth = 1.35;
      const gap = mobile.matches ? 34 : 40;
      const step = mobile.matches ? 17 : 13;
      const time = staticFrame ? 0 : now * 0.00015;
      for (let baseline = -gap; baseline < height + gap * 2; baseline += gap) {
        context.beginPath();
        for (let x = -step; x <= width + step; x += step) {
          const rolling = terrainNoise(x * 0.007 + time, baseline * 0.01) * 13;
          const detail = terrainNoise(x * 0.018, baseline * 0.023 + time * 0.7) * 5;
          let y = baseline + (rolling + detail) * boundedIntensity;
          if (!staticFrame) {
            if (pointer.x > -180 && pointer.x < width + 180) {
              const dx = x - pointer.x;
              const dy = baseline - pointer.y;
              const distanceSquared = dx * dx + dy * dy;
              if (distanceSquared < 180 * 180) {
                const distance = Math.sqrt(distanceSquared);
                y +=
                  Math.sin(distance * 0.052 - now * 0.009) *
                  (1 - distance / 180) *
                  9 *
                  boundedIntensity;
              }
            }
            for (const ripple of ripples) {
              const radius = Math.hypot(x - ripple.x, baseline - ripple.y);
              const age = now - ripple.born;
              const wave = Math.abs(radius - age * 0.2);
              if (wave < 50)
                y +=
                  Math.sin((radius - age * 0.2) * 0.09) *
                  (1 - wave / 50) *
                  (1 - age / 1400) *
                  12 *
                  boundedIntensity;
            }
          }
          if (x === -step) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }
      frameCount += 1;
      canvas.dataset["frameCount"] = String(frameCount);
    };

    const animate = (now: number) => {
      if (disposed || motion.matches || document.hidden || !visible) return;
      const interval = mobile.matches ? 1000 / 30 : 1000 / 60;
      if (now - lastDraw >= interval - 1) {
        ripples.splice(0, ripples.length, ...ripples.filter((ripple) => now - ripple.born < 1400));
        draw(now);
        lastDraw = now;
      }
      frame = requestAnimationFrame(animate);
    };

    const update = () => {
      cancelAnimationFrame(frame);
      canvas.dataset["active"] = String(!motion.matches && !document.hidden && visible);
      if (motion.matches) draw(performance.now(), true);
      else if (!document.hidden && visible) {
        lastDraw = 0;
        frame = requestAnimationFrame(animate);
      }
    };

    const onPointer = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      if (event.pointerType !== "touch" || event.type !== "pointerdown") return;
      if (performance.now() - lastRipple < 100) return;
      lastRipple = performance.now();
      ripples.push({ ...pointer, born: lastRipple });
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      update();
    });
    observer.observe(canvas);
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    document.addEventListener("visibilitychange", update, { passive: true });
    motion.addEventListener("change", update);
    dark.addEventListener("change", update);
    resize();
    update();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("visibilitychange", update);
      motion.removeEventListener("change", update);
      dark.removeEventListener("change", update);
    };
  }, [intensity, colorScheme, off]);

  if (off) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="interactive-background"
      data-frame-count="0"
      data-active="false"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

export default InteractiveBackground;
