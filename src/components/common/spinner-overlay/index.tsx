import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  showSpinner: boolean;
};

export function SpinnerOverlay({ children, showSpinner }: Props) {
  return (
    <div className="relative">
      {children}
      {showSpinner && (
        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#184fc2] border-t-transparent animate-spin" />
      )}
    </div>
  );
}
