// lib/pdf/cloudRunPdfClient.ts

const PDF_SERVER_URL =
  process.env.CLOUD_RUN_PDF_URL ??
  'https://pdf-server-778205600694.asia-northeast3.run.app/pdf'

const DEFAULT_TIMEOUT_MS = 10_000

export async function renderPdfByCloudRun(
  html: string
): Promise<Buffer> {
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    DEFAULT_TIMEOUT_MS
  )

  try {
    const res = await fetch(PDF_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ html }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(
        `Cloud Run PDF error ${res.status}: ${text}`
      )
    }

    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (err) {
    if ((err as any).name === 'AbortError') {
      throw new Error('Cloud Run PDF timeout')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}
