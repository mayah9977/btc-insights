import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

type DailyReportInput = {
  date: string
  market: string
  riskLevel: string
  judgement: string
  scenarios: {
    title: string
    probability: number
  }[]
}

export async function generateVipDailyReportPdf(
  input: DailyReportInput
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595, 842]) // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica)

  let y = 780

  const draw = (text: string, size = 12) => {
    page.drawText(text, {
      x: 50,
      y,
      size,
      font,
      color: rgb(1, 1, 1),
    })
    y -= size + 8
  }

  draw(`VIP DAILY REPORT`, 20)
  y -= 10
  draw(`Date: ${input.date}`)
  draw(`Market: ${input.market}`)
  draw(`Risk Level: ${input.riskLevel}`)
  y -= 10

  draw(`Judgement`, 14)
  draw(input.judgement)

  y -= 10
  draw(`Scenarios`, 14)

  input.scenarios.forEach((s) => {
    draw(`- ${s.title} (${s.probability}%)`)
  })

  return await pdf.save()
}
