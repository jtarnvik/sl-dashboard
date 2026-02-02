import { type AxiosError } from "axios";

export type AbortControllerState = AbortController | undefined;

export function createAbortController(): AbortController {
  return new AbortController();
}

export function isAbortError(error: unknown): boolean {
  const e = error as AxiosError & { code?: string; name?: string };
  return e?.code === "ERR_CANCELED" || e?.name === "CanceledError";
}