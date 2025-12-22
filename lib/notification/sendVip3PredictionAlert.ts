import { sendMobileNotification } from './sendMobileNotification'

export function sendVip3PredictionAlert(
  probabilityPercent: number
) {
  sendMobileNotification({
    title: 'VIP3 Prediction',
    body: `Next Extreme probability ${probabilityPercent}%`,
  })
}
