type ChartUpdater = (data: any) => void

class ChartRealtimeBridge {

  private static instance: ChartRealtimeBridge

  private charts = new Map<string, ChartUpdater>()

  static getInstance() {
    if (!this.instance) {
      this.instance = new ChartRealtimeBridge()
    }
    return this.instance
  }

  register(id: string, updater: ChartUpdater) {
    this.charts.set(id, updater)
  }

  unregister(id: string) {
    this.charts.delete(id)
  }

  update(id: string, data: any) {
    const chart = this.charts.get(id)
    if (chart) {
      chart(data)
    }
  }

}

export const chartRealtimeBridge = ChartRealtimeBridge.getInstance()
