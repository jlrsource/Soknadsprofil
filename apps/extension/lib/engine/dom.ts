import type { FieldDescriptor } from "@soknadsprofil/shared";

export type FillableElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement;

const SELECTOR = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]';
const MAX_TEXT = 160;

/** Finn alle skjemafelt, også inne i åpne shadow roots. */
export function scanFields(root: Document | ShadowRoot = document): FillableElement[] {
  const out: FillableElement[] = [];
  const visit = (node: Document | ShadowRoot | Element) => {
    node.querySelectorAll<FillableElement>(SELECTOR).forEach((el) => {
      if (isCandidate(el)) out.push(el);
    });
    node.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) visit(el.shadowRoot);
    });
  };
  visit(root);
  return out;
}

function isCandidate(el: FillableElement): boolean {
  if ((el as HTMLInputElement).disabled || (el as HTMLInputElement).readOnly) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  if (el instanceof HTMLInputElement && el.type === "file") return true; // filfelt er ofte skjult bak en egen knapp
  return isVisible(el);
}

function isVisible(el: Element): boolean {
  // jsdom har ingen layout; der regner vi alt som synlig.
  if (typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom")) return true;
  const style = getComputedStyle(el);
  if (style.visibility === "hidden" || style.display === "none") return false;
  return el.getClientRects().length > 0;
}

const clip = (s: string | null | undefined) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > MAX_TEXT ? "" : t; // lange tekster er sjelden en label
};

function textOfIds(ids: string | null, doc: Document | ShadowRoot): string {
  if (!ids) return "";
  return ids
    .split(/\s+/)
    .map((id) => doc.getElementById?.(id)?.textContent ?? (doc as Document).querySelector?.(`#${CSS.escape(id)}`)?.textContent ?? "")
    .join(" ");
}

function labelText(el: FillableElement): string {
  const labels = (el as HTMLInputElement).labels;
  if (labels && labels.length) return clip(Array.from(labels).map((l) => labelWithoutControls(l)).join(" "));
  const wrapping = el.closest("label");
  if (wrapping) return clip(labelWithoutControls(wrapping));
  return "";
}

/** Labeltekst uten verdier fra kontroller inni (f.eks. <select> inne i <label>). */
function labelWithoutControls(label: HTMLLabelElement): string {
  const clone = label.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("input, select, textarea, option").forEach((n) => n.remove());
  return clone.textContent ?? "";
}

/** Tekst like i nærheten: forrige søsken, eller forrige søsken til en forelder (maks fire nivåer opp). */
function nearbyText(el: Element): string {
  let node: Element | null = el;
  for (let depth = 0; node && depth < 4; depth++) {
    let sib = node.previousElementSibling;
    for (let i = 0; sib && i < 2; i++) {
      if (!sib.matches(SELECTOR) && !sib.querySelector(SELECTOR)) {
        const t = clip(sib.textContent);
        if (t) return t;
      }
      sib = sib.previousElementSibling;
    }
    const legend = node.parentElement?.closest("fieldset")?.querySelector("legend");
    if (legend && depth === 3) return clip(legend.textContent);
    node = node.parentElement;
  }
  return "";
}

export function describeField(el: FillableElement): FieldDescriptor {
  const root = el.getRootNode() as Document | ShadowRoot;
  const tag: FieldDescriptor["tag"] =
    el instanceof HTMLInputElement ? "input" : el instanceof HTMLTextAreaElement ? "textarea" : el instanceof HTMLSelectElement ? "select" : "contenteditable";
  return {
    tag,
    type: el instanceof HTMLInputElement ? el.type : undefined,
    autocomplete: el.getAttribute("autocomplete") ?? undefined,
    name: el.getAttribute("name") ?? undefined,
    id: el.id || undefined,
    placeholder: el.getAttribute("placeholder") ?? el.getAttribute("data-placeholder") ?? undefined,
    label: labelText(el) || undefined,
    ariaLabel: clip(el.getAttribute("aria-label") || textOfIds(el.getAttribute("aria-labelledby"), root)) || undefined,
    nearbyText: nearbyText(el) || undefined,
  };
}

export function hasValue(el: FillableElement): boolean {
  if (el instanceof HTMLInputElement && el.type === "file") return (el.files?.length ?? 0) > 0;
  if (el instanceof HTMLSelectElement) return el.selectedIndex > 0 || (el.selectedIndex === 0 && el.value !== "" && !isPlaceholderOption(el.options[0]));
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return el.value.trim() !== "";
  return (el.textContent ?? "").trim() !== "";
}

function isPlaceholderOption(opt: HTMLOptionElement | undefined): boolean {
  if (!opt) return true;
  return opt.value === "" || /velg|choose|select|--/i.test(opt.text);
}

/** Sett verdi slik at React/Angular/Vue registrerer endringen. */
export function setTextValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  el.focus({ preventScroll: true });
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: true }));
  el.blur();
}

const ALIASES: Record<string, string[]> = {
  norge: ["norway", "no", "nor", "noreg"],
  sverige: ["sweden", "se", "swe"],
  danmark: ["denmark", "dk", "dnk"],
};

const norm = (s: string) => s.toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Velg alternativet som passer best med verdien. Returnerer false hvis ingen passer. */
export function setSelectValue(el: HTMLSelectElement, value: string): boolean {
  const target = norm(value);
  const candidates = [target, ...(ALIASES[target] ?? [])];
  const options = Array.from(el.options).filter((o) => !isPlaceholderOption(o));
  const score = (o: HTMLOptionElement) => {
    const t = norm(o.text);
    const v = norm(o.value);
    for (const c of candidates) {
      if (t === c || v === c) return 3;
    }
    for (const c of candidates) {
      if (c.length >= 3 && (t.startsWith(c) || c.startsWith(t))) return 2;
    }
    for (const c of candidates) {
      if (c.length >= 4 && t.includes(c)) return 1;
    }
    return 0;
  };
  let best: HTMLOptionElement | null = null;
  let bestScore = 0;
  for (const o of options) {
    const s = score(o);
    if (s > bestScore) {
      best = o;
      bestScore = s;
    }
  }
  if (!best) return false;
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
  if (setter) setter.call(el, best.value);
  else el.value = best.value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

export function setContentEditable(el: HTMLElement, value: string) {
  el.focus({ preventScroll: true });
  const selection = el.ownerDocument.getSelection();
  if (selection) {
    selection.selectAllChildren(el);
  }
  // execCommand er utdatert, men er fortsatt det som fungerer best med rik-tekst-editorer.
  const ok = typeof el.ownerDocument.execCommand === "function" && el.ownerDocument.execCommand("insertText", false, value);
  if (!ok) {
    el.textContent = value;
    el.dispatchEvent(new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
  }
  el.blur();
}

export function setFileValue(el: HTMLInputElement, file: File): boolean {
  try {
    const dt = new DataTransfer();
    dt.items.add(file);
    el.files = dt.files;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- markering

const MARK_ATTR = "data-soknadsprofil";
const COLORS = { filled: "#22c55e", uncertain: "#f59e0b" } as const;

export function highlight(el: Element, kind: keyof typeof COLORS, title: string) {
  const target = (el instanceof HTMLInputElement && el.type === "file" ? el.closest("label") ?? el.parentElement ?? el : el) as HTMLElement;
  if (!target.hasAttribute(MARK_ATTR)) {
    target.setAttribute(`${MARK_ATTR}-prev`, target.getAttribute("style") ?? "");
  }
  target.setAttribute(MARK_ATTR, kind);
  target.style.setProperty("outline", `2px solid ${COLORS[kind]}`, "important");
  target.style.setProperty("outline-offset", "1px", "important");
  target.style.setProperty("transition", "outline-color .3s", "important");
  target.title = title;
}

export function clearHighlights(root: Document | ShadowRoot = document) {
  root.querySelectorAll<HTMLElement>(`[${MARK_ATTR}]`).forEach((el) => {
    const prev = el.getAttribute(`${MARK_ATTR}-prev`);
    if (prev) el.setAttribute("style", prev);
    else el.removeAttribute("style");
    el.removeAttribute(MARK_ATTR);
    el.removeAttribute(`${MARK_ATTR}-prev`);
  });
}
