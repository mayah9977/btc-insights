// lib/pdf/simplePdf.ts
import { PDFDocument, StandardFonts } from 'pdf-lib'

export async function generateSimplePdf(text: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595, 842])
  const font = await pdf.embedFont(StandardFonts.Helvetica)

  page.drawText(text, {
    x: 50,
    y: 780,
    size: 12,
    font,
    maxWidth: 500,
    lineHeight: 16,
  })

  return await pdf.save()
}
