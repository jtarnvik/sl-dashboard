export interface RecentStop {
  stopPointId: string;
  stopPointName: string;
  stopPointParentName?: string;
}

export interface UserSettings {
  stopPointId: string;
  stopPointName: string;
  useAiInterpretation: boolean;
  recentStops?: RecentStop[];
}

export interface User {
  email: string;
  name: string;
  picture: string;
  role?: string;
  settings?: UserSettings | null;
}

export interface UserRowItem {
  id: number;
  email: string;
  name: string;
  createDate: string;
  role?: string | null;
  message?: string | null;
  lastLogin?: string | null;
}

export interface AccessRequestItem extends UserRowItem {
  message: string | null;
}

export interface AllowedUserItem extends UserRowItem {
  role: string | null;
  lastLogin: string | null;
}

export interface StatisticsData {
  routesShared: number;
  aiInterpretationQueries: number;
  userCount: number;
}

export interface MonitoredRouteGroup {
  transportMode: string;
  routeGroup: number;
  displayName: string;
  focusStart: string | null;
  focusEnd: string | null;
  onlyFocused: boolean;
}

export interface GtfsDataStatus {
  date: string | null;
  status: string | null;
  staticDataAvailable: boolean;
}
