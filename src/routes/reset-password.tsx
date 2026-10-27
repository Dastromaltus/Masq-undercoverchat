import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/reset-password")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      { title: "Nouveau mot de passe — Masq" },
      { name: "description", content: "Définis un nouveau mot de passe pour ton compte Masq." },
      { property: "og:title", content: "Nouveau mot de passe — Masq" },
      { property: "og:description", content: "Définis un nouveau mot de passe." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError(t.auth.weak);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    toast.success(t.auth.passwordUpdated);
    navigate({ to: "/dashboard" });
  }
  return (
    <AppShell>
      <form onSubmit={submit} className="card-surface mx-auto mt-8 max-w-sm space-y-4 p-5">
        <h1 className="text-2xl font-extrabold">{t.auth.forgotTitle}</h1>
        <div className="space-y-1.5">
          <Label htmlFor="pw">{t.auth.newPassword}</Label>
          <Input id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="hero" className="w-full" disabled={busy}>{t.auth.updatePassword}</Button>
      </form>
    </AppShell>
  );
}
