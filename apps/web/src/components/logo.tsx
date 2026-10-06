import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-display text-lg font-semibold tracking-tight", className)}>
      <span className="grid size-8 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--mint))] text-white shadow-soft">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12l4 4L19 6" />
        </svg>
      </span>
      SøknadsProfil
    </Link>
  );
}
