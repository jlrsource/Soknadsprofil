"use client";

import { Loader2, Mail } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup" | "reset";

const MIN_PASSWORD = 8;

/** Supabase-feilmeldinger på norsk. */
function translate(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Feil e-post eller passord.";
  if (m.includes("already registered")) return "Det finnes allerede en konto med denne e-posten. Logg inn i stedet.";
  if (m.includes("email not confirmed")) return "Du må bekrefte e-postadressen først. Sjekk innboksen din.";
  if (m.includes("rate limit")) return "For mange forsøk. Vent litt og prøv igjen.";
  if (m.includes("password should be")) return `Passordet må være minst ${MIN_PASSWORD} tegn.`;
  if (m.includes("weak")) return "Passordet er for svakt. Bruk en lengre eller mer variert kombinasjon.";
  return message;
}

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/app";
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkInbox, setCheckInbox] = useState<null | "confirm" | "reset">(null);
  const [error, setError] = useState<string | null>(params.get("error") ? "Innloggingen feilet. Prøv igjen." : null);

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  // Full navigasjon, så proxy.ts og serveren ser den nye sesjonskaken med en gang.
  const goToApp = () => window.location.assign(next);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "reset") {
      setBusy(true);
      const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/nytt-passord`,
      });
      setBusy(false);
      if (error) setError(translate(error.message));
      else setCheckInbox("reset");
      return;
    }
    if (mode === "signup" && password.length < MIN_PASSWORD) {
      setError(`Passordet må være minst ${MIN_PASSWORD} tegn.`);
      return;
    }
    setBusy(true);
    const supabase = getSupabase();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(translate(error.message));
        setBusy(false);
        return;
      }
      goToApp();
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
    if (error) {
      setError(translate(error.message));
      setBusy(false);
      return;
    }
    // Finnes e-posten fra før, svarer Supabase «ok» uten sesjon og uten identiteter, og sender ingen e-post.
    if (!data.session && data.user?.identities?.length === 0) {
      setError("Det finnes allerede en konto med denne e-posten. Logg inn, eller bruk «Glemt passord?».");
      setMode("login");
      setBusy(false);
      return;
    }
    // Uten sesjon betyr at «Confirm email» er på i Supabase: brukeren må bekrefte først.
    if (data.session) goToApp();
    else {
      setCheckInbox("confirm");
      setBusy(false);
    }
  }

  async function google() {
    const { error } = await getSupabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
    if (error) setError(translate(error.message));
  }

  if (checkInbox) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Mail className="size-6" />
        </div>
        <h2 className="mt-4 font-display text-xl font-semibold">{checkInbox === "reset" ? "Sjekk innboksen din" : "Bekreft e-posten din"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {checkInbox === "reset" ? "Hvis det finnes en konto for " : "Vi har sendt en bekreftelseslenke til "}
          <strong className="text-foreground">{email}</strong>
          {checkInbox === "reset" ? ", har vi sendt en lenke for å lage nytt passord." : ". Klikk på den for å aktivere kontoen."}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-4"
          onClick={() => {
            setCheckInbox(null);
            setMode("login");
          }}
        >
          Tilbake til innlogging
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {mode === "reset" ? (
        <div>
          <h2 className="font-display text-lg font-semibold">Glemt passord</h2>
          <p className="mt-1 text-sm text-muted-foreground">Skriv inn e-posten din, så sender vi deg en lenke for å lage nytt passord.</p>
        </div>
      ) : (
      <div className="grid grid-cols-2 rounded-xl bg-muted p-1 text-sm" role="tablist">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cn("rounded-lg py-1.5 font-medium transition", mode === m ? "bg-card shadow-soft" : "text-muted-foreground hover:text-foreground")}
          >
            {m === "login" ? "Logg inn" : "Lag konto"}
          </button>
        ))}
      </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <Field label="E-post" htmlFor="email">
          <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="deg@eksempel.no" />
        </Field>
        {mode !== "reset" && (
          <Field label="Passord" htmlFor="password" hint={mode === "signup" ? `Minst ${MIN_PASSWORD} tegn.` : undefined}>
            <Input
              id="password"
              type="password"
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        )}
        {mode === "login" && (
          <button
            type="button"
            onClick={() => {
              setMode("reset");
              setError(null);
            }}
            className="-mt-2 text-xs text-muted-foreground hover:text-primary hover:underline"
          >
            Glemt passord?
          </button>
        )}
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-sm text-destructive" role="alert">
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {mode === "login" ? "Logg inn" : mode === "signup" ? "Lag konto" : "Send lenke"}
        </Button>
        {mode === "reset" && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
          >
            Tilbake til innlogging
          </Button>
        )}
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> eller <div className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" className="w-full" size="lg" onClick={google}>
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
        Fortsett med Google
      </Button>
    </div>
  );
}
