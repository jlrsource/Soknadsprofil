import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { SUPABASE_URL } from "@/lib/supabase/env";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Lager en engangskode som extensionen bytter mot sin EGEN sesjon (verifyOtp).
 * Vi deler ikke web-appens tokens, fordi Supabase roterer refresh-tokens:
 * to klienter med samme refresh-token ville logget hverandre ut.
 */
export async function POST() {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "SUPABASE_SECRET_KEY mangler på serveren" }, { status: 500 });
  }
  const admin = createClient(SUPABASE_URL, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email: data.user.email });
  if (linkError || !link.properties?.hashed_token) {
    return NextResponse.json({ error: linkError?.message ?? "Kunne ikke lage kode" }, { status: 500 });
  }

  return NextResponse.json(
    { tokenHash: link.properties.hashed_token },
    { headers: { "Cache-Control": "no-store" } },
  );
}
