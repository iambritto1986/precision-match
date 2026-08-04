import jsPDF from 'jspdf';
import { ResumeData } from '../types';

// ---------------------------------------------------------------------------
// Shared PDF drawing toolkit
// ---------------------------------------------------------------------------
// Every template below renders directly onto a jsPDF document using real text
// (never a screenshot), so the exported PDF is genuinely ATS-parseable while
// still visually mirroring the on-screen template the user picked.

// Default (Letter) page dimensions in points — kept as a fallback constant for
// call sites that don't have a `doc` handy yet. Once a jsPDF document exists,
// prefer pageWidth(doc)/pageHeight(doc) below, since those read the document's
// *actual* format (Letter or A4), so the same template renderers work for both.
export const PAGE_WIDTH = 612;  // Letter, points
export const PAGE_HEIGHT = 792;

export const pageWidth = (doc: jsPDF): number => (doc.internal.pageSize as any).getWidth();
export const pageHeight = (doc: jsPDF): number => (doc.internal.pageSize as any).getHeight();

export type RGB = [number, number, number];

export type PdfFontFamily = 'helvetica' | 'times' | 'courier';

// The Font Family dropdown stores values like 'font-mono', 'font-serif', etc.
// (or '' for "use the template's own default"). Two templates (Creative, Tech)
// and one (Academic) compare against bare literals like 'inter'/'merriweather'
// in the actual app, which never match the real 'font-xxx' values — so in
// practice those three templates always render in their hardcoded default
// font no matter what's selected. We replicate that exact behavior here so
// the PDF matches what's really on screen, not what the dropdown implies.
export const resolveFont = (fontFamily: string | undefined, fallback: PdfFontFamily): PdfFontFamily => {
  if (!fontFamily) return fallback;
  if (fontFamily.includes('mono')) return 'courier';
  if (fontFamily.includes('serif') || fontFamily.includes('roboto')) return 'times';
  return 'helvetica';
};

export interface Ctx {
  doc: jsPDF;
  y: number;
  marginX: number;
  marginTop: number;
  marginBottom: number;
  contentWidth: number;
  font: PdfFontFamily;
  // Optional override for what happens when content overflows the page.
  // Used to make a "right column" reuse pages an earlier-rendered "left
  // column" already created, instead of always appending a fresh page.
  onOverflow?: (ctx: Ctx) => void;
}

export const newCtx = (doc: jsPDF, opts: { marginX?: number; marginTop?: number; marginBottom?: number; font: PdfFontFamily; onOverflow?: (ctx: Ctx) => void; contentWidth?: number }): Ctx => {
  const marginX = opts.marginX ?? 50;
  return {
    doc,
    y: opts.marginTop ?? 50,
    marginX,
    marginTop: opts.marginTop ?? 50,
    marginBottom: opts.marginBottom ?? 50,
    contentWidth: opts.contentWidth ?? (pageWidth(doc) - marginX * 2),
    font: opts.font,
    onOverflow: opts.onOverflow,
  };
};

export const ensureSpace = (ctx: Ctx, needed: number) => {
  if (ctx.y + needed > pageHeight(ctx.doc) - ctx.marginBottom) {
    if (ctx.onOverflow) {
      ctx.onOverflow(ctx);
    } else {
      ctx.doc.addPage();
      ctx.y = ctx.marginTop;
    }
  }
};

// Renders a two-column block that may span multiple pages. The left column is
// drawn first (appending new pages as needed); the right column is then drawn
// starting from the same page, reusing whatever pages the left column already
// created before appending any further new ones — so the two columns stay
// side-by-side across as many pages as either one needs.
export const renderTwoColumns = (
  doc: jsPDF,
  startY: number,
  marginTop: number,
  marginBottom: number,
  left: { x: number; width: number; draw: (ctx: Ctx) => void },
  right: { x: number; width: number; draw: (ctx: Ctx) => void },
  font: PdfFontFamily
) => {
  const startPage = (doc.internal as any).getCurrentPageInfo().pageNumber;

  const leftCtx = newCtx(doc, { marginX: left.x, marginTop, marginBottom, font, contentWidth: left.width });
  leftCtx.y = startY;
  left.draw(leftCtx);
  const leftEndPage = (doc.internal as any).getCurrentPageInfo().pageNumber;

  doc.setPage(startPage);
  const rightCtx = newCtx(doc, { marginX: right.x, marginTop, marginBottom, font, contentWidth: right.width });
  rightCtx.y = startY;
  rightCtx.onOverflow = (ctx) => {
    const cur = (ctx.doc.internal as any).getCurrentPageInfo().pageNumber;
    if (cur < leftEndPage) {
      ctx.doc.setPage(cur + 1);
    } else {
      ctx.doc.addPage();
    }
    ctx.y = ctx.marginTop;
  };
  right.draw(rightCtx);
  const rightEndPage = (doc.internal as any).getCurrentPageInfo().pageNumber;

  // Leave the document positioned at the true last page of this block.
  doc.setPage(Math.max(leftEndPage, rightEndPage));
};

export const setColor = (doc: jsPDF, c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
export const setDraw = (doc: jsPDF, c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
export const setFill = (doc: jsPDF, c: RGB) => doc.setFillColor(c[0], c[1], c[2]);

export const text = (
  ctx: Ctx,
  str: string,
  x: number,
  opts: { size?: number; bold?: boolean; italic?: boolean; color?: RGB; align?: 'left' | 'center' | 'right'; maxWidth?: number; lineHeight?: number; font?: PdfFontFamily } = {}
): number => {
  if (!str) return 0;
  const size = opts.size ?? 10;
  const style = opts.bold && opts.italic ? 'bolditalic' : opts.bold ? 'bold' : opts.italic ? 'italic' : 'normal';
  const color = opts.color ?? [30, 30, 30];
  const lineHeight = opts.lineHeight ?? size * 1.35;
  ctx.doc.setFont(opts.font ?? ctx.font, style);
  ctx.doc.setFontSize(size);
  setColor(ctx.doc, color);
  const maxWidth = opts.maxWidth ?? ctx.contentWidth;
  const lines: string[] = ctx.doc.splitTextToSize(str, maxWidth);
  lines.forEach(line => {
    ensureSpace(ctx, lineHeight);
    ctx.doc.text(line, x, ctx.y, { align: opts.align ?? 'left' });
    ctx.y += lineHeight;
  });
  return lines.length * lineHeight;
};

export const bullet = (ctx: Ctx, str: string, x: number, opts: { size?: number; color?: RGB; indent?: number; markerColor?: RGB; marker?: string } = {}) => {
  if (!str) return;
  const size = opts.size ?? 9.5;
  const indent = opts.indent ?? 12;
  const lineHeight = size * 1.35;
  ctx.doc.setFont(ctx.font, 'normal');
  ctx.doc.setFontSize(size);
  const lines: string[] = ctx.doc.splitTextToSize(str, ctx.contentWidth - (x - ctx.marginX) - indent);
  lines.forEach((line, idx) => {
    ensureSpace(ctx, lineHeight);
    if (idx === 0) {
      setColor(ctx.doc, opts.markerColor ?? [150, 150, 150]);
      ctx.doc.text(opts.marker ?? '•', x, ctx.y);
    }
    setColor(ctx.doc, opts.color ?? [60, 60, 60]);
    ctx.doc.text(line, x + indent, ctx.y);
    ctx.y += lineHeight;
  });
};

export const hr = (ctx: Ctx, x1: number, x2: number, color: RGB = [200, 200, 200], width = 0.75) => {
  ensureSpace(ctx, 4);
  setDraw(ctx.doc, color);
  ctx.doc.setLineWidth(width);
  ctx.doc.line(x1, ctx.y, x2, ctx.y);
};

export const filledRect = (doc: jsPDF, x: number, y: number, w: number, h: number, color: RGB, radius = 0) => {
  setFill(doc, color);
  if (radius > 0) doc.roundedRect(x, y, w, h, radius, radius, 'F');
  else doc.rect(x, y, w, h, 'F');
};

// Splits sectionOrder into pages exactly the way App.tsx does for the on-screen
// preview: pageBreaks[sectionId] === true means "start a new page after this section".
export const paginate = (sectionOrder: string[], pageBreaks?: Record<string, boolean>): string[][] => {
  const pages: string[][] = [[]];
  let current = 0;
  sectionOrder.forEach(sec => {
    pages[current].push(sec);
    if (pageBreaks?.[sec]) {
      current++;
      pages.push([]);
    }
  });
  if (pages.length > 1 && pages[pages.length - 1].length === 0) pages.pop();
  return pages;
};

export const contactParts = (p: ResumeData['personalDetails']): string[] =>
  [p.email, p.phone, p.location, p.linkedin, p.website].filter((v): v is string => !!v);

// Draws an already-loaded image (data URI) into a square/rounded-square frame.
// (A perfect circular crop isn't attempted — see handoff notes — but the image
// is still placed, sized, and positioned to match each template's photo slot.)
export const drawImage = (doc: jsPDF, dataUrl: string | null | undefined, x: number, y: number, size: number, radius = 0) => {
  if (!dataUrl) return;
  try {
    if (radius > 0) {
      doc.saveGraphicsState();
      doc.roundedRect(x, y, size, size, radius, radius, null as any).clip();
      doc.addImage(dataUrl, 'JPEG', x, y, size, size, undefined, 'FAST');
      doc.restoreGraphicsState();
    } else {
      doc.addImage(dataUrl, 'JPEG', x, y, size, size, undefined, 'FAST');
    }
  } catch {
    // Unsupported image format/data — skip silently rather than break the export.
  }
};

export interface TemplateRenderOpts {
  sectionOrder: string[];
  fontFamily?: string;
  showProfilePicture: boolean;
  aestheticTheme?: 'default' | 'ocean' | 'sunset' | 'forest';
  pageBreaks?: Record<string, boolean>;
  profileImage?: string | null; // pre-resolved data URI, or null if unavailable
}

// A single line with left-aligned text and an optional right-aligned value —
// the "flex justify-between items-baseline" pattern used throughout the
// on-screen templates (e.g. company ... location, role ... duration).
export const justifyLine = (
  ctx: Ctx,
  left: string,
  right?: string,
  opts: { size?: number; bold?: boolean; italic?: boolean; color?: RGB; rightSize?: number; rightItalic?: boolean; rightBold?: boolean; rightColor?: RGB } = {}
) => {
  const size = opts.size ?? 10;
  const lineHeight = size * 1.35;
  ensureSpace(ctx, lineHeight);
  ctx.doc.setFont(ctx.font, opts.bold && opts.italic ? 'bolditalic' : opts.bold ? 'bold' : opts.italic ? 'italic' : 'normal');
  ctx.doc.setFontSize(size);
  setColor(ctx.doc, opts.color ?? [20, 20, 20]);
  ctx.doc.text(left || '', ctx.marginX, ctx.y);
  if (right) {
    const rSize = opts.rightSize ?? size;
    ctx.doc.setFont(ctx.font, opts.rightBold && opts.rightItalic ? 'bolditalic' : opts.rightBold ? 'bold' : opts.rightItalic ? 'italic' : 'normal');
    ctx.doc.setFontSize(rSize);
    setColor(ctx.doc, opts.rightColor ?? opts.color ?? [20, 20, 20]);
    ctx.doc.text(right, ctx.marginX + ctx.contentWidth, ctx.y, { align: 'right' });
  }
  ctx.y += lineHeight;
};

// Centered section header with a horizontal rule either underneath (Classic-style)
// or above+below as a filled bar (Executive-style).
/**
 * Centered section header on a tinted band.
 *
 * Mirrors the on-screen Executive markup:
 *   `text-center uppercase tracking-[0.15em] border-y border-gray-300 py-1 bg-gray-50`
 *
 * Three things were wrong before and are worth naming so they don't come back:
 *  1. `border-y` was never drawn — the PDF had a bare fill with no rules above
 *     or below, which is the most visible difference from the preview.
 *  2. The text was vertically mis-centred in the band. The baseline was placed
 *     relative to `ctx.y` rather than to the band, leaving the label sitting
 *     high. Baseline is now derived from the band's own top edge plus the cap
 *     height, so the label is optically centred at any font size.
 *  3. `tracking-[0.15em]` was ignored. jsPDF needs setCharSpace, and centring
 *     must then be computed manually because getTextWidth excludes char spacing.
 */
export const sectionHeaderCentered = (
  ctx: Ctx,
  title: string,
  opts: { bg?: RGB; size?: number; ruleColor?: RGB; tracking?: number; gapBefore?: number; gapAfter?: number } = {}
) => {
  const size = opts.size ?? 9.5;
  const padY = 3;                      // py-1 => 4px => 3pt above and below
  const barHeight = size + padY * 2;
  const gapBefore = opts.gapBefore ?? 10;
  // `mb-4` under the on-screen heading => 16px => 12pt of actual white space
  // between the band's bottom edge and the top of the next line's capitals.
  const gapAfter = opts.gapAfter ?? 12;
  // CRITICAL: ctx.y is a BASELINE, and `text()`/`justifyLine()` draw at it directly.
  // The following line's capitals rise above that baseline by roughly its cap
  // height, so leaving only `gapAfter` below the band made the next heading
  // ("Uber Technologies — Chicago") climb back through the bottom rule and
  // collide with the band. Reserve the ascent of a typical ~12pt following line
  // so `gapAfter` is real white space rather than space the glyphs eat into.
  const nextLineAscent = 8.6;

  ensureSpace(ctx, gapBefore + barHeight + gapAfter + nextLineAscent);
  ctx.y += gapBefore;

  const top = ctx.y - size;
  const bottom = top + barHeight;

  if (opts.bg) {
    filledRect(ctx.doc, ctx.marginX, top, ctx.contentWidth, barHeight, opts.bg);
  }

  // border-y: a hairline rule along the top and bottom edges of the band.
  const rule = opts.ruleColor ?? [209, 213, 219]; // gray-300
  setDraw(ctx.doc, rule);
  ctx.doc.setLineWidth(0.75);
  ctx.doc.line(ctx.marginX, top, ctx.marginX + ctx.contentWidth, top);
  ctx.doc.line(ctx.marginX, bottom, ctx.marginX + ctx.contentWidth, bottom);

  ctx.doc.setFont(ctx.font, 'bold');
  ctx.doc.setFontSize(size);
  setColor(ctx.doc, [30, 30, 30]);

  const label = title.toUpperCase();
  // 0.15em tracking, matching the on-screen class.
  const charSpace = opts.tracking ?? size * 0.15;
  const glyphWidth = ctx.doc.getTextWidth(label);
  // getTextWidth ignores charSpace, so add it back: one gap between each pair of
  // glyphs. Trailing space after the final glyph is not rendered, hence length-1.
  const trackedWidth = glyphWidth + charSpace * Math.max(label.length - 1, 0);
  const startX = ctx.marginX + (ctx.contentWidth - trackedWidth) / 2;
  // Optical centre: cap height of most serif/sans faces is ~0.7em, so half of
  // that below the band's vertical midpoint puts the glyphs visually centred.
  const baseline = top + barHeight / 2 + size * 0.35;

  ctx.doc.setCharSpace(charSpace);
  ctx.doc.text(label, startX, baseline);
  ctx.doc.setCharSpace(0);

  ctx.y = bottom + gapAfter + nextLineAscent;
};

export const sectionHeaderLeft = (ctx: Ctx, title: string, opts: { size?: number; color?: RGB; ruleColor?: RGB } = {}) => {
  const size = opts.size ?? 10.5;
  ensureSpace(ctx, size + 10);
  ctx.y += 8;
  ctx.doc.setFont(ctx.font, 'bold');
  ctx.doc.setFontSize(size);
  setColor(ctx.doc, opts.color ?? [20, 20, 20]);
  ctx.doc.text(title.toUpperCase(), ctx.marginX, ctx.y);
  ctx.y += 3;
  hr(ctx, ctx.marginX, ctx.marginX + ctx.contentWidth, opts.ruleColor ?? [200, 200, 200]);
  ctx.y += 11;
};
