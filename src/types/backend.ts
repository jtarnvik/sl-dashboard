export interface User {
  email: string;
  name: string;
  picture: string;
  role?: string;
}

export interface AccessRequestItem {
  id: number;
  email: string;
  name: string;
  createDate: string;
}

export interface AllowedUserItem {
  id: number;
  email: string;
  name: string;
  role: string | null;
  createDate: string;
}
