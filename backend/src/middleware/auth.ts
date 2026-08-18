import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { verifyToken } from "../lib/jwt.js";
import type { User } from "@prisma/client";

export type AuthedRequest = Request & { user?: User };

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Gal si aad u sii wadato", code: "UNAUTHENTICATED" });
    return;
  }

  try {
    const payload = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      res.status(401).json({ error: "Akoonka lama helin", code: "UNAUTHENTICATED" });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Fadlan mar kale gal", code: "UNAUTHENTICATED" });
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Ma lihid oggolaansho maamule", code: "FORBIDDEN" });
    return;
  }
  next();
}

export async function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }
  try {
    const payload = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user) req.user = user;
  } catch {
    // ignore invalid tokens on public routes
  }
  next();
}
