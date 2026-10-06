"use client";

import { computeCompleteness } from "@soknadsprofil/shared";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useProfile } from "@/lib/profile-store";
import { cn } from "@/lib/utils";
import { NAV } from "./nav";
import { ProgressRing } from "./progress-ring";

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const { profile, loading, userEmail } = useProfile();
  const score = computeCompleteness(profile).score;

  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r bg-card/60 px-4 py-5 backdrop-blur lg:flex">
      <Logo href="/app" className="px-2" />
      <nav className="mt-8 flex flex-col gap-1" aria-label="Hovedmeny">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3">
        {!loading && (
          <Link href="/app" className="flex items-center gap-3 rounded-2xl border bg-card p-3 transition hover:border-primary/40">
            <ProgressRing value={score} size={44} stroke={5} label={false} />
            <div className="text-sm">
              <div className="font-medium">{score}% komplett</div>
              <div className="text-xs text-muted-foreground">{score === 100 ? "Profilen er klar!" : "Fortsett å bygge"}</div>
            </div>
          </Link>
        )}
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="truncate text-xs text-muted-foreground" title={userEmail ?? ""}>{userEmail}</span>
          <div className="flex shrink-0">
            <ThemeToggle />
            <form action="/auth/signout" method="post">
              <button type="submit" aria-label="Logg ut" className="grid size-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <div className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Logo href="/app" />
        <div className="flex">
          <ThemeToggle />
          <form action="/auth/signout" method="post">
            <button type="submit" aria-label="Logg ut" className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-muted">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none]" aria-label="Hovedmeny">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs",
              isActive(pathname, href) ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
