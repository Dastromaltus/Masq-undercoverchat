import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Compass, LockKeyhole, MapPin, UserRound, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { getMessageHints } from "@/lib/message-hints.functions";

export function MessageHints({ messageId }: { messageId: string }) {
  const { t } = useI18n();
  const { session } = useAuth();
  const getHints = useServerFn(getMessageHints);
  const q = useQuery({ queryKey: ["message-hints", session?.user.id, messageId], queryFn: () => getHints({ data: { messageId } }), staleTime: 0, gcTime: 0, retry: 1 });
  return (
    <section className="space-y-3 border-y border-border py-5" aria-labelledby="hints-title">
      <h2 id="hints-title" className="flex items-center gap-2 font-bold"><Compass className="size-5 text-primary" aria-hidden />{t.hints.title}</h2>
      {q.isPending ? <p className="text-sm text-muted-foreground">{t.common.loading}</p> : q.isError ? (
        <div className="space-y-2"><p role="alert" className="text-sm text-muted-foreground">{t.common.error}</p><Button variant="outline" size="sm" onClick={() => q.refetch()}><RefreshCw aria-hidden />{t.hints.retry}</Button></div>
      ) : q.data.state === "none" ? <p className="text-sm text-muted-foreground">{t.hints.none}</p> : q.data.state === "locked" ? (
        <>
          <p className="text-sm">{q.data.count} {t.hints.available}</p>
          <p className="text-sm text-muted-foreground">{t.hints.offer}</p>
          <Button asChild variant="hero" className="w-full"><Link to="/pricing"><LockKeyhole aria-hidden />{t.hints.unlock}</Link></Button>
          <p className="text-xs text-muted-foreground">{t.hints.disclaimer}</p>
        </>
      ) : (
        <>
          <dl className="grid gap-3 sm:grid-cols-2">
            {q.data.hints.gender && <div><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><UserRound className="size-4" aria-hidden />{t.hints.genderLabel}</dt><dd className="mt-1 font-semibold">{t.hints.genders[q.data.hints.gender]}</dd></div>}
            {q.data.hints.region && <div><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-4" aria-hidden />{t.hints.regionLabel}</dt><dd className="mt-1 font-semibold">{t.hints.regions[q.data.hints.region]}</dd></div>}
          </dl>
          <p className="text-xs text-muted-foreground">{t.hints.disclaimer}</p>
        </>
      )}
    </section>
  );
}