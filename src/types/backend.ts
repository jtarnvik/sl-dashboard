export interface User {
  email: string;
  name: string;
  picture: string;
  role?: string;
}

export interface UserRowItem {
  id: number;
  email: string;
  name: string;
  createDate: string;
  role?: string | null;
  message?: string | null;
}

export interface AccessRequestItem extends UserRowItem {
  message: string | null;
}

export interface AllowedUserItem extends UserRowItem {
  role: string | null;
}
