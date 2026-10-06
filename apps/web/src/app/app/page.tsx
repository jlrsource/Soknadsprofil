"use client";

import { computeCompleteness } from "@soknadsprofil/shared";
import { ArrowRight, Briefcase, Check, FileText, GraduationCap, MessageSquareText, Puzzle, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { LoadingBlock } from "@/components/app/page-header";
import { SECTION_HREF } from "@/components/app/nav";
import { ProgressRing } from "@/components/app/progress-ring";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { useProfile } from "@/lib/profile-store";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 10 ? "God morgen" : h < 17 ? "Hei" : "God kveld";
}

export default function DashboardPage() {
  const { profile, loading } = useProfile();
  if (loading) return <LoadingBlock />;

  const { score, items, next } = computeCompleteness(profile);
  const name = profile.personal?.first_name;
  const isNew = !name && profile.experiences.length === 0 && profile.documents.length === 0;

  const stats = [
    { label: "Jobber", value: profile.experiences.length, icon: Briefcase, href: SECTION_HREF.experience },
    { label: "Utdanninger", value: profile.educations.length, icon: GraduationCap, href: SECTION_HREF.education },
    { label: "Ferdigheter", value: profile.skills.length, icon: Sparkles, href: SECTION_HREF.skills },
    { label: "Dokumenter", value: profile.documents.length, icon: FileText, href: SECTION_HREF.documents },
    { label: "Standardsvar", value: profile.saved_answers.length, icon: MessageSquareText, href: SECTION_HREF.answers },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {greeting()}
          {name ? `, ${name}` : ""} 👋
        </h1>
        <p className="mt-2 text-muted-foreground">
          {score === 100
            ? "Profilen din er komplett. Nå er det bare å søke!"
            : "Jo mer komplett profilen er, jo mer kan extensionen fylle ut for deg."}
        </p>
      </motion.div>

      {isNew && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="relative overflow-hidden p-7">
            <div className="pointer-events-none absolute inset-0 bg-aurora" aria-hidden />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-display text-xl font-semibold">Kom i gang på to minutter</div>
                <p className="mt-1 text-sm text-muted-foreground">Tre raske steg: deg selv, siste jobb og CV.</p>
              </div>
              <Link href="/app/kom-i-gang" className={buttonVariants({ variant: "gradient", size: "lg" })}>
                Start <ArrowRight />
              </Link>
            </div>
          </Card>
        </motion.div>
      )}

      <Card className="grid gap-8 p-6 sm:grid-cols-[auto_1fr] sm:p-8">
        <div className="flex justify-center">
          <ProgressRing value={score} />
        </div>
        <div className="min-w-0">
          {next ? (
            <div className="rounded-2xl bg-primary/8 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-primary">Neste steg</div>
              <div className="mt-1 font-display text-lg font-semibold">{next.label}</div>
              <Link href={SECTION_HREF[next.section]} className={cn(buttonVariants({ size: "sm" }), "mt-3")}>
                Gjør det nå <ArrowRight />
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl bg-success/10 p-4 font-medium text-success">Alt er på plass 🎉</div>
          )}
          <ul className="mt-5 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {items.map((item, i) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i }}
              >
                <Link href={SECTION_HREF[item.section]} className="group flex items-center gap-2 text-sm">
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full border transition",
                      item.done ? "border-success bg-success text-white" : "group-hover:border-primary",
                    )}
                  >
                    {item.done && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className={cn(item.done ? "text-muted-foreground line-through" : "group-hover:text-primary")}>{item.label}</span>
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, href }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + 0.05 * i }}>
            <Link href={href}>
              <Card className="p-4 transition hover:-translate-y-0.5 hover:border-primary/40">
                <Icon className="size-4 text-primary" />
                <div className="mt-3 font-display text-2xl font-semibold tabular-nums">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 overflow-hidden p-6 bg-[linear-gradient(120deg,color-mix(in_oklch,var(--primary)_14%,var(--card)),var(--card)_60%)]">
        <div className="flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Puzzle className="size-5" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">Fyll ut søknader med ett klikk</div>
            <p className="text-sm text-muted-foreground">Koble til Chrome-extensionen for å bruke profilen på alle søknadssider.</p>
          </div>
        </div>
        <Link href="/app/extension" className={buttonVariants({ variant: "outline" })}>
          Koble til <ArrowRight />
        </Link>
      </Card>
    </div>
  );
}
