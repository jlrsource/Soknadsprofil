import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui/card";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = { title: "Nytt passord" };

export default function NewPasswordPage() {
  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-aurora" aria-hidden />
      <div className="relative w-full max-w-sm">
        <Logo className="mb-8 justify-center" />
        <Card className="p-7">
          <h1 className="mb-1 text-center font-display text-2xl font-semibold">Lag nytt passord</h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">Velg et passord du ikke bruker andre steder.</p>
          <NewPasswordForm />
        </Card>
      </div>
    </div>
  );
}
