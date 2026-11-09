// Shared helpers for building the four Word reports with docx-js
const fs = require("fs");
const d = require("docx");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, ImageRun, LevelFormat, PageBreak, Footer, Header, PageNumber,
} = d;

const GREEN = "1B4332", MID = "2E7D32", LIGHT = "E8F5E9", GREYTXT = "555555";
const FONT = "Calibri";
const PAGE_W = 11906, PAGE_H = 16838, MARGIN = 1300;
const CONTENT_W = PAGE_W - 2 * MARGIN; // 9306 DXA

const results = JSON.parse(fs.readFileSync(__dirname + "/../data/results.json", "utf8"));

// ---- inline **bold** parser ----
function runs(text, opts = {}) {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((t) =>
    t.startsWith("**")
      ? new TextRun({ text: t.slice(2, -2), bold: true, font: FONT, ...opts })
      : new TextRun({ text: t, font: FONT, ...opts })
  );
}
const P = (text, o = {}) =>
  new Paragraph({ children: runs(text, o.run || {}), spacing: { after: 120, line: 288 }, alignment: o.align || AlignmentType.LEFT, ...(o.para || {}) });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t, font: FONT })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t, font: FONT })] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: t, font: FONT })] });
const B = (text, level = 0) => new Paragraph({ numbering: { reference: "bullets", level }, children: runs(text), spacing: { after: 60, line: 276 } });
const N = (text, ref = "nums") => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(text), spacing: { after: 60, line: 276 } });
const spacer = (after = 120) => new Paragraph({ children: [], spacing: { after } });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// ---- table ----
const thin = { style: BorderStyle.SINGLE, size: 4, color: "BBBBBB" };
const borders = { top: thin, bottom: thin, left: thin, right: thin };
function table(headers, rows, widths, o = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const cell = (txt, w, head, shade) =>
    new TableCell({
      width: { size: w, type: WidthType.DXA }, borders,
      shading: head ? { fill: GREEN, type: ShadingType.CLEAR, color: "auto" } : shade ? { fill: shade, type: ShadingType.CLEAR, color: "auto" } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: String(txt).split("\n").map((line) => new Paragraph({
        spacing: { after: 20 },
        children: runs(line, { size: o.size || 18, color: head ? "FFFFFF" : undefined, bold: head ? true : undefined }),
      })),
    });
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], true)) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], false, ri % 2 ? "F5F9F5" : undefined)) })),
    ],
  });
}

// ---- image (reads PNG size from header) ----
function img(file, widthPx = 560, caption) {
  const buf = fs.readFileSync(__dirname + "/../charts/" + file);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  const out = [new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: !!caption,
    children: [new ImageRun({ type: "png", data: buf, transformation: { width: widthPx, height: Math.round(widthPx * h / w) },
      altText: { title: file, description: caption || file, name: file } })],
  })];
  if (caption) out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: caption, italics: true, size: 18, color: GREYTXT, font: FONT })] }));
  return out;
}

// ---- callout box (single-cell table) ----
function callout(title, lines) {
  const kids = [new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: title, bold: true, font: FONT, color: GREEN, size: 22 })] }),
    ...lines.map((l) => new Paragraph({ spacing: { after: 60 }, children: runs(l, { size: 20 }) }))];
  const bl = { style: BorderStyle.SINGLE, size: 24, color: MID };
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA }, borders: { top: none, bottom: none, right: none, left: bl },
      shading: { fill: LIGHT, type: ShadingType.CLEAR, color: "auto" },
      margins: { top: 120, bottom: 100, left: 200, right: 160 }, children: kids })] })],
  });
}

// ---- code block ----
function code(lines) {
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA }, borders: { top: none, bottom: none, left: none, right: none },
      shading: { fill: "F3F4F6", type: ShadingType.CLEAR, color: "auto" }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
      children: lines.map((l) => new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: l || " ", font: "Consolas", size: 17 })] })) })] })],
  });
}

// ---- cover block ----
function cover(week, title, subtitle) {
  return [
    spacer(1800),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "AGRICULTURE & AGRIBUSINESS  |  DATA ANALYTICS PROJECT", font: FONT, size: 20, bold: true, color: MID, characterSpacing: 40 })] }),
    new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: MID, space: 8 } }, spacing: { after: 240 },
      children: [new TextRun({ text: week, font: FONT, size: 28, color: GREYTXT })] }),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: title, font: FONT, size: 60, bold: true, color: GREEN })] }),
    new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: subtitle, font: FONT, size: 26, color: GREYTXT })] }),
    new Paragraph({ spacing: { after: 60 }, children: runs("**Prepared by:** Junior Data Analyst (Intern)", { size: 22 }) }),
    new Paragraph({ spacing: { after: 60 }, children: runs("**Client scenario:** GreenHarvest Agri Co-operative (hypothetical), Karnataka, India", { size: 22 }) }),
    new Paragraph({ spacing: { after: 60 }, children: runs("**Date:** November 2026", { size: 22 }) }),
    new Paragraph({ spacing: { after: 60 }, children: runs("**Note:** All datasets in this project are synthetic and created for demonstration.", { size: 22, color: GREYTXT }) }),
    pageBreak(),
  ];
}

function build(file, docTitle, children) {
  const doc = new Document({
    creator: "Junior Data Analyst", title: docTitle,
    styles: {
      default: { document: { run: { font: FONT, size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { font: FONT, size: 34, bold: true, color: GREEN },
          paragraph: { spacing: { before: 360, after: 140 }, keepNext: true, outlineLevel: 0,
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: MID, space: 4 } } } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { font: FONT, size: 27, bold: true, color: MID }, paragraph: { spacing: { before: 260, after: 100 }, keepNext: true, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { font: FONT, size: 23, bold: true, color: "333333" }, paragraph: { spacing: { before: 180, after: 80 }, keepNext: true, outlineLevel: 2 } },
      ],
    },
    numbering: { config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "\u2013", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 270 } } } } ] },
      ...["nums", "nums2", "nums3", "nums4", "nums5"].map((r) => ({ reference: r, levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 320 } } } } ] })),
    ] },
    sections: [{
      properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: 1300, bottom: 1200, left: MARGIN, right: MARGIN } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: docTitle, size: 16, color: "888888", font: FONT })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Page ", size: 16, color: "888888", font: FONT }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888", font: FONT })] })] }) },
      children,
    }],
  });
  return Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(__dirname + "/../reports/" + file, buf); console.log("wrote", file); });
}

module.exports = { P, H1, H2, H3, B, N, spacer, pageBreak, table, img, callout, code, cover, build, results, CONTENT_W, AlignmentType };
