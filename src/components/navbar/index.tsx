import {SlLogo} from "./sl-logo";
import {ReloadButton} from "../reload-button";

type Props = {
  onManualUpdate: () => void
}

export function Navbar({onManualUpdate}: Props) {
  return (
    <nav
      className="bg-[#2870f0] fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-[6px]">
        <div className="flex space-x-2 text-white text-2xl">
          <SlLogo />
          <span>
          Skogslöparvägen
          </span>
        </div>
        <div className="flex md:order-2 space-x-3 md:space-x-0">
          <ReloadButton onClick={onManualUpdate} />
        </div>
      </div>
    </nav>
  );
}