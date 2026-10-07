import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-display text-lg font-semibold tracking-tight", className)}>
      <span className="grid size-8 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--mint))] text-white shadow-soft">
        <BrandMark className="size-5" />
      </span>
      Masterkey
    </Link>
  );
}
