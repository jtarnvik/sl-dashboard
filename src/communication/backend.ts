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
  URL_BACKEND_LIVE_TRAFFIC_VIEW,
  URL_BACKEND_FAVOURITE_STOPS,
  URL_BACKEND_ADMIN_STATISTICS,
  URL_BACKEND_GTFS_ROUTE_GROUPS,
  URL_BACKEND_GTFS_DATA_STATUS,
  URL_BACKEND_GTFS_ROUTE_DATA,
  URL_BACKEND_GTFS_ROUTE_GROUP_STOPS,
  URL_BACKEND_GTFS_RESOLVE_TRIP,
  URL_BACKEND_SHARED_ROUTE_CREATE,
  URL_BACKEND_SHARED_ROUTE_GET,
  URL_BACKEND_VERSION,
} from "./constant.ts";
import {AccessRequestItem, AllowedUserItem, FavouriteStop, GtfsDataStatus, LiveTrafficView, MonitoredRouteGroup, RecentStop, ResolvedTrip, RouteData, RouteGroupStops, StatisticsData, TripQuery, User, UserSettings} from "../types/backend.ts";
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
    } else if (!error.response) {
      window.dispatchEvent(new Event("backendOffline"));
    }
    return Promise.reject(error);
  }
);

export default backend;

type SetError = (message: string, retry?: () => void) => void;

export async function checkLoginStatus(): Promise<{ user: User | null; offline: boolean }> {
  try {
    const response = await backend.get<User>(URL_BACKEND_GET_CHECK_AUTH);
    return { user: response.data, offline: false };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return { user: null, offline: false };
    }
    return { user: null, offline: true };
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

// No setError: the about dialog is informational, so a failed lookup degrades to "okänd" rather than
// raising an error the user cannot act on.
export async function fetchBackendVersion(): Promise<string | null> {
  try {
    const response = await backend.get<{ version: string }>(URL_BACKEND_VERSION);
    return response.data.version;
  } catch {
    return null;
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

export async function fetchGtfsDataStatus(setError: SetError): Promise<GtfsDataStatus | null> {
  try {
    const response = await backend.get<GtfsDataStatus>(URL_BACKEND_GTFS_DATA_STATUS);
    return response.data;
  } catch {
    setError("Kunde inte hämta trafikdatastatus.");
    return null;
  }
}

export async function fetchRouteData(
  transportMode: string,
  routeGroup: number,
  focused: boolean,
  setError: SetError
): Promise<RouteData | null> {
  try {
    const response = await backend.get<RouteData>(URL_BACKEND_GTFS_ROUTE_DATA, {
      params: { transportMode, routeGroup, focused },
    });
    return response.data;
  } catch {
    setError("Kunde inte hämta ruttdata.");
    return null;
  }
}

/**
 * Finds the live vehicle behind one departure row.
 *
 * No `setError`: this is a convenience on the way into a view that works without it, so a failure returns
 * null and the caller opens the line anyway. An error banner over a working schematic would be out of
 * proportion — the same reasoning as `saveLiveTrafficView`.
 */
export async function resolveTrip(query: TripQuery): Promise<ResolvedTrip | null> {
  try {
    const response = await backend.get<ResolvedTrip>(URL_BACKEND_GTFS_RESOLVE_TRIP, { params: query });
    return response.data;
  } catch {
    return null;
  }
}

/** The favourites catalogue. Empty when the GTFS dataset is not loaded — not an error condition. */
export async function fetchRouteGroupStops(setError: SetError): Promise<RouteGroupStops[]> {
  try {
    const response = await backend.get<RouteGroupStops[]>(URL_BACKEND_GTFS_ROUTE_GROUP_STOPS);
    return response.data;
  } catch {
    setError("Kunde inte hämta hållplatser.");
    return [];
  }
}

/**
 * `setError` is optional because there are two kinds of caller. The live traffic view cannot work without
 * this list and must say so; the main page only uses it to decide whether a departure row offers a shortcut,
 * and a banner for a missing shortcut would be out of proportion.
 */
export async function fetchRouteGroups(setError?: SetError): Promise<MonitoredRouteGroup[]> {
  try {
    const response = await backend.get<MonitoredRouteGroup[]>(URL_BACKEND_GTFS_ROUTE_GROUPS);
    return response.data;
  } catch {
    setError?.("Kunde inte hämta linjegrupper.");
    return [];
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

/**
 * Saves the favourite stops on their own, for the live traffic schematic where a stop is tapped directly.
 * Its own endpoint because the view does not own the stop point and must not send it back.
 *
 * Deliberately not fire-and-forget like `saveLiveTrafficView` below: this is a change the user asked for and
 * will come looking for again, so a silent failure would leave a stop bold that was never stored. The live
 * traffic view renders an `ErrorHandler`, so `setError` is actually visible there.
 */
export async function saveFavouriteStops(favouriteStops: FavouriteStop[], setError: SetError): Promise<boolean> {
  try {
    await backend.put(URL_BACKEND_FAVOURITE_STOPS, { favouriteStops });
    return true;
  } catch {
    setError("Kunde inte spara favorithållplatser.");
    return false;
  }
}

/**
 * Remembers the live traffic view's selection. Fire-and-forget on purpose: this is a convenience, and a
 * failed save must not put an error banner over a view that is working perfectly well.
 */
export async function saveLiveTrafficView(view: LiveTrafficView): Promise<void> {
  try {
    await backend.put(URL_BACKEND_LIVE_TRAFFIC_VIEW, view);
  } catch {
    // Nothing to tell the user — the view they are looking at is unaffected.
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