import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config.js";

export type TokenPayload = {
  sub: string;
  role: "admin" | "user";
};

export function signToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, config.jwtSecret, options);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}
