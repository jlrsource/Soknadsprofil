import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Logg inn" };

export default function LoginPage() {
  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-aurora" aria-hidden />
      <div className="relative w-full max-w-sm">
        <Logo className="mb-8 justify-center" />
        <Card className="p-7">
          <h1 className="mb-1 text-center font-display text-2xl font-semibold">Velkommen</h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">Logg inn eller lag en konto. Det er gratis.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
