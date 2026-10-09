// Story card renderer (1080×1920). Pure client-side canvas; nothing is uploaded.
export type Template = "aurora" | "midnight" | "candy";
export type CardContent =
  | { kind: "question"; title: string; footer: string }
  | { kind: "message"; title: string; reply: string; footer: string }
  | { kind: "poll"; title: string; rows: { label: string; pct: number }[] | null; footer: string; hiddenLabel: string };

export const W = 1080;
export const H = 1920;

// Card palettes are export artwork, not app UI theming.
const palettes: Record<Template, { bg: [string, string]; card: string; ink: string; sub: string; bar: string; barBg: string }> = {
  aurora: { bg: ["#7c3aed", "#db2777"], card: "#ffffff", ink: "#1a1033", sub: "#6b5b8a", bar: "#8b5cf6", barBg: "#ede9fe" },
  midnight: { bg: ["#0f0a1f", "#2e1065"], card: "#1c1430", ink: "#f5f3ff", sub: "#a99bd0", bar: "#a78bfa", barBg: "#2d2350" },
  candy: { bg: ["#f9a8d4", "#c4b5fd"], card: "#fff7fb", ink: "#3b0a2a", sub: "#8a4f72", bar: "#ec4899", barBg: "#fce7f3" },
};

const PII = [
  /[\w.+-]+@[\w-]+\.[\w.]+/g,
  /(?:\+?\d[\s.-]?){8,}\d/g,
  /(^|\s)@[\w.]{2,30}/g,
  /\bhttps?:\/\/\S+|\bwww\.\S+/gi,
];
export const hasPII = (s: string) => PII.some((r) => { r.lastIndex = 0; return r.test(s); });
export const maskPII = (s: string) => PII.reduce((acc, r) => acc.replace(r, (m) => (m.startsWith(" ") ? " " : "") + "•••"), s);

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number) {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; } else line = test;
    }
    lines.push(line);
  }
  if (lines.length > maxLines) { const l = lines.slice(0, maxLines); l[maxLines - 1] += "…"; return l; }
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}

export async function renderCard(canvas: HTMLCanvasElement, c: CardContent, tpl: Template) {
  try { await document.fonts.ready; } catch { /* ignore */ }
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const p = palettes[tpl];
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, p.bg[0]); g.addColorStop(1, p.bg[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  const pad = 90, cw = W - pad * 2, inner = cw - 120;
  ctx.font = "700 64px 'Bricolage Grotesque', sans-serif";
  const titleLines = wrap(ctx, c.title || " ", inner, 8);
  let bodyH = titleLines.length * 80;
  let replyLines: string[] = [];
  if (c.kind === "message") {
    ctx.font = "500 46px Manrope, sans-serif";
    replyLines = wrap(ctx, c.reply || " ", inner - 60, 8);
    bodyH += 80 + replyLines.length * 62 + 60;
  }
  if (c.kind === "poll") bodyH += 60 + (c.rows ? c.rows.length * 130 : 80);
  const ch = bodyH + 160;
  const cy = (H - ch) / 2;

  ctx.fillStyle = p.card; roundRect(ctx, pad, cy, cw, ch, 60);
  let y = cy + 120;
  ctx.fillStyle = p.ink; ctx.font = "700 64px 'Bricolage Grotesque', sans-serif"; ctx.textBaseline = "alphabetic";
  for (const l of titleLines) { ctx.fillText(l, pad + 60, y); y += 80; }

  if (c.kind === "message") {
    y += 40;
    ctx.fillStyle = p.barBg; roundRect(ctx, pad + 60, y - 10, inner, replyLines.length * 62 + 60, 36);
    ctx.fillStyle = p.ink; ctx.font = "500 46px Manrope, sans-serif"; y += 60;
    for (const l of replyLines) { ctx.fillText(l, pad + 90, y); y += 62; }
  }
  if (c.kind === "poll") {
    y += 40;
    if (!c.rows) { ctx.fillStyle = p.sub; ctx.font = "500 42px Manrope, sans-serif"; ctx.fillText(c.hiddenLabel, pad + 60, y + 30); }
    else for (const r of c.rows) {
      ctx.fillStyle = p.barBg; roundRect(ctx, pad + 60, y, inner, 100, 30);
      ctx.fillStyle = p.bar; if (r.pct > 0) roundRect(ctx, pad + 60, y, Math.max(60, (inner * r.pct) / 100), 100, 30);
      ctx.fillStyle = p.ink; ctx.font = "700 42px Manrope, sans-serif";
      const label = wrap(ctx, r.label, inner - 220, 1)[0];
      ctx.fillText(label, pad + 90, y + 64);
      ctx.textAlign = "right"; ctx.fillText(`${r.pct}%`, pad + 60 + inner - 30, y + 64); ctx.textAlign = "left";
      y += 130;
    }
  }

  // Masq branding (always on in free plan)
  ctx.textAlign = "center";
  ctx.fillStyle = tpl === "candy" ? p.ink : "#ffffff";
  ctx.font = "800 72px 'Bricolage Grotesque', sans-serif";
  ctx.fillText("masq", W / 2, H - 230);
  ctx.font = "500 38px Manrope, sans-serif";
  ctx.fillText(c.footer, W / 2, H - 165);
  ctx.textAlign = "left";
}
