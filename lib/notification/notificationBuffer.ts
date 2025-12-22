type Notification = {
  message: string;
  at: number;
};

const buffer: Notification[] = [];
let timer: any = null;

export function pushNotification(
  msg: string,
  flush: (items: Notification[]) => void,
  windowMs = 5000
) {
  buffer.push({ message: msg, at: Date.now() });

  if (timer) return;

  timer = setTimeout(() => {
    flush([...buffer]);
    buffer.length = 0;
    timer = null;
  }, windowMs);
}
