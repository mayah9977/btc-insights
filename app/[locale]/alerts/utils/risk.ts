export type RowStatus = 'safe' | 'warning' | 'danger'

export const getRowRisk = (status: RowStatus): number => {
  switch (status) {
    case 'danger':
      return 2
    case 'warning':
      return 1
    default:
      return 0
  }
}
