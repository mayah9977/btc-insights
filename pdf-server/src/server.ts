import express from 'express'
import { renderPdf } from './renderPdf'

const app = express()

app.use(express.json({ limit: '10mb' }))

// ✅ 브라우저 테스트용 (Cloud Run 헬스 체크 겸용)
app.get('/', (req, res) => {
  res.send('PDF Server OK')
})

// ✅ PDF 생성 API
app.post('/pdf', async (req, res) => {
  const { html } = req.body

  if (!html) {
    return res.status(400).json({
      ok: false,
      reason: 'html required',
    })
  }

  try {
    const buffer = await renderPdf(html)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'inline; filename="result.pdf"')
    res.send(buffer)
  } catch (err) {
    console.error(err)
    res.status(500).json({
      ok: false,
      reason: 'pdf render failed',
    })
  }
})

// ✅ Cloud Run 권장 포트 (8080)
app.listen(8080, () => {
  console.log('PDF server running on 8080')
})
