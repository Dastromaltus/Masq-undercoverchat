import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Spinner, EmptyState } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { meQuery } from "@/lib/me";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Back-office — Masq" }, { name: "description", content: "Modération de la plateforme." }, { property: "og:title", content: "Back-office — Masq" }, { property: "og:description", content: "Modération." }] }),
  component: Admin,
});

function Admin() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const me = useQuery(meQuery);
  const staff = !!me.data?.isStaff;
  const reports = useQuery({ queryKey: ["admin-reports"], enabled: staff, queryFn: async () => {
    const { data, error } = await supabase.rpc("admin_list_reports", { _status: "open" }); if (error) throw error; return data; } });
  const pending = useQuery({ queryKey: ["admin-pending"], enabled: staff, queryFn: async () => {
    const { data, error } = await supabase.rpc("admin_list_pending"); if (error) throw error; return data; } });
  const history = useQuery({ queryKey: ["admin-history"], enabled: staff, queryFn: async () => {
    const { data, error } = await supabase.rpc("admin_list_actions"); if (error) throw error; return data; } });

  if (me.isLoading) return <Spinner />;
  if (!staff) return <div className="pt-4"><EmptyState title={t.admin.forbidden} /></div>;

  const refresh = () => ["admin-reports", "admin-pending", "admin-history"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  async function resolve(id: string, action: "hide" | "restore" | "dismiss") {
    const { error } = await supabase.rpc("admin_resolve_report", { _report_id: id, _action: action, _note: "" });
    if (error) return toast.error(t.common.error); refresh();
  }
  async function setStatus(id: string, status: "published" | "hidden") {
    const { error } = await supabase.rpc("admin_set_message_status", { _message_id: id, _status: status, _note: "" });
    if (error) return toast.error(t.common.error); refresh();
  }

  return (
    <div className="space-y-5 pt-4">
      <h1 className="text-3xl font-extrabold">{t.admin.title}</h1>
      <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">{t.admin.noIdentity}<br />{t.admin.aiOff}</p>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">{t.admin.reports}</h2>
        {reports.isLoading ? <Spinner /> : !reports.data?.length ? <EmptyState title={t.admin.empty} /> : reports.data.map((r) => (
          <article key={r.id} className="card-surface space-y-2 p-4">
            <div className="flex gap-2 text-xs text-muted-foreground"><span>{t.report.reasons[r.reason as keyof typeof t.report.reasons] ?? r.reason}</span><span>{new Date(r.created_at).toLocaleString(lang)}</span><span>[{r.message_status}]</span></div>
            {r.message_body && <p className="whitespace-pre-wrap break-words text-sm">{r.message_body}</p>}
            {r.details && <p className="text-xs italic text-muted-foreground">{r.details}</p>}
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={() => resolve(r.id, "hide")}>{t.admin.hide}</Button>
              <Button size="sm" variant="secondary" onClick={() => resolve(r.id, "restore")}>{t.admin.restore}</Button>
              <Button size="sm" variant="ghost" onClick={() => resolve(r.id, "dismiss")}>{t.admin.dismiss}</Button>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">{t.admin.pending}</h2>
        {pending.isLoading ? <Spinner /> : !pending.data?.length ? <EmptyState title={t.admin.empty} /> : pending.data.map((m) => (
          <article key={m.id} className="card-surface space-y-2 p-4">
            <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setStatus(m.id, "published")}>{t.admin.publish}</Button>
              <Button size="sm" variant="destructive" onClick={() => setStatus(m.id, "hidden")}>{t.admin.hide}</Button>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">{t.admin.history}</h2>
        <ul className="card-surface divide-y divide-border text-sm">
          {(history.data ?? []).map((h) => (
            <li key={h.id} className="flex justify-between p-3"><span>{h.action}</span><span className="text-muted-foreground">{new Date(h.created_at).toLocaleString(lang)}</span></li>
          ))}
          {!history.data?.length && <li className="p-3 text-muted-foreground">{t.admin.empty}</li>}
        </ul>
      </section>
    </div>
  );
}
