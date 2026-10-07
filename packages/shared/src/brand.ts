/**
 * Masterkey-merket: et søknadsbrev (ark med brettet hjørne og tekstlinjer) med en nøkkel over.
 * Tegnes med strek i en 24×24-viewBox. Arket maskeres rundt nøkkelen så den står fritt.
 */
export const BRAND_MARK = {
  viewBox: "0 0 24 24",
  strokeWidth: 1.8,
  sheet: [
    "M6 3h6.5L15.5 6v11.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 6 3z",
    "M12.5 3v3h3",
    "M7.5 9.5h5",
    "M7.5 12.5h3.5",
  ],
  key: {
    bow: { cx: 17, cy: 15, r: 3 },
    paths: ["M14.9 17.1 10.4 21.6", "M12.3 19.7l1.2 1.2", "M10.9 21.1l0.9 0.9"],
  },
  /** Hvor bredt arket kuttes rundt nøkkelen. */
  cutWidth: 5,
} as const;

/** Merket som en frittstående SVG-streng (brukes til favicon og extension-ikoner). */
export function brandMarkSvg({ size = 24, color = "#fff", tile }: { size?: number; color?: string; tile?: [string, string] } = {}): string {
  const m = BRAND_MARK;
  const keyShapes = (stroke: string, width: number) =>
    `<circle cx="${m.key.bow.cx}" cy="${m.key.bow.cy}" r="${m.key.bow.r}" stroke="${stroke}" stroke-width="${width}" fill="none"/>` +
    m.key.paths.map((d) => `<path d="${d}" stroke="${stroke}" stroke-width="${width}"/>`).join("");
  const tileSvg = tile
    ? `<defs><linearGradient id="mk-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tile[0]}"/><stop offset="1" stop-color="${tile[1]}"/></linearGradient></defs>` +
      `<rect width="24" height="24" rx="6.2" fill="url(#mk-g)"/>`
    : "";
  // Tegnet litt mindre inni flisen så det får luft rundt seg.
  const inner = tile ? `transform="translate(2.4 2.4) scale(0.8)"` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${m.viewBox}" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    tileSvg +
    `<mask id="mk-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff"/><g fill="none" stroke-linecap="round">${keyShapes("#000", m.cutWidth)}</g></mask>` +
    `<g ${inner}><g mask="url(#mk-cut)">${m.sheet.map((d) => `<path d="${d}" stroke="${color}" stroke-width="${m.strokeWidth}"/>`).join("")}</g>` +
    `${keyShapes(color, m.strokeWidth)}</g></svg>`
  );
}
