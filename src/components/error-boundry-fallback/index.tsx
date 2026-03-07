import {Card} from "../common/card";

export function ErrorBoundryFallback() {
  return (<div>
    <Card>
      Någonting har gått fel. Prova att ladda om sidan eller i värsta fall, stäng fliken och öppna den igen.
    </Card>
  </div>);
}