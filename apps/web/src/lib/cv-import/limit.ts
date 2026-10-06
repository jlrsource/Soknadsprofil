import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const CV_IMPORTS_PER_DAY = 3;

/** E-poster uten grense, kommaseparert i CV_IMPORT_UNLIMITED_EMAILS. */
function isUnlimited(email: string | undefined): boolean {
  if (!email) return false;
  const list = (process.env.CV_IMPORT_UNLIMITED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export type ClaimResult =
  | { allowed: true; release: () => Promise<void>; remaining: number | null }
  | { allowed: false; resetAt: string };

/** Reserverer én CV-import. Kall `release()` hvis importen feiler, så den ikke teller. */
export async function claimCvImport(user: { id: string; email?: string }, documentId: string): Promise<ClaimResult> {
  if (isUnlimited(user.email)) return { allowed: true, release: async () => {}, remaining: null };

  const admin = createSupabaseAdmin();
  const { data, error } = await admin.rpc("claim_cv_import", {
    p_user_id: user.id,
    p_document_id: documentId,
    p_limit: CV_IMPORTS_PER_DAY,
  });
  if (error) throw new Error(`Kunne ikke sjekke grensen for CV-import: ${error.message}`);

  const result = data as { allowed: boolean; usage_id: string | null; remaining: number; reset_at: string };
  if (!result.allowed) return { allowed: false, resetAt: result.reset_at };
  return {
    allowed: true,
    remaining: result.remaining,
    release: async () => {
      await admin.from("cv_import_usage").delete().eq("id", result.usage_id!);
    },
  };
}
