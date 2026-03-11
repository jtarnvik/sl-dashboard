import axios from "axios";
import {RefObject} from "react";

import { AbortControllerState, createAbortController, isAbortError } from "../types/communication";

export function fetchAbortable<T>(
  url: string,
  controllerRef: RefObject<AbortControllerState>,
  onSuccess: (data: T) => void,
  onError: (error: string, retry: () => void) => void,
): void {
  if (controllerRef.current) {
    controllerRef.current.abort("Previous request contains stale data");
  }

  const controller = createAbortController();
  controllerRef.current = controller;

  function attempt(isRetry: boolean): void {
    axios.get<T>(url, { signal: controller.signal })
      .then(function (response) {
        onSuccess(response.data);
      })
      .catch(function (error) {
        if (isAbortError(error)) {
          return;
        }
        if (!isRetry && axios.isAxiosError(error) && error.response?.status === 429) {
          const timeoutId = setTimeout(function () { attempt(true); }, 500);
          controller.signal.addEventListener("abort", function () { clearTimeout(timeoutId); });
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        onError(message, () => attempt(false));
      })
      .finally(function () {
        if (controllerRef.current === controller) {
          controllerRef.current = undefined;
        }
      });
  }

  attempt(false);
}
