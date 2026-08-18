import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { uploadsRoot } from "./lib/storage.js";
import { errorHandler } from "./middleware/error.js";
import authRoutes from "./routes/auth.js";
import qaariRoutes from "./routes/qaaris.js";
import searchRoutes from "./routes/search.js";
import favoriteRoutes from "./routes/favorites.js";
import adminRoutes from "./routes/admin.js";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/media", express.static(uploadsRoot, { fallthrough: false, maxAge: "7d" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "qaari-api" });
  });

  app.use("/auth", authRoutes);
  app.use("/qaaris", qaariRoutes);
  app.use("/search", searchRoutes);
  app.use("/favorites", favoriteRoutes);
  app.use("/admin", adminRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: "Jidkan lama helin", code: "NOT_FOUND" });
  });

  app.use(errorHandler);
  return app;
}
