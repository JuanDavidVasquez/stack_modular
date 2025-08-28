
export interface TokenPayload {
  sub: string;
  email?: string;
  role?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface UserTokenInfo {
  userId: string;
  email?: string;
  role?: string;
  type: string;
}