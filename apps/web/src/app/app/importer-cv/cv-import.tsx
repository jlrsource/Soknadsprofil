"use client";

import {
  buildCvProposal,
  countSelected,
  IMPORT_SECTIONS,
  LANGUAGE_LEVEL_LABELS,
  SKILL_LEVEL_LABELS,
  type CvExtraction,
  type CvProposal,
  type ImportRows,
  type ImportSection,
  type Personal,
} from "@soknadsprofil/shared";
import { ArrowRight, Check, FileText, Loader2, RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoadingBlock, PageHeader } from "@/components/app/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { useProfile } from "@/lib/profile-store";
import { cn, formatPeriod } from "@/lib/utils";

const SECTION_TITLES: Record<ImportSection, string> = {
  experiences: "Arbeidserfaring",
  volunteering: "Verv og frivillig arbeid",
  educations: "Utdanning",
  certifications: "Kurs og sertifiseringer",
  skills: "Ferdigheter",
  languages: "Språk",
};

/** Tittel og undertekst for en foreslått rad. */
function describe<S extends ImportSection>(section: S, row: ImportRows[S]): { title: string; sub?: string } {
  const r = row as never as Record<string, unknown>;
  const s = (k: string) => (typeof r[k] === "string" ? (r[k] as string) : undefined);
  const join = (...xs: (string | undefined)[]) => xs.filter(Boolean).join(" · ") || undefined;
  const period = formatPeriod(s("start_date"), s("end_date"), Boolean(r.is_current)) || undefined;
  switch (section) {
    case "experiences": return { title: `${s("title")} – ${s("employer")}`, sub: join(s("location"), period) };
    case "volunteering": return { title: `${s("role")} – ${s("organization")}`, sub: join(s("location"), period) };
    case "educations": return { title: s("school") ?? "", sub: join(s("degree"), s("field_of_study"), period) };
    case "certifications": return { title: s("name") ?? "", sub: join(s("issuer")) };
    case "skills": return { title: s("name") ?? "", sub: r.level ? SKILL_LEVEL_LABELS[r.level as keyof typeof SKILL_LEVEL_LABELS] : undefined };
    case "languages": {
      const lvl = (k: string) => (r[k] ? LANGUAGE_LEVEL_LABELS[r[k] as keyof typeof LANGUAGE_LEVEL_LABELS] : undefined);
      return { title: s("language") ?? "", sub: join(lvl("spoken_level") && `Muntlig: ${lvl("spoken_level")}`, lvl("written_level") && `Skriftlig: ${lvl("written_level")}`) };
    }
  }
  return { title: "" };
}

const READING_STEPS = ["Leser CV-en …", "Finner arbeidserfaring og utdanning …", "Plukker ut ferdigheter og språk …", "Rydder og sammenligner med profilen din …"];

type Phase = { name: "reading" } | { name: "error"; message: string } | { name: "review"; proposal: CvProposal; remaining: number | null } | { name: "saving"; done: number; total: number } | { name: "done"; count: number };

export function CvImport() {
  const params = useSearchParams();
  const docId = params.get("doc");
  const { profile, loading, updatePersonal, saveRow } = useProfile();
  const [phase, setPhase] = useState<Phase>({ name: "reading" });
  const [step, setStep] = useState(0);
  const started = useRef(false);

  const doc = profile.documents.find((d) => d.id === docId);

  const run = useCallback(async () => {
    if (!docId) return;
    setPhase({ name: "reading" });
    setStep(0);
    try {
      const res = await fetch("/api/cv/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentId: docId }) });
      const body = (await res.json()) as { extraction?: CvExtraction; remaining?: number | null; error?: string };
      if (!res.ok || !body.extraction) throw new Error(body.error ?? "Ukjent feil");
      setPhase({ name: "review", proposal: buildCvProposal(body.extraction, profile), remaining: body.remaining ?? null });
    } catch (e) {
      setPhase({ name: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }, [docId, profile]);

  // Start lesingen én gang når profilen er lastet (trengs for å finne duplikater).
  useEffect(() => {
    if (loading || started.current || !docId) return;
    started.current = true;
    void run();
  }, [loading, docId, run]);

  useEffect(() => {
    if (phase.name !== "reading") return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, READING_STEPS.length - 1)), 4500);
    return () => clearInterval(t);
  }, [phase.name]);

  if (loading) return <LoadingBlock />;

  if (!docId || !doc) {
    const cvs = profile.documents.filter((d) => d.type === "cv");
    return (
      <div>
        <PageHeader title="Fyll ut fra CV" description="Velg CV-en du vil hente opplysninger fra." />
        {cvs.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Du har ikke lastet opp noen CV ennå.</p>
            <Link href="/app/dokumenter" className={cn(buttonVariants(), "mt-4")}>
              Last opp CV
            </Link>
          </Card>
        ) : (
          <ul className="space-y-2">
            {cvs.map((d) => (
              <li key={d.id}>
                <a href={`/app/importer-cv?doc=${d.id}`}>
                  <Card className="flex items-center gap-3 p-4 transition hover:border-primary/40">
                    <FileText className="size-5 text-primary" />
                    <span className="flex-1 font-medium">{d.file_name}</span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Card>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (phase.name === "reading") {
    return (
      <Card className="relative mx-auto max-w-lg overflow-hidden p-10 text-center">
        <div className="pointer-events-none absolute inset-0 bg-aurora opacity-70" aria-hidden />
        <div className="relative">
          <motion.div
            className="mx-auto grid size-16 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--primary),var(--mint))] text-white"
            animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          >
            <Sparkles className="size-7" />
          </motion.div>
          <h1 className="mt-5 font-display text-2xl font-semibold">Leser {doc.file_name}</h1>
          <div className="mt-2 h-6" role="status" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.p key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-sm text-muted-foreground">
                {READING_STEPS[step]}
              </motion.p>
            </AnimatePresence>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Dette tar vanligvis under ett minutt. Du får se alt før noe lagres.</p>
        </div>
      </Card>
    );
  }

  if (phase.name === "error") {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <TriangleAlert className="mx-auto size-8 text-destructive" />
        <h1 className="mt-4 font-display text-xl font-semibold">Kunne ikke lese CV-en</h1>
        <p className="mt-2 text-sm text-muted-foreground">{phase.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/app/dokumenter" className={buttonVariants({ variant: "ghost" })}>
            Til dokumenter
          </Link>
          <Button onClick={run}>
            <RefreshCw /> Prøv igjen
          </Button>
        </div>
      </Card>
    );
  }

  if (phase.name === "saving") {
    return (
      <Card className="mx-auto max-w-lg p-10 text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-primary" />
        <p className="mt-4 font-medium">
          Lagrer {phase.done} av {phase.total} …
        </p>
      </Card>
    );
  }

  if (phase.name === "done") {
    return (
      <Card className="mx-auto max-w-lg p-10 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
          className="mx-auto grid size-16 place-items-center rounded-2xl bg-success/15 text-success"
        >
          <Check className="size-8" strokeWidth={3} />
        </motion.div>
        <h1 className="mt-5 font-display text-2xl font-semibold">{phase.count} opplysninger lagt til</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Se over profilen og fyll på det som mangler. AI-en kan ha misforstått noe.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link href="/app/erfaring" className={buttonVariants({ variant: "outline" })}>
            Se erfaring
          </Link>
          <Link href="/app" className={buttonVariants()}>
            Til oversikten <ArrowRight />
          </Link>
        </div>
      </Card>
    );
  }

  const remaining = phase.remaining;
  return <Review proposal={phase.proposal} remaining={remaining} onChange={(proposal) => setPhase({ name: "review", proposal, remaining })} onImport={importSelected} fileName={doc.file_name} />;

  async function importSelected(proposal: CvProposal) {
    const personalPatch = Object.fromEntries(proposal.personal.filter((s) => s.selected).map((s) => [s.key, s.proposed])) as Partial<Personal>;
    const rows = IMPORT_SECTIONS.flatMap((section) => proposal.lists[section].filter((r) => r.selected).map((r) => ({ section, row: r.row })));
    const total = rows.length + (Object.keys(personalPatch).length ? 1 : 0);
    let done = 0;
    setPhase({ name: "saving", done, total });
    if (Object.keys(personalPatch).length) {
      await updatePersonal(personalPatch);
      setPhase({ name: "saving", done: ++done, total });
    }
    // Én og én, så rekkefølgen (sort_order) blir den samme som i CV-en.
    for (const { section, row } of rows) {
      await saveRow(section, row as never);
      setPhase({ name: "saving", done: ++done, total });
    }
    setPhase({ name: "done", count: countSelected(proposal) });
  }
}

function Review({ proposal, remaining, onChange, onImport, fileName }: { proposal: CvProposal; remaining: number | null; onChange: (p: CvProposal) => void; onImport: (p: CvProposal) => void; fileName: string }) {
  const selected = countSelected(proposal);
  const empty = proposal.personal.length === 0 && IMPORT_SECTIONS.every((s) => proposal.lists[s].length === 0);

  const togglePersonal = (i: number) =>
    onChange({ ...proposal, personal: proposal.personal.map((s, j) => (j === i ? { ...s, selected: !s.selected } : s)) });
  const toggleRow = (section: ImportSection, i: number) =>
    onChange({ ...proposal, lists: { ...proposal.lists, [section]: proposal.lists[section].map((r, j) => (j === i ? { ...r, selected: !r.selected } : r)) } });
  const setSection = (section: ImportSection, value: boolean) =>
    onChange({ ...proposal, lists: { ...proposal.lists, [section]: proposal.lists[section].map((r) => ({ ...r, selected: value })) } });

  if (empty) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <Check className="mx-auto size-8 text-success" />
        <h1 className="mt-4 font-display text-xl font-semibold">Ingenting nytt å legge til</h1>
        <p className="mt-2 text-sm text-muted-foreground">Alt vi fant i {fileName} ligger allerede i profilen din.</p>
        <Link href="/app" className={cn(buttonVariants(), "mt-6")}>
          Til oversikten
        </Link>
      </Card>
    );
  }

  return (
    <div className="pb-28">
      <PageHeader title="Se over forslagene" description={`Dette fant vi i ${fileName}. Velg hva som skal legges inn i profilen.`}>
        {remaining !== null && (
          <Badge tone={remaining === 0 ? "warning" : "default"}>
            {remaining === 0 ? "Ingen CV-importer igjen i dag" : `${remaining} CV-import${remaining === 1 ? "" : "er"} igjen i dag`}
          </Badge>
        )}
      </PageHeader>

      <div className="space-y-8">
        {proposal.personal.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Personalia</h2>
            <Card className="divide-y">
              {proposal.personal.map((s, i) => (
                <label key={s.key} className="flex cursor-pointer items-start gap-3 p-4 hover:bg-muted/50">
                  <input type="checkbox" checked={s.selected} onChange={() => togglePersonal(i)} className="mt-1 size-4 accent-[var(--primary)]" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <div className={cn("break-words", s.key === "summary" && "line-clamp-3 text-sm")}>{s.proposed}</div>
                    {s.current && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Erstatter: <span className={cn(s.selected && "line-through")}>{s.current}</span>
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </Card>
          </section>
        )}

        {IMPORT_SECTIONS.map((section) => {
          const items = proposal.lists[section];
          if (items.length === 0) return null;
          const allSelected = items.every((r) => r.selected);
          return (
            <section key={section}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">{SECTION_TITLES[section]}</h2>
                <button type="button" onClick={() => setSection(section, !allSelected)} className="text-xs text-muted-foreground hover:text-primary">
                  {allSelected ? "Fjern alle" : "Velg alle"}
                </button>
              </div>
              <Card className="divide-y">
                {items.map((r, i) => {
                  const d = describe(section, r.row);
                  return (
                    <label key={i} className="flex cursor-pointer items-start gap-3 p-4 hover:bg-muted/50">
                      <input type="checkbox" checked={r.selected} onChange={() => toggleRow(section, i)} className="mt-1 size-4 accent-[var(--primary)]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{d.title}</span>
                          {r.duplicate && <Badge>Finnes allerede</Badge>}
                        </div>
                        {d.sub && <div className="text-sm text-muted-foreground">{d.sub}</div>}
                      </div>
                    </label>
                  );
                })}
              </Card>
            </section>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/85 backdrop-blur lg:left-72">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <span className="text-sm text-muted-foreground">{selected} valgt</span>
          <Button variant="gradient" size="lg" disabled={selected === 0} onClick={() => onImport(proposal)}>
            Legg til i profilen <ArrowRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
