import html2canvas from 'html2canvas'

export async function captureChartBase64(
  el: HTMLElement
): Promise<string> {
  const canvas = await html2canvas(el, {
    backgroundColor: '#05070d',
    scale: 2,
  })

  return canvas.toDataURL('image/png')
}
