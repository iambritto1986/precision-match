import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { ResumeData } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export const exportToDocx = async (data: ResumeData) => {
  const sections: any[] = [];

  // Personal Info
  sections.push(
    new Paragraph({
      text: data.personalDetails.name,
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      text: `${data.personalDetails.title} | ${data.personalDetails.email} | ${data.personalDetails.phone} | ${data.personalDetails.location}`,
    })
  );

  if (data.personalDetails.summary) {
    sections.push(
      new Paragraph({ text: 'Professional Summary', heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ text: data.personalDetails.summary })
    );
  }

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
      exp.responsibilities.forEach(r => {
        sections.push(new Paragraph({ text: r, bullet: { level: 0 } }));
      });
    });
  }

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

  if (data.skills.length > 0) {
     sections.push(new Paragraph({ text: 'Skills', heading: HeadingLevel.HEADING_2 }));
     data.skills.forEach(s => {
       sections.push(new Paragraph({ text: `${s.category}: ${s.items.join(', ')}` }));
     });
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: sections
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.personalDetails.name.replace(/\s+/g, '_')}_Resume.docx`);
};

export const exportToPdf = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Temporarily reset transform to avoid html2canvas scale bug cutting off layout and losing styles
  const originalTransform = element.style.transform;
  element.style.transform = 'none';
  
  // A small delay allows the DOM to reflow properly before capturing
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    const canvas = await html2canvas(element, { 
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [816, 1056]
    });
    
    const pdfWidth = 816;
    const pdfHeight = 1056;
    const imgProps = pdf.getImageProperties(imgData);
    const totalImgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = totalImgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalImgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = position - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalImgHeight);
      heightLeft -= pdfHeight;
    }
    
    pdf.save(filename);
  } catch (error) {
    console.error("PDF Export failed:", error);
  } finally {
    element.style.transform = originalTransform;
  }
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
