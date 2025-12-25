export interface JwtPayload {
  sub: string;
  sid: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
