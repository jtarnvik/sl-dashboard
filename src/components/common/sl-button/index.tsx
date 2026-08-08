import {ReactNode} from "react";
import {Button} from "@headlessui/react";
import classNames from "classnames";

type Props = {
  onClick: () => void,
  thin?: boolean,
  children: ReactNode,
  disabled?: boolean,
  // Outlined rather than filled, for an action that sits beside a primary one and must not compete with it.
  secondary?: boolean
}

export function SLButton({onClick, thin, children, disabled = false, secondary = false}: Props) {
  const buttonSizing = classNames({
    'p-[6px]': !thin,
    'p-px px-[5px]' : thin
  });

  const buttonColours = secondary
    ? "border border-[#184fc2] bg-white text-[#184fc2] data-hover:bg-[#e8eefb] data-active:bg-[#e8eefb]"
    : "bg-[#184fc2] text-white data-hover:bg-[#578ff3] data-active:bg-[#578ff3]";

  return (
    <Button
      className={"rounded-sm text-sm data-disabled:opacity-40 data-disabled:cursor-not-allowed focus:outline-hidden " + buttonColours + " " + buttonSizing}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
