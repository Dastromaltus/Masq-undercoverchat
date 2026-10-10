import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/i18n";
import { errorCode } from "@/lib/polls";

export const Route = createFileRoute("/_authenticated/polls/new")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Nouveau sondage — Masq" }, { name: "description", content: "Crée un sondage à votes masqués." }, { property: "og:title", content: "Nouveau sondage — Masq" }, { property: "og:description", content: "Crée un sondage." }] }),
  component: NewPoll,
});

type Vis = "always" | "after_vote" | "after_close";

function NewPoll() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [multiple, setMultiple] = useState(false);
  const [closesAt, setClosesAt] = useState("");
  const [vis, setVis] = useState<Vis>("after_vote");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (question.trim().length < 3 || question.trim().length > 200) { setError(t.polls.errors.BAD_QUESTION); return; }
    if (opts.length < 2 || opts.length > 6) { setError(t.polls.errors.BAD_OPTIONS); return; }
    if (vis === "after_close" && !closesAt) { setError(t.polls.errors.BAD_CLOSE); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("create_poll", {
      _question: question, _options: opts, _multiple: multiple,
      _closes_at: closesAt ? new Date(closesAt).toISOString() : (null as unknown as string), _visibility: vis,
    });
    setBusy(false);
    if (error) { const c = errorCode(error.message, t.polls.errors); setError(c ? t.polls.errors[c] : t.common.error); return; }
    navigate({ to: "/p/$id", params: { id: data as string } });
  }

  return (
    <form onSubmit={submit} className="space-y-4 pt-4">
      <h1 className="text-3xl font-extrabold">{t.polls.create}</h1>
      <div className="card-surface space-y-4 p-5">
        <div className="space-y-1.5"><Label htmlFor="q">{t.polls.question}</Label>
          <Input id="q" maxLength={200} value={question} onChange={(e) => setQuestion(e.target.value)} /></div>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">{t.polls.options}</legend>
          {options.map((o, i) => (
            <div key={i} className="flex gap-2">
              <Input maxLength={80} value={o} aria-label={`${t.polls.option} ${i + 1}`} placeholder={`${t.polls.option} ${i + 1}`}
                onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))} />
              {options.length > 2 && (
                <Button type="button" variant="ghost" size="icon" aria-label={t.common.delete} onClick={() => setOptions(options.filter((_, j) => j !== i))}><X /></Button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <Button type="button" variant="secondary" size="sm" onClick={() => setOptions([...options, ""])}><Plus aria-hidden />{t.polls.addOption}</Button>
          )}
        </fieldset>
        <label className="flex items-center justify-between text-sm">{t.polls.multiple}<Switch checked={multiple} onCheckedChange={setMultiple} /></label>
        <div className="space-y-1.5"><Label htmlFor="c">{t.polls.closesAt}</Label>
          <Input id="c" type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} /></div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t.polls.visibility}</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(t.polls.vis) as Vis[]).map((v) => (
              <button type="button" key={v} aria-pressed={vis === v} onClick={() => setVis(v)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${vis === v ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{t.polls.vis[v]}</button>
            ))}
          </div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="hero" className="w-full" disabled={busy}>{busy ? t.common.loading : t.polls.publish}</Button>
      </div>
      <p className="text-xs text-muted-foreground">{t.polls.privacy}</p>
    </form>
  );
}
