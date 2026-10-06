"use client";

import {
  LANGUAGE_LEVEL_LABELS,
  LANGUAGE_LEVELS,
  languageSchema,
  referenceSchema,
  SKILL_LEVEL_LABELS,
  SKILL_LEVELS,
  type Skill,
} from "@soknadsprofil/shared";
import { Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ListSection } from "@/components/app/list-section";
import { LoadingBlock, PageHeader, SectionTitle } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { useProfile } from "@/lib/profile-store";
import { cn } from "@/lib/utils";

const s = (v: unknown) => (typeof v === "string" && v ? v : undefined);
const languageOptions = LANGUAGE_LEVELS.map((value) => ({ value, label: LANGUAGE_LEVEL_LABELS[value] }));
const levelDots: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

function Skills() {
  const { profile, saveRow, deleteRow } = useProfile();
  const [name, setName] = useState("");
  const [level, setLevel] = useState<Skill["level"] | "">("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (profile.skills.some((sk) => sk.name.toLowerCase() === trimmed.toLowerCase())) {
      setName("");
      return;
    }
    setName("");
    await saveRow("skills", { name: trimmed, level: level || null, sort_order: 0 });
  }

  async function cycleLevel(skill: Skill) {
    const i = skill.level ? SKILL_LEVELS.indexOf(skill.level) : -1;
    await saveRow("skills", { ...skill, level: SKILL_LEVELS[(i + 1) % SKILL_LEVELS.length] });
  }

  return (
    <section>
      <SectionTitle title="Ferdigheter" description="Klikk på prikkene for å endre nivå." />
      <Card className="p-5">
        <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. Excel, React, kundeservice …" aria-label="Ny ferdighet" />
          <Select value={level ?? ""} onChange={(e) => setLevel(e.target.value as Skill["level"])} className="sm:w-44" aria-label="Nivå">
            <option value="">Nivå (valgfritt)</option>
            {SKILL_LEVELS.map((l) => (
              <option key={l} value={l}>
                {SKILL_LEVEL_LABELS[l]}
              </option>
            ))}
          </Select>
          <Button type="submit" disabled={!name.trim()}>
            <Plus /> Legg til
          </Button>
        </form>
        <ul className="mt-4 flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {profile.skills.map((skill) => (
              <motion.li
                key={skill.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 rounded-full border bg-background py-1 pl-3 pr-1 text-sm"
              >
                {skill.name}
                <button
                  type="button"
                  onClick={() => cycleLevel(skill)}
                  className="flex gap-0.5 rounded-full px-1 py-1 hover:bg-muted"
                  title={skill.level ? SKILL_LEVEL_LABELS[skill.level] : "Sett nivå"}
                  aria-label={`Nivå for ${skill.name}: ${skill.level ? SKILL_LEVEL_LABELS[skill.level] : "ikke satt"}. Klikk for å endre.`}
                >
                  {[1, 2, 3, 4].map((d) => (
                    <span key={d} className={cn("size-1.5 rounded-full", d <= (levelDots[skill.level ?? ""] ?? 0) ? "bg-primary" : "bg-border")} />
                  ))}
                </button>
                <button
                  type="button"
                  onClick={() => skill.id && deleteRow("skills", skill.id)}
                  className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Fjern ${skill.name}`}
                >
                  <X className="size-3.5" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {profile.skills.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Ingen ferdigheter ennå.</p>}
      </Card>
    </section>
  );
}

export default function FerdigheterPage() {
  const { loading } = useProfile();
  if (loading) return <LoadingBlock />;

  return (
    <div>
      <PageHeader title="Ferdigheter og språk" description="Det som gjør deg til deg, pluss folk som kan gå god for deg." />
      <div className="space-y-12">
        <Skills />
        <ListSection
          table="languages"
          schema={languageSchema}
          heading="Språk"
          addLabel="Legg til språk"
          emptyText="Legg til språkene du snakker."
          sortable
          title={(r) => s(r.language) ?? ""}
          subtitle={(r) =>
            [
              r.spoken_level && `Muntlig: ${LANGUAGE_LEVEL_LABELS[r.spoken_level as keyof typeof LANGUAGE_LEVEL_LABELS]}`,
              r.written_level && `Skriftlig: ${LANGUAGE_LEVEL_LABELS[r.written_level as keyof typeof LANGUAGE_LEVEL_LABELS]}`,
            ]
              .filter(Boolean)
              .join(" · ")
          }
          fields={[
            { name: "language", label: "Språk", placeholder: "F.eks. Engelsk", wide: true },
            { name: "spoken_level", label: "Muntlig", type: "select", options: languageOptions },
            { name: "written_level", label: "Skriftlig", type: "select", options: languageOptions },
          ]}
        />
        <ListSection
          table="references"
          schema={referenceSchema}
          heading="Referanser"
          addLabel="Legg til referanse"
          emptyText="Legg til personer som kan gi deg en god attest."
          sortable
          title={(r) => s(r.name) ?? ""}
          subtitle={(r) => [s(r.role), s(r.company)].filter(Boolean).join(", ")}
          meta={(r) => s(r.phone) ?? s(r.email)}
          fields={[
            { name: "name", label: "Navn" },
            { name: "relation", label: "Relasjon", placeholder: "F.eks. Nærmeste leder" },
            { name: "role", label: "Stilling" },
            { name: "company", label: "Firma" },
            { name: "phone", label: "Telefon", type: "tel" },
            { name: "email", label: "E-post", type: "email" },
          ]}
        />
      </div>
    </div>
  );
}
