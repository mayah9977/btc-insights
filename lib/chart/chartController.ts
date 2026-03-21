/* =========================================================
   ChartController
   Event routing layer between realtime bridge and chart engine
========================================================= */

import { chartRealtimeBridge } from '@/lib/chart/chartRealtimeBridge'
import { ChartBuffer, ChartPoint } from '@/lib/chart/chartBuffer'
import { chartEngine } from '@/lib/chart/chartEngine'

type ChartRenderer<T extends ChartPoint> = (data: T[]) => void

type ChartEntry<T extends ChartPoint> = {
  buffer: ChartBuffer<T>
  renderer: ChartRenderer<T>
}

/* =========================================================
   🔥 타입 정의 추가 (핵심)
========================================================= */
export interface IChartController {
  push: <T extends ChartPoint>(id: string, point: T) => void
  registerChart: <T extends ChartPoint>(
    id: string,
    bufferSize: number,
    renderer: ChartRenderer<T>
  ) => void
  unregisterChart: (id: string) => void
  getBuffer: <T extends ChartPoint>(id: string) => ChartBuffer<T> | undefined
}

/* =========================================================
   ChartController
========================================================= */
class ChartController implements IChartController {

  private static instance: ChartController
  private charts = new Map<string, ChartEntry<any>>()

  static getInstance() {
    if (!this.instance) {
      this.instance = new ChartController()
    }
    return this.instance
  }

  /* =========================================================
     Register chart
  ========================================================= */
  registerChart<T extends ChartPoint>(
    id: string,
    bufferSize: number,
    renderer: ChartRenderer<T>
  ) {

    if (this.charts.has(id)) return

    const buffer = new ChartBuffer<T>(bufferSize)

    this.charts.set(id, {
      buffer,
      renderer
    })

    /* chartEngine render loop */
    chartEngine.register(id, () => {
      const entry = this.charts.get(id)
      if (!entry) return

      const data = entry.buffer.toArray()

      try {
        entry.renderer(data)
      } catch {}
    })

    /* realtime bridge subscription */
    chartRealtimeBridge.register(id, (point: T) => {
      const entry = this.charts.get(id)
      if (!entry) return

      entry.buffer.push(point)
    })
  }

  /* =========================================================
     push
  ========================================================= */
  push<T extends ChartPoint>(id: string, point: T) {
    chartRealtimeBridge.update(id, point)
  }

  /* =========================================================
     Unregister chart
  ========================================================= */
  unregisterChart(id: string) {

    if (!this.charts.has(id)) return

    this.charts.delete(id)

    chartEngine.unregister(id)
    chartRealtimeBridge.unregister(id)
  }

  /* =========================================================
     Get buffer
  ========================================================= */
  getBuffer<T extends ChartPoint>(id: string): ChartBuffer<T> | undefined {
    return this.charts.get(id)?.buffer
  }
}

/* =========================================================
   Export (타입 포함)
========================================================= */
export const chartController: IChartController =
  ChartController.getInstance()
  