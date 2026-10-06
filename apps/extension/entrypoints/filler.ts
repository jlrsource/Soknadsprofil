import { createEngine } from "@/lib/engine/engine";

/** Injiseres i fanen med browser.scripting når brukeren ber om utfylling. */
export default defineUnlistedScript(() => {
  window.__soknadsprofil ??= createEngine(document);
});
