import { analyzeRiskPnLCorrelation } from '@/lib/analysis/riskPnlCorrelation'

export const runtime = 'nodejs'

function generateSimplePdf(content: string): Uint8Array {
  const text = content.replace(/\n/g, '\\n')

  const pdf = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
   /Contents 4 0 R
   /Resources << /Font << /F1 5 0 R >> >>
>>
endobj
4 0 obj
<< /Length ${text.length + 50} >>
stream
BT
/F1 12 Tf
72 720 Td
(${text}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000117 00000 n
0000000270 00000 n
0000000400 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
520
%%EOF
`

  return new TextEncoder().encode(pdf)
}

export async function GET() {
  const stats = analyzeRiskPnLCorrelation()

  const content = `
VIP3 RISK REPORT

LOW Risk
Count: ${stats.LOW.count}
Avg PnL: ${stats.LOW.avgPnL.toFixed(2)}

MEDIUM Risk
Count: ${stats.MEDIUM.count}
Avg PnL: ${stats.MEDIUM.avgPnL.toFixed(2)}

HIGH Risk
Count: ${stats.HIGH.count}
Avg PnL: ${stats.HIGH.avgPnL.toFixed(2)}
`

  const pdfBytes = generateSimplePdf(content)

  // ✅ 표준 Fetch 방식: ReadableStream
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(pdfBytes)
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        'attachment; filename="vip3-risk-report.pdf"',
    },
  })
}
