import { useState } from 'react';
import { ExtremeWarningModal } from './ExtremeWarningModal';

export function ExtremeEntry({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);

  if (!ok) {
    return <ExtremeWarningModal onConfirm={() => setOk(true)} />;
  }

  return <>{children}</>;
}
