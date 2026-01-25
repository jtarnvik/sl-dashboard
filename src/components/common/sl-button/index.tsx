import {Button} from "@headlessui/react";
import classNames from "classnames";
import {ReactNode} from "react";

type Props = {
  onClick: () => void,
  thin?: boolean,
  children: ReactNode,
  disabled?: boolean
}

export function SLButton({onClick, thin, children, disabled = false}: Props) {
  const buttonSizing = classNames({
    'p-[6px]': !thin,
    'p-[1px] px-[5px]' : thin
  });

  return (
    <Button
      className={"rounded bg-[#184fc2] text-sm text-white data-[hover]:bg-[#578ff3] data-[active]:bg-[#578ff3] focus:outline-none " + buttonSizing}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
