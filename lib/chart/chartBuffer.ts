/* =========================================================
   ChartBuffer
   High-performance circular buffer for realtime charts
   ========================================================= */

export type ChartPoint = {
  ts: number
  [key: string]: any
}

export class ChartBuffer<T extends ChartPoint> {
  private buffer: (T | undefined)[]
  private size: number
  private index: number = 0
  private length: number = 0

  constructor(size: number) {
    this.size = size
    this.buffer = new Array(size)
  }

  /* =========================================================
     Push new data point
     O(1) overwrite when full
     ========================================================= */
  push(point: T) {
    this.buffer[this.index] = point

    this.index = (this.index + 1) % this.size

    if (this.length < this.size) {
      this.length++
    }
  }

  /* =========================================================
     Get latest point
     ========================================================= */
  latest(): T | undefined {
    if (this.length === 0) return undefined

    const idx =
      (this.index - 1 + this.size) % this.size

    return this.buffer[idx]
  }

  /* =========================================================
     Get ordered array for chart rendering
     ========================================================= */
  toArray(): T[] {
    const result: T[] = []

    for (let i = 0; i < this.length; i++) {
      const idx =
        (this.index - this.length + i + this.size) %
        this.size

      const item = this.buffer[idx]

      if (item) {
        result.push(item)
      }
    }

    return result
  }

  /* =========================================================
     Clear buffer
     ========================================================= */
  clear() {
    this.index = 0
    this.length = 0
    this.buffer = new Array(this.size)
  }

  /* =========================================================
     Current length
     ========================================================= */
  getLength() {
    return this.length
  }

  /* =========================================================
     Max buffer size
     ========================================================= */
  getSize() {
    return this.size
  }
}
