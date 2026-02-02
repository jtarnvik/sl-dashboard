import axios, { type CancelTokenSource } from "axios";

export function getCancelToken(): CancelTokenSource {
  return axios.CancelToken.source();
}


