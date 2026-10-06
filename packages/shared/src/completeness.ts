import type { FullProfile } from "./schema";

export interface CompletenessItem {
  id: string;
  label: string;
  weight: number;
  done: boolean;
  /** Seksjonen i web-appen der brukeren kan fikse dette. */
  section: "personal" | "experience" | "education" | "skills" | "documents" | "answers";
}

export interface Completeness {
  score: number; // 0–100
  items: CompletenessItem[];
  next: CompletenessItem | undefined;
}

const has = (v: string | null | undefined) => typeof v === "string" && v.trim().length > 0;

export function computeCompleteness(p: FullProfile): Completeness {
  const pe = p.personal;
  const items: CompletenessItem[] = [
    { id: "name", label: "Legg inn fullt navn", weight: 10, section: "personal", done: has(pe?.first_name) && has(pe?.last_name) },
    { id: "contact", label: "Legg inn e-post og telefon", weight: 10, section: "personal", done: has(pe?.email) && has(pe?.phone) },
    { id: "address", label: "Legg inn adresse", weight: 5, section: "personal", done: has(pe?.address) && has(pe?.postal_code) && has(pe?.city) },
    { id: "summary", label: "Skriv et kort sammendrag om deg selv", weight: 10, section: "personal", done: has(pe?.summary) },
    { id: "linkedin", label: "Legg til LinkedIn-profil", weight: 5, section: "personal", done: has(pe?.linkedin_url) },
    { id: "experience", label: "Legg til arbeidserfaring", weight: 15, section: "experience", done: p.experiences.length > 0 },
    { id: "education", label: "Legg til utdanning", weight: 15, section: "education", done: p.educations.length > 0 },
    { id: "skills", label: "Legg til minst tre ferdigheter", weight: 5, section: "skills", done: p.skills.length >= 3 },
    { id: "languages", label: "Legg til språk", weight: 5, section: "skills", done: p.languages.length > 0 },
    { id: "references", label: "Legg til en referanse", weight: 5, section: "skills", done: p.references.length > 0 },
    { id: "cv", label: "Last opp CV", weight: 10, section: "documents", done: p.documents.some((d) => d.type === "cv") },
    { id: "answers", label: "Lagre minst to standardsvar", weight: 5, section: "answers", done: p.saved_answers.length >= 2 },
  ];
  const total = items.reduce((s, i) => s + i.weight, 0);
  const got = items.filter((i) => i.done).reduce((s, i) => s + i.weight, 0);
  const next = items.filter((i) => !i.done).sort((a, b) => b.weight - a.weight)[0];
  return { score: Math.round((got / total) * 100), items, next };
}
