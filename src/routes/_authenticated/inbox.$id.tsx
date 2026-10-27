import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Archive, ArrowLeft, Ban, Flag, HandHeart, Share2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Spinner, EmptyState } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ReportDialog } from "@/components/ReportDialog";
import { useI18n } from "@/i18n";
import { MessageHints } from "@/components/MessageHints";

export const Route = createFileRoute("/_authenticated/inbox/$id")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },{ title: "Message — Masq" }, { name: "description", content: "Détail d’un message reçu." }, { property: "og:title", content: "Message — Masq" }, { property: "og:description", content: "Détail d’un message reçu." }] }),
  component: MessageDetail,
});

function MessageDetail() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["message", id],
    queryFn: async () => {
      // Only columns of the message itself. No sender data exists on this table.
      const { data, error } = await supabase.from("messages")
        .select("id, body, status, allow_reveal, archived, read_at, created_at").eq("id", id).maybeSingle();
      if (error) throw error;
      const replies = data
        ? (await supabase.from("message_replies").select("id, body, created_at").eq("message_id", id).order("created_at")).data ?? []
        : [];
      return data ? { ...data, replies } : null;
    },
  });

  useEffect(() => {
    if (q.data && !q.data.read_at) {
      supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", id).then(() => {
        qc.invalidateQueries({ queryKey: ["unread-count"] });
        qc.invalidateQueries({ queryKey: ["inbox"] });
      });
    }
  }, [q.data, id, qc]);

  if (q.isLoading) return <Spinner />;
  if (q.isError) return <EmptyState title={t.common.error} />;
  const m = q.data;
  if (!m) return <EmptyState title={t.inbox.notFound} />;

  const refresh = () => { qc.invalidateQueries({ queryKey: ["message", id] }); qc.invalidateQueries({ queryKey: ["inbox"] }); };

  async function toggleArchive() {
    if (!m) return;
    const { error } = await supabase.from("messages").update({ archived: !m.archived }).eq("id", id);
    if (error) { toast.error(t.common.error); return; }
    refresh();
  }
  async function remove() {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) { toast.error(t.common.error); return; }
    toast.success(t.inbox.deleted);
    qc.invalidateQueries({ queryKey: ["inbox"] });
    navigate({ to: "/inbox" });
  }
  async function block() {
    const { error } = await supabase.rpc("block_message_sender", { _message_id: id });
    if (error) { toast.error(t.common.error); return; }
    toast.success(t.inbox.blocked);
  }
  async function sendReply() {
    const body = reply.trim();
    if (!body || body.length > 1000) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setBusy(false); toast.error(t.common.error); return; }
    const { error } = await supabase.from("message_replies").insert({ message_id: id, author_id: u.user.id, body });
    setBusy(false);
    if (error) { toast.error(t.common.error); return; }
    setReply("");
    refresh();
  }

  return (
    <div className="space-y-4 pt-4">
      <Link to="/inbox" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" />{t.common.back}</Link>
      <article className="rounded-3xl bg-gradient-primary p-[1px] shadow-glow">
        <div className="rounded-3xl bg-card p-5">
          <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{new Date(m.created_at).toLocaleString(lang)}</span>
            {m.status === "pending" && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-warning">{t.inbox.pendingBadge}</span>}
          </div>
          <p className="whitespace-pre-wrap break-words font-display text-xl font-semibold">{m.body}</p>
        </div>
      </article>
      <MessageHints messageId={id} />

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={toggleArchive}><Archive aria-hidden />{m.archived ? t.inbox.unarchive : t.inbox.archive}</Button>
        <Button asChild variant="secondary"><Link to="/studio" search={{ kind: "message", id }}><Share2 aria-hidden />{t.inbox.share}</Link></Button>
        <ReportDialog messageId={id} trigger={<Button variant="secondary"><Flag aria-hidden />{t.inbox.report}</Button>} />
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="secondary"><Ban aria-hidden />{t.inbox.block}</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>{t.inbox.block}</AlertDialogTitle><AlertDialogDescription>{t.inbox.blockConfirm}</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>{t.common.cancel}</AlertDialogCancel><AlertDialogAction onClick={block}>{t.common.confirm}</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {m.allow_reveal && (
        <div className="card-surface flex items-center gap-3 p-4 text-sm">
          <HandHeart className="size-5 text-primary" aria-hidden />
          <span className="flex-1 text-muted-foreground">{t.inbox.revealSoon}</span>
          <Button size="sm" variant="outline" disabled>{t.inbox.revealRequest}</Button>
        </div>
      )}

      <section className="card-surface space-y-3 p-4">
        <h2 className="font-bold">{t.inbox.reply}</h2>
        {m.replies.map((r) => (
          <p key={r.id} className="whitespace-pre-wrap break-words rounded-2xl bg-accent/50 p-3 text-sm">{r.body}</p>
        ))}
        <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t.inbox.replyPlaceholder} maxLength={1000} rows={3} className="resize-none rounded-2xl" />
        <Button variant="hero" className="w-full" onClick={sendReply} disabled={busy || !reply.trim()}>{t.inbox.sendReply}</Button>
      </section>

      <AlertDialog>
        <AlertDialogTrigger asChild><Button variant="ghost" className="w-full text-destructive"><Trash2 aria-hidden />{t.common.delete}</Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t.common.delete}</AlertDialogTitle><AlertDialogDescription>{t.inbox.deleteConfirm}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t.common.cancel}</AlertDialogCancel><AlertDialogAction onClick={remove}>{t.common.delete}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
