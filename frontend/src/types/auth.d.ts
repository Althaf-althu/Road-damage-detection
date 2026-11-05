export type UserRole = "citizen" | "inspector" | "supervisor" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string | null;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  full_name: string;
}

