import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "2021-03-01" → "mar. 2021" */
export function formatMonth(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("nb-NO", { month: "short", year: "numeric" });
}

export function formatPeriod(start?: string | null, end?: string | null, current?: boolean): string {
  const s = formatMonth(start);
  const e = current ? "nå" : formatMonth(end);
  return [s, e].filter(Boolean).join(" – ");
}

export function formatBytes(n: number | null | undefined): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} kB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
