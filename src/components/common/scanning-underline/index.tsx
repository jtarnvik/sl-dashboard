import { ReactNode } from 'react';

import './index.css';

type Props = {
  children: ReactNode;
  active: boolean;
  lineOffset?: number;
};

export function ScanningUnderline({ children, active, lineOffset = 0 }: Props) {
  return (
    <div className="relative">
      {children}
      {active && <div className="scanning-line" style={{ bottom: -lineOffset }} />}
    </div>
  );
}
