import PptxGenJS from "pptxgenjs";
import { ClientInfo, STRATEGY_STEPS, StepResult } from "./strategy-steps";

const NAVY = "1a2744";
const GOLD = "c89b3c";
const WHITE = "FFFFFF";
const LIGHT_BG = "f5f5f7";
const TEXT_DARK = "1e2a3a";
const TEXT_MUTED = "6b7280";

export const exportToPptx = async (
  clientInfo: ClientInfo,
  results: Record<number, StepResult>
) => {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "CUSTOM", width: 13.33, height: 7.5 });
  pptx.layout = "CUSTOM";
  pptx.author = "Strategy AI";
  pptx.title = `${clientInfo.name} — Strategia`;

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: NAVY };
  titleSlide.addText(clientInfo.name, {
    x: 0.8, y: 2.0, w: 11.7, h: 1.5,
    fontSize: 44, fontFace: "Georgia", color: WHITE, bold: true,
  });
  titleSlide.addText(
    `Strategia ${clientInfo.strategyType === "both" ? "Social & SEO" : clientInfo.strategyType === "social" ? "Social" : "SEO"}`,
    { x: 0.8, y: 3.4, w: 11.7, h: 0.8, fontSize: 24, fontFace: "Georgia", color: GOLD }
  );
  titleSlide.addText(
    `${clientInfo.sector} · ${clientInfo.location}`,
    { x: 0.8, y: 4.4, w: 11.7, h: 0.5, fontSize: 14, fontFace: "Arial", color: TEXT_MUTED }
  );
  // Gold accent line
  titleSlide.addShape("rect" as any, { x: 0.8, y: 6.8, w: 2, h: 0.08, fill: { color: GOLD } });

  // Content slides
  for (const step of STRATEGY_STEPS) {
    const result = results[step.id];
    if (!result) continue;

    const content = result.merged?.content || result.gemini?.content || result.gpt?.content || "";
    if (!content.trim()) continue;

    // Split content into chunks of ~2000 chars for multiple slides if needed
    const chunks = splitContent(content, 2200);

    chunks.forEach((chunk, idx) => {
      const slide = pptx.addSlide();
      slide.background = { color: LIGHT_BG };

      // Header bar
      slide.addShape("rect" as any, { x: 0, y: 0, w: 13.33, h: 1.1, fill: { color: NAVY } });
      slide.addText(`${step.id}. ${step.title}${chunks.length > 1 ? ` (${idx + 1}/${chunks.length})` : ""}`, {
        x: 0.6, y: 0.15, w: 10, h: 0.8,
        fontSize: 22, fontFace: "Georgia", color: WHITE, bold: true,
      });
      slide.addText(clientInfo.name, {
        x: 10.5, y: 0.3, w: 2.5, h: 0.5,
        fontSize: 10, fontFace: "Arial", color: GOLD, align: "right",
      });

      // Content - clean markdown to plain text
      const plainText = markdownToPlain(chunk);
      slide.addText(plainText, {
        x: 0.6, y: 1.4, w: 12.1, h: 5.5,
        fontSize: 11, fontFace: "Arial", color: TEXT_DARK,
        valign: "top", lineSpacingMultiple: 1.3,
        wrap: true,
      });

      // Footer accent
      slide.addShape("rect" as any, { x: 0, y: 7.35, w: 13.33, h: 0.15, fill: { color: GOLD } });
    });
  }

  // Download
  const fileName = `${clientInfo.name.replace(/[^a-zA-Z0-9]/g, "_")}_Strategia.pptx`;
  await pptx.writeFile({ fileName });
};

function splitContent(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf("\n\n", maxLen);
    if (splitAt < maxLen * 0.3) splitAt = remaining.lastIndexOf("\n", maxLen);
    if (splitAt < maxLen * 0.3) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
  return chunks;
}

function markdownToPlain(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "") // headers
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/\*(.+?)\*/g, "$1") // italic
    .replace(/`(.+?)`/g, "$1") // inline code
    .replace(/^\s*[-*]\s+/gm, "• ") // bullets
    .replace(/^\s*\d+\.\s+/gm, (m) => m.trim() + " ") // numbered
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/\|/g, " | ") // table separators
    .replace(/^[-|:\s]+$/gm, "") // table dividers
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
