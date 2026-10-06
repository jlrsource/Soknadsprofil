"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useId } from "react";

export function ProgressRing({ value, size = 160, stroke = 12, label = true }: { value: number; size?: number; stroke?: number; label?: boolean }) {
  const id = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = useMotionValue(0);
  const offset = useTransform(progress, (v) => c - (v / 100) * c);
  const text = useTransform(progress, (v) => `${Math.round(v)}`);

  useEffect(() => {
    const controls = animate(progress, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [progress, value]);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--mint)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      {label && (
        <div className="absolute inset-0 grid place-items-center text-center" role="img" aria-label={`Profilstyrke ${value} prosent`}>
          <div>
            <div className="font-display text-4xl font-semibold tabular-nums leading-none">
              <motion.span>{text}</motion.span>
              <span className="text-lg text-muted-foreground">%</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">profilstyrke</div>
          </div>
        </div>
      )}
    </div>
  );
}
