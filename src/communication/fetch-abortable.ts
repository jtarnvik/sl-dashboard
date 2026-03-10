import axios from "axios";
import {RefObject} from "react";

import { AbortControllerState, createAbortController, isAbortError } from "../types/communication";

export function fetchAbortable<T>(
  url: string,
  controllerRef: RefObject<AbortControllerState>,
  onSuccess: (data: T) => void,
  onError: (error: string) => void,
): void {
  if (controllerRef.current) {
    controllerRef.current.abort("Previous request contains stale data");
  }

  const controller = createAbortController();
  controllerRef.current = controller;

  axios.get<T>(url, { signal: controller.signal })
    .then(function (response) {
      onSuccess(response.data);
    })
    .catch(function (error) {
      if (isAbortError(error)) {
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      onError(message);
    })
    .finally(function () {
      if (controllerRef.current === controller) {
        controllerRef.current = undefined;
      }
    });
}
