import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { ResumeData, TemplateId } from '../types';
import jsPDF from 'jspdf';
import { getTemplateRenderer } from './pdfTemplateRenderers';

// Resolves which sections to render and in what order. Prefers the caller's
// current sectionOrder (so exports match what the user sees on screen and
// how they've arranged things), but falls back to a sensible default that
// still includes certifications/custom sections if present in the data.
const resolveOrder = (data: ResumeData, sectionOrder?: string[]): string[] => {
  if (sectionOrder && sectionOrder.length) return sectionOrder;
  const order = ['summary', 'experience', 'skills', 'education', 'projects'];
  if (data.certifications && data.certifications.length > 0) order.push('certifications');
  data.customSections?.forEach(cs => {
    if (!order.includes(cs.id)) order.push(cs.id);
  });
  return order;
};

const SECTION_TITLES: Record<string, string> = {
  summary: 'Professional Summary',
  experience: 'Experience',
  skills: 'Skills',
  education: 'Education',
  projects: 'Projects',
  certifications: 'Certifications',
};

export const exportToDocx = async (data: ResumeData, sectionOrder?: string[]) => {
  const sections: any[] = [];

  // Personal Info
  sections.push(
    new Paragraph({
      text: data.personalDetails.name,
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      text: [data.personalDetails.title, data.personalDetails.email, data.personalDetails.phone, data.personalDetails.location]
        .filter(Boolean).join(' | '),
    })
  );

  const order = resolveOrder(data, sectionOrder);

  order.forEach(sectionId => {
    if (sectionId === 'summary') {
      if (data.personalDetails.summary) {
        sections.push(
          new Paragraph({ text: 'Professional Summary', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: data.personalDetails.summary })
        );
      }
      return;
    }

    if (sectionId === 'experience') {
      if (data.experience.length > 0) {
        sections.push(new Paragraph({ text: 'Experience', heading: HeadingLevel.HEADING_2 }));
        data.experience.forEach(exp => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${exp.role} at ${exp.company}`, bold: true }),
                new TextRun({ text: ` | ${exp.duration} | ${exp.location}`, italics: true })
              ]
            })
          );
          exp.responsibilities.filter(r => r.trim()).forEach(r => {
            sections.push(new Paragraph({ text: r, bullet: { level: 0 } }));
          });
        });
      }
      return;
    }

    if (sectionId === 'skills') {
      if (data.skills.length > 0) {
        sections.push(new Paragraph({ text: 'Skills', heading: HeadingLevel.HEADING_2 }));
        data.skills.forEach(s => {
          sections.push(new Paragraph({ text: `${s.category}: ${s.items.filter(i => i.trim()).join(', ')}` }));
        });
      }
      return;
    }

    if (sectionId === 'education') {
      if (data.education.length > 0) {
        sections.push(new Paragraph({ text: 'Education', heading: HeadingLevel.HEADING_2 }));
        data.education.forEach(edu => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${edu.degree} - ${edu.institution}`, bold: true }),
                new TextRun({ text: ` | ${edu.duration} | ${edu.location}`, italics: true })
              ]
            })
          );
          if (edu.details) {
            sections.push(new Paragraph({ text: edu.details }));
          }
        });
      }
      return;
    }

    if (sectionId === 'projects') {
      if (data.projects && data.projects.length > 0) {
        sections.push(new Paragraph({ text: 'Projects', heading: HeadingLevel.HEADING_2 }));
        data.projects.forEach(proj => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: proj.name, bold: true }),
                new TextRun({ text: ` | ${proj.role} | ${proj.duration}`, italics: true })
              ]
            })
          );
          if (proj.description) sections.push(new Paragraph({ text: proj.description }));
          if (proj.url) sections.push(new Paragraph({ text: proj.url }));
        });
      }
      return;
    }

    if (sectionId === 'certifications') {
      if (data.certifications && data.certifications.length > 0) {
        sections.push(new Paragraph({ text: 'Certifications', heading: HeadingLevel.HEADING_2 }));
        data.certifications.forEach(cert => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: cert.name, bold: true }),
                new TextRun({ text: `${cert.issuer ? ` | ${cert.issuer}` : ''}${cert.date ? ` | ${cert.date}` : ''}`, italics: true })
              ]
            })
          );
        });
      }
      return;
    }

    // Custom section
    const customSec = data.customSections?.find(c => c.id === sectionId);
    if (customSec && customSec.items.length > 0) {
      sections.push(new Paragraph({ text: customSec.title, heading: HeadingLevel.HEADING_2 }));
      customSec.items.forEach(item => {
        const metaParts = [item.subtitle, item.date].filter(Boolean).join(' | ');
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: item.title, bold: true }),
              ...(metaParts ? [new TextRun({ text: ` | ${metaParts}`, italics: true })] : [])
            ]
          })
        );
        if (item.description) sections.push(new Paragraph({ text: item.description }));
      });
    }
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: sections
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.personalDetails.name.replace(/\s+/g, '_')}_Resume.docx`);
};

// --------------- Text-based PDF export ---------------
// IMPORTANT: this generates the PDF directly from structured data using jsPDF's
// native text API for every template — it does NOT screenshot the on-screen
// preview. A screenshot-based PDF (the old approach) embeds only a rasterized
// image with no text layer, which most Applicant Tracking Systems can't parse
// at all. Each template below (src/lib/pdfTemplateRenderers.ts) recreates that
// template's on-screen look — layout, colors, fonts, section styling — using
// real positioned text, so the download both matches what the user picked AND
// stays genuinely ATS-parseable. If a templateId somehow doesn't have a
// dedicated renderer, we fall back to a plain single-column ATS-safe layout
// below rather than failing the export outright.

// Converts a profile picture URL (data: URI or blob: URL) into a data URI that
// jsPDF can embed. Returns null if there's no image or it can't be loaded —
// callers should treat that the same as "no photo" rather than failing the export.
const loadImageAsDataUrl = async (url: string | undefined): Promise<string | null> => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export interface ExportPdfOptions {
  templateId: TemplateId;
  sectionOrder?: string[];
  fontFamily?: string;
  showProfilePicture?: boolean;
  aestheticTheme?: 'default' | 'ocean' | 'sunset' | 'forest';
  pageBreaks?: Record<string, boolean>;
  filename?: string;
  // Defaults to 'letter' (unchanged behavior). Pass 'a4' to print/export on A4
  // paper instead — every template renderer reads its page dimensions from the
  // jsPDF document itself, so this one flag is all that's needed.
  pageFormat?: 'letter' | 'a4';
}

const MARGIN_X = 54;
const MARGIN_TOP = 54;
const MARGIN_BOTTOM = 54;

const renderGenericAtsPdf = (doc: jsPDF, data: ResumeData, sectionOrder?: string[]) => {
  let cursorY = MARGIN_TOP;
  const PAGE_WIDTH = (doc.internal.pageSize as any).getWidth();
  const PAGE_HEIGHT = (doc.internal.pageSize as any).getHeight();
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

  const ensureSpace = (neededHeight: number) => {
    if (cursorY + neededHeight > PAGE_HEIGHT - MARGIN_BOTTOM) {
      doc.addPage();
      cursorY = MARGIN_TOP;
    }
  };

  const addSectionHeader = (title: string) => {
    ensureSpace(26);
    cursorY += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(title.toUpperCase(), MARGIN_X, cursorY);
    cursorY += 4;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.75);
    doc.line(MARGIN_X, cursorY, MARGIN_X + CONTENT_WIDTH, cursorY);
    cursorY += 14;
  };

  const addText = (
    text: string,
    opts: { fontSize?: number; bold?: boolean; italic?: boolean; color?: [number, number, number]; indent?: number; lineHeightFactor?: number } = {}
  ) => {
    if (!text) return;
    const fontSize = opts.fontSize ?? 10;
    const style = opts.bold ? 'bold' : opts.italic ? 'italic' : 'normal';
    const color = opts.color ?? [40, 40, 40];
    const indent = opts.indent ?? 0;
    const lineHeight = fontSize * (opts.lineHeightFactor ?? 1.35);

    doc.setFont('helvetica', style);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text, CONTENT_WIDTH - indent);
    lines.forEach((line: string) => {
      ensureSpace(lineHeight);
      doc.text(line, MARGIN_X + indent, cursorY);
      cursorY += lineHeight;
    });
  };

  const addBullet = (text: string, fontSize = 10) => {
    if (!text) return;
    const indent = 12;
    const lineHeight = fontSize * 1.35;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH - indent);
    lines.forEach((line: string, idx: number) => {
      ensureSpace(lineHeight);
      if (idx === 0) doc.text('•', MARGIN_X, cursorY);
      doc.text(line, MARGIN_X + indent, cursorY);
      cursorY += lineHeight;
    });
  };

  const addMetaLine = (text: string) => addText(text, { fontSize: 9.5, italic: true, color: [110, 110, 110] });

  // --- Header ---
  const { personalDetails } = data;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 15, 15);
  doc.text(personalDetails.name || 'Untitled', MARGIN_X, cursorY);
  cursorY += 22;

  if (personalDetails.title) {
    addText(personalDetails.title, { fontSize: 11.5, color: [80, 80, 80] });
    cursorY += 2;
  }

  const contactLine = [personalDetails.email, personalDetails.phone, personalDetails.location, personalDetails.linkedin, personalDetails.website]
    .filter(Boolean).join('   |   ');
  if (contactLine) {
    addText(contactLine, { fontSize: 9.5, color: [100, 100, 100] });
  }

  cursorY += 6;
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(1);
  doc.line(MARGIN_X, cursorY, MARGIN_X + CONTENT_WIDTH, cursorY);
  cursorY += 4;

  // --- Sections ---
  const order = resolveOrder(data, sectionOrder);

  order.forEach(sectionId => {
    if (sectionId === 'summary') {
      if (personalDetails.summary) {
        addSectionHeader(SECTION_TITLES.summary);
        addText(personalDetails.summary);
      }
      return;
    }

    if (sectionId === 'experience') {
      if (data.experience.length > 0) {
        addSectionHeader(SECTION_TITLES.experience);
        data.experience.forEach((exp, i) => {
          if (i > 0) cursorY += 6;
          addText(exp.role || '', { fontSize: 11, bold: true, color: [20, 20, 20] });
          addMetaLine([exp.company, exp.duration, exp.location].filter(Boolean).join('   |   '));
          cursorY += 2;
          exp.responsibilities.filter(r => r.trim()).forEach(r => addBullet(r));
        });
      }
      return;
    }

    if (sectionId === 'skills') {
      if (data.skills.length > 0) {
        addSectionHeader(SECTION_TITLES.skills);
        data.skills.forEach(grp => {
          const items = grp.items.filter(s => s.trim()).join(', ');
          if (!items) return;
          const fontSize = 10;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(fontSize);
          const labelWidth = doc.getTextWidth(`${grp.category}:  `);
          ensureSpace(fontSize * 1.35);
          doc.setTextColor(20, 20, 20);
          doc.text(`${grp.category}:`, MARGIN_X, cursorY);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          const wrapped = doc.splitTextToSize(items, CONTENT_WIDTH - labelWidth);
          wrapped.forEach((line: string, idx: number) => {
            if (idx > 0) ensureSpace(fontSize * 1.35);
            doc.text(line, MARGIN_X + labelWidth, cursorY);
            if (idx < wrapped.length - 1) cursorY += fontSize * 1.35;
          });
          cursorY += fontSize * 1.35;
        });
      }
      return;
    }

    if (sectionId === 'education') {
      if (data.education.length > 0) {
        addSectionHeader(SECTION_TITLES.education);
        data.education.forEach((edu, i) => {
          if (i > 0) cursorY += 6;
          addText(edu.degree || '', { fontSize: 11, bold: true, color: [20, 20, 20] });
          addMetaLine([edu.institution, edu.duration, edu.location].filter(Boolean).join('   |   '));
          if (edu.details) {
            cursorY += 2;
            addText(edu.details);
          }
        });
      }
      return;
    }

    if (sectionId === 'projects') {
      if (data.projects && data.projects.length > 0) {
        addSectionHeader(SECTION_TITLES.projects);
        data.projects.forEach((proj, i) => {
          if (i > 0) cursorY += 6;
          addText(proj.name || '', { fontSize: 11, bold: true, color: [20, 20, 20] });
          addMetaLine([proj.role, proj.duration].filter(Boolean).join('   |   '));
          if (proj.description) {
            cursorY += 2;
            addText(proj.description);
          }
          if (proj.url) addText(proj.url, { fontSize: 9.5, color: [90, 90, 90] });
        });
      }
      return;
    }

    if (sectionId === 'certifications') {
      if (data.certifications && data.certifications.length > 0) {
        addSectionHeader(SECTION_TITLES.certifications);
        data.certifications.forEach((cert, i) => {
          if (i > 0) cursorY += 4;
          addText(cert.name || '', { fontSize: 10.5, bold: true, color: [20, 20, 20] });
          addMetaLine([cert.issuer, cert.date].filter(Boolean).join('   |   '));
        });
      }
      return;
    }

    // Custom section
    const customSec = data.customSections?.find(c => c.id === sectionId);
    if (customSec && customSec.items.length > 0) {
      addSectionHeader(customSec.title);
      customSec.items.forEach((item, i) => {
        if (i > 0) cursorY += 6;
        addText(item.title || '', { fontSize: 11, bold: true, color: [20, 20, 20] });
        const meta = [item.subtitle, item.date].filter(Boolean).join('   |   ');
        if (meta) addMetaLine(meta);
        if (item.description) {
          cursorY += 2;
          addText(item.description);
        }
      });
    }
  });
};

// The public export used throughout the app. Renders the resume in the
// visual style of whichever template the user has selected, using real text
// (see the big comment above), then falls back to a plain ATS-safe layout if
// a template ever doesn't have a dedicated renderer.
export const exportToPdf = async (data: ResumeData, opts: ExportPdfOptions) => {
  const doc = new jsPDF({ unit: 'pt', format: opts.pageFormat === 'a4' ? 'a4' : 'letter' });

  const profileImage = opts.showProfilePicture
    ? await loadImageAsDataUrl(data.personalDetails.profilePictureUrl)
    : null;

  const renderer = getTemplateRenderer(opts.templateId);
  if (renderer) {
    renderer(doc, data, {
      sectionOrder: opts.sectionOrder && opts.sectionOrder.length ? opts.sectionOrder : resolveOrder(data),
      fontFamily: opts.fontFamily,
      showProfilePicture: !!opts.showProfilePicture,
      aestheticTheme: opts.aestheticTheme,
      pageBreaks: opts.pageBreaks,
      profileImage,
    });
  } else {
    renderGenericAtsPdf(doc, data, opts.sectionOrder);
  }

  doc.save(opts.filename || `${(data.personalDetails.name || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`);
};

export const exportCoverLetterDocx = async (text: string, filename: string) => {
  const paragraphs = text.split('\n').filter(p => p.trim() !== '').map(p => new Paragraph({ text: p }));

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
};
