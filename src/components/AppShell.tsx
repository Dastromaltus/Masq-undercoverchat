import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Home, Inbox, BarChart3, Users, User, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/use-auth";
import logoUrl from "@/assets/logo-mask.png";

export function LangSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex rounded-full border border-border p-0.5 text-xs" role="group" aria-label="Language">
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2.5 py-1 font-semibold uppercase transition-colors ${
            lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function Logo() {
  return (
    <Link to="/" className="font-display text-2xl font-extrabold tracking-tight">
      <span className="text-gradient">masq</span>
    </Link>
  );
}

export function PrivacyNotice() {
  const { t } = useI18n();
  return (
    <p className="flex gap-2 rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      {t.privacy.notice}
    </p>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { session } = useAuth();
  const items = [
    { to: "/dashboard", label: t.nav.home, icon: Home },
    { to: "/inbox", label: t.nav.messages, icon: Inbox },
    { to: "/polls", label: t.nav.polls, icon: BarChart3 },
    { to: "/channels", label: t.nav.channels, icon: Users },
    { to: "/profile", label: t.nav.profile, icon: User },
  ] as const;
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col bg-hero">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background/80 px-5 py-3 backdrop-blur">
        <Logo />
        <div className="flex items-center gap-3">
          <LangSwitch />
          {!session && (
            <Link to="/auth" className="text-sm font-semibold text-primary">
              {t.common.signIn}
            </Link>
          )}
        </div>
      </header>
      <main className={`flex-1 px-5 pt-2 ${session ? "pb-28" : "pb-10"}`}>{children}</main>
      {session && (
        <nav
          aria-label="Navigation"
          className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-xl border-t border-border bg-card/95 backdrop-blur"
        >
          <ul className="grid grid-cols-5">
            {items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
                  activeProps={{ className: "text-primary" }}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

export function EmptyState({ title, hint, heading }: { title: string; hint?: string; heading?: boolean }) {
  const Title = heading ? "h1" : "p";
  return (
    <div className="card-surface flex flex-col items-center gap-2 p-8 text-center">
      <div className="text-3xl" aria-hidden>🎭</div>
      <Title className="font-semibold">{title}</Title>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Spinner() {
  const { t } = useI18n();
  return (
    <div className="flex justify-center py-10" role="status">
      <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="sr-only">{t.common.loading}</span>
    </div>
  );
}

export function FooterLinks() {
  const { t } = useI18n();
  return (
    <footer className="mt-12 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <Link to="/safety">{t.landing.links.safety}</Link>
      <Link to="/pricing">{t.landing.links.pricing}</Link>
      <Link to="/help">{t.landing.links.help}</Link>
      <Link to="/legal">{t.landing.links.legal}</Link>
    </footer>
  );
}

