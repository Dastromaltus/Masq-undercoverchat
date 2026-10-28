import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, EyeOff, HandHeart, Sparkles } from "lucide-react";
import { ConversationPreview } from "@/components/ConversationPreview";
import { AppShell, PrivacyNotice, FooterLinks } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/use-auth";
import logoUrl from "@/assets/logo-mask.png";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      { title: "Masq — Questions anonymes Instagram, révélation consentie" },
      { name: "description", content: "Questions anonymes pour Instagram : reçois des messages, partage les réponses en story et révèle ton profil uniquement quand tu le décides." },
      { property: "og:title", content: "Masq — Questions anonymes Instagram" },
      { property: "og:description", content: "Pose tes questions librement. Partage les réponses. Révèle ton profil uniquement quand tu le décides." },
    ],
  }),
  component: Landing,
});

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
      <section className="landing-intro pt-6 pb-6 text-center">
        <p className="mb-3 text-xs font-semibold uppercase text-mint">{t.landing.intro}</p>
        <img
          src={logoUrl}
          alt="Masq"
          width={1024}
          height={1024}
          className="brand-float mx-auto mb-2 size-32 object-contain"
        />
        <h1 className="font-display text-6xl font-extrabold leading-tight">Masq<span className="text-primary">.</span></h1>
        <h2 className="mx-auto mt-3 max-w-sm text-xl font-bold leading-snug">{t.landing.seoHeading}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{t.landing.tagline}</p>
        <div className="mt-6 flex flex-col gap-2">
          {session ? (
            <Button asChild variant="hero" size="lg">
              <Link to="/dashboard">{t.nav.home}<ArrowUpRight aria-hidden /></Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="hero" size="lg">
                <Link to="/auth" search={{ mode: "signup" }}>{t.landing.cta}<ArrowUpRight aria-hidden /></Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link to="/auth">{t.landing.ctaSecondary}</Link>
              </Button>
            </>
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{t.landing.adult}</p>
      </section>
      <ConversationPreview />
      <section className="landing-features mt-6 grid">
        {features.map(({ icon: Icon, title, desc }, index) => (
          <article key={title} className="feature-row flex gap-4 border-t border-border py-5">
            <div className={`feature-icon flex size-11 shrink-0 items-center justify-center rounded-lg ${index === 1 ? "bg-mint/10 text-mint" : index === 2 ? "bg-coral/10 text-coral" : "bg-accent text-primary"}`}>
              <Icon className="size-5" aria-hidden />
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
