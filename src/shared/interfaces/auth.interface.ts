export interface LoginData {
  email: string;
  role?: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
  deviceType?: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
  phone?: string;
}
