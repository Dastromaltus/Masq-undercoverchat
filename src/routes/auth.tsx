import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PrivacyNotice } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/i18n";
import { lovable } from "@/integrations/lovable/index";

const search = z.object({ mode: z.enum(["signin", "signup", "forgot"]).optional(), next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: false },
  validateSearch: search,
  head: () => ({
    meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      { title: "Connexion — Masq" },
      { name: "description", content: "Connecte-toi ou crée ton compte Masq." },
      { property: "og:title", content: "Connexion — Masq" },
      { property: "og:description", content: "Connecte-toi ou crée ton compte Masq." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const safeNext = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard");

function AuthPage() {
  const { t } = useI18n();
  const { mode: initial, next } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initial ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const emailOk = z.string().trim().email().max(255).safeParse(email);
    if (!emailOk.success) return setError(t.auth.invalid);
    setBusy(true);
    try {
      if (mode === "forgot") {
        await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        setInfo(t.auth.resetSent);
      } else if (mode === "signup") {
        if (password.length < 8) return setError(t.auth.weak);
        if (!adult) return setError(t.auth.ageRequired);
        const u = username.trim().toLowerCase();
        const { data: ok } = await supabase.rpc("username_available", { _username: u });
        if (!ok) return setError(t.auth.usernameTaken);
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin, data: { username: u, age_declared: true } },
        });
        if (error) return setError(error.message);
        setInfo(t.auth.checkEmail);
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) return setError(t.auth.invalid);
        toast.success("👋");
        navigate({ to: safeNext(next) });
      }
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    if (mode === "signup" && !adult) return setError(t.auth.ageRequired);
    if (next) sessionStorage.setItem("masq.next", safeNext(next));
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) return setError(t.common.error);
    if (result.redirected) return;
    navigate({ to: safeNext(next ?? sessionStorage.getItem("masq.next") ?? undefined) });
  }

  // Returning from the Google redirect: once the session exists, continue.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const n = sessionStorage.getItem("masq.next") ?? undefined;
        sessionStorage.removeItem("masq.next");
        navigate({ to: safeNext(next ?? n), replace: true });
      }
    });
  }, [navigate, next]);

  const title = mode === "signup" ? t.auth.signUpTitle : mode === "forgot" ? t.auth.forgotTitle : t.auth.signInTitle;

  return (
    <AppShell>
      <div className="mx-auto max-w-sm pt-6">
        <h1 className="mb-6 text-3xl font-extrabold">{title}</h1>
        <form onSubmit={submit} className="card-surface space-y-4 p-5" noValidate>
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="username">{t.auth.username}</Label>
              <Input id="username" value={username} maxLength={20} autoComplete="username"
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} required />
              <p className="text-xs text-muted-foreground">{t.auth.usernameHint}</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <Label htmlFor="password">{t.auth.password}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"} required />
            </div>
          )}
          {mode === "signup" && (
            <div className="space-y-1">
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={adult} onCheckedChange={(v) => setAdult(v === true)} className="mt-0.5" />
                {t.auth.age}
              </label>
              <p className="pl-6 text-xs text-muted-foreground">{t.auth.ageNote}</p>
            </div>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {info && <p role="status" className="text-sm text-success">{info}</p>}
          <Button type="submit" variant="hero" className="w-full" disabled={busy}>
            {busy ? t.common.loading : mode === "signup" ? t.auth.submitSignUp : mode === "forgot" ? t.auth.sendReset : t.auth.submitSignIn}
          </Button>
        </form>
        {mode !== "forgot" && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{t.auth.or}<span className="h-px flex-1 bg-border" /></div>
            <Button type="button" variant="outline" className="w-full" onClick={google}>
              <svg viewBox="0 0 24 24" aria-hidden className="size-4"><path fill="currentColor" d="M21.35 11.1H12v2.9h5.35c-.25 1.5-1.7 4.4-5.35 4.4-3.2 0-5.85-2.65-5.85-5.9S8.8 6.6 12 6.6c1.85 0 3.05.8 3.75 1.45l2.55-2.45C16.7 4.1 14.55 3 12 3 7 3 3 7 3 12s4 9 9 9c5.2 0 8.65-3.65 8.65-8.8 0-.6-.05-1.05-.3-1.1z"/></svg>
              {t.auth.google}
            </Button>
            {mode === "signup" && <p className="text-center text-xs text-muted-foreground">{t.auth.googleNote}</p>}
          </div>
        )}
        <div className="mt-4 flex flex-col items-center gap-2 text-sm">
          {mode !== "signup" && <button className="text-primary" onClick={() => setMode("signup")}>{t.auth.toSignUp}</button>}
          {mode !== "signin" && <button className="text-primary" onClick={() => setMode("signin")}>{t.auth.toSignIn}</button>}
          {mode === "signin" && <button className="text-muted-foreground" onClick={() => setMode("forgot")}>{t.auth.forgot}</button>}
        </div>
        <div className="mt-6"><PrivacyNotice /></div>
      </div>
    </AppShell>
  );
}
