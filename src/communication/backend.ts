import axios from "axios";
import {
  URL_BACKEND_ACCESS_REQUEST,
  URL_BACKEND_ADMIN_ACCESS_REQUEST_COUNT,
  URL_BACKEND_ADMIN_ACCESS_REQUESTS,
  URL_BACKEND_ADMIN_APPROVE_ACCESS_REQUEST,
  URL_BACKEND_ADMIN_DELETE_USER,
  URL_BACKEND_ADMIN_REJECT_ACCESS_REQUEST,
  URL_BACKEND_ADMIN_USERS,
  URL_BACKEND_GET_CHECK_AUTH,
  URL_BACKEND_LOGIN,
  URL_BACKEND_LOGOUT,
} from "./constant.ts";
import {AccessRequestItem, AllowedUserItem, User} from "../types/backend.ts";

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


export async function requestAccess(email: string, message: string, setError: SetError): Promise<boolean> {
  try {
    await backend.post(URL_BACKEND_ACCESS_REQUEST, { email, message });
    return true;
  } catch {
    setError("Kunde inte skicka ansökan. Försök igen senare.");
    return false;
  }
}

export async function fetchAccessRequestCount(): Promise<number | null> {
  try {
    const response = await backend.get<number>(URL_BACKEND_ADMIN_ACCESS_REQUEST_COUNT);
    return response.data;
  } catch {
    return null;
  }
}

export async function fetchAccessRequests(setError: SetError): Promise<AccessRequestItem[]> {
  try {
    const response = await backend.get<AccessRequestItem[]>(URL_BACKEND_ADMIN_ACCESS_REQUESTS);
    return response.data;
  } catch {
    setError("Kunde inte hämta väntande förfrågningar.");
    return [];
  }
}

export async function approveAccessRequest(id: number, setError: SetError): Promise<boolean> {
  try {
    await backend.post(URL_BACKEND_ADMIN_APPROVE_ACCESS_REQUEST(id));
    return true;
  } catch {
    setError("Kunde inte godkänna förfrågan.");
    return false;
  }
}

export async function rejectAccessRequest(id: number, setError: SetError): Promise<boolean> {
  try {
    await backend.delete(URL_BACKEND_ADMIN_REJECT_ACCESS_REQUEST(id));
    return true;
  } catch {
    setError("Kunde inte avslå förfrågan.");
    return false;
  }
}

export async function fetchAllowedUsers(setError: SetError): Promise<AllowedUserItem[]> {
  try {
    const response = await backend.get<AllowedUserItem[]>(URL_BACKEND_ADMIN_USERS);
    return response.data;
  } catch {
    setError("Kunde inte hämta användare.");
    return [];
  }
}

export async function deleteAllowedUser(id: number, setError: SetError): Promise<boolean> {
  try {
    await backend.delete(URL_BACKEND_ADMIN_DELETE_USER(id));
    return true;
  } catch {
    setError("Kunde inte ta bort användare.");
    return false;
  }
}