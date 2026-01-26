import html2canvas from 'html2canvas'

export async function captureChartBase64(
  el: HTMLElement
): Promise<string> {
  const canvas = await html2canvas(el, {
    backgroundColor: '#000',
    scale: 2,
  })
  return canvas.toDataURL('image/png')
}
