import { useEffect, useState } from "react";

import { fetchBackendVersion } from "../../communication/backend.ts";
import { APP_NAME, CONTACT_EMAIL } from "../../communication/constant.ts";
import { ModalDialog } from "../common/modal-dialog";

type Props = {
  aboutOpen: boolean,
  setAboutOpen: (open: boolean) => void,
}

export function About({ aboutOpen, setAboutOpen }: Props) {
  const [backendVersion, setBackendVersion] = useState<string | null>(null);

  // Fetched on first open and kept for the page session — the version cannot change without the backend
  // restarting, which ends the session anyway.
  useEffect(() => {
    if (aboutOpen && backendVersion === null) {
      fetchBackendVersion().then(version => setBackendVersion(version ?? "okänd"));
    }
  }, [aboutOpen, backendVersion]);

  return (
    <ModalDialog isOpen={aboutOpen} onClose={() => setAboutOpen(false)} title={`Om ${APP_NAME}`}>
      <p className="text-gray-800">
        {APP_NAME} är ett litet hobbyprojekt som visar avgångar, reseförslag och aktuell trafik
        för Stockholms kollektivtrafik.
      </p>
      <dl className="flex gap-2 text-gray-800">
        <dt className="font-medium text-gray-700">Serverversion:</dt>
        <dd>{backendVersion ?? "…"}</dd>
      </dl>
      <p className="text-gray-800">
        Frågor eller synpunkter? Hör av dig till{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#184fc2] hover:text-[#578ff3] underline">
          {CONTACT_EMAIL}
        </a>.
      </p>
    </ModalDialog>
  );
}
