import "dotenv/config";

const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET", "dev-only-change-in-production-qaari-secret"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "30d",
  publicBaseUrl: (process.env.PUBLIC_BASE_URL ?? "http://localhost:4000").replace(/\/$/, ""),
  admin: {
    name: process.env.ADMIN_NAME ?? "Ministry of Information",
    email: process.env.ADMIN_EMAIL ?? "admin@moin.govsomaliland.org",
    password: process.env.ADMIN_PASSWORD ?? "ChangeMeNow!",
  },
  limits: {
    audioMb: Number(process.env.MAX_AUDIO_MB ?? 80),
    photoMb: Number(process.env.MAX_PHOTO_MB ?? 8),
  },
  timeZone: "Africa/Nairobi",
} as const;
