import { ArrowRight, FileCheck2, Layers, MousePointerClick, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { HeroDemo } from "@/components/landing/hero-demo";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Layers, title: "Én profil, alle søknader", text: "Personalia, erfaring, utdanning, ferdigheter, referanser og dokumenter. Alt samlet på ett sted." },
  { icon: MousePointerClick, title: "Utfylling med ett klikk", text: "Chrome-extensionen kjenner igjen feltene og fyller dem ut, både på norsk og engelsk." },
  { icon: FileCheck2, title: "CV-en lastes opp av seg selv", text: "Velg en standard-CV, så legges den ved automatisk der skjemaet ber om fil." },
  { icon: Sparkles, title: "Gjenbrukbare svar", text: "Lønnskrav, oppstartsdato og «hvorfor oss?». Skriv dem én gang, og bruk dem overalt." },
  { icon: Zap, title: "Fungerer der du søker", text: "Laget for Webcruiter, Jobylon, Teamtailor, Workday, ReachMee og mange andre." },
  { icon: ShieldCheck, title: "Du har kontrollen", text: "Ingenting sendes inn uten deg. Du ser alltid over før du trykker «Send»." },
];

const PLATFORMS = ["Webcruiter", "Jobylon", "Teamtailor", "Workday", "ReachMee", "Easycruit", "Greenhouse", "Lever"];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[44rem] bg-aurora" aria-hidden />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            Logg inn
          </Link>
          <Link href="/login" className={cn(buttonVariants(), "hidden sm:inline-flex")}>
            Kom i gang
          </Link>
        </div>
      </header>

      <main className="relative">
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-24 pt-12 sm:px-6 lg:grid-cols-2 lg:pt-20 [&>*]:min-w-0">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="size-1.5 rounded-full bg-success" /> Gratis i beta
            </div>
            <h1 className="font-display text-[2.5rem] font-semibold leading-[1.04] tracking-tight sm:text-6xl">
              Skriv det <span className="text-gradient">én gang</span>.<br />
              Søk overalt.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Bygg én skikkelig god profil i SøknadsProfil. Extensionen fyller ut alle de tunge søknadsskjemaene for deg, på alle plattformer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className={buttonVariants({ variant: "gradient", size: "lg" })}>
                Lag profilen din <ArrowRight />
              </Link>
              <a href="#slik-funker-det" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Slik funker det
              </a>
            </div>
          </div>
          <HeroDemo />
        </section>

        <section className="border-y bg-card/50 py-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 text-sm font-medium text-muted-foreground">
            {PLATFORMS.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
        </section>

        <section id="slik-funker-det" className="mx-auto max-w-6xl scroll-mt-10 px-4 py-24 sm:px-6">
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">Slutt å skrive navnet ditt for hundrede gang.</h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Hver arbeidsgiver har sin egen søknadsportal, og alle vil ha de samme opplysningene. Vi samler dem, så du kan bruke tiden på det som betyr noe.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="p-6 transition hover:-translate-y-1 hover:border-primary/40">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <Card className="relative overflow-hidden p-10 text-center sm:p-16">
            <div className="pointer-events-none absolute inset-0 bg-aurora opacity-80" aria-hidden />
            <div className="relative">
              <h2 className="font-display text-4xl font-semibold tracking-tight">Klar for neste søknad?</h2>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">Det tar omtrent ti minutter å bygge profilen. Etter det tar hver søknad sekunder.</p>
              <Link href="/login" className={cn(buttonVariants({ variant: "gradient", size: "lg" }), "mt-8")}>
                Kom i gang gratis <ArrowRight />
              </Link>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">© 2026 SøknadsProfil</footer>
    </div>
  );
}
