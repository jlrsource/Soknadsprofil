import { MobileNav, Sidebar } from "@/components/app/sidebar";
import { ProfileProvider } from "@/lib/profile-store";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <ProfileProvider>
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-aurora opacity-60" aria-hidden />
          <MobileNav />
          <main className="relative mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 lg:py-12">{children}</main>
        </div>
      </div>
    </ProfileProvider>
  );
}
