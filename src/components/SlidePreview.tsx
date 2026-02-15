import { StepResult, STRATEGY_STEPS, ClientInfo } from "@/lib/strategy-steps";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Copy, Check, Upload, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useMemo, useEffect } from "react";
import { toast } from "sonner";

interface SlidePreviewProps {
  stepId: number;
  result?: StepResult;
  clientInfo: ClientInfo;
  isLoading?: boolean;
  logoUrl?: string | null;
  onLogoUpload?: (url: string) => void;
  onLogoRemove?: () => void;
  onRegenerate?: () => void;
}

const sanitizeContent = (text: string): string => {
  return text.replace(/<\/?[a-zA-Z][^>]*>/g, '');
};

// Extract hex colors from content
const extractColors = (content: string): { hex: string; name: string; usage: string }[] => {
  const lines = content.split('\n');
  const colors: { hex: string; name: string; usage: string }[] = [];
  const hexRegex = /#([0-9A-Fa-f]{6})\b/;

  for (const line of lines) {
    const match = line.match(hexRegex);
    if (match) {
      const nameMatch = line.match(/:\s*#[0-9A-Fa-f]{6}\s*[–\-—]\s*(.+)/i) || 
                         line.match(/:\s*#[0-9A-Fa-f]{6}\s*\((.+?)\)/i) ||
                         line.match(/:\s*#[0-9A-Fa-f]{6}\s+(.+)/i);
      const labelMatch = line.match(/[-–•*]\s*(.+?):\s*#/i) || line.match(/\*\*(.+?)\*\*.*#/i);
      colors.push({
        hex: match[0],
        name: nameMatch?.[1]?.trim().substring(0, 30) || match[0],
        usage: labelMatch?.[1]?.trim() || "",
      });
    }
  }
  return colors;
};

// Extract font names from content for step 9
const extractFonts = (content: string): { name: string; type: string }[] => {
  const fonts: { name: string; type: string }[] = [];
  const seen = new Set<string>();
  
  // Match patterns like "**Font Titolo:** Playfair Display" or "Font Titolo: Playfair Display"
  const patterns = [
    /\*\*Font\s+(?:Titolo|Title|Heading|Display)[:\s]*\*\*[:\s]*([A-Z][a-zA-Z\s]+?)(?:\n|$|\.|\,|\s*[-–—])/gi,
    /\*\*Font\s+(?:Corpo|Body|Testo|Text|Paragrafo)[:\s]*\*\*[:\s]*([A-Z][a-zA-Z\s]+?)(?:\n|$|\.|\,|\s*[-–—])/gi,
    /Font\s+(?:Titolo|Title|Heading)[:\s]+([A-Z][a-zA-Z\s]+?)(?:\n|$|\.|\,|\s*[-–—])/gi,
    /Font\s+(?:Corpo|Body|Testo|Text)[:\s]+([A-Z][a-zA-Z\s]+?)(?:\n|$|\.|\,|\s*[-–—])/gi,
  ];
  
  const typeMap: Record<number, string> = { 0: "titolo", 1: "corpo", 2: "titolo", 3: "corpo" };
  
  patterns.forEach((pattern, idx) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const fontName = match[1].trim();
      if (fontName.length > 2 && fontName.length < 40 && !seen.has(fontName.toLowerCase())) {
        seen.add(fontName.toLowerCase());
        fonts.push({ name: fontName, type: typeMap[idx] });
      }
    }
  });
  
  // Also try to match standalone font names mentioned with Google Fonts context
  const googleFontPattern = /(?:Google\s+Fonts?[:\s]*)?(?:\*\*)?([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)(?:\*\*)?/g;
  const knownFonts = [
    "Playfair Display", "Montserrat", "Roboto", "Open Sans", "Lato", "Poppins",
    "Raleway", "Oswald", "Merriweather", "Nunito", "Source Sans Pro", "PT Sans",
    "Ubuntu", "Rubik", "Work Sans", "Inter", "DM Sans", "Outfit", "Manrope",
    "Cormorant Garamond", "Libre Baskerville", "Crimson Text", "EB Garamond",
    "Josefin Sans", "Quicksand", "Bitter", "Archivo", "Space Grotesk", "Sora",
    "Plus Jakarta Sans", "Cabin", "Karla", "Fira Sans", "Barlow", "Mulish",
    "Noto Sans", "Bebas Neue", "Dancing Script", "Pacifico", "Great Vibes",
    "Abril Fatface", "Righteous", "Fredoka One", "Lobster", "Comfortaa",
  ];
  
  for (const font of knownFonts) {
    if (content.includes(font) && !seen.has(font.toLowerCase())) {
      seen.add(font.toLowerCase());
      fonts.push({ name: font, type: "generico" });
    }
  }
  
  return fonts;
};

// Load Google Font dynamically
const loadGoogleFont = (fontName: string) => {
  const link = document.createElement("link");
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;600;700&display=swap`;
  link.rel = "stylesheet";
  // Check if already loaded
  const existing = document.querySelector(`link[href="${link.href}"]`);
  if (!existing) {
    document.head.appendChild(link);
  }
};

// Inline color swatch component for markdown rendering
const InlineColorSwatch = ({ hex }: { hex: string }) => (
  <span
    className="inline-block w-4 h-4 rounded border border-border align-middle mx-1 cursor-pointer hover:scale-125 transition-transform"
    style={{ backgroundColor: hex }}
    title={`Clicca per copiare ${hex}`}
    onClick={(e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(hex);
      toast.success(`${hex} copiato!`);
    }}
  />
);

// Process text children to add inline color swatches
const processTextWithColors = (text: string): (string | JSX.Element)[] => {
  const hexRegex = /#([0-9A-Fa-f]{6})\b/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = hexRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(text.slice(match.index, match.index + 7));
    parts.push(<InlineColorSwatch key={`color-${match.index}`} hex={match[0]} />);
    lastIndex = match.index + 7;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
};

export const SlidePreview = ({ stepId, result, clientInfo, isLoading, logoUrl, onLogoUpload, onLogoRemove, onRegenerate }: SlidePreviewProps) => {
  const stepDef = STRATEGY_STEPS.find((s) => s.id === stepId)!;
  const rawContent = result?.merged?.content || "";
  const mergedContent = sanitizeContent(rawContent);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = useMemo(() => {
    if (stepId === 8 && mergedContent) return extractColors(mergedContent);
    return [];
  }, [stepId, mergedContent]);

  const fonts = useMemo(() => {
    if (stepId === 9 && mergedContent) return extractFonts(mergedContent);
    return [];
  }, [stepId, mergedContent]);

  // Load Google Fonts for step 9
  useEffect(() => {
    fonts.forEach((f) => loadGoogleFont(f.name));
  }, [fonts]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mergedContent);
      setCopied(true);
      toast.success("Testo copiato negli appunti!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossibile copiare il testo");
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Seleziona un file immagine");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      onLogoUpload?.(url);
      toast.success("Logo caricato!");
    };
    reader.readAsDataURL(file);
  };

  // Check if content has hex colors (for inline rendering in step 8)
  const shouldRenderInlineColors = stepId === 8;

  // Custom text renderer that adds color swatches
  const renderTextWithSwatches = (children: React.ReactNode): React.ReactNode => {
    if (!shouldRenderInlineColors) return children;
    if (typeof children === "string") {
      const processed = processTextWithColors(children);
      if (processed.length === 1 && typeof processed[0] === "string") return children;
      return <>{processed}</>;
    }
    if (Array.isArray(children)) {
      return children.map((child, i) => {
        if (typeof child === "string") {
          const processed = processTextWithColors(child);
          if (processed.length === 1 && typeof processed[0] === "string") return child;
          return <span key={i}>{processed}</span>;
        }
        return child;
      });
    }
    return children;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="relative w-full rounded-2xl overflow-hidden shadow-elevated border border-border bg-card">
        {/* Slide header */}
        <div className="gradient-navy px-8 py-6 flex items-center justify-between">
          <div>
            <p className="text-gold-light/60 text-xs font-medium tracking-widest uppercase mb-1">
              {clientInfo.name} — Strategia {clientInfo.strategyType === "both" ? "Social & SEO" : clientInfo.strategyType === "social" ? "Social" : "SEO"}
            </p>
            <h2 className="font-serif text-2xl md:text-3xl text-primary-foreground">
              {stepDef.title}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {result && mergedContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-1.5"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="text-xs">{copied ? "Copiato!" : "Copia testo"}</span>
              </Button>
            )}
            <span className="text-xs font-mono text-primary-foreground/40 bg-primary-foreground/10 px-3 py-1.5 rounded-full">
              {stepId} / {STRATEGY_STEPS.length}
            </span>
          </div>
        </div>

        {/* Slide body */}
        <div className="p-8 md:p-12 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
              <p className="text-muted-foreground text-sm">Generazione e merge in corso...</p>
            </div>
          ) : !result ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground text-lg">In attesa di generazione...</p>
            </div>
          ) : (
            <>
              {/* Logo upload zone for step 7 */}
              {stepId === 7 && (
                <div className="mb-8 p-6 rounded-xl border-2 border-dashed border-accent/30 bg-accent/5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoFileChange}
                  />
                  {logoUrl ? (
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        <img
                          src={logoUrl}
                          alt="Logo caricato"
                          className="h-24 w-auto max-w-[200px] object-contain rounded-lg border border-border bg-card p-2"
                        />
                        <button
                          onClick={onLogoRemove}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground mb-1">Logo caricato</p>
                        <p className="text-xs text-muted-foreground">Il logo verrà usato come riferimento per le regole di utilizzo sottostanti.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 gap-1.5 text-xs"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-3 w-3" /> Cambia logo
                        </Button>
                      </div>
                      <div className="hidden md:grid grid-cols-2 gap-3">
                        <div className="w-20 h-20 rounded-lg bg-card border border-border flex items-center justify-center p-2">
                          <img src={logoUrl} alt="Su sfondo chiaro" className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="w-20 h-20 rounded-lg bg-foreground border border-border flex items-center justify-center p-2">
                          <img src={logoUrl} alt="Su sfondo scuro" className="max-h-full max-w-full object-contain brightness-0 invert" />
                        </div>
                        <span className="text-[9px] text-center text-muted-foreground">Sfondo chiaro</span>
                        <span className="text-[9px] text-center text-muted-foreground">Sfondo scuro</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex flex-col items-center gap-3 py-4 cursor-pointer hover:bg-accent/10 rounded-lg transition-colors"
                    >
                      <div className="h-14 w-14 rounded-2xl bg-accent/20 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-accent" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">Carica il logo del cliente</p>
                        <p className="text-xs text-muted-foreground mt-0.5">PNG, SVG o JPG — verrà usato per l'analisi visiva</p>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* Color swatches for step 8 */}
              {stepId === 8 && colors.length > 0 && (
                <div className="mb-8 p-6 rounded-xl border border-border bg-muted/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-lg text-foreground">Preview Palette</h3>
                    {onRegenerate && (
                      <Button variant="outline" size="sm" onClick={onRegenerate} className="gap-1.5 text-xs">
                        <RefreshCw className="h-3 w-3" /> Rigenera palette
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {colors.map((color, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <div
                          className="w-14 h-14 rounded-xl border border-border shadow-sm cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: color.hex }}
                          title={`${color.hex} — ${color.name}`}
                          onClick={() => {
                            navigator.clipboard.writeText(color.hex);
                            toast.success(`${color.hex} copiato!`);
                          }}
                        />
                        <span className="text-[10px] font-mono text-muted-foreground">{color.hex}</span>
                        {color.usage && (
                          <span className="text-[9px] text-muted-foreground text-center leading-tight max-w-[70px] truncate">{color.usage}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3 text-center">Clicca su un colore per copiare il codice HEX</p>
                </div>
              )}

              {/* Font preview for step 9 */}
              {stepId === 9 && fonts.length > 0 && (
                <div className="mb-8 p-6 rounded-xl border border-border bg-muted/30 space-y-6">
                  <h3 className="font-serif text-lg text-foreground">Anteprima Font</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fonts.map((font, i) => (
                      <div key={i} className="p-5 rounded-xl bg-card border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                            {font.type === "titolo" ? "Font Titolo" : font.type === "corpo" ? "Font Corpo" : "Font"}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {font.name}
                          </span>
                        </div>
                        <p
                          className="text-2xl mb-2 text-foreground"
                          style={{ fontFamily: `'${font.name}', sans-serif` }}
                        >
                          {clientInfo.name}
                        </p>
                        <p
                          className="text-base text-card-foreground leading-relaxed"
                          style={{ fontFamily: `'${font.name}', sans-serif` }}
                        >
                          La qualità è il nostro impegno quotidiano. Ogni dettaglio conta per offrire un'esperienza unica.
                        </p>
                        <p
                          className="text-sm text-muted-foreground mt-2"
                          style={{ fontFamily: `'${font.name}', sans-serif` }}
                        >
                          ABCDEFGHIJKLMNOPQRSTUVWXYZ · abcdefghijklmnopqrstuvwxyz · 0123456789
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <article className="slide-content">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="font-serif text-2xl md:text-3xl text-foreground mt-2 mb-6 pb-3 border-b-2 border-accent/30">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="font-serif text-xl md:text-2xl text-foreground mt-10 mb-4 pb-2 border-b border-border flex items-center gap-2">
                        <span className="inline-block w-1 h-6 rounded-full bg-accent" />
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="font-serif text-lg text-accent mt-6 mb-3 font-semibold">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="font-sans text-sm font-bold text-foreground uppercase tracking-wider mt-5 mb-2">
                        {children}
                      </h4>
                    ),
                    p: ({ children }) => (
                      <p className="text-card-foreground leading-relaxed mb-4 text-sm md:text-base">
                        {renderTextWithSwatches(children)}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-2 mb-6 ml-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="space-y-2 mb-6 ml-1 list-decimal list-inside">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="flex items-start gap-2.5 text-sm md:text-base text-card-foreground leading-relaxed">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                        <span>{renderTextWithSwatches(children)}</span>
                      </li>
                    ),
                    table: ({ children }) => (
                      <div className="my-6 rounded-xl border border-border overflow-x-auto shadow-sm">
                        <table className="w-full text-sm">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-muted">{children}</thead>
                    ),
                    th: ({ children }) => (
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-4 py-3 border-b border-border text-card-foreground align-top">
                        {renderTextWithSwatches(children)}
                      </td>
                    ),
                    tr: ({ children }) => (
                      <tr className="hover:bg-muted/50 transition-colors">{children}</tr>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-accent/40 bg-accent/5 rounded-r-lg pl-5 pr-4 py-3 my-5 italic text-muted-foreground">
                        {children}
                      </blockquote>
                    ),
                    hr: () => <hr className="my-8 border-border" />,
                    code: ({ children }) => (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-accent">
                        {children}
                      </code>
                    ),
                  }}
                  remarkPlugins={[remarkGfm]}
                >
                  {mergedContent}
                </ReactMarkdown>
              </article>
            </>
          )}
        </div>

        {/* Slide footer accent line */}
        <div className="h-1.5 gradient-gold" />
      </div>
    </div>
  );
};
