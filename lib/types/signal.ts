// app/lib/types/signal.ts

export type InternalAction = "ENTRY" | "WAIT" | "OBSERVE";

export type UISignalLabel = {
  title: string;
  button: string;
  description?: string;
};
