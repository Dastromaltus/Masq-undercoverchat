import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, EyeOff, MessageCircle, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

export function ConversationPreview() {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const examples = t.landing.examples;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!playing || reducedMotion || hovered || focused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((current) => (current + 1) % examples.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [playing, reducedMotion, hovered, focused, examples.length, index]);

  const example = examples[index];
  if (!example) return null;
  const move = (step: number) => setIndex((current) => (current + step + examples.length) % examples.length);

  return (
    <section className="conversation-preview" aria-label={t.landing.example}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <MessageCircle className="size-4 text-mint" aria-hidden />{t.landing.example}
        </span>
        <span className="font-mono text-xs text-muted-foreground">0{index + 1} / 0{examples.length}</span>
      </div>
      <div className="conversation-stage" aria-live={playing && !reducedMotion ? "off" : "polite"}>
        <div key={index} className="conversation-frame">
          <article className="question-bubble">
            <span className="mb-3 flex items-center gap-2 text-xs font-semibold text-primary">
              <EyeOff className="size-4" aria-hidden />{t.landing.exampleSender}
            </span>
            <p className="font-display text-xl font-bold leading-snug">{example.question}</p>
          </article>
          <article className="answer-bubble">
            <span className="mb-2 block text-xs font-semibold text-mint">{t.inbox.reply}</span>
            <p className="text-sm font-medium leading-relaxed">{example.answer}</p>
          </article>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1.5" aria-hidden>{examples.map((_, position) => <span key={position} className={`preview-marker ${position === index ? "is-active" : ""}`} />)}</div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-9" title={t.landing.previousExample} aria-label={t.landing.previousExample} onClick={() => move(-1)}><ArrowLeft /></Button>
          <Button variant="ghost" size="icon" className="size-9" title={playing && !reducedMotion ? t.landing.pauseExamples : t.landing.playExamples} aria-label={playing && !reducedMotion ? t.landing.pauseExamples : t.landing.playExamples} aria-pressed={playing && !reducedMotion} disabled={reducedMotion} onClick={() => setPlaying((value) => !value)}>{playing && !reducedMotion ? <Pause /> : <Play />}</Button>
          <Button variant="ghost" size="icon" className="size-9" title={t.landing.nextExample} aria-label={t.landing.nextExample} onClick={() => move(1)}><ArrowRight /></Button>
        </div>
      </div>
    </section>
  );
}