import axios from "axios";
import {URL_BACKEND_GET_CHECK_AUTH, URL_BACKEND_LOGIN, URL_BACKEND_LOGOUT, URL_BACKEND_NOTIFICATION_TEST} from "./constant.ts";
import {User} from "../types/backend.ts";

const backend = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

backend.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event("unauthorized"));
    }
    return Promise.reject(error);
  }
);

export default backend;

type SetError = (message: string, retry?: () => void) => void;

export async function checkLoginStatus(setError: SetError): Promise<User | null> {
  try {
    const response = await backend.get<User>(URL_BACKEND_GET_CHECK_AUTH);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    setError("Kunde inte kontrollera inloggningsstatus.");
    return null;
  }
}

export function login(): void {
  window.location.href = import.meta.env.VITE_API_URL + URL_BACKEND_LOGIN;
}

export async function logout(setError: SetError): Promise<void> {
  try {
    await backend.post(URL_BACKEND_LOGOUT);
  } catch {
    setError("Kunde inte logga ut.");
  }
}

export async function sendTestNotification(setError: SetError): Promise<void> {
  try {
    await backend.post(URL_BACKEND_NOTIFICATION_TEST);
  } catch {
    setError("Kunde inte skicka testavisering.");
  }
}