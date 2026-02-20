import puppeteer from 'puppeteer-core'

export async function renderPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    // 🔥 networkidle0 → domcontentloaded (Cloud Run 안정화)
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
    })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
    })

    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}