"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { getSupabase } from "@/lib/supabase/client";

const MIN_PASSWORD = 8;

export function NewPasswordForm() {
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lenken fra e-posten går via /auth/callback, som logger brukeren inn før vi havner her.
  useEffect(() => {
    void getSupabase()
      .auth.getUser()
      .then(({ data }) => setHasSession(Boolean(data.user)));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD) return setError(`Passordet må være minst ${MIN_PASSWORD} tegn.`);
    if (password !== repeat) return setError("Passordene er ikke like.");
    setBusy(true);
    const { error } = await getSupabase().auth.updateUser({ password });
    if (error) {
      setBusy(false);
      setError(error.message.toLowerCase().includes("different from the old") ? "Det nye passordet må være forskjellig fra det gamle." : error.message);
      return;
    }
    window.location.assign("/app");
  }

  if (hasSession === null) {
    return <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />;
  }

  if (!hasSession) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        <p>Lenken er utløpt eller allerede brukt. Be om en ny lenke fra innloggingssiden.</p>
        <Link href="/login" className={buttonVariants({ variant: "outline", className: "mt-4" })}>
          Til innlogging
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nytt passord" htmlFor="pw" hint={`Minst ${MIN_PASSWORD} tegn.`}>
        <Input id="pw" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
      </Field>
      <Field label="Gjenta passord" htmlFor="pw2">
        <Input id="pw2" type="password" autoComplete="new-password" required value={repeat} onChange={(e) => setRepeat(e.target.value)} />
      </Field>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />}
        Lagre passord
      </Button>
    </form>
  );
}
