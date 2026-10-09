import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Download, LogOut, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Spinner, EmptyState, LangSwitch, PrivacyNotice, FooterLinks } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/i18n";
import { meQuery, publicUrl } from "@/lib/me";
import { deleteMyAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profil — Masq" }, { name: "description", content: "Profil et paramètres de confidentialité." }, { property: "og:title", content: "Profil — Masq" }, { property: "og:description", content: "Profil et paramètres." }] }),
  component: ProfilePage,
});

const profileSchema = z.object({
  display_name: z.string().trim().max(40),
  bio: z.string().trim().max(280),
  avatar_url: z.union([z.literal(""), z.string().trim().url().startsWith("https://").max(500)]),
  instagram_url: z.union([z.literal(""), z.string().trim().regex(/^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.]{1,30}\/?$/)]),
});

function ProfilePage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const del = useServerFn(deleteMyAccount);
  const me = useQuery(meQuery);
  const [form, setForm] = useState({ display_name: "", bio: "", avatar_url: "", instagram_url: "" });
  const [inbox, setInbox] = useState({ welcome_question: "", accepting: true, allow_reveal_requests: true });
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!me.data) return;
    const p = me.data.profile, s = me.data.settings;
    setForm({ display_name: p.display_name ?? "", bio: p.bio ?? "", avatar_url: p.avatar_url ?? "", instagram_url: p.instagram_url ?? "" });
    setInbox({ welcome_question: s.welcome_question, accepting: s.accepting, allow_reveal_requests: s.allow_reveal_requests });
  }, [me.data]);

  if (me.isLoading) return <Spinner />;
  if (!me.data) return <EmptyState title={t.common.error} />;
  const { profile, isStaff } = me.data;

  async function saveProfile() {
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.path.join(".") + " — " + t.common.error); return; }
    const v = parsed.data;
    const { error } = await supabase.from("profiles").update({
      display_name: v.display_name || null, bio: v.bio || null, avatar_url: v.avatar_url || null, instagram_url: v.instagram_url || null,
    }).eq("id", profile.id);
    if (error) { toast.error(t.common.error); return; }
    toast.success(t.common.saved);
    qc.invalidateQueries({ queryKey: ["me"] });
  }
  async function saveInbox(next = inbox) {
    const wq = next.welcome_question.trim();
    if (!wq || wq.length > 140) { toast.error(t.common.error); return; }
    const { error } = await supabase.from("inbox_settings").update({ ...next, welcome_question: wq, updated_at: new Date().toISOString() }).eq("user_id", profile.id);
    if (error) { toast.error(t.common.error); return; }
    toast.success(t.common.saved);
    qc.invalidateQueries({ queryKey: ["me"] });
  }
  async function exportData() {
    const { data, error } = await supabase.rpc("export_my_data");
    if (error) { toast.error(t.common.error); return; }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `masq-export-${profile.username}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  async function deleteAccount() {
    try {
      await del();
      qc.clear();
      await supabase.auth.signOut();
      navigate({ to: "/", replace: true });
    } catch {
      toast.error(t.common.error);
    }
  }
  const confirmWord = t.profile.deleteConfirm.includes("SUPPRIMER") ? "SUPPRIMER" : "DELETE";

  return (
    <div className="space-y-5 pt-4">
      <h1 className="text-3xl font-extrabold">{t.profile.title}</h1>

      <section className="card-surface space-y-3 p-5">
        <p className="text-sm text-muted-foreground">{t.profile.publicUrl}</p>
        <Link to="/u/$username" params={{ username: profile.username }} className="break-all font-semibold text-primary">
          {publicUrl(profile.username).replace(/^https?:\/\//, "")}
        </Link>
        <p className="text-xs text-muted-foreground">{t.profile.ageStatus}</p>
        <div className="space-y-1.5"><Label htmlFor="dn">{t.profile.displayName}</Label>
          <Input id="dn" maxLength={40} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="bio">{t.profile.bio}</Label>
          <Textarea id="bio" maxLength={280} rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="av">{t.profile.avatar}</Label>
          <Input id="av" type="url" placeholder="https://…" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="ig">{t.profile.instagram}</Label>
          <Input id="ig" type="url" placeholder="https://instagram.com/…" value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} />
          <p className="text-xs text-muted-foreground">{t.profile.instagramHint}</p></div>
        <Button variant="hero" className="w-full" onClick={saveProfile}>{t.common.save}</Button>
      </section>

      <section className="card-surface space-y-4 p-5">
        <h2 className="text-lg font-bold">{t.profile.inbox}</h2>
        <div className="space-y-1.5"><Label htmlFor="wq">{t.profile.welcome}</Label>
          <Input id="wq" maxLength={140} value={inbox.welcome_question} onChange={(e) => setInbox({ ...inbox, welcome_question: e.target.value })} onBlur={() => saveInbox()} /></div>
        <label className="flex items-center justify-between gap-3 text-sm">{t.profile.accepting}
          <Switch checked={inbox.accepting} onCheckedChange={(v) => { const n = { ...inbox, accepting: v }; setInbox(n); saveInbox(n); }} /></label>
        <label className="flex items-center justify-between gap-3 text-sm">{t.profile.allowReveal}
          <Switch checked={inbox.allow_reveal_requests} onCheckedChange={(v) => { const n = { ...inbox, allow_reveal_requests: v }; setInbox(n); saveInbox(n); }} /></label>
      </section>

      <section className="card-surface flex items-center justify-between p-5">
        <span className="text-sm font-semibold">{t.profile.language}</span><LangSwitch />
      </section>

      {isStaff && (
        <Button asChild variant="outline" className="w-full"><Link to="/admin"><ShieldAlert aria-hidden />{t.profile.admin}</Link></Button>
      )}

      <section className="card-surface space-y-3 p-5">
        <h2 className="text-lg font-bold">{t.profile.data}</h2>
        <Button variant="secondary" className="w-full" onClick={exportData}><Download aria-hidden />{t.profile.export}</Button>
        <p className="text-xs text-muted-foreground">{t.profile.exportNote}</p>
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-sm text-destructive">{t.profile.deleteConfirm}</p>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} aria-label={t.profile.deleteAccount} />
          <Button variant="destructive" className="w-full" disabled={confirmText !== confirmWord} onClick={deleteAccount}>{t.profile.deleteAccount}</Button>
        </div>
      </section>

      <Button variant="ghost" className="w-full" onClick={signOut}><LogOut aria-hidden />{t.common.signOut}</Button>
      <PrivacyNotice />
      <FooterLinks />
    </div>
  );
}
