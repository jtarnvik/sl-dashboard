import { Link } from "react-router-dom";

import { Card } from "../../common/card";

export function LoginTeaser() {
  return (
    <Card>
      <div className="py-2 flex flex-col">
        <p className="text-sm mb-2">
          Logga in för att se AI tolkad avvikelseinformation, reseplanering och övriga funktioner. Helt gratis.
        </p>
        <div className="flex justify-end">
          <Link to="/gdpr" className="text-xs text-gray-400 hover:text-gray-600">
            Om din data
          </Link>
        </div>
      </div>
    </Card>
  );
}
