import { createFileRoute, Link } from "@tanstack/react-router";
import { EyeOff, HandHeart, Sparkles } from "lucide-react";
import { AppShell, PrivacyNotice } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Masq — Questions à identité masquée, révélation consentie" },
      { name: "description", content: "Pose tes questions librement. Partage les réponses. Révèle ton profil uniquement quand tu le décides." },
      { property: "og:title", content: "Masq — Questions à identité masquée" },
      { property: "og:description", content: "Pose tes questions librement. Partage les réponses. Révèle ton profil uniquement quand tu le décides." },
    ],
  }),
  component: Landing,
});

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

function Landing() {
  const { t } = useI18n();
  const { session } = useAuth();
  const features = [
    { icon: EyeOff, title: t.landing.f1t, desc: t.landing.f1d },
    { icon: HandHeart, title: t.landing.f2t, desc: t.landing.f2d },
    { icon: Sparkles, title: t.landing.f3t, desc: t.landing.f3d },
  ];
  return (
    <AppShell>
      <section className="pt-10 pb-8 text-center">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-gradient-primary text-4xl shadow-glow" aria-hidden>
          🎭
        </div>
        <h1 className="text-4xl font-extrabold leading-tight">
          {t.landing.tagline.split(". ")[0]}.
          <span className="mt-2 block text-gradient">{t.landing.tagline.split(". ").slice(1).join(". ")}</span>
        </h1>
        <div className="mt-8 flex flex-col gap-3">
          {session ? (
            <Button asChild variant="hero" size="lg">
              <Link to="/dashboard">{t.nav.home}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="hero" size="lg">
                <Link to="/auth" search={{ mode: "signup" }}>{t.landing.cta}</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link to="/auth">{t.landing.ctaSecondary}</Link>
              </Button>
            </>
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{t.landing.adult}</p>
      </section>
      <section className="grid gap-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <article key={title} className="card-surface flex gap-4 p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent">
              <Icon className="size-5 text-primary" aria-hidden />
            </div>
            <div>
              <h2 className="font-bold">{title}</h2>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          </article>
        ))}
      </section>
      <div className="mt-6">
        <PrivacyNotice />
      </div>
      <FooterLinks />
    </AppShell>
  );
}
