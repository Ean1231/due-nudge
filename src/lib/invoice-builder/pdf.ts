import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont, type RGB } from "pdf-lib";
import { formatMoney } from "@/lib/money";
import { invoiceTotals, type InvoiceBuilderInput } from "@/lib/invoice-builder/schema";

type Palette = {
  ink: RGB;
  muted: RGB;
  accent: RGB;
  tint: RGB;
};

const palettes: Record<InvoiceBuilderInput["templateId"], Palette> = {
  classic: {
    ink: rgb(0.08, 0.13, 0.22),
    muted: rgb(0.35, 0.4, 0.48),
    accent: rgb(0.07, 0.22, 0.42),
    tint: rgb(0.92, 0.95, 0.98),
  },
  modern: {
    ink: rgb(0.08, 0.15, 0.14),
    muted: rgb(0.35, 0.45, 0.43),
    accent: rgb(0.02, 0.55, 0.45),
    tint: rgb(0.9, 0.98, 0.96),
  },
  minimal: {
    ink: rgb(0.08, 0.08, 0.08),
    muted: rgb(0.42, 0.42, 0.42),
    accent: rgb(0.08, 0.08, 0.08),
    tint: rgb(0.96, 0.96, 0.96),
  },
  warm: {
    ink: rgb(0.18, 0.11, 0.08),
    muted: rgb(0.45, 0.35, 0.3),
    accent: rgb(0.66, 0.24, 0.14),
    tint: rgb(0.99, 0.94, 0.89),
  },
};

export async function generateInvoicePdf(data: InvoiceBuilderInput) {
  const document = await PDFDocument.create();
  document.setTitle(`Invoice ${safeText(data.invoiceNumber)}`);
  document.setAuthor(safeText(data.businessName));
  document.setCreationDate(new Date());

  const page = document.addPage([595.28, 841.89]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const palette = palettes[data.templateId];

  drawTemplateFrame(page, data.templateId, palette);
  drawHeader(page, data, regular, bold, palette);
  drawParties(page, data, regular, bold, palette);
  drawItems(page, data, regular, bold, palette);
  drawFooter(page, data, regular, bold, palette);

  return Buffer.from(await document.save());
}

function drawTemplateFrame(
  page: PDFPage,
  template: InvoiceBuilderInput["templateId"],
  palette: Palette,
) {
  if (template === "classic") {
    page.drawRectangle({ x: 0, y: 742, width: 595.28, height: 100, color: palette.accent });
  } else if (template === "modern") {
    page.drawRectangle({ x: 0, y: 0, width: 18, height: 841.89, color: palette.accent });
    page.drawRectangle({ x: 18, y: 742, width: 577.28, height: 100, color: palette.tint });
  } else if (template === "minimal") {
    page.drawLine({ start: { x: 42, y: 766 }, end: { x: 553, y: 766 }, thickness: 2, color: palette.accent });
  } else {
    page.drawRectangle({ x: 0, y: 720, width: 595.28, height: 121.89, color: palette.tint });
    page.drawRectangle({ x: 42, y: 740, width: 8, height: 66, color: palette.accent });
  }
}

function drawHeader(
  page: PDFPage,
  data: InvoiceBuilderInput,
  regular: PDFFont,
  bold: PDFFont,
  palette: Palette,
) {
  const inverse = data.templateId === "classic" ? rgb(1, 1, 1) : palette.ink;
  page.drawText("INVOICE", { x: 48, y: 786, size: 28, font: bold, color: inverse });
  page.drawText(fitText(data.businessName, bold, 16, 250), {
    x: 48,
    y: 760,
    size: 16,
    font: bold,
    color: inverse,
  });
  drawRight(page, `# ${data.invoiceNumber}`, 547, 791, 12, bold, inverse);
  drawRight(page, `Issued ${formatDate(data.issueDate)}`, 547, 771, 9, regular, inverse);
  drawRight(page, `Due ${formatDate(data.dueDate)}`, 547, 755, 9, regular, inverse);
}

function drawParties(
  page: PDFPage,
  data: InvoiceBuilderInput,
  regular: PDFFont,
  bold: PDFFont,
  palette: Palette,
) {
  drawAddressBlock(page, "FROM", data.businessName, data.businessAddress, data.businessEmail, data.businessPhone, 48, 690, regular, bold, palette);
  drawAddressBlock(page, "BILL TO", data.clientName, data.clientAddress, data.clientEmail, data.clientPhone, 315, 690, regular, bold, palette);
}

function drawAddressBlock(
  page: PDFPage,
  label: string,
  name: string,
  address: string,
  email: string,
  phone: string,
  x: number,
  y: number,
  regular: PDFFont,
  bold: PDFFont,
  palette: Palette,
) {
  page.drawText(label, { x, y, size: 8, font: bold, color: palette.accent });
  page.drawText(fitText(name, bold, 11, 220), { x, y: y - 20, size: 11, font: bold, color: palette.ink });
  let lineY = y - 36;
  for (const line of wrapText(address, regular, 9, 220).slice(0, 3)) {
    page.drawText(line, { x, y: lineY, size: 9, font: regular, color: palette.muted });
    lineY -= 13;
  }
  page.drawText(fitText(email, regular, 9, 220), { x, y: lineY, size: 9, font: regular, color: palette.muted });
  if (phone) page.drawText(fitText(phone, regular, 9, 220), { x, y: lineY - 13, size: 9, font: regular, color: palette.muted });
}

function drawItems(
  page: PDFPage,
  data: InvoiceBuilderInput,
  regular: PDFFont,
  bold: PDFFont,
  palette: Palette,
) {
  const top = 565;
  page.drawRectangle({ x: 42, y: top, width: 511, height: 28, color: palette.accent });
  page.drawText("DESCRIPTION", { x: 52, y: top + 10, size: 8, font: bold, color: rgb(1, 1, 1) });
  drawRight(page, "QTY", 392, top + 10, 8, bold, rgb(1, 1, 1));
  drawRight(page, "RATE", 468, top + 10, 8, bold, rgb(1, 1, 1));
  drawRight(page, "AMOUNT", 543, top + 10, 8, bold, rgb(1, 1, 1));

  let y = top - 24;
  for (const [index, item] of data.lineItems.entries()) {
    if (index % 2 === 1) page.drawRectangle({ x: 42, y: y - 8, width: 511, height: 24, color: palette.tint });
    page.drawText(fitText(item.description, regular, 9, 275), { x: 52, y, size: 9, font: regular, color: palette.ink });
    drawRight(page, formatQuantity(item.quantity), 392, y, 9, regular, palette.ink);
    drawRight(page, formatMoney(Math.round(item.unitPrice * 100), "usd"), 468, y, 9, regular, palette.ink);
    drawRight(page, formatMoney(Math.round(item.quantity * item.unitPrice * 100), "usd"), 543, y, 9, regular, palette.ink);
    y -= 24;
  }

  const totals = invoiceTotals(data);
  const totalY = Math.min(y - 14, 300);
  drawTotalLine(page, "Subtotal", totals.subtotalCents, totalY, regular, palette);
  drawTotalLine(page, `Tax (${formatQuantity(data.taxRate)}%)`, totals.taxCents, totalY - 20, regular, palette);
  page.drawRectangle({ x: 365, y: totalY - 54, width: 188, height: 30, color: palette.accent });
  page.drawText("TOTAL", { x: 376, y: totalY - 43, size: 10, font: bold, color: rgb(1, 1, 1) });
  drawRight(page, formatMoney(totals.totalCents, "usd"), 543, totalY - 43, 11, bold, rgb(1, 1, 1));
}

function drawTotalLine(page: PDFPage, label: string, cents: number, y: number, font: PDFFont, palette: Palette) {
  page.drawText(label, { x: 376, y, size: 9, font, color: palette.muted });
  drawRight(page, formatMoney(cents, "usd"), 543, y, 9, font, palette.ink);
}

function drawFooter(
  page: PDFPage,
  data: InvoiceBuilderInput,
  regular: PDFFont,
  bold: PDFFont,
  palette: Palette,
) {
  let y = 160;
  if (data.paymentTerms) {
    page.drawText("PAYMENT TERMS", { x: 48, y, size: 8, font: bold, color: palette.accent });
    y -= 16;
    for (const line of wrapText(data.paymentTerms, regular, 8, 500).slice(0, 3)) {
      page.drawText(line, { x: 48, y, size: 8, font: regular, color: palette.muted });
      y -= 11;
    }
  }
  if (data.notes) {
    y -= 8;
    page.drawText("NOTES", { x: 48, y, size: 8, font: bold, color: palette.accent });
    y -= 16;
    for (const line of wrapText(data.notes, regular, 8, 500).slice(0, 3)) {
      page.drawText(line, { x: 48, y, size: 8, font: regular, color: palette.muted });
      y -= 11;
    }
  }
  page.drawText("Generated by DueNudge", { x: 48, y: 28, size: 7, font: regular, color: palette.muted });
}

function drawRight(page: PDFPage, value: string, right: number, y: number, size: number, font: PDFFont, color: RGB) {
  const text = safeText(value);
  page.drawText(text, { x: right - font.widthOfTextAtSize(text, size), y, size, font, color });
}

function fitText(value: string, font: PDFFont, size: number, width: number) {
  let text = safeText(value);
  while (text.length > 1 && font.widthOfTextAtSize(text, size) > width) text = `${text.slice(0, -2)}…`;
  return safeText(text);
}

function wrapText(value: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  for (const paragraph of safeText(value).split(/\r?\n/)) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate;
      else {
        if (line) lines.push(line);
        line = fitText(word, font, size, width);
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function safeText(value: string) {
  return value.normalize("NFKD").replace(/[^\x20-\x7E\n\r]/g, "?").replace(/[\r\n]+/g, " ");
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatQuantity(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
