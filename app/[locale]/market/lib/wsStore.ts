type RealtimeState = {
  funding: number;
  markPrice: number;
  timestamp: number;
};

let state: RealtimeState | null = null;

export function updateRealtimeData(data: RealtimeState) {
  state = data;
}

export function getRealtimeData() {
  return state;
}
