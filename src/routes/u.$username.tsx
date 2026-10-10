import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Lock, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PrivacyNotice, Spinner, EmptyState } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/u/$username")({
  staticData: { sitemap: false },
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} sur Masq` },
      { name: "description", content: `Envoie un message à @${params.username} sur Masq — ton identité n’est pas affichée.` },
      { property: "og:title", content: `@${params.username} sur Masq` },
      { property: "og:description", content: "Pose ta question. Ton identité n’est pas affichée au destinataire." },
    ],
  }),
  component: PublicProfile,
});

const MAX = 500;

function PublicProfile() {
  const { username } = Route.useParams();
  const { t } = useI18n();
  const { session } = useAuth();
  const q = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_profile", { _username: username });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<"A" | "B">("A");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!body.trim()) return setError(t.send.errors.EMPTY);
    if (body.length > MAX) return setError(t.send.errors.TOO_LONG);
    setBusy(true);
    const { error } = await supabase.rpc("send_message", { _username: username, _body: body, _allow_reveal: mode === "B" });
    setBusy(false);
    if (error) {
      const code = Object.keys(t.send.errors).find((k) => error.message.includes(k)) as keyof typeof t.send.errors | undefined;
      return setError(code ? t.send.errors[code] : t.common.error);
    }
    setSent(true);
    setBody("");
    setMode("A");
  }

  if (q.isLoading) return <AppShell><Spinner /></AppShell>;
  if (q.isError) return <AppShell><EmptyState heading title={t.common.error} /></AppShell>;
  const p = q.data;
  if (!p) return <AppShell><EmptyState heading title={t.send.notFound} /></AppShell>;

  return (
    <AppShell>
      <section className="pt-6 text-center">
        <div className="mx-auto flex size-20 items-center justify-center overflow-hidden rounded-full bg-gradient-primary text-3xl font-bold text-primary-foreground">
          {p.avatar_url ? <img src={p.avatar_url} alt="" className="size-full object-cover" referrerPolicy="no-referrer" /> : p.username[0]?.toUpperCase()}
        </div>
        <h1 className="mt-3 text-xl font-bold">{p.display_name || `@${p.username}`}</h1>
        <p className="text-sm text-muted-foreground">@{p.username}</p>
        {p.bio && <p className="mx-auto mt-2 max-w-xs text-sm">{p.bio}</p>}
      </section>

      <div className="mt-6 overflow-hidden rounded-3xl bg-gradient-primary p-[1px] shadow-glow">
        <div className="rounded-3xl bg-card p-5">
          <p className="mb-4 font-display text-xl font-bold">{p.welcome_question}</p>
          {!p.accepting ? (
            <p className="text-sm text-muted-foreground">{t.send.closed}</p>
          ) : sent ? (
            <div className="space-y-3 text-center">
              <p className="text-lg font-semibold">{t.send.sent}</p>
              <Button variant="secondary" onClick={() => setSent(false)}>{t.send.sendAnother}</Button>
            </div>
          ) : !session ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t.send.loginRequired}</p>
              <Button asChild variant="hero" className="w-full">
                <Link to="/auth" search={{ next: `/u/${username}` }}>{t.common.signIn}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={t.send.placeholder}
                  maxLength={MAX} rows={4} aria-label={t.send.placeholder} className="resize-none rounded-2xl" />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>{t.send.noAttachments}</span>
                  <span>{body.length}/{MAX}</span>
                </div>
              </div>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as "A" | "B")} className="gap-2">
                {([["A", t.send.modeA, t.send.modeAd], ["B", t.send.modeB, t.send.modeBd]] as const).map(([v, title, d]) => (
                  <label key={v} className={`flex cursor-pointer gap-3 rounded-2xl border p-3 ${mode === v ? "border-primary bg-accent/50" : "border-border"}`}>
                    <RadioGroupItem value={v} className="mt-1" />
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold"><Lock className="size-3.5" aria-hidden />{title}</span>
                      <span className="block text-xs text-muted-foreground">{d}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                <Send aria-hidden /> {busy ? t.common.loading : t.send.submit}
              </Button>
            </form>
          )}
        </div>
      </div>
      <div className="mt-5"><PrivacyNotice /></div>
    </AppShell>
  );
}
