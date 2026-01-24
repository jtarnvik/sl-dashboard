import {LineJourney} from "../common/line";
import {Destination} from "./destination.tsx";

export const symbols: { symbol: React.ReactNode; legend: React.ReactNode; }[] = [
  {
    symbol: <LineJourney journey={{id: 177, state: "EXPECTED"}}
                  line={{id: 117, designation: "117", transport_mode: "BUS"}} />,
    legend: <div>Ej avgått</div>
  },
  {
    symbol: <LineJourney journey={{id: 177, state: "SLOWPROGRESS"}}
                  line={{id: 117, designation: "117", transport_mode: "BUS"}} />,
    legend: <div>Låg fart</div>
  },
  {
    symbol: <LineJourney journey={{id: 177, state: "NORMALPROGRESS"}}
                  line={{id: 117, designation: "117", transport_mode: "BUS"}} />,
    legend: <div>Normal fart</div>
  },
  {
    symbol: <LineJourney journey={{id: 177, state: "FASTPROGRESS"}}
                  line={{id: 117, designation: "117", transport_mode: "BUS"}} />,
    legend: <div>Hög fart</div>
  },
  {
    symbol: <LineJourney journey={{id: 177, state: "ATORIGIN"}}
                  line={{id: 117, designation: "117", transport_mode: "BUS"}} />,
    legend: <div>Avgångsstation</div>
  },
];
export const destinations: { symbol: React.ReactNode; legend: React.ReactNode; }[] = [
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
