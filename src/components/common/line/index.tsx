type Props = {
  line: Line
}

export function Line({line}: Props) {
  return (
    <div className="flex">
      <div
        className="px-[3px] grid-line font-signage bg-black text-white font-extrabold pt-[2px] mb-[4px] leading-[calc(1em-4px)] mt-[4px]">
        {line.designation}
      </div>
    </div>
  );
}