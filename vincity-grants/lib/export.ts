import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { ApplicationSection } from './types';

interface ExportOptions {
  sections: ApplicationSection[];
  clientName: string;
  grantName: string;
}

export async function generateDocx({
  sections,
  clientName,
  grantName,
}: ExportOptions): Promise<Buffer> {
  const date = new Date().toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const headerParagraphs = [
    new Paragraph({
      children: [new TextRun({ text: grantName, bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Applicant: ${clientName}`, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: date, size: 20, color: '888888' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
    }),
  ];

  const sectionParagraphs = sections.flatMap((section) => {
    const heading = new Paragraph({
      text: section.title,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 480, after: 160 },
    });

    const bodyParas = section.content
      .split(/\n\n+/)
      .filter((p) => p.trim())
      .map(
        (para) =>
          new Paragraph({
            children: [new TextRun({ text: para.trim(), size: 22 })],
            spacing: { before: 0, after: 200 },
          })
      );

    return [heading, ...bodyParas];
  });

  const doc = new Document({
    sections: [
      {
        children: [...headerParagraphs, ...sectionParagraphs],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
