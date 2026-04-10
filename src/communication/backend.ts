import axios from "axios";
import {
  URL_BACKEND_ACCESS_REQUEST,
  URL_BACKEND_ADMIN_ACCESS_REQUEST_COUNT,
  URL_BACKEND_ADMIN_ACCESS_REQUESTS,
  URL_BACKEND_ADMIN_APPROVE_ACCESS_REQUEST,
  URL_BACKEND_ADMIN_DELETE_USER,
  URL_BACKEND_ADMIN_REJECT_ACCESS_REQUEST,
  URL_BACKEND_ADMIN_USERS,
  URL_BACKEND_DELETE_ACCOUNT,
  URL_BACKEND_GET_CHECK_AUTH,
  URL_BACKEND_CLEAR_HIDDEN_DEVIATIONS,
  URL_BACKEND_HAS_HIDDEN_DEVIATIONS,
  URL_BACKEND_HIDE_DEVIATION,
  URL_BACKEND_INTERPRET_DEVIATIONS,
  URL_BACKEND_LOGIN,
  URL_BACKEND_LOGOUT,
  URL_BACKEND_SETTINGS,
  URL_BACKEND_RECENT_STOPS,
  URL_BACKEND_ADMIN_STATISTICS,
  URL_BACKEND_SHARED_ROUTE_CREATE,
  URL_BACKEND_SHARED_ROUTE_GET,
} from "./constant.ts";
import {AccessRequestItem, AllowedUserItem, RecentStop, StatisticsData, User, UserSettings} from "../types/backend.ts";
import {BackendInterpretationResult} from "../types/deviations-common.ts";
import {Journey} from "../types/sl-journeyplaner-responses.ts";

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

export async function deleteAccount(setError: SetError): Promise<boolean> {
  try {
    await backend.delete(URL_BACKEND_DELETE_ACCOUNT);
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      setError("Kan inte ta bort det sista administratörskontot.");
    } else {
      setError("Kunde inte ta bort kontot. Försök igen senare.");
    }
    return false;
  }
}

export async function interpretDeviations(
  texts: string[],
  setError: SetError
): Promise<BackendInterpretationResult[] | null> {
  try {
    const response = await backend.post<BackendInterpretationResult[]>(
      URL_BACKEND_INTERPRET_DEVIATIONS,
      { deviationTexts: texts }
    );
    return response.data;
  } catch {
    setError("Kunde inte tolka avvikelser.");
    return null;
  }
}

export async function hideDeviation(id: number, setError: SetError): Promise<boolean> {
  try {
    await backend.post(URL_BACKEND_HIDE_DEVIATION(id));
    return true;
  } catch {
    setError("Kunde inte dölja avvikelsen.");
    return false;
  }
}

export async function fetchHasHiddenDeviations(setError: SetError): Promise<boolean> {
  try {
    const response = await backend.get<boolean>(URL_BACKEND_HAS_HIDDEN_DEVIATIONS);
    return response.data;
  } catch {
    setError("Kunde inte kontrollera dolda avvikelser.");
    return false;
  }
}

export async function clearHiddenDeviations(setError: SetError): Promise<boolean> {
  try {
    await backend.delete(URL_BACKEND_CLEAR_HIDDEN_DEVIATIONS);
    return true;
  } catch {
    setError("Kunde inte återställa dolda avvikelser.");
    return false;
  }
}

export async function fetchStatistics(setError: SetError): Promise<StatisticsData | null> {
  try {
    const response = await backend.get<StatisticsData>(URL_BACKEND_ADMIN_STATISTICS);
    return response.data;
  } catch {
    setError("Kunde inte hämta statistik.");
    return null;
  }
}

export async function createSharedRoute(routeData: string, setError: SetError): Promise<string | null> {
  try {
    const response = await backend.post<{ id: string }>(URL_BACKEND_SHARED_ROUTE_CREATE, { routeData });
    return response.data.id;
  } catch {
    setError("Kunde inte dela resvägen.");
    return null;
  }
}

export async function fetchSharedRoute(id: string): Promise<Journey | null> {
  try {
    const response = await backend.get<{ routeData: string }>(URL_BACKEND_SHARED_ROUTE_GET(id));
    return JSON.parse(response.data.routeData) as Journey;
  } catch {
    return null;
  }
}

export async function saveSettings(settings: UserSettings, setError: SetError): Promise<boolean> {
  try {
    await backend.put(URL_BACKEND_SETTINGS, settings);
    return true;
  } catch {
    setError("Kunde inte spara inställningar.");
    return false;
  }
}

export async function addRecentStop(stop: RecentStop, setError: SetError): Promise<boolean> {
  try {
    await backend.post(URL_BACKEND_RECENT_STOPS, stop);
    return true;
  } catch {
    setError("Kunde inte spara senaste hållplats.");
    return false;
  }
}

export async function clearRecentStops(setError: SetError): Promise<boolean> {
  try {
    await backend.delete(URL_BACKEND_RECENT_STOPS);
    return true;
  } catch {
    setError("Kunde inte rensa senaste hållplatser.");
    return false;
  }
}