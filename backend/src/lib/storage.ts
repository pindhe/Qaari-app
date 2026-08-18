import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsRoot = path.resolve(__dirname, "../../uploads");

export function ensureUploadDirs(): void {
  for (const dir of ["audio", "photos"]) {
    fs.mkdirSync(path.join(uploadsRoot, dir), { recursive: true });
  }
}

export function publicUrl(relativePath: string): string {
  const clean = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${config.publicBaseUrl}/media/${clean}`;
}

export function relativeFromPublicUrl(url: string): string | null {
  const prefix = `${config.publicBaseUrl}/media/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}

export function absoluteUploadPath(relativePath: string): string {
  return path.join(uploadsRoot, relativePath);
}

export function deletePublicFile(url: string | null | undefined): void {
  if (!url) return;
  const relative = relativeFromPublicUrl(url);
  if (!relative) return;
  const full = absoluteUploadPath(relative);
  if (fs.existsSync(full)) {
    fs.unlinkSync(full);
  }
}
