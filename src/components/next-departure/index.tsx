import {useCallback, useEffect, useImperativeHandle, useState} from "react";
import axios from 'axios';
import {SITE_SKOGSLOPARVAGEN_4_CHAR, URL_GET_DEPARTURES_FROM_SITE} from "../../communication/constant.ts";
import {DateTime, Duration} from "luxon";
import {shortSwedishHumanizer} from "../../util/humanizer.ts";
import {sortDeparturesByDestination} from "../../util/sorters.ts";
import {useVisibility} from "../../hook/use-visibility.ts";
import {Line} from "../common/line";
import {Card} from "../common/card";

import "./index.css"
import {Destination} from "./destination.tsx";
import {SLButton} from "../common/sl-button";
import {ModalDialog} from "../common/modal-dialog";
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

function Legend({legendData, title, useColumns}: PropsLegend) {
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


type Props = {
  performManualUpdate?: React.Ref<ScheduleOperations>;
}

export function NextDeparture({performManualUpdate}: Props) {
  const [departures, setDepartures] = useState<SlDeparturesResponse | undefined>(undefined);
  const [lastUpdated, setLastUpdated] = useState<DateTime | undefined>(undefined);
  const [diffSinceLastUpdated, setDiffSinceLastUpdated] = useState<Duration | undefined>(undefined);
  const [legendOpen, setLegendOpen] = useState<boolean>(false);

  const updateDiffSinceLatUpdated = useCallback(() => {
    setDiffSinceLastUpdated(lastUpdated?.diffNow())
  }, [lastUpdated]);

  const updateDepartures = useCallback(() => {
    const url = URL_GET_DEPARTURES_FROM_SITE(SITE_SKOGSLOPARVAGEN_4_CHAR);
    axios.get(url)
      .then(function (response) {
        setDepartures(response.data);
        setLastUpdated(DateTime.now());
        setDiffSinceLastUpdated(DateTime.now().diffNow())

        // console.log(response);
      })
      .catch(function (error) {
        // TODO: Log error
        // handle error
        console.log(error);
      })
      .finally(function () {
        // always executed
      });
  }, []);

  useVisibility({onVisible: updateDepartures});

  function manualUpdate() {
    updateDepartures();
  }

  useEffect(() => {
    updateDepartures();
    const intervalId = setInterval(updateDepartures, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [updateDepartures]);

  useEffect(() => {
    const intervalId = setInterval(updateDiffSinceLatUpdated, 1000);
    return () => clearInterval(intervalId);
  }, [updateDiffSinceLatUpdated]);

  useImperativeHandle(performManualUpdate, () => ({
    manualUpdate: manualUpdate,
  }));

  function handleLegend() {
    setLegendOpen(true);
  }

  const departurePres: Departure[] = sortDeparturesByDestination(departures?.departures);

  const symbols: { symbol: React.ReactNode; legend: React.ReactNode; }[] = [
    {
      symbol: <Line journey={{id: 177, state: "EXPECTED"}}
                    line={{id: 117, designation: "117", transport_mode: "BUS"}} />,
      legend: <div>Ej avgått</div>
    },
    {
      symbol: <Line journey={{id: 177, state: "SLOWPROGRESS"}}
                    line={{id: 117, designation: "117", transport_mode: "BUS"}} />,
      legend: <div>Låg fart</div>
    },
    {
      symbol: <Line journey={{id: 177, state: "NORMALPROGRESS"}}
                    line={{id: 117, designation: "117", transport_mode: "BUS"}} />,
      legend: <div>Normal fart</div>
    },
    {
      symbol: <Line journey={{id: 177, state: "FASTPROGRESS"}}
                    line={{id: 117, designation: "117", transport_mode: "BUS"}} />,
      legend: <div>Hög fart</div>
    },
  ];
  const destinations: { symbol: React.ReactNode; legend: React.ReactNode; }[] = [
    {
      symbol: <Destination journey={{id: 177, state: "EXPECTED"}} destination="Brommaplan" />,
      legend: <div>Planerad</div>
    },
    {
      symbol: <Destination journey={{id: 177, state: "NORMALPROGRESS"}} destination="Brommaplan" />,
      legend: <div>På väg</div>
    },
    {
      symbol: <Destination journey={{id: 177, state: "CANCELLED"}} destination="Brommaplan" />,
      legend: <div>Inställd</div>
    },
  ];

  return (
    <Card>
      <div className="flex justify-between">
        <div>Uppdaterad {((diffSinceLastUpdated) ? shortSwedishHumanizer(diffSinceLastUpdated?.toMillis()) : "-")}</div>
        <div>Avgår</div>
      </div>
      {departurePres.length > 0 &&
        departurePres.map((departure, index) =>
          <div key={index} className="departures-grid">
            <div className="grid-line justify-self-start">
              <Line line={departure.line} journey={departure.journey} />
            </div>
            <div className="grid-name">
              <Destination journey={departure.journey} destination={departure.destination} />
            </div>
            <div className="grid-time justify-self-end">
              {departure.display}
            </div>
          </div>
        )}
      <div className="w-full flex justify-end">
        <SLButton onClick={handleLegend} thin>Symboler</SLButton>
      </div>
      <ModalDialog
        isOpen={legendOpen}
        onClose={() => setLegendOpen(false)}
        title={"Symboler"}
      >
        <Legend legendData={symbols} title="Linjesymbol" useColumns/>
        <Legend legendData={destinations} title="Destination" />
      </ModalDialog>
    </Card>
  )
}
