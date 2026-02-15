/* =========================================================
 * 🔥 Rolling Statistics (OI Drift 용)
 * ========================================================= */

type RollingState = {
  buf: number[]
  sum: number
  sumSq: number
  max: number
}

const rollingMap = new Map<string, RollingState>()

export function pushRollingValue(
  key: string,
  value: number,
  windowSize: number = 50,
) {
  let st = rollingMap.get(key)

  if (!st) {
    st = { buf: [], sum: 0, sumSq: 0, max: windowSize }
    rollingMap.set(key, st)
  }

  st.max = windowSize

  st.buf.push(value)
  st.sum += value
  st.sumSq += value * value

  while (st.buf.length > st.max) {
    const out = st.buf.shift()
    if (typeof out === 'number') {
      st.sum -= out
      st.sumSq -= out * out
    }
  }
}

export function getRollingMean(key: string): number | null {
  const st = rollingMap.get(key)
  if (!st || st.buf.length === 0) return null
  return st.sum / st.buf.length
}

export function getRollingStd(key: string): number | null {
  const st = rollingMap.get(key)
  if (!st || st.buf.length < 2) return null

  const mean = st.sum / st.buf.length
  const variance =
    st.sumSq / st.buf.length - mean * mean

  return Math.sqrt(Math.max(variance, 0))
}
