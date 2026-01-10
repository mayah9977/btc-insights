import { useEffect } from "react";

type AlertMessage = {
  type: "ALERT_TRIGGERED";
  alertId?: string;
};

export function usePushNotification(
  onAlertTriggered: (payload?: AlertMessage) => void
) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== "ALERT_TRIGGERED") return;

      onAlertTriggered({
        type: "ALERT_TRIGGERED",
        alertId: data.alertId,
      });
    };

    navigator.serviceWorker.addEventListener("message", handler);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handler);
    };
  }, [onAlertTriggered]);
}
