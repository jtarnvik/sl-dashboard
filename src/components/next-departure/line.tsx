type Props = {
  line: Line
}

export function Line({line}: Props) {
  return (
    <div className="grid-line">{line.designation}</div>
  );
}