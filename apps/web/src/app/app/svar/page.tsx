"use client";

import { savedAnswerSchema, SUGGESTED_ANSWER_TAGS, type SavedAnswer } from "@soknadsprofil/shared";
import { Copy, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LoadingBlock, PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useProfile } from "@/lib/profile-store";
import { cn } from "@/lib/utils";

const TEMPLATES: Pick<SavedAnswer, "question" | "tags">[] = [
  { question: "Hva er ditt lønnskrav?", tags: ["lønnskrav"] },
  { question: "Når kan du begynne?", tags: ["oppstart"] },
  { question: "Hvorfor søker du på denne stillingen?", tags: ["motivasjon"] },
  { question: "Hva er dine største styrker?", tags: ["styrker"] },
];

function AnswerEditor({ initial, onDone }: { initial: Partial<SavedAnswer>; onDone: () => void }) {
  const { saveRow } = useProfile();
  const [question, setQuestion] = useState(initial.question ?? "");
  const [answer, setAnswer] = useState(initial.answer ?? "");
  const [tags, setTags] = useState<string[]>(initial.tags ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const row = { ...(initial.id ? { id: initial.id } : {}), question, answer, tags };
    const parsed = savedAnswerSchema.safeParse(row);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    if (await saveRow("saved_answers", parsed.data)) onDone();
  }

  const toggle = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  return (
    <Card className="border-primary/40 p-5 ring-4 ring-primary/10">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Spørsmål" htmlFor="q" error={errors.question}>
          <Input id="q" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="F.eks. Hvorfor vil du jobbe hos oss?" />
        </Field>
        <Field label="Svar" htmlFor="a" error={errors.answer}>
          <Textarea id="a" value={answer} onChange={(e) => setAnswer(e.target.value)} rows={6} />
        </Field>
        <div>
          <div className="mb-2 text-sm font-medium">Tags</div>
          <p className="mb-2 text-xs text-muted-foreground">Tagene «lønnskrav», «oppstart» og «motivasjon» lar extensionen fylle ut slike felt automatisk.</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_ANSWER_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggle(t)}
                aria-pressed={tags.includes(t)}
                className={cn("rounded-full border px-3 py-1 text-xs transition", tags.includes(t) ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50")}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>
            Avbryt
          </Button>
          <Button type="submit">Lagre</Button>
        </div>
      </form>
    </Card>
  );
}

export default function SvarPage() {
  const { profile, loading, deleteRow } = useProfile();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<SavedAnswer> | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profile.saved_answers.filter(
      (a) => (!tag || a.tags.includes(tag)) && (!q || a.question.toLowerCase().includes(q) || a.answer.toLowerCase().includes(q)),
    );
  }, [profile.saved_answers, query, tag]);

  if (loading) return <LoadingBlock />;
  const usedTags = [...new Set(profile.saved_answers.flatMap((a) => a.tags))];
  const missingTemplates = TEMPLATES.filter((t) => !profile.saved_answers.some((a) => a.tags.some((x) => t.tags.includes(x))));

  return (
    <div>
      <PageHeader title="Standardsvar" description="Skriv gode svar én gang, og gjenbruk dem i alle søknader.">
        {!editing && (
          <Button onClick={() => setEditing({})}>
            <Plus /> Nytt svar
          </Button>
        )}
      </PageHeader>

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6">
            <AnswerEditor key={editing.id ?? "new"} initial={editing} onDone={() => setEditing(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {!editing && missingTemplates.length > 0 && (
        <div className="mb-8">
          <div className="mb-2 text-sm text-muted-foreground">Forslag til vanlige spørsmål:</div>
          <div className="flex flex-wrap gap-2">
            {missingTemplates.map((t) => (
              <button
                key={t.question}
                type="button"
                onClick={() => setEditing(t)}
                className="flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-sm transition hover:border-primary hover:text-primary"
              >
                <Plus className="size-3.5" /> {t.question}
              </button>
            ))}
          </div>
        </div>
      )}

      {profile.saved_answers.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Søk i svar …" className="pl-9" aria-label="Søk i svar" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {usedTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag(tag === t ? null : t)}
                aria-pressed={tag === t}
                className={cn("rounded-full px-3 py-1 text-xs transition", tag === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-border")}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {filtered.map((a) => (
            <motion.li key={a.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="group p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium">{a.question}</h3>
                  <div className="flex shrink-0 gap-1 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Kopier svar"
                      onClick={async () => {
                        await navigator.clipboard.writeText(a.answer);
                        toast.success("Kopiert");
                      }}
                    >
                      <Copy />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Rediger" onClick={() => setEditing(a)}>
                      <Pencil />
                    </Button>
                    <Button variant="destructive" size="icon" aria-label="Slett" onClick={() => a.id && confirm("Slette svaret?") && deleteRow("saved_answers", a.id)}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{a.answer}</p>
                {a.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {a.tags.map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                  </div>
                )}
              </Card>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {profile.saved_answers.length > 0 && filtered.length === 0 && <p className="text-center text-sm text-muted-foreground">Ingen svar matcher søket.</p>}
    </div>
  );
}
