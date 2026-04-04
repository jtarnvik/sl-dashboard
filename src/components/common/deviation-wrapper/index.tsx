import { ReactNode, useState } from 'react';
import { DeviationModal } from '../deviation-modal';
import { EnrichedDeviation } from '../../../types/deviations-common.ts';

type Props = {
  children: ReactNode;
  deviations: EnrichedDeviation[];
};

export function DeviationWrapper({ children, deviations }: Props) {
  const [open, setOpen] = useState(false);

  if (deviations.length === 0) {
    return (<div>{children}</div>);
  }

  return (
    <div>
      <div className={"deviation-info"} onClick={() => setOpen(true)}>
        {children}
      </div>
      <DeviationModal
        onClose={() => setOpen(false)}
        open={open}
        deviation={deviations}
      />
    </div>
  );
}
