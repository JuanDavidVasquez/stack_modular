import jwt, { SignOptions, JwtPayload, VerifyErrors } from "jsonwebtoken";
import { StringValue } from "ms";

export interface IJwtAdapter {
  sign(payload: object, options?: SignOptions): Promise<string>;
  verify<T extends object = JwtPayload>(token: string): Promise<T>;
  decode<T extends object = JwtPayload>(token: string): T | null;
}

export class JwtAdapter implements IJwtAdapter {
  private readonly secret: string;
  private readonly expiresIn: number | StringValue;

  constructor(
    secret = process.env.JWT_SECRET || "default_secret", 
    expiresIn: number | StringValue = (process.env.JWT_EXPIRES_IN as StringValue) || "1h"
  ) {
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  async sign(payload: object, options: SignOptions = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      const signOptions: SignOptions = {
        expiresIn: this.expiresIn,
        ...options
      };

      jwt.sign(
        payload,
        this.secret,
        signOptions,
        (err, token) => {
          if (err || !token) return reject(err);
          resolve(token);
        }
      );
    });
  }

  async verify<T extends object = JwtPayload>(token: string): Promise<T> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.secret, (err: VerifyErrors | null, decoded) => {
        if (err) return reject(err);
        resolve(decoded as T);
      });
    });
  }

  decode<T extends object = JwtPayload>(token: string): T | null {
    return jwt.decode(token) as T | null;
  }
}