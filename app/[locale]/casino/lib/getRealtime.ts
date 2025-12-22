import { getRealtimeData } from "./wsStore";

export async function getRealtime() {
  return getRealtimeData();
}
