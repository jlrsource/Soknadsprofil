import {
  classifyField,
  FIELD_LABELS,
  formatDateForInput,
  HIGH_CONFIDENCE,
  resolveValue,
  type Classification,
  type FieldKey,
} from "@soknadsprofil/shared";
import type { EngineApi, FieldReport, FilePayload, FillPayload, FrameReport } from "../types";
import { findAdapter } from "./adapters";
import {
  clearHighlights,
  describeField,
  hasValue,
  highlight,
  scanFields,
  setContentEditable,
  setFileValue,
  setSelectValue,
  setTextValue,
  type FillableElement,
} from "./dom";

interface Match {
  el: FillableElement;
  result: Classification;
}

/** Klassifiser alle felt i dokumentet. Adapter-regler går foran den generiske klassifisereren. */
export function classifyDocument(
  doc: Document = document,
  hostname = doc.location?.hostname ?? "",
): { matches: Match[]; adapter: string | null } {
  const adapter = findAdapter(hostname);
  const overrides = new Map<Element, FieldKey>();
  for (const rule of adapter?.fields ?? []) {
    doc.querySelectorAll(rule.selector).forEach((el) => {
      // Workday legger data-automation-id på en wrapper. Finn selve feltet inni.
      const field = el.matches("input, textarea, select") ? el : el.querySelector("input, textarea, select");
      if (field) overrides.set(field, rule.key);
    });
  }

  const matches: Match[] = [];
  for (const el of scanFields(doc)) {
    const override = overrides.get(el);
    const result = override ? { key: override, confidence: 1 } : classifyField(describeField(el));
    if (result) matches.push({ el, result });
  }
  return { matches, adapter: adapter?.name ?? null };
}

function base64ToFile(f: FilePayload): File {
  const bin = atob(f.base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], f.name, { type: f.mime });
}

/** Ett felt per type for de fleste nøkler. Unntaket er e-post, der «bekreft e-post» også skal fylles. */
const MULTI_ALLOWED: FieldKey[] = ["email"];

export async function fillDocument(payload: FillPayload, doc: Document = document): Promise<FrameReport> {
  const { matches, adapter } = classifyDocument(doc);
  const used = new Set<FieldKey>();
  const fields: FieldReport[] = [];

  // Sikreste treff først, så de vinner hvis flere felt matcher samme nøkkel.
  matches.sort((a, b) => b.result.confidence - a.result.confidence);

  for (const { el, result } of matches) {
    const { key, confidence } = result;
    const report: FieldReport = { key, label: FIELD_LABELS[key], confidence, status: "no-value" };
    fields.push(report);

    if (used.has(key) && !MULTI_ALLOWED.includes(key)) {
      report.status = "skipped-has-value";
      continue;
    }
    if (!payload.overwrite && hasValue(el)) {
      report.status = "skipped-has-value";
      continue;
    }
    const value = resolveValue(key, payload.profile);
    if (!value) continue;

    let ok = false;
    try {
      if (value.kind === "file") {
        const file = payload.files[key as keyof FillPayload["files"]];
        if (el instanceof HTMLInputElement && el.type === "file" && file) ok = setFileValue(el, base64ToFile(file));
      } else if (el instanceof HTMLSelectElement) {
        ok = setSelectValue(el, value.value);
      } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const text = key === "birthDate" ? formatDateForInput(value.value, (el as HTMLInputElement).type) : value.value;
        setTextValue(el, text);
        ok = true;
      } else {
        setContentEditable(el, value.value);
        ok = true;
      }
    } catch (e) {
      console.warn("[SøknadsProfil] kunne ikke fylle felt", key, e);
    }

    if (!ok) {
      report.status = "failed";
      continue;
    }
    used.add(key);
    const sure = confidence >= HIGH_CONFIDENCE;
    report.status = sure ? "filled" : "uncertain";
    highlight(el, sure ? "filled" : "uncertain", sure ? `SøknadsProfil: ${FIELD_LABELS[key]}` : `SøknadsProfil: ${FIELD_LABELS[key]}? Sjekk at dette stemmer.`);
  }

  return { url: doc.location?.href ?? "", adapter, detected: matches.length, fields };
}

export function createEngine(doc: Document = document): EngineApi {
  return {
    analyze() {
      const { matches, adapter } = classifyDocument(doc);
      return { keys: [...new Set(matches.map((m) => m.result.key))], adapter };
    },
    fill: (payload) => fillDocument(payload, doc),
    clear: () => clearHighlights(doc),
  };
}
