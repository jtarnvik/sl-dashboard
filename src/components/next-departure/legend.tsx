import classNames from "classnames";

interface LegendData {
  symbol: React.ReactNode,
  legend: React.ReactNode,
}

type PropsLegend = {
  legendData: LegendData[],
  title: String,
  useColumns?: boolean
}

export function Legend({legendData, title, useColumns}: PropsLegend) {
  const columnStyling = classNames({
    'grid grid-cols-2 gap-y-1 gap-x-2': useColumns
  });

  return (
    <div className="mt-0">
      <p className="font-semibold">{title}</p>
      <div className={columnStyling}>
        {legendData.map((itm, index) =>
          <div className="flex items-center space-x-2" id={"" + index}>
            {itm.symbol}
            {itm.legend}
          </div>
        )}
      </div>
    </div>
  );
}