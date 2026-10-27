import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AlertTriangle, Copy, Download, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Spinner, EmptyState } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import { meQuery, publicUrl } from "@/lib/me";
import { pollQuery } from "@/lib/polls";
import { renderCard, hasPII, maskPII, type CardContent, type Template } from "@/lib/card";

export const Route = createFileRoute("/_authenticated/studio")({
  staticData: { sitemap: false },
  validateSearch: z.object({ kind: z.enum(["question", "message", "poll"]).default("question"), id: z.string().uuid().optional() }),
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },{ title: "Studio de partage — Masq" }, { name: "description", content: "Crée une carte story 1080×1920." }, { property: "og:title", content: "Studio — Masq" }, { property: "og:description", content: "Cartes pour stories Instagram." }] }),
  component: Studio,
});

function Studio() {
  const { kind, id } = Route.useSearch();
  const { t } = useI18n();
  const me = useQuery(meQuery);
  const msg = useQuery({
    queryKey: ["studio-msg", id], enabled: kind === "message" && !!id,
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("body").eq("id", id!).maybeSingle();
      const { data: r } = await supabase.from("message_replies").select("body").eq("message_id", id!).order("created_at", { ascending: false }).limit(1);
      return data ? { body: data.body, reply: r?.[0]?.body ?? "" } : null;
    },
  });
  const poll = useQuery({ ...pollQuery(id ?? "00000000-0000-0000-0000-000000000000"), enabled: kind === "poll" && !!id });

  const [tpl, setTpl] = useState<Template>("aurora");
  const [title, setTitle] = useState("");
  const [reply, setReply] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (kind === "question" && me.data) setTitle(me.data.settings.welcome_question);
    if (kind === "message" && msg.data) { setTitle(msg.data.body); setReply(msg.data.reply); }
    if (kind === "poll" && poll.data) setTitle(poll.data.question);
  }, [kind, me.data, msg.data, poll.data]);

  const username = me.data?.profile.username ?? "";
  const link = username ? publicUrl(username) : "";
  const content: CardContent = useMemo(() => {
    const footer = `${t.studio.askMe} masq · @${username}`;
    if (kind === "message") return { kind, title, reply: reply || t.studio.noReply, footer };
    if (kind === "poll") {
      const p = poll.data;
      const total = p?.total_ballots ?? 0;
      const rows = p?.results_visible ? p.options.map((o) => ({ label: o.label, pct: total ? Math.round(((o.count ?? 0) / total) * 100) : 0 })) : null;
      return { kind, title, rows, footer, hiddenLabel: t.studio.resultsHidden };
    }
    return { kind: "question", title, footer };
  }, [kind, title, reply, poll.data, username, t]);

  useEffect(() => { if (canvas.current && title) renderCard(canvas.current, content, tpl); }, [content, tpl, title]);

  const pii = hasPII(title) || hasPII(reply);
  const loading = me.isLoading || (kind === "message" && msg.isLoading) || (kind === "poll" && poll.isLoading);
  if (loading) return <Spinner />;
  if ((kind === "message" && !msg.data) || (kind === "poll" && !poll.data?.is_owner)) return <div className="pt-4"><EmptyState title={t.studio.pickSource} /></div>;

  const blob = () => new Promise<Blob | null>((res) => canvas.current?.toBlob(res, "image/png"));
  async function download() {
    const b = await blob(); if (!b) return;
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `masq-${kind}.png`; a.click(); URL.revokeObjectURL(a.href);
  }
  async function share() {
    const b = await blob(); if (!b) return;
    const file = new File([b], `masq-${kind}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file] }); } catch { /* cancelled */ } }
    else { await download(); }
  }
  const shareLink = kind === "poll" && id ? `${window.location.origin}/p/${id}` : link;

  return (
    <div className="space-y-4 pt-4">
      <h1 className="text-3xl font-extrabold">{t.studio.title}</h1>
      <p className="text-sm text-muted-foreground">{t.studio.kinds[kind]}</p>
      <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-3xl border border-border shadow-glow">
        <canvas ref={canvas} className="block h-auto w-full" style={{ aspectRatio: "9 / 16" }} aria-label={t.studio.title} />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t.studio.template}</legend>
        <div className="flex gap-2">
          {(Object.keys(t.studio.templates) as Template[]).map((k) => (
            <button key={k} type="button" aria-pressed={tpl === k} onClick={() => setTpl(k)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tpl === k ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{t.studio.templates[k]}</button>
          ))}
        </div>
      </fieldset>
      <div className="space-y-1.5"><Label htmlFor="ct">{t.studio.edit}</Label>
        <Textarea id="ct" rows={3} maxLength={500} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      {kind === "message" && (
        <div className="space-y-1.5"><Label htmlFor="cr">{t.studio.reply}</Label>
          <Textarea id="cr" rows={3} maxLength={1000} value={reply} onChange={(e) => setReply(e.target.value)} /></div>
      )}
      {pii && (
        <div role="alert" className="space-y-2 rounded-xl bg-warning/15 p-3 text-sm text-warning">
          <p className="flex gap-2"><AlertTriangle className="size-4 shrink-0" aria-hidden />{t.studio.piiWarn}</p>
          <Button size="sm" variant="secondary" onClick={() => { setTitle(maskPII(title)); setReply(maskPII(reply)); }}>{t.studio.maskPii}</Button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="hero" onClick={download}><Download aria-hidden />{t.studio.download}</Button>
        <Button variant="secondary" onClick={share}><Share2 aria-hidden />{t.studio.share}</Button>
        <Button variant="secondary" className="col-span-2" onClick={async () => { await navigator.clipboard.writeText(shareLink); toast.success(t.common.copied); }}>
          <Copy aria-hidden />{t.common.copy}
        </Button>
      </div>
      <p className="card-surface p-4 text-sm">{t.studio.help}</p>
      <p className="text-xs text-muted-foreground">{t.studio.noAuto}</p>
    </div>
  );
}
