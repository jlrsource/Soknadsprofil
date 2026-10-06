"use client";

import { Loader2, Mail } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { getSupabase } from "@/lib/supabase/client";

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/app";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(params.get("error") ? "Innloggingen feilet. Prøv igjen." : null);

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const { error } = await getSupabase().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    if (error) {
      setError(error.message);
      setState("idle");
    } else {
      setState("sent");
    }
  }

  async function google() {
    const { error } = await getSupabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
    if (error) setError(error.message);
  }

  return (
    <AnimatePresence mode="wait">
      {state === "sent" ? (
        <motion.div key="sent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="size-6" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold">Sjekk innboksen din</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Vi har sendt en innloggingslenke til <strong className="text-foreground">{email}</strong>.
          </p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => setState("idle")}>
            Bruk en annen e-post
          </Button>
        </motion.div>
      ) : (
        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
          <Button variant="outline" className="w-full" size="lg" onClick={google}>
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
            </svg>
            Fortsett med Google
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> eller <div className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={sendLink} className="space-y-4">
            <Field label="E-post" htmlFor="email" error={error ?? undefined}>
              <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="deg@eksempel.no" />
            </Field>
            <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={state === "sending"}>
              {state === "sending" && <Loader2 className="animate-spin" />}
              Send innloggingslenke
            </Button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
