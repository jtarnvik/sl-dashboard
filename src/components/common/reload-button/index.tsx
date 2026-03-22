import { RxReload } from 'react-icons/rx';

import { SLButton } from "../sl-button";

type Props = {
  onClick: () => void
}

export function ReloadButton({ onClick }: Props) {
  return (
    <SLButton onClick={onClick}>
      <RxReload />
    </SLButton>
  );
}
