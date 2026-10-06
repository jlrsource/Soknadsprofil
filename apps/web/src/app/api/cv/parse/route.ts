import { NextResponse, type NextRequest } from "next/server";
import { CvExtractionError, extractCv } from "@/lib/cv-import/extract";
import { claimCvImport, CV_IMPORTS_PER_DAY } from "@/lib/cv-import/limit";
import { createSupabaseServer } from "@/lib/supabase/server";

// Å lese en CV tar typisk 15–60 sekunder.
export const maxDuration = 120;

const timeFormat = new Intl.DateTimeFormat("nb-NO", { weekday: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Oslo" });

/** Leser en opplastet CV med Claude og returnerer forslag til profilfelt. Ingenting lagres her. */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { documentId?: string };
  if (!body.documentId) return NextResponse.json({ error: "documentId mangler" }, { status: 400 });

  // RLS sørger for at brukeren bare kan hente sine egne dokumenter.
  const { data: doc } = await supabase.from("documents").select("storage_path, mime_type, file_name").eq("id", body.documentId).single();
  if (!doc) return NextResponse.json({ error: "Fant ikke dokumentet" }, { status: 404 });

  const claim = await claimCvImport({ id: auth.user.id, email: auth.user.email }, body.documentId);
  if (!claim.allowed) {
    return NextResponse.json(
      {
        error: `Du har brukt alle ${CV_IMPORTS_PER_DAY} CV-importene for siste døgn. Neste blir ledig ${timeFormat.format(new Date(claim.resetAt))}.`,
        resetAt: claim.resetAt,
      },
      { status: 429 },
    );
  }

  try {
    const { data: file, error: downloadError } = await supabase.storage.from("documents").download(doc.storage_path);
    if (downloadError || !file) throw new CvExtractionError("Kunne ikke hente filen", 500);
    const extraction = await extractCv(file, doc.mime_type || file.type);
    return NextResponse.json({ extraction, remaining: claim.remaining }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    // Feilede importer skal ikke telle mot grensen.
    await claim.release().catch((e) => console.error("Kunne ikke frigi CV-import", e));
    if (error instanceof CvExtractionError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("CV-import feilet", error);
    return NextResponse.json({ error: "Noe gikk galt under lesingen av CV-en." }, { status: 500 });
  }
}
