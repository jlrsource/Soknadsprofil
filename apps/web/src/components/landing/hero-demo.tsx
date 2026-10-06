"use client";

import { Check, MousePointerClick } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const FIELDS = [
  { label: "Fornavn", value: "Kari" },
  { label: "Etternavn", value: "Nordmann" },
  { label: "E-post", value: "kari@nordmann.no" },
  { label: "Telefon", value: "+47 912 34 567" },
  { label: "Nåværende stilling", value: "UX-designer, Fjord AS" },
  { label: "CV", value: "Kari_Nordmann_CV.pdf", file: true },
];

/** Viser et søknadsskjema som fylles ut av seg selv, i en løkke. */
export function HeroDemo() {
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    const delay = filled === 0 ? 1400 : filled > FIELDS.length ? 2600 : 260;
    const t = setTimeout(() => setFilled((n) => (n > FIELDS.length ? 0 : n + 1)), delay);
    return () => clearTimeout(t);
  }, [filled]);

  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <div className="absolute -inset-6 rounded-[2.5rem] bg-[linear-gradient(135deg,var(--primary),var(--mint))] opacity-25 blur-3xl" />
      <div className="relative rounded-3xl border bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">jobs.eksempel.no</div>
            <div className="font-display font-semibold">Søk på: Produktdesigner</div>
          </div>
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-destructive/60" />
            <span className="size-2.5 rounded-full bg-warning/70" />
            <span className="size-2.5 rounded-full bg-success/70" />
          </div>
        </div>
        <div className="space-y-3">
          {FIELDS.map((f, i) => {
            const done = i < filled;
            return (
              <div key={f.label}>
                <div className="mb-1 text-xs font-medium text-muted-foreground">{f.label}</div>
                <div
                  className={cn(
                    "flex h-9 items-center justify-between rounded-lg border px-3 text-sm transition-all duration-300",
                    done && "border-success/60 bg-success/8 ring-2 ring-success/15",
                  )}
                >
                  <AnimatePresence>
                    {done && (
                      <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className={cn(f.file && "text-primary")}>
                        {f.file ? `📎 ${f.value}` : f.value}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {done && <Check className="size-3.5 text-success" />}
                </div>
              </div>
            );
          })}
        </div>
        <motion.div
          className="absolute -right-4 -top-4 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg"
          animate={filled === 0 ? { scale: [1, 0.92, 1] } : { scale: 1 }}
          transition={{ duration: 0.4, delay: 1 }}
        >
          <MousePointerClick className="size-4" />
          {filled > FIELDS.length ? `${FIELDS.length} felt fylt ut` : "Fyll ut"}
        </motion.div>
      </div>
    </div>
  );
}
