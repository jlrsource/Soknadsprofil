export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-muted-foreground">{description}</p>}
      </div>
      {children}
    </header>
  );
}

export function SectionTitle({ id, title, description, action }: { id?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div id={id} className="mb-4 flex scroll-mt-24 items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingBlock() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Laster">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
