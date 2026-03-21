/* =========================================================
   ChartEngine
   High-performance RAF scheduler for realtime charts
   ========================================================= */

type ChartRenderer = () => void

class ChartEngine {
  private static instance: ChartEngine

  private renderers = new Map<string, ChartRenderer>()

  private running = false
  private rafId: number | null = null

  /* FPS control (TradingView style) */
  private targetFPS = 30
  private frameInterval = 1000 / this.targetFPS
  private lastFrameTime = 0

  static getInstance() {
    if (!this.instance) {
      this.instance = new ChartEngine()
    }
    return this.instance
  }

  /* =========================================================
     Register renderer
     ========================================================= */

  register(id: string, renderer: ChartRenderer) {
    this.renderers.set(id, renderer)

    if (!this.running) {
      this.start()
    }
  }

  /* =========================================================
     Unregister renderer
     ========================================================= */

  unregister(id: string) {
    this.renderers.delete(id)

    if (this.renderers.size === 0) {
      this.stop()
    }
  }

  /* =========================================================
     Start RAF loop
     ========================================================= */

  private start() {
    if (this.running) return

    this.running = true
    this.lastFrameTime = performance.now()

    const loop = (time: number) => {
      if (!this.running) return

      const delta = time - this.lastFrameTime

      if (delta >= this.frameInterval) {
        this.lastFrameTime = time

        /* batch render all charts */
        this.renderers.forEach((render) => {
          try {
            render()
          } catch {}
        })
      }

      this.rafId = requestAnimationFrame(loop)
    }

    this.rafId = requestAnimationFrame(loop)
  }

  /* =========================================================
     Stop RAF loop
     ========================================================= */

  private stop() {
    this.running = false

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  /* =========================================================
     Change target FPS
     ========================================================= */

  setFPS(fps: number) {
    this.targetFPS = fps
    this.frameInterval = 1000 / fps
  }

  /* =========================================================
     Debug info
     ========================================================= */

  getRendererCount() {
    return this.renderers.size
  }
}

export const chartEngine = ChartEngine.getInstance()
