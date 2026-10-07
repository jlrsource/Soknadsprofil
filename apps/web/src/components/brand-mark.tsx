import { BRAND_MARK as M } from "@soknadsprofil/shared";

/** Masterkey-merket: søknadsbrev med en nøkkel over. Arvet farge (currentColor). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox={M.viewBox} className={className} fill="none" stroke="currentColor" strokeWidth={M.strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <mask id="mk-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="#fff" />
        <g stroke="#000" strokeWidth={M.cutWidth}>
          <circle {...M.key.bow} />
          {M.key.paths.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </mask>
      <g mask="url(#mk-cut)">
        {M.sheet.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <circle {...M.key.bow} />
      {M.key.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
