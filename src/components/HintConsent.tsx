import { useI18n } from "@/i18n";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HINT_GENDERS, HINT_REGIONS, type HintGender, type HintRegion } from "@/lib/message-hints";

export function HintConsent({ consent, gender, region, onConsent, onGender, onRegion }: {
  consent: boolean; gender: HintGender | ""; region: HintRegion | "";
  onConsent: (v: boolean) => void; onGender: (v: HintGender | "") => void; onRegion: (v: HintRegion | "") => void;
}) {
  const { t } = useI18n();
  return (
    <fieldset className="space-y-3 border-t border-border pt-4">
      <legend className="text-sm font-semibold">{t.hints.optional}</legend>
      <label className="flex items-start gap-3 text-sm"><Checkbox checked={consent} onCheckedChange={(v) => onConsent(v === true)} className="mt-0.5" /><span>{t.hints.consent}</span></label>
      {consent && <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><label id="hint-gender-label" className="text-xs text-muted-foreground">{t.hints.genderLabel}</label><Select value={gender || "none"} onValueChange={(v) => onGender(HINT_GENDERS.find((g) => g === v) ?? "")}><SelectTrigger aria-labelledby="hint-gender-label" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t.hints.notShared}</SelectItem>{HINT_GENDERS.map((g) => <SelectItem key={g} value={g}>{t.hints.genders[g]}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><label id="hint-region-label" className="text-xs text-muted-foreground">{t.hints.regionLabel}</label><Select value={region || "none"} onValueChange={(v) => onRegion(HINT_REGIONS.find((r) => r === v) ?? "")}><SelectTrigger aria-labelledby="hint-region-label" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t.hints.notShared}</SelectItem>{HINT_REGIONS.map((r) => <SelectItem key={r} value={r}>{t.hints.regions[r]}</SelectItem>)}</SelectContent></Select></div>
      </div>}
      <p className="text-xs text-muted-foreground">{t.hints.senderNote}</p>
    </fieldset>
  );
}