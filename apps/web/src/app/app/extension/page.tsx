"use client";

import { CheckCircle2, Download, Loader2, PlugZap, RefreshCw, Unplug } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requestExtension } from "@/lib/extension-bridge";
import { useProfile } from "@/lib/profile-store";

type Status = { state: "checking" } | { state: "missing" } | { state: "installed"; connectedEmail: string | null; version: string };

const STEPS = [
  { title: "Åpne en søknad", text: "Gå til et søknadsskjema på Webcruiter, Jobylon, Teamtailor, Workday eller en annen side." },
  { title: "Klikk på extensionen", text: "Trykk «Fyll ut denne siden» i popupen, eller bruk tastatursnarveien Alt+Shift+F." },
  { title: "Se over og send inn", text: "Grønne felt er sikre treff, gule bør du sjekke. Du sender alltid inn selv." },
];

export default function ExtensionPage() {
  const { userEmail } = useProfile();
  const [status, setStatus] = useState<Status>({ state: "checking" });
  const [busy, setBusy] = useState(false);

  const check = useCallback(async () => {
    setStatus({ state: "checking" });
    const pong = await requestExtension({ type: "PING" }, "PONG");
    setStatus(pong ? { state: "installed", connectedEmail: pong.connectedEmail, version: pong.version } : { state: "missing" });
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  async function connect() {
    setBusy(true);
    try {
      const res = await fetch("/api/extension/token", { method: "POST" });
      const body = (await res.json()) as { tokenHash?: string; error?: string };
      if (!res.ok || !body.tokenHash) throw new Error(body.error ?? "Ukjent feil");
      const result = await requestExtension({ type: "CONNECT", tokenHash: body.tokenHash }, "CONNECT_RESULT", 10000);
      if (!result) throw new Error("Extensionen svarte ikke");
      if (!result.ok) throw new Error(result.error ?? "Tilkoblingen feilet");
      toast.success("Extensionen er koblet til 🎉");
      await check();
    } catch (e) {
      toast.error("Kunne ikke koble til", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    await requestExtension({ type: "DISCONNECT" }, "DISCONNECT_RESULT", 5000);
    setBusy(false);
    await check();
  }

  const connected = status.state === "installed" && status.connectedEmail;
  const connectedToOther = connected && status.connectedEmail !== userEmail;

  return (
    <div>
      <PageHeader title="Chrome-extension" description="Extensionen henter profilen din og fyller ut søknadsskjemaer for deg." />

      <Card className="overflow-hidden">
        <div className="flex flex-col items-center gap-5 p-8 text-center sm:flex-row sm:text-left">
          <motion.div
            className={`grid size-16 shrink-0 place-items-center rounded-2xl ${connected ? "bg-success/15 text-success" : "bg-primary/10 text-primary"}`}
            animate={connected ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            {status.state === "checking" ? (
              <Loader2 className="size-7 animate-spin" />
            ) : connected ? (
              <CheckCircle2 className="size-7" />
            ) : status.state === "installed" ? (
              <PlugZap className="size-7" />
            ) : (
              <Download className="size-7" />
            )}
          </motion.div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-semibold">
              {status.state === "checking" && "Ser etter extensionen …"}
              {status.state === "missing" && "Extensionen er ikke installert"}
              {status.state === "installed" && !connected && "Extensionen er installert, men ikke koblet til"}
              {connected && "Koblet til"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {status.state === "missing" && "Installer SøknadsProfil fra Chrome Web Store. Under utvikling kan du laste den inn som upakket extension. Last deretter siden på nytt."}
              {status.state === "installed" && !connected && "Koble til for å gi extensionen tilgang til profilen din."}
              {connected && !connectedToOther && `Extensionen bruker profilen til ${status.connectedEmail}.`}
              {connectedToOther && `Extensionen er koblet til en annen konto (${status.connectedEmail}). Koble til på nytt for å bytte.`}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {status.state === "missing" && (
              <Button variant="outline" onClick={check}>
                <RefreshCw /> Sjekk igjen
              </Button>
            )}
            {status.state === "installed" && (!connected || connectedToOther) && (
              <Button variant="gradient" onClick={connect} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <PlugZap />} Koble til
              </Button>
            )}
            {connected && (
              <Button variant="ghost" onClick={disconnect} disabled={busy}>
                <Unplug /> Koble fra
              </Button>
            )}
          </div>
        </div>
      </Card>

      <h2 className="mb-4 mt-12 font-display text-xl font-semibold">Slik bruker du den</h2>
      <ol className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <motion.li key={step.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}>
            <Card className="h-full p-5">
              <div className="grid size-8 place-items-center rounded-full bg-primary/10 font-display font-semibold text-primary">{i + 1}</div>
              <h3 className="mt-3 font-medium">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
            </Card>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
