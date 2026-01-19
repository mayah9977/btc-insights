import nodemailer from 'nodemailer'

/**
 * VIP 리포트 이메일 발송
 */
export async function sendVIPReportEmail(
  to: string,
  pdfBuffer: Buffer
) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: '"BTC 인사이트" <no-reply@btc-insight.ai>',
    to,
    subject: '📊 VIP 월간 성과 리포트',
    text: '첨부된 PDF에서 이번 달 VIP 성과 리포트를 확인하세요.',
    attachments: [
      {
        filename: 'vip-monthly-report.pdf',
        content: pdfBuffer, // ✅ Buffer 그대로 사용
        contentType: 'application/pdf',
      },
    ],
  })
}
