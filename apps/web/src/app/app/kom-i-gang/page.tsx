"use client";

import { ArrowLeft, ArrowRight, Check, FileText, PartyPopper, UploadCloud } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { LoadingBlock } from "@/components/app/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { useProfile } from "@/lib/profile-store";
import { cn } from "@/lib/utils";

const STEPS = ["Om deg", "Siste jobb", "CV", "Ferdig"];

export default function OnboardingPage() {
  const { profile, loading, updatePersonal, saveRow, uploadDocument } = useProfile();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<string | null>(null);

  if (loading) return <LoadingBlock />;
  const p = profile.personal ?? {};
  const current = profile.experiences[0];

  async function submitPersonal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const patch = Object.fromEntries(["first_name", "last_name", "email", "phone", "city"].map((k) => [k, String(fd.get(k) ?? "")]));
    if (!patch.first_name || !patch.last_name) {
      setError("Fyll inn fornavn og etternavn");
      return;
    }
    setError(null);
    setBusy(true);
    await updatePersonal(patch);
    setBusy(false);
    setStep(1);
  }

  async function submitJob(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const employer = String(fd.get("employer") ?? "").trim();
    if (title && employer) {
      setBusy(true);
      await saveRow("experiences", { title, employer, is_current: fd.get("is_current") === "on", sort_order: 0 });
      setBusy(false);
    }
    setStep(2);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    await uploadDocument(file, "cv");
    setUploaded(file.name);
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-xl">
      <ol className="mb-10 flex items-center gap-2" aria-label="Fremdrift">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition",
                i < step ? "bg-success text-white" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
              aria-current={i === step ? "step" : undefined}
            >
              {i < step ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn("hidden text-sm sm:inline", i === step ? "font-medium" : "text-muted-foreground")}>{label}</span>
            {i < STEPS.length - 1 && <span className={cn("h-px flex-1", i < step ? "bg-success" : "bg-border")} />}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
          {step === 0 && (
            <Card className="p-7">
              <h1 className="font-display text-2xl font-semibold">La oss starte med deg 👋</h1>
              <p className="mt-1 text-sm text-muted-foreground">Dette spør nesten alle søknader om.</p>
              <form onSubmit={submitPersonal} className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Fornavn" htmlFor="o-fn">
                  <Input id="o-fn" name="first_name" defaultValue={p.first_name ?? ""} autoComplete="given-name" autoFocus />
                </Field>
                <Field label="Etternavn" htmlFor="o-ln">
                  <Input id="o-ln" name="last_name" defaultValue={p.last_name ?? ""} autoComplete="family-name" />
                </Field>
                <Field label="E-post" htmlFor="o-em">
                  <Input id="o-em" name="email" type="email" defaultValue={p.email ?? ""} autoComplete="email" />
                </Field>
                <Field label="Telefon" htmlFor="o-ph">
                  <Input id="o-ph" name="phone" type="tel" defaultValue={p.phone ?? ""} autoComplete="tel" />
                </Field>
                <Field label="Hvor bor du?" htmlFor="o-ci" className="sm:col-span-2">
                  <Input id="o-ci" name="city" defaultValue={p.city ?? ""} placeholder="F.eks. Bergen" autoComplete="address-level2" />
                </Field>
                {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
                <div className="flex justify-end sm:col-span-2">
                  <Button type="submit" disabled={busy}>
                    Neste <ArrowRight />
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {step === 1 && (
            <Card className="p-7">
              <h1 className="font-display text-2xl font-semibold">Hva jobber du med nå?</h1>
              <p className="mt-1 text-sm text-muted-foreground">Eller hva var siste jobb? Du kan legge til flere senere.</p>
              <form onSubmit={submitJob} className="mt-6 grid gap-4">
                <Field label="Stillingstittel" htmlFor="o-ti">
                  <Input id="o-ti" name="title" defaultValue={current?.title ?? ""} placeholder="F.eks. Kundekonsulent" autoFocus />
                </Field>
                <Field label="Arbeidsgiver" htmlFor="o-em2">
                  <Input id="o-em2" name="employer" defaultValue={current?.employer ?? ""} />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_current" defaultChecked className="size-4 accent-[var(--primary)]" /> Jeg jobber her nå
                </label>
                <div className="flex justify-between">
                  <Button type="button" variant="ghost" onClick={() => setStep(0)}>
                    <ArrowLeft /> Tilbake
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                      Hopp over
                    </Button>
                    <Button type="submit" disabled={busy}>
                      Neste <ArrowRight />
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          )}

          {step === 2 && (
            <Card className="p-7">
              <h1 className="font-display text-2xl font-semibold">Last opp CV-en din</h1>
              <p className="mt-1 text-sm text-muted-foreground">Extensionen legger den ved automatisk når et skjema ber om CV.</p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-6 flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 transition hover:border-primary/60 hover:bg-primary/5"
              >
                {uploaded ? <FileText className="size-8 text-success" /> : <UploadCloud className="size-8 text-primary" />}
                <span className="font-medium">{busy ? "Laster opp …" : uploaded ?? "Velg fil"}</span>
                <span className="text-xs text-muted-foreground">PDF eller Word, maks 10 MB</span>
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.odt" hidden onChange={(e) => onFile(e.target.files?.[0])} />
              <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft /> Tilbake
                </Button>
                <Button onClick={() => setStep(3)} variant={uploaded ? "primary" : "ghost"} disabled={busy}>
                  {uploaded ? "Neste" : "Hopp over"} <ArrowRight />
                </Button>
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card className="p-10 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 14 }}
                className="mx-auto grid size-16 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--primary),var(--mint))] text-white"
              >
                <PartyPopper className="size-8" />
              </motion.div>
              <h1 className="mt-5 font-display text-2xl font-semibold">Godt i gang!</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Grunnmuren er på plass. Fyll gjerne på med utdanning, ferdigheter og standardsvar. Da kan extensionen gjøre enda mer.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-2">
                <Link href="/app" className={buttonVariants({ variant: "outline" })}>
                  Til oversikten
                </Link>
                <Link href="/app/extension" className={buttonVariants({ variant: "gradient" })}>
                  Koble til extensionen <ArrowRight />
                </Link>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
