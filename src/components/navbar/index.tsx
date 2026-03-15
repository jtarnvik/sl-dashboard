import {SlLogo} from "./sl-logo";

type Props = {
  heading: string
}

export function Navbar({heading}: Props) {
  return (
    <nav
      className="bg-[#2870f0] fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
      <div className="min-h-[53px] max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-2">
        <div className="flex space-x-2 text-white text-2xl">
          <SlLogo />
          <span>
          {heading}
          </span>
        </div>
      </div>
    </nav>
  );
}
