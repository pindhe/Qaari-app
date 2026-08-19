import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import multer from "multer";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Invalid input",
      code: "VALIDATION",
      details: err.flatten(),
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "The file is too large"
        : err.message;
    res.status(400).json({ error: message, code: err.code });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Khalad server ah ayaa dhacay", code: "INTERNAL" });
}
