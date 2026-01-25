import {ModalDialog} from "../common/modal-dialog";
import {useState} from "react";
import {URL_GET_STOP_POINT} from "../../communication/constant.ts";
import axios from "axios";
import {StopFinderResponse} from "../../types/sl-journeyplaner-responses.ts";
import {SLButton} from "../common/sl-button";

type Props = {
  settingsOpen: boolean,
  setSettingsOpen: (open: boolean) => void
}

export function Settings({settingsOpen, setSettingsOpen}:Props) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResponse, setSearchResponse] = useState<StopFinderResponse | undefined>(undefined);
  const [searchInProgress, setSearchInProgress] = useState<boolean>(false);

  function stopPointSearch() {
    setSearchInProgress(true);
    setSearchResponse(undefined);

    const url =  URL_GET_STOP_POINT(searchTerm) ;
    axios.get(url)
      .then(function (response) {
        setSearchResponse(response.data);
      })
      .catch(function (error) {
        // TODO: Log error
        // handle error
        console.log(error);
      })
      .finally(function () {
        // always executed
        setSearchInProgress(false);
      });
  }

  const MAX_RESULTS = 5;
  const totalResults = searchResponse?.locations?.length ?? 0;
  const visibleResults = searchResponse?.locations?.slice(0, MAX_RESULTS) ?? [];

  return (
    <ModalDialog isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Inställningar" >
      <div className="flex flex-col space-y-2">
        Hållplats
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <SLButton onClick={stopPointSearch} disabled={searchInProgress}>Sök</SLButton>
      </div>

      {searchResponse &&
        <>
          {visibleResults.map((itm, index) => {
            return (
              <div key={index}>
                {itm.disassembledName} - {itm.parent?.name}
              </div>
            );
          })}

          <div className="text-sm text-gray-500">
            Visar {Math.min(MAX_RESULTS, totalResults)}({totalResults})
          </div>
        </>
      }
    </ModalDialog>
  );
}