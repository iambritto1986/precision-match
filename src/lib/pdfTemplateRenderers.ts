import jsPDF from 'jspdf';
import { ResumeData, TemplateId } from '../types';
import {
  PAGE_WIDTH, PAGE_HEIGHT, RGB, Ctx, newCtx, ensureSpace, text, bullet, hr, filledRect,
  paginate, contactParts, drawImage, resolveFont, justifyLine, sectionHeaderCentered,
  sectionHeaderLeft, renderTwoColumns, TemplateRenderOpts, setColor
} from './pdfTemplates';

const GRAY_900: RGB = [17, 24, 39];
const GRAY_700: RGB = [55, 65, 81];
const GRAY_600: RGB = [75, 85, 99];
const GRAY_500: RGB = [107, 114, 128];
const GRAY_400: RGB = [156, 163, 175];
const GRAY_300: RGB = [209, 213, 219];
const GRAY_200: RGB = [229, 231, 235];
const GRAY_100: RGB = [243, 244, 246];
const GRAY_50: RGB = [249, 250, 251];
const BLUE_600: RGB = [37, 99, 235];
const INDIGO_50: RGB = [238, 242, 255];
const INDIGO_100: RGB = [224, 231, 255];
const INDIGO_200: RGB = [199, 210, 254];
const INDIGO_400: RGB = [129, 140, 248];
const INDIGO_500: RGB = [99, 102, 241];
const INDIGO_600: RGB = [79, 70, 229];
const INDIGO_700: RGB = [67, 56, 202];
const INDIGO_900: RGB = [49, 46, 129];
const INDIGO_950: RGB = [30, 27, 75];
const EMERALD_100: RGB = [209, 250, 229];
const EMERALD_500: RGB = [16, 185, 129];
const EMERALD_600: RGB = [5, 150, 105];
const SLATE_900: RGB = [15, 23, 42];
const SLATE_800: RGB = [30, 41, 59];
const SLATE_700: RGB = [51, 65, 85];
const SLATE_600: RGB = [71, 85, 105];
const SLATE_500: RGB = [100, 116, 139];
const SLATE_400: RGB = [148, 163, 184];
const SLATE_300: RGB = [203, 213, 225];
const SLATE_200: RGB = [226, 232, 240];
const ACADEMIC_BG: RGB = [253, 252, 251];

type Renderer = (doc: jsPDF, data: ResumeData, opts: TemplateRenderOpts) => void;

const M = 50; // standard page margin in points

// ---------------------------------------------------------------------------
// CLASSIC — serif, single column, bordered section headers
// ---------------------------------------------------------------------------
const renderClassic: Renderer = (doc, data, opts) => {
  const font = resolveFont(opts.fontFamily, 'times');
  const { personalDetails: p } = data;
  const pages = paginate(opts.sectionOrder, opts.pageBreaks);

  pages.forEach((group, pageIdx) => {
    if (pageIdx > 0) doc.addPage();
    const ctx = newCtx(doc, { marginX: M, font });

    if (pageIdx === 0) {
      if (opts.showProfilePicture && opts.profileImage) {
        drawImage(doc, opts.profileImage, ctx.marginX, ctx.y - 6, 60);
      }
      const textX = opts.showProfilePicture && opts.profileImage ? ctx.marginX + 74 : ctx.marginX;
      const textWidth = ctx.contentWidth - (textX - ctx.marginX);
      const headerCtx = { ...ctx, marginX: textX, contentWidth: textWidth };
      text(headerCtx, p.name || 'Untitled', textX, { size: 22, bold: true, color: GRAY_900 });
      ctx.y = headerCtx.y;
      if (p.title) { text(ctx, p.title, textX, { size: 12.5, italic: true, color: GRAY_700, maxWidth: textWidth }); }
      const contact = contactParts(p).join('    ');
      if (contact) text(ctx, contact, textX, { size: 9, color: GRAY_600, maxWidth: textWidth });
      ctx.y = Math.max(ctx.y, ctx.marginTop + 66);
      ctx.y += 6;
      hr(ctx, ctx.marginX, ctx.marginX + ctx.contentWidth, GRAY_900, 1.5);
      ctx.y += 16;
    }

    group.forEach(sectionId => renderClassicSection(ctx, data, sectionId));
  });
};

const renderClassicSection = (ctx: Ctx, data: ResumeData, sectionId: string) => {
  const { personalDetails: p, experience, education, skills, projects, certifications, customSections } = data;
  if (sectionId === 'summary' && p.summary) {
    text(ctx, p.summary, ctx.marginX, { size: 10, color: GRAY_700 });
    ctx.y += 12;
    return;
  }
  if (sectionId === 'experience' && experience.length > 0) {
    sectionHeaderLeft(ctx, 'Professional Experience', { ruleColor: GRAY_300 });
    experience.forEach((exp, i) => {
      if (i > 0) ctx.y += 8;
      justifyLine(ctx, exp.company || '', exp.location, { size: 11, bold: true, rightItalic: true, rightSize: 9.5, rightColor: GRAY_600 });
      justifyLine(ctx, exp.role || '', exp.duration, { size: 9.5, italic: true, color: GRAY_700, rightSize: 9.5, rightColor: GRAY_700 });
      ctx.y += 2;
      exp.responsibilities.filter(r => r.trim()).forEach(r => bullet(ctx, r, ctx.marginX, { color: GRAY_700 }));
    });
    ctx.y += 4;
    return;
  }
  if (sectionId === 'skills' && skills.length > 0) {
    sectionHeaderLeft(ctx, 'Skills & Expertise', { ruleColor: GRAY_300 });
    skills.forEach(s => {
      const items = s.items.filter(i => i.trim()).join(', ');
      if (!items) return;
      ctx.doc.setFont(ctx.font, 'bold'); ctx.doc.setFontSize(9.5); setColor(ctx.doc, GRAY_900);
      const label = `${s.category}: `;
      const labelWidth = ctx.doc.getTextWidth(label);
      ensureSpace(ctx, 13);
      ctx.doc.text(label, ctx.marginX, ctx.y);
      ctx.doc.setFont(ctx.font, 'normal'); setColor(ctx.doc, GRAY_700);
      const wrapped: string[] = ctx.doc.splitTextToSize(items, ctx.contentWidth - labelWidth);
      wrapped.forEach((line, idx) => {
        if (idx > 0) ensureSpace(ctx, 13);
        ctx.doc.text(line, ctx.marginX + labelWidth, ctx.y);
        if (idx < wrapped.length - 1) ctx.y += 13;
      });
      ctx.y += 13;
    });
    ctx.y += 4;
    return;
  }
  if (sectionId === 'education' && education.length > 0) {
    sectionHeaderLeft(ctx, 'Education', { ruleColor: GRAY_300 });
    education.forEach((edu, i) => {
      if (i > 0) ctx.y += 6;
      justifyLine(ctx, edu.institution || '', edu.location, { size: 10.5, bold: true, rightSize: 9.5, rightColor: GRAY_700 });
      justifyLine(ctx, edu.degree || '', edu.duration, { size: 9.5, italic: true, color: GRAY_700, rightSize: 9.5, rightColor: GRAY_700 });
      if (edu.details) text(ctx, edu.details, ctx.marginX, { size: 9.5, color: GRAY_700 });
    });
    ctx.y += 4;
    return;
  }
  if (sectionId === 'projects' && projects && projects.length > 0) {
    sectionHeaderLeft(ctx, 'Selected Projects', { ruleColor: GRAY_300 });
    projects.forEach((proj, i) => {
      if (i > 0) ctx.y += 6;
      justifyLine(ctx, proj.name || '', proj.duration, { size: 10.5, bold: true, rightSize: 9.5, rightColor: GRAY_700 });
      text(ctx, proj.role || '', ctx.marginX, { size: 9.5, bold: true, italic: true, color: GRAY_700 });
      if (proj.description) text(ctx, proj.description, ctx.marginX, { size: 9.5, color: GRAY_700 });
    });
    ctx.y += 4;
    return;
  }
  if (sectionId === 'certifications' && certifications && certifications.length > 0) {
    sectionHeaderLeft(ctx, 'Certifications', { ruleColor: GRAY_300 });
    certifications.forEach((cert, i) => {
      if (i > 0) ctx.y += 6;
      justifyLine(ctx, cert.name || '', cert.date, { size: 10.5, bold: true, rightSize: 9.5, rightColor: GRAY_700 });
      text(ctx, cert.issuer || '', ctx.marginX, { size: 9.5, color: GRAY_600 });
    });
    ctx.y += 4;
    return;
  }
  const customSec = customSections?.find(c => c.id === sectionId);
  if (customSec && customSec.items.length > 0) {
    sectionHeaderLeft(ctx, customSec.title, { ruleColor: GRAY_300 });
    customSec.items.forEach((item, i) => {
      if (i > 0) ctx.y += 6;
      justifyLine(ctx, item.title || '', item.date, { size: 10.5, bold: true, rightSize: 9.5, rightColor: GRAY_700 });
      if (item.subtitle) text(ctx, item.subtitle, ctx.marginX, { size: 9.5, bold: true, italic: true, color: GRAY_700 });
      if (item.description) text(ctx, item.description, ctx.marginX, { size: 9.5, color: GRAY_700 });
    });
    ctx.y += 4;
  }
};

// ---------------------------------------------------------------------------
// MODERN — sans, 1/3 left sidebar (photo, contact, skills) + 2/3 right column
// ---------------------------------------------------------------------------
const renderModern: Renderer = (doc, data, opts) => {
  const font = resolveFont(opts.fontFamily, 'helvetica');
  const { personalDetails: p, skills } = data;
  const pages = paginate(opts.sectionOrder, opts.pageBreaks);
  const sidebarW = 170;
  const gap = 24;
  const mainX = M + sidebarW + gap;
  const mainW = PAGE_WIDTH - mainX - M;

  pages.forEach((group, pageIdx) => {
    if (pageIdx > 0) doc.addPage();
    const isFirst = pageIdx === 0;

    renderTwoColumns(doc, M, M, M,
      {
        x: M, width: sidebarW, draw: (ctx) => {
          filledRect(ctx.doc, 0, 0, sidebarW + M + gap / 2, PAGE_HEIGHT, GRAY_100);
          ctx.y = M + 4;
          if (isFirst) {
            if (opts.showProfilePicture && opts.profileImage) {
              drawImage(ctx.doc, opts.profileImage, ctx.marginX + sidebarW / 2 - 32, ctx.y, 64, 32);
              ctx.y += 74;
            }
            text(ctx, (p.name || '').toUpperCase(), ctx.marginX + sidebarW / 2, { size: 14, bold: true, color: GRAY_900, align: 'center', maxWidth: sidebarW });
            if (p.title) text(ctx, p.title.toUpperCase(), ctx.marginX + sidebarW / 2, { size: 8.5, bold: true, color: BLUE_600, align: 'center', maxWidth: sidebarW });
            ctx.y += 8;
            hr(ctx, ctx.marginX, ctx.marginX + sidebarW, GRAY_300);
            ctx.y += 4;
            text(ctx, 'CONTACT', ctx.marginX, { size: 8, bold: true, color: GRAY_400 });
            contactParts(p).forEach(c => text(ctx, c, ctx.marginX, { size: 8.5, color: GRAY_700, maxWidth: sidebarW }));
            ctx.y += 6;
          }
          if (skills.length > 0 && group.includes('skills')) {
            text(ctx, 'SKILLS', ctx.marginX, { size: 8, bold: true, color: GRAY_400 });
            skills.forEach(s => {
              text(ctx, s.category, ctx.marginX, { size: 9, bold: true, color: GRAY_900, maxWidth: sidebarW });
              const items = s.items.filter(i => i.trim()).join(', ');
              if (items) text(ctx, items, ctx.marginX, { size: 8.5, color: GRAY_600, maxWidth: sidebarW });
              ctx.y += 4;
            });
          }
        }
      },
      {
        x: mainX, width: mainW, draw: (ctx) => {
          group.filter(s => s !== 'skills').forEach(sectionId => renderModernSection(ctx, data, sectionId));
        }
      },
      font
    );
  });
};

const renderModernSection = (ctx: Ctx, data: ResumeData, sectionId: string) => {
  const { personalDetails: p, experience, education, projects, certifications, customSections } = data;
  const header = (title: string) => {
    ensureSpace(ctx, 20);
    ctx.doc.setFont(ctx.font, 'bold'); ctx.doc.setFontSize(13); setColor(ctx.doc, GRAY_900);
    ctx.doc.text(title, ctx.marginX, ctx.y);
    ctx.y += 12;
  };
  if (sectionId === 'summary' && p.summary) { header('Profile'); text(ctx, p.summary, ctx.marginX, { size: 9.5, color: GRAY_700 }); ctx.y += 10; return; }
  if (sectionId === 'experience' && experience.length > 0) {
    header('Experience');
    experience.forEach((exp, i) => {
      if (i > 0) ctx.y += 8;
      text(ctx, exp.role || '', ctx.marginX, { size: 10.5, bold: true, color: GRAY_900 });
      text(ctx, [exp.company, exp.duration].filter(Boolean).join('   •   '), ctx.marginX, { size: 9, color: GRAY_500 });
      ctx.y += 2;
      exp.responsibilities.filter(r => r.trim()).forEach(r => bullet(ctx, r, ctx.marginX, { color: GRAY_700, markerColor: BLUE_600 }));
    });
    ctx.y += 8; return;
  }
  if (sectionId === 'education' && education.length > 0) {
    header('Education');
    education.forEach(e => {
      text(ctx, e.degree || '', ctx.marginX, { size: 10, bold: true, color: GRAY_900 });
      text(ctx, [e.institution, e.duration].filter(Boolean).join('   •   '), ctx.marginX, { size: 9, color: GRAY_500 });
      ctx.y += 4;
    });
    ctx.y += 6; return;
  }
  if (sectionId === 'projects' && projects && projects.length > 0) {
    header('Projects');
    projects.forEach(proj => {
      text(ctx, proj.name || '', ctx.marginX, { size: 10, bold: true, color: GRAY_900 });
      text(ctx, [proj.role, proj.duration].filter(Boolean).join('   •   '), ctx.marginX, { size: 9, color: GRAY_500 });
      if (proj.description) text(ctx, proj.description, ctx.marginX, { size: 9, color: GRAY_700 });
      ctx.y += 6;
    });
    ctx.y += 4; return;
  }
  if (sectionId === 'certifications' && certifications && certifications.length > 0) {
    header('Certifications');
    certifications.forEach(cert => {
      text(ctx, cert.name || '', ctx.marginX, { size: 10, bold: true, color: GRAY_900 });
      text(ctx, [cert.issuer, cert.date].filter(Boolean).join('   •   '), ctx.marginX, { size: 9, color: GRAY_500 });
      ctx.y += 4;
    });
    ctx.y += 4; return;
  }
  const customSec = customSections?.find(c => c.id === sectionId);
  if (customSec && customSec.items.length > 0) {
    header(customSec.title);
    customSec.items.forEach(item => {
      text(ctx, item.title || '', ctx.marginX, { size: 10, bold: true, color: GRAY_900 });
      const meta = [item.subtitle, item.date].filter(Boolean).join('   •   ');
      if (meta) text(ctx, meta, ctx.marginX, { size: 9, color: GRAY_500 });
      if (item.description) text(ctx, item.description, ctx.marginX, { size: 9, color: GRAY_700 });
      ctx.y += 6;
    });
  }
};

// ---------------------------------------------------------------------------
// MINIMALIST — mono default, right-aligned labels + wide content column
// ---------------------------------------------------------------------------
const renderMinimalist: Renderer = (doc, data, opts) => {
  const font = resolveFont(opts.fontFamily, 'courier');
  const { personalDetails: p } = data;
  const pages = paginate(opts.sectionOrder, opts.pageBreaks);
  const labelW = 90;
  const contentX = M + labelW + 16;
  const contentW = PAGE_WIDTH - contentX - M;

  pages.forEach((group, pageIdx) => {
    if (pageIdx > 0) doc.addPage();
    const ctx = newCtx(doc, { marginX: M, font });

    if (pageIdx === 0) {
      if (opts.showProfilePicture && opts.profileImage) drawImage(doc, opts.profileImage, ctx.marginX, ctx.y, 50);
      const tx = opts.showProfilePicture && opts.profileImage ? ctx.marginX + 62 : ctx.marginX;
      text(ctx, p.name || 'Untitled', tx, { size: 22, color: GRAY_900, lineHeight: 24 });
      if (p.title) text(ctx, p.title, tx, { size: 9.5, bold: true, color: GRAY_500 });
      const contact = contactParts(p).slice(0, 3).join('    ');
      if (contact) text(ctx, contact, tx, { size: 8.5, color: GRAY_400 });
      ctx.y += 18;
    }

    group.forEach(sectionId => renderMinimalistSection(ctx, data, sectionId, labelW, contentX, contentW));
  });
};

const minimalistLabel = (ctx: Ctx, label: string, labelW: number) => {
  ensureSpace(ctx, 12);
  ctx.doc.setFont(ctx.font, 'bold'); ctx.doc.setFontSize(9); setColor(ctx.doc, GRAY_400);
  ctx.doc.text(label.toUpperCase(), ctx.marginX + labelW, ctx.y, { align: 'right' });
};

const renderMinimalistSection = (ctx: Ctx, data: ResumeData, sectionId: string, labelW: number, contentX: number, contentW: number) => {
  const { personalDetails: p, experience, education, skills, projects, certifications, customSections } = data;
  const contentCtx: Ctx = { ...ctx, marginX: contentX, contentWidth: contentW };

  if (sectionId === 'summary' && p.summary) {
    minimalistLabel(ctx, 'Summary', labelW);
    text(contentCtx, p.summary, contentX, { size: 8.5, color: GRAY_600, lineHeight: 12 });
    ctx.y = Math.max(ctx.y, contentCtx.y) + 14; return;
  }
  if (sectionId === 'experience' && experience.length > 0) {
    minimalistLabel(ctx, 'Experience', labelW);
    experience.forEach((exp, i) => {
      if (i > 0) contentCtx.y += 10;
      justifyLine(contentCtx, `${exp.role || ''} @ ${exp.company || ''}`, exp.duration, { size: 9, bold: true, color: GRAY_900, rightColor: GRAY_400, rightSize: 8 });
      contentCtx.y += 2;
      exp.responsibilities.filter(r => r.trim()).forEach(r => bullet(contentCtx, r, contentX, { size: 8.5, color: GRAY_600, marker: '-', markerColor: GRAY_300 }));
    });
    ctx.y = Math.max(ctx.y, contentCtx.y) + 14; return;
  }
  if (sectionId === 'skills' && skills.length > 0) {
    minimalistLabel(ctx, 'Skills', labelW);
    skills.forEach(s => {
      const items = s.items.filter(i => i.trim()).join(', ');
      text(contentCtx, `${s.category}: ${items}`, contentX, { size: 8.5, color: GRAY_600 });
    });
    ctx.y = Math.max(ctx.y, contentCtx.y) + 14; return;
  }
  if (sectionId === 'education' && education.length > 0) {
    minimalistLabel(ctx, 'Education', labelW);
    education.forEach((e, i) => {
      if (i > 0) contentCtx.y += 6;
      text(contentCtx, e.degree || '', contentX, { size: 8.5, bold: true, color: GRAY_900 });
      text(contentCtx, `${e.institution || ''} (${e.duration || ''})`, contentX, { size: 8.5, color: GRAY_600 });
    });
    ctx.y = Math.max(ctx.y, contentCtx.y) + 14; return;
  }
  if (sectionId === 'projects' && projects && projects.length > 0) {
    minimalistLabel(ctx, 'Projects', labelW);
    projects.forEach((pr, i) => {
      if (i > 0) contentCtx.y += 6;
      justifyLine(contentCtx, pr.name || '', pr.duration, { size: 8.5, bold: true, color: GRAY_900, rightColor: GRAY_600, rightSize: 8.5 });
      if (pr.role) text(contentCtx, pr.role, contentX, { size: 8.5, italic: true, color: GRAY_500 });
      if (pr.description) text(contentCtx, pr.description, contentX, { size: 8.5, color: GRAY_600 });
    });
    ctx.y = Math.max(ctx.y, contentCtx.y) + 14; return;
  }
  if (sectionId === 'certifications' && certifications && certifications.length > 0) {
    minimalistLabel(ctx, 'Certifications', labelW);
    certifications.forEach((c, i) => {
      if (i > 0) contentCtx.y += 6;
      justifyLine(contentCtx, c.name || '', c.date, { size: 8.5, bold: true, color: GRAY_900, rightColor: GRAY_600, rightSize: 8.5 });
      if (c.issuer) text(contentCtx, c.issuer, contentX, { size: 8.5, italic: true, color: GRAY_500 });
    });
    ctx.y = Math.max(ctx.y, contentCtx.y) + 14; return;
  }
  const customSec = customSections?.find(c => c.id === sectionId);
  if (customSec && customSec.items.length > 0) {
    minimalistLabel(ctx, customSec.title, labelW);
    customSec.items.forEach((item, i) => {
      if (i > 0) contentCtx.y += 6;
      justifyLine(contentCtx, item.title || '', item.date, { size: 8.5, bold: true, color: GRAY_900, rightColor: GRAY_600, rightSize: 8.5 });
      if (item.subtitle) text(contentCtx, item.subtitle, contentX, { size: 8.5, italic: true, color: GRAY_500 });
      if (item.description) text(contentCtx, item.description, contentX, { size: 8.5, color: GRAY_600 });
    });
    ctx.y = Math.max(ctx.y, contentCtx.y) + 14;
  }
};

// ---------------------------------------------------------------------------
// EXECUTIVE — serif, centered header, centered bar-style section headers
// ---------------------------------------------------------------------------
const renderExecutive: Renderer = (doc, data, opts) => {
  const font = resolveFont(opts.fontFamily, 'times');
  const { personalDetails: p } = data;
  const pages = paginate(opts.sectionOrder, opts.pageBreaks);

  pages.forEach((group, pageIdx) => {
    if (pageIdx > 0) doc.addPage();
    const ctx = newCtx(doc, { marginX: M, font });

    if (pageIdx === 0) {
      if (opts.showProfilePicture && opts.profileImage) {
        drawImage(doc, opts.profileImage, PAGE_WIDTH / 2 - 27, ctx.y, 54, 27);
        ctx.y += 62;
      }
      const cx = ctx.marginX + ctx.contentWidth / 2;
      text(ctx, p.name || 'Untitled', cx, { size: 21, color: GRAY_900, align: 'center' });
      if (p.title) text(ctx, p.title.toUpperCase(), cx, { size: 9, color: GRAY_500, align: 'center' });
      const contact = contactParts(p).join('   •   ');
      if (contact) text(ctx, contact, cx, { size: 8.5, color: GRAY_600, align: 'center' });
      ctx.y += 12;
    }

    group.forEach(sectionId => renderExecutiveSection(ctx, data, sectionId));
  });
};

const renderExecutiveSection = (ctx: Ctx, data: ResumeData, sectionId: string) => {
  const { personalDetails: p, experience, education, skills, projects, certifications, customSections } = data;
  if (sectionId === 'summary' && p.summary) {
    text(ctx, p.summary, ctx.marginX + ctx.contentWidth / 2, { size: 9.5, color: GRAY_700, align: 'center' });
    ctx.y += 10; return;
  }
  if (sectionId === 'experience' && experience.length > 0) {
    sectionHeaderCentered(ctx, 'Professional Experience', { bg: GRAY_50 });
    experience.forEach((exp, i) => {
      if (i > 0) ctx.y += 8;
      justifyLine(ctx, `${exp.company || ''}${exp.location ? `  —  ${exp.location}` : ''}`, exp.duration, { size: 10.5, bold: true, rightBold: true, rightSize: 9.5 });
      text(ctx, exp.role || '', ctx.marginX, { size: 9.5, bold: true, color: GRAY_900 });
      ctx.y += 2;
      exp.responsibilities.filter(r => r.trim()).forEach(r => bullet(ctx, r, ctx.marginX, { color: GRAY_700 }));
    });
    ctx.y += 4; return;
  }
  if (sectionId === 'education' && education.length > 0) {
    sectionHeaderCentered(ctx, 'Education', { bg: GRAY_50 });
    education.forEach(e => {
      justifyLine(ctx, e.institution || '', e.location, { size: 9.5, bold: true, rightSize: 9.5 });
      justifyLine(ctx, e.degree || '', e.duration, { size: 9.5, italic: true, color: GRAY_700, rightColor: GRAY_600, rightSize: 9 });
      ctx.y += 4;
    });
    return;
  }
  if (sectionId === 'skills' && skills.length > 0) {
    sectionHeaderCentered(ctx, 'Core Competencies', { bg: GRAY_50 });
    skills.forEach(s => {
      const items = s.items.filter(i => i.trim()).join(', ');
      ctx.doc.setFont(ctx.font, 'bold'); ctx.doc.setFontSize(9.5); setColor(ctx.doc, GRAY_900);
      const label = `${s.category}: `;
      const lw = ctx.doc.getTextWidth(label);
      ensureSpace(ctx, 13);
      ctx.doc.text(label, ctx.marginX, ctx.y);
      ctx.doc.setFont(ctx.font, 'normal'); setColor(ctx.doc, GRAY_700);
      const wrapped: string[] = ctx.doc.splitTextToSize(items, ctx.contentWidth - lw);
      wrapped.forEach((line, idx) => { if (idx > 0) ensureSpace(ctx, 13); ctx.doc.text(line, ctx.marginX + lw, ctx.y); if (idx < wrapped.length - 1) ctx.y += 13; });
      ctx.y += 13;
    });
    ctx.y += 4; return;
  }
  if (sectionId === 'projects' && projects && projects.length > 0) {
    sectionHeaderCentered(ctx, 'Selected Projects', { bg: GRAY_50 });
    projects.forEach((proj, i) => {
      if (i > 0) ctx.y += 6;
      justifyLine(ctx, proj.name || '', proj.duration, { size: 10.5, bold: true, rightBold: true, rightSize: 9.5 });
      text(ctx, proj.role || '', ctx.marginX, { size: 9.5, bold: true, color: GRAY_900 });
      if (proj.description) text(ctx, proj.description, ctx.marginX, { size: 9.5, color: GRAY_700 });
    });
    ctx.y += 4; return;
  }
  if (sectionId === 'certifications' && certifications && certifications.length > 0) {
    sectionHeaderCentered(ctx, 'Certifications', { bg: GRAY_50 });
    certifications.forEach(cert => {
      justifyLine(ctx, cert.name || '', cert.date, { size: 9.5, bold: true, rightSize: 9.5 });
      text(ctx, cert.issuer || '', ctx.marginX, { size: 9.5, italic: true, color: GRAY_700 });
      ctx.y += 4;
    });
    return;
  }
  const customSec = customSections?.find(c => c.id === sectionId);
  if (customSec && customSec.items.length > 0) {
    sectionHeaderCentered(ctx, customSec.title, { bg: GRAY_50 });
    customSec.items.forEach((item, i) => {
      if (i > 0) ctx.y += 6;
      justifyLine(ctx, item.title || '', item.date, { size: 10.5, bold: true, rightBold: true, rightSize: 9.5 });
      if (item.subtitle) text(ctx, item.subtitle, ctx.marginX, { size: 9.5, bold: true, color: GRAY_900 });
      if (item.description) text(ctx, item.description, ctx.marginX, { size: 9.5, color: GRAY_700 });
    });
    ctx.y += 4;
  }
};

// ---------------------------------------------------------------------------
// AESTHETIC — sans, playful; left column (skills/education), right column
// (summary/experience/projects/certifications/custom), theme-tinted accents
// ---------------------------------------------------------------------------
const AESTHETIC_THEMES: Record<string, { accent: RGB; icon: RGB; iconBg: RGB }> = {
  default: { accent: [219, 39, 119], icon: [219, 39, 119], iconBg: [252, 231, 243] },
  ocean: { accent: [2, 132, 199], icon: [2, 132, 199], iconBg: [224, 242, 254] },
  sunset: { accent: [234, 88, 12], icon: [234, 88, 12], iconBg: [255, 237, 213] },
  forest: { accent: [5, 150, 105], icon: [5, 150, 105], iconBg: [209, 250, 229] },
};

const renderAesthetic: Renderer = (doc, data, opts) => {
  const font = resolveFont(opts.fontFamily, 'helvetica');
  const theme = AESTHETIC_THEMES[opts.aestheticTheme || 'default'] || AESTHETIC_THEMES.default;
  const { personalDetails: p, skills, education } = data;
  const pages = paginate(opts.sectionOrder, opts.pageBreaks);
  const leftW = 150;
  const gap = 26;
  const rightX = M + leftW + gap;
  const rightW = PAGE_WIDTH - rightX - M;

  pages.forEach((group, pageIdx) => {
    if (pageIdx > 0) doc.addPage();
    let startY = M;

    if (pageIdx === 0) {
      const headCtx = newCtx(doc, { marginX: M, font });
      const hasPhoto = !!(opts.showProfilePicture && opts.profileImage);
      if (hasPhoto) {
        drawImage(doc, opts.profileImage, headCtx.marginX, headCtx.y, 56, 14);
      }
      const tx = hasPhoto ? headCtx.marginX + 70 : headCtx.marginX;
      const tw = headCtx.contentWidth - (tx - headCtx.marginX);
      const nameY = headCtx.y;
      text(headCtx, (p.name || '').toUpperCase(), tx, { size: 20, bold: true, color: GRAY_900, maxWidth: tw });
      if (p.title) text(headCtx, p.title, tx, { size: 11, bold: true, color: theme.accent, maxWidth: tw });
      const contact = contactParts(p).join('    ');
      if (contact) text(headCtx, contact, tx, { size: 8, color: GRAY_600, maxWidth: tw });
      if (hasPhoto) headCtx.y = Math.max(headCtx.y, nameY + 64);
      headCtx.y += 8;
      hr(headCtx, M, PAGE_WIDTH - M, GRAY_900, 1.5);
      startY = headCtx.y + 10;
    }

    renderTwoColumns(doc, startY, M, M,
      {
        x: M, width: leftW, draw: (ctx) => {
          if (group.includes('skills') && skills.length > 0) {
            text(ctx, 'SKILLS', ctx.marginX, { size: 10.5, bold: true, color: GRAY_900 });
            skills.forEach(s => {
              text(ctx, s.category.toUpperCase(), ctx.marginX, { size: 7.5, bold: true, color: GRAY_400 });
              const items = s.items.join(', ');
              if (items) text(ctx, items, ctx.marginX, { size: 8.5, color: GRAY_700 });
              ctx.y += 5;
            });
            ctx.y += 6;
          }
          if (group.includes('education') && education.length > 0) {
            text(ctx, 'EDU', ctx.marginX, { size: 10.5, bold: true, color: GRAY_900 });
            education.forEach(e => {
              text(ctx, e.degree || '', ctx.marginX, { size: 9, bold: true, color: GRAY_900 });
              text(ctx, e.institution || '', ctx.marginX, { size: 8.5, color: GRAY_600 });
              text(ctx, (e.duration || '').toUpperCase(), ctx.marginX, { size: 7.5, color: GRAY_400 });
              ctx.y += 5;
            });
          }
        }
      },
      {
        x: rightX, width: rightW, draw: (ctx) => {
          group.filter(s => s !== 'skills' && s !== 'education').forEach(sectionId => renderAestheticSection(ctx, data, sectionId, theme));
        }
      },
      font
    );
  });
};

const renderAestheticSection = (ctx: Ctx, data: ResumeData, sectionId: string, theme: { accent: RGB; icon: RGB; iconBg: RGB }) => {
  const { personalDetails: p, experience, projects, certifications, customSections } = data;
  const header = (title: string) => {
    ensureSpace(ctx, 18);
    ctx.doc.setFont(ctx.font, 'bold'); ctx.doc.setFontSize(12); setColor(ctx.doc, GRAY_900);
    ctx.doc.text(title.toUpperCase(), ctx.marginX, ctx.y);
    ctx.y += 12;
  };
  if (sectionId === 'summary' && p.summary) {
    filledRect(ctx.doc, ctx.marginX, ctx.y - 10, 2.5, 34, theme.accent);
    text(ctx, p.summary, ctx.marginX + 10, { size: 9, italic: true, color: GRAY_600, maxWidth: ctx.contentWidth - 10 });
    ctx.y += 10; return;
  }
  if (sectionId === 'experience' && experience.length > 0) {
    header('Work Experience');
    experience.forEach((exp, i) => {
      if (i > 0) ctx.y += 6;
      justifyLine(ctx, exp.role || '', exp.duration, { size: 10, bold: true, color: GRAY_900, rightColor: GRAY_500, rightSize: 8 });
      text(ctx, exp.company || '', ctx.marginX, { size: 9, bold: true, color: theme.accent });
      ctx.y += 2;
      exp.responsibilities.filter(r => r.trim()).forEach(r => bullet(ctx, r, ctx.marginX, { size: 8.5, color: GRAY_600, markerColor: theme.accent }));
    });
    ctx.y += 6; return;
  }
  if (sectionId === 'projects' && projects && projects.length > 0) {
    header('Projects');
    projects.forEach(proj => {
      text(ctx, proj.name || '', ctx.marginX, { size: 9.5, bold: true, color: GRAY_900 });
      if (proj.role) text(ctx, proj.role.toUpperCase(), ctx.marginX, { size: 7.5, bold: true, color: theme.accent });
      if (proj.description) text(ctx, proj.description, ctx.marginX, { size: 8.5, color: GRAY_600 });
      ctx.y += 6;
    });
    ctx.y += 2; return;
  }
  if (sectionId === 'certifications' && certifications && certifications.length > 0) {
    header('Certifications');
    certifications.forEach(cert => {
      justifyLine(ctx, cert.name || '', cert.date, { size: 9.5, bold: true, color: GRAY_900, rightColor: GRAY_400, rightSize: 7.5 });
      text(ctx, cert.issuer || '', ctx.marginX, { size: 8.5, bold: true, color: GRAY_600 });
      ctx.y += 4;
    });
    return;
  }
  const customSec = customSections?.find(c => c.id === sectionId);
  if (customSec && customSec.items.length > 0) {
    header(customSec.title);
    customSec.items.forEach(item => {
      justifyLine(ctx, item.title || '', item.date, { size: 9.5, bold: true, color: GRAY_900, rightColor: GRAY_400, rightSize: 7.5 });
      if (item.subtitle) text(ctx, item.subtitle, ctx.marginX, { size: 8.5, bold: true, color: GRAY_600 });
      if (item.description) text(ctx, item.description, ctx.marginX, { size: 8.5, color: GRAY_600 });
      ctx.y += 4;
    });
  }
};

// ---------------------------------------------------------------------------
// CREATIVE — 1/3 indigo sidebar (photo, contact, skills, education — shown on
// every page, matching the on-screen template's actual behavior) + 2/3 main
// column (summary, experience, custom sections — no projects/certifications
// support, matching the on-screen template's actual behavior).
// ---------------------------------------------------------------------------
const renderCreative: Renderer = (doc, data, opts) => {
  const font = 'courier' as const; // Creative always renders mono on screen (see resolveFont note)
  const { personalDetails: p, skills, education, experience, customSections } = data;
  const pages = paginate(opts.sectionOrder, opts.pageBreaks);
  const sidebarW = 190;
  const gap = 0;
  const mainX = M + sidebarW + 24;
  const mainW = PAGE_WIDTH - mainX - M;

  pages.forEach((group, pageIdx) => {
    if (pageIdx > 0) doc.addPage();

    renderTwoColumns(doc, M, M, M,
      {
        x: M, width: sidebarW, draw: (ctx) => {
          filledRect(ctx.doc, 0, 0, M + sidebarW + gap, PAGE_HEIGHT, INDIGO_50);
          ctx.y = M + 4;
          if (opts.showProfilePicture && opts.profileImage) {
            drawImage(ctx.doc, opts.profileImage, ctx.marginX + sidebarW / 2 - 30, ctx.y, 60, 30);
            ctx.y += 70;
          }
          text(ctx, (p.name || '').toUpperCase(), ctx.marginX + sidebarW / 2, { size: 15, bold: true, color: INDIGO_950, align: 'center', maxWidth: sidebarW });
          if (p.title) text(ctx, (p.title || '').toUpperCase(), ctx.marginX + sidebarW / 2, { size: 8, bold: true, color: INDIGO_600, align: 'center', maxWidth: sidebarW });
          ctx.y += 8;
          contactParts(p).forEach(c => text(ctx, c, ctx.marginX, { size: 8, color: INDIGO_900, maxWidth: sidebarW }));
          if (skills.length > 0) {
            ctx.y += 6;
            text(ctx, 'EXPERTISE', ctx.marginX, { size: 9, bold: true, color: INDIGO_900 });
            hr(ctx, ctx.marginX, ctx.marginX + sidebarW, INDIGO_200, 1.2);
            ctx.y += 6;
            skills.forEach(s => {
              text(ctx, s.category, ctx.marginX, { size: 8.5, bold: true, color: INDIGO_900, maxWidth: sidebarW });
              const items = s.items.join(', ');
              if (items) text(ctx, items, ctx.marginX, { size: 7.5, italic: true, color: INDIGO_400, maxWidth: sidebarW });
            });
          }
          if (education.length > 0) {
            ctx.y += 6;
            text(ctx, 'EDUCATION', ctx.marginX, { size: 9, bold: true, color: INDIGO_900 });
            hr(ctx, ctx.marginX, ctx.marginX + sidebarW, INDIGO_200, 1.2);
            ctx.y += 6;
            education.forEach(e => {
              text(ctx, e.degree || '', ctx.marginX, { size: 8.5, bold: true, color: INDIGO_900, maxWidth: sidebarW });
              text(ctx, e.institution || '', ctx.marginX, { size: 8, color: INDIGO_700, maxWidth: sidebarW });
              text(ctx, e.duration || '', ctx.marginX, { size: 7.5, color: INDIGO_500, maxWidth: sidebarW });
              ctx.y += 4;
            });
          }
        }
      },
      {
        x: mainX, width: mainW, draw: (ctx) => {
          if (group.includes('summary') && p.summary) {
            text(ctx, 'PROFILE', ctx.marginX, { size: 12, bold: true, color: INDIGO_950 });
            ctx.y += 2;
            text(ctx, p.summary, ctx.marginX, { size: 9, color: SLATE_700 });
            ctx.y += 8;
          }
          if (group.includes('experience') && experience.length > 0) {
            text(ctx, 'EXPERIENCE', ctx.marginX, { size: 12, bold: true, color: INDIGO_950 });
            ctx.y += 4;
            experience.forEach((exp, i) => {
              if (i > 0) ctx.y += 8;
              justifyLine(ctx, exp.role || '', exp.duration, { size: 10, bold: true, color: SLATE_900, rightColor: INDIGO_500, rightSize: 8 });
              text(ctx, [exp.company, exp.location].filter(Boolean).join('  |  '), ctx.marginX, { size: 9, bold: true, color: INDIGO_700 });
              ctx.y += 2;
              exp.responsibilities.filter(r => r.trim()).forEach(r => bullet(ctx, r, ctx.marginX, { size: 8.5, color: SLATE_600, markerColor: INDIGO_400 }));
            });
            ctx.y += 6;
          }
          customSections?.forEach(section => {
            if (!group.includes(section.id) || section.items.length === 0) return;
            text(ctx, section.title.toUpperCase(), ctx.marginX, { size: 12, bold: true, color: INDIGO_950 });
            ctx.y += 4;
            section.items.forEach(item => {
              justifyLine(ctx, item.title || '', item.date, { size: 9.5, bold: true, color: SLATE_900, rightColor: INDIGO_500, rightSize: 8 });
              if (item.subtitle) text(ctx, item.subtitle, ctx.marginX, { size: 8.5, bold: true, color: INDIGO_700 });
              if (item.description) text(ctx, item.description, ctx.marginX, { size: 8.5, color: SLATE_600 });
              ctx.y += 4;
            });
            ctx.y += 4;
          });
        }
      },
      font
    );
  });
};

// ---------------------------------------------------------------------------
// TECH — mono, terminal aesthetic, single column, emerald accents
// ---------------------------------------------------------------------------
const renderTech: Renderer = (doc, data, opts) => {
  const font = 'courier' as const; // Tech always renders mono on screen (see resolveFont note)
  const { personalDetails: p, skills, education, experience, customSections } = data;
  const pages = paginate(opts.sectionOrder, opts.pageBreaks);

  pages.forEach((group, pageIdx) => {
    if (pageIdx > 0) doc.addPage();
    const ctx = newCtx(doc, { marginX: M, font });

    if (pageIdx === 0) {
      text(ctx, `> ${p.name || 'Untitled'}_`, ctx.marginX, { size: 19, bold: true, color: SLATE_900 });
      if (p.title) text(ctx, p.title, ctx.marginX, { size: 11, bold: true, color: EMERALD_600 });
      ctx.y += 6;
      hr(ctx, ctx.marginX, ctx.marginX + ctx.contentWidth, EMERALD_500, 1.5);
      ctx.y += 10;
      const parts: string[] = [];
      if (p.email) parts.push(`email: ${p.email}`);
      if (p.phone) parts.push(`tel: ${p.phone}`);
      if (p.location) parts.push(`loc: ${p.location}`);
      if (p.linkedin) parts.push(`link: ${p.linkedin}`);
      if (p.website) parts.push(`web: ${p.website}`);
      text(ctx, parts.join('    '), ctx.marginX, { size: 8, color: SLATE_600 });
      ctx.y += 6;
      hr(ctx, ctx.marginX, ctx.marginX + ctx.contentWidth, SLATE_300, 0.5);
      ctx.y += 12;
    }

    group.forEach(sectionId => {
      const tag = (label: string) => {
        ensureSpace(ctx, 18);
        filledRect(ctx.doc, ctx.marginX, ctx.y - 8, ctx.doc.getTextWidth(`~/${label}`) + 8, 13, EMERALD_100);
        ctx.doc.setFont(font, 'bold'); ctx.doc.setFontSize(9); setColor(ctx.doc, SLATE_900);
        ctx.doc.text(`~/${label}`, ctx.marginX + 4, ctx.y);
        ctx.y += 14;
      };
      if (sectionId === 'summary' && p.summary) {
        tag('summary');
        text(ctx, p.summary, ctx.marginX, { size: 9, color: SLATE_700 });
        ctx.y += 8; return;
      }
      if (sectionId === 'experience' && experience.length > 0) {
        tag('experience');
        experience.forEach((exp, i) => {
          if (i > 0) ctx.y += 6;
          justifyLine(ctx, `## ${exp.role || ''} @ ${exp.company || ''}`, `[${exp.duration || ''}]`, { size: 9, bold: true, color: SLATE_900, rightColor: SLATE_500, rightSize: 8 });
          exp.responsibilities.filter(r => r.trim()).forEach(r => bullet(ctx, r, ctx.marginX, { size: 8.5, color: SLATE_700, marker: '*', markerColor: [110, 231, 183] }));
        });
        ctx.y += 8; return;
      }
      if (sectionId === 'skills' && skills.length > 0) {
        tag('skills');
        skills.forEach(s => {
          const items = s.items.join(', ');
          text(ctx, `${s.category}${items ? ` (${items})` : ''}`, ctx.marginX, { size: 8.5, color: SLATE_700 });
        });
        ctx.y += 8; return;
      }
      if (sectionId === 'education' && education.length > 0) {
        tag('education');
        education.forEach(e => {
          justifyLine(ctx, e.degree || '', `[${e.duration || ''}]`, { size: 9, bold: true, color: SLATE_900, rightColor: SLATE_500, rightSize: 8 });
          text(ctx, e.institution || '', ctx.marginX, { size: 8.5, color: SLATE_600 });
          ctx.y += 2;
        });
        ctx.y += 6; return;
      }
      const customSec = customSections?.find(c => c.id === sectionId);
      if (customSec && customSec.items.length > 0) {
        tag(customSec.title.toLowerCase().replace(/\s+/g, '-'));
        customSec.items.forEach(item => {
          justifyLine(ctx, item.title || '', item.date ? `[${item.date}]` : '', { size: 9, bold: true, color: SLATE_900, rightColor: SLATE_500, rightSize: 8 });
          if (item.subtitle) text(ctx, item.subtitle, ctx.marginX, { size: 8.5, color: EMERALD_600 });
          if (item.description) text(ctx, item.description, ctx.marginX, { size: 8.5, color: SLATE_700 });
          ctx.y += 4;
        });
        ctx.y += 6;
      }
    });
  });
};

// ---------------------------------------------------------------------------
// ACADEMIC — serif, centered CV-style header, dot-separated contact
// ---------------------------------------------------------------------------
const renderAcademic: Renderer = (doc, data, opts) => {
  const font = 'times' as const; // Academic always renders serif on screen (see resolveFont note)
  const { personalDetails: p, skills, education, experience, customSections } = data;
  const pages = paginate(opts.sectionOrder, opts.pageBreaks);

  pages.forEach((group, pageIdx) => {
    if (pageIdx > 0) doc.addPage();
    const ctx = newCtx(doc, { marginX: M, font });

    if (pageIdx === 0) {
      const cx = ctx.marginX + ctx.contentWidth / 2;
      text(ctx, (p.name || 'Untitled').toUpperCase(), cx, { size: 18, color: SLATE_900, align: 'center' });
      if (p.title) text(ctx, p.title, cx, { size: 9.5, italic: true, color: SLATE_600, align: 'center' });
      const contact = contactParts(p).join('   •   ');
      if (contact) text(ctx, contact, cx, { size: 8, color: SLATE_700, align: 'center' });
      ctx.y += 12;
    }

    group.forEach(sectionId => {
      const header = (title: string) => {
        ensureSpace(ctx, 18);
        ctx.doc.setFont(font, 'bold'); ctx.doc.setFontSize(9.5); setColor(ctx.doc, SLATE_900);
        ctx.doc.text(title.toUpperCase(), ctx.marginX, ctx.y);
        ctx.y += 3;
        hr(ctx, ctx.marginX, ctx.marginX + ctx.contentWidth, SLATE_300);
        ctx.y += 11;
      };
      if (sectionId === 'summary' && p.summary) {
        header('Curriculum Vitae');
        text(ctx, p.summary, ctx.marginX, { size: 9.5, color: SLATE_800 });
        ctx.y += 8; return;
      }
      if (sectionId === 'education' && education.length > 0) {
        header('Education');
        education.forEach(e => {
          justifyLine(ctx, e.degree || '', e.duration, { size: 9.5, bold: true, color: SLATE_900, rightColor: SLATE_700, rightSize: 8.5 });
          text(ctx, e.institution || '', ctx.marginX, { size: 9.5, italic: true, color: SLATE_800 });
          ctx.y += 4;
        });
        ctx.y += 4; return;
      }
      if (sectionId === 'experience' && experience.length > 0) {
        header('Academic & Professional Appointments');
        experience.forEach((exp, i) => {
          if (i > 0) ctx.y += 6;
          justifyLine(ctx, exp.role || '', exp.duration, { size: 9.5, bold: true, color: SLATE_900, rightColor: SLATE_700, rightSize: 8.5 });
          text(ctx, [exp.company, exp.location].filter(Boolean).join(', '), ctx.marginX, { size: 9.5, italic: true, color: SLATE_800 });
          ctx.y += 2;
          exp.responsibilities.filter(r => r.trim()).forEach(r => bullet(ctx, r, ctx.marginX, { size: 8.5, color: SLATE_800 }));
        });
        ctx.y += 6; return;
      }
      if (sectionId === 'skills' && skills.length > 0) {
        header('Core Competencies');
        text(ctx, skills.map(s => s.category).join(' • '), ctx.marginX, { size: 9.5, color: SLATE_800 });
        ctx.y += 8; return;
      }
      const customSec = customSections?.find(c => c.id === sectionId);
      if (customSec && customSec.items.length > 0) {
        header(customSec.title);
        customSec.items.forEach(item => {
          justifyLine(ctx, item.title || '', item.date, { size: 9.5, bold: true, color: SLATE_900, rightColor: SLATE_700, rightSize: 8.5 });
          if (item.subtitle) text(ctx, item.subtitle, ctx.marginX, { size: 9.5, italic: true, color: SLATE_800 });
          if (item.description) text(ctx, item.description, ctx.marginX, { size: 9.5, color: SLATE_800 });
          ctx.y += 4;
        });
        ctx.y += 4;
      }
    });
  });
};

const TEMPLATE_RENDERERS: Partial<Record<TemplateId, Renderer>> = {
  classic: renderClassic,
  modern: renderModern,
  minimalist: renderMinimalist,
  executive: renderExecutive,
  aesthetic: renderAesthetic,
  creative: renderCreative,
  tech: renderTech,
  academic: renderAcademic,
};

export const getTemplateRenderer = (templateId: TemplateId): Renderer | undefined => TEMPLATE_RENDERERS[templateId];

export { GRAY_900, GRAY_700, GRAY_600, GRAY_500, GRAY_400, GRAY_300, GRAY_200, GRAY_100, GRAY_50, BLUE_600, INDIGO_50, INDIGO_100, INDIGO_200, INDIGO_400, INDIGO_500, INDIGO_600, INDIGO_700, INDIGO_900, INDIGO_950, EMERALD_100, EMERALD_500, EMERALD_600, SLATE_900, SLATE_800, SLATE_700, SLATE_600, SLATE_500, SLATE_400, SLATE_300, SLATE_200, ACADEMIC_BG, M };
