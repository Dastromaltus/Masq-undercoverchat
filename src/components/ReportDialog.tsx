import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";

export function ReportDialog({ messageId, trigger }: { messageId: string; trigger: ReactNode }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<keyof typeof t.report.reasons>("harassment");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    const { error } = await supabase.rpc("report_message", { _message_id: messageId, _reason: reason, _details: details.slice(0, 1000) });
    setBusy(false);
    if (error) { toast.error(t.common.error); return; }
    toast.success(t.inbox.reported);
    setOpen(false);
    setDetails("");
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-3xl">
        <DialogHeader><DialogTitle>{t.report.title}</DialogTitle></DialogHeader>
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold">{t.report.reason}</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(t.report.reasons) as (keyof typeof t.report.reasons)[]).map((r) => (
              <button key={r} type="button" onClick={() => setReason(r)} aria-pressed={reason === r}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${reason === r ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                {t.report.reasons[r]}
              </button>
            ))}
          </div>
        </fieldset>
        <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t.report.details} maxLength={1000} rows={3} />
        <Button variant="hero" onClick={submit} disabled={busy}>{t.report.submit}</Button>
      </DialogContent>
    </Dialog>
  );
}
