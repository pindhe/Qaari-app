import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { parseFile } from "music-metadata";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { config } from "../config.js";
import { deletePublicFile, publicUrl, uploadsRoot } from "../lib/storage.js";
import { requireAdmin, requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";

const router = Router();
router.use(requireAuth, requireAdmin);

const audioMimes = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/aac",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
]);

const photoMimes = new Set(["image/jpeg", "image/png", "image/webp"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === "photo" ? "photos" : "audio";
    cb(null, path.join(uploadsRoot, folder));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype.includes("aac") ? ".aac" : ".bin");
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Math.max(config.limits.audioMb, config.limits.photoMb) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "photo") {
      if (!photoMimes.has(file.mimetype)) {
        cb(new HttpError(400, "Sawirka waa inuu noqdaa JPG, PNG ama WEBP"));
        return;
      }
      if (file.size && file.size > config.limits.photoMb * 1024 * 1024) {
        cb(new HttpError(400, "Sawirka waa weyn yahay"));
        return;
      }
    } else if (file.fieldname === "audio") {
      if (!audioMimes.has(file.mimetype)) {
        cb(new HttpError(400, "Codka waa inuu noqdaa MP3, AAC ama M4A"));
        return;
      }
    }
    cb(null, true);
  },
});

const qaariBody = z.object({
  name: z.string().trim().min(2).max(120),
  bio: z.string().trim().min(10).max(4000),
});

router.get("/qaaris", async (_req, res) => {
  const qaaris = await prisma.qaari.findMany({
    orderBy: { name: "asc" },
    include: {
      recordings: { select: { id: true, juzNumber: true, durationSeconds: true, audioUrl: true } },
    },
  });

  res.json({
    qaaris: qaaris.map((q) => ({
      id: q.id,
      name: q.name,
      bio: q.bio,
      photoUrl: q.photoUrl,
      uploadedJuzCount: q.recordings.length,
      recordings: q.recordings.sort((a, b) => a.juzNumber - b.juzNumber),
    })),
  });
});

router.post("/qaaris", upload.single("photo"), async (req: AuthedRequest, res) => {
  const body = qaariBody.parse({
    name: req.body.name,
    bio: req.body.bio,
  });

  const qaari = await prisma.qaari.create({
    data: {
      name: body.name,
      bio: body.bio,
      photoUrl: req.file ? publicUrl(`photos/${req.file.filename}`) : null,
      createdById: req.user!.id,
    },
  });

  res.status(201).json({ qaari });
});

router.put("/qaaris/:id", upload.single("photo"), async (req, res) => {
  const existing = await prisma.qaari.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, "Qaariga lama helin", "NOT_FOUND");

  const body = qaariBody.parse({
    name: req.body.name ?? existing.name,
    bio: req.body.bio ?? existing.bio,
  });

  if (req.file && existing.photoUrl) {
    deletePublicFile(existing.photoUrl);
  }

  const qaari = await prisma.qaari.update({
    where: { id: existing.id },
    data: {
      name: body.name,
      bio: body.bio,
      photoUrl: req.file ? publicUrl(`photos/${req.file.filename}`) : existing.photoUrl,
    },
  });

  res.json({ qaari });
});

router.delete("/qaaris/:id", async (req, res) => {
  const existing = await prisma.qaari.findUnique({
    where: { id: req.params.id },
    include: { recordings: true },
  });
  if (!existing) throw new HttpError(404, "Qaariga lama helin", "NOT_FOUND");

  deletePublicFile(existing.photoUrl);
  for (const rec of existing.recordings) {
    deletePublicFile(rec.audioUrl);
  }

  await prisma.qaari.delete({ where: { id: existing.id } });
  res.status(204).send();
});

const juzSchema = z.object({
  juzNumber: z.coerce.number().int().min(1).max(30),
});

router.post("/qaaris/:id/juz", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    throw new HttpError(400, "Faylka codka ayaa loo baahan yahay", "NO_FILE");
  }

  const { juzNumber } = juzSchema.parse(req.body);
  const qaari = await prisma.qaari.findUnique({ where: { id: req.params.id } });
  if (!qaari) {
    fs.unlinkSync(req.file.path);
    throw new HttpError(404, "Qaariga lama helin", "NOT_FOUND");
  }

  let durationSeconds: number | null = null;
  try {
    const meta = await parseFile(req.file.path);
    if (meta.format.duration) {
      durationSeconds = Math.round(meta.format.duration);
    }
  } catch {
    durationSeconds = null;
  }

  const audioUrl = publicUrl(`audio/${req.file.filename}`);
  const previous = await prisma.recording.findUnique({
    where: { qaariId_juzNumber: { qaariId: qaari.id, juzNumber } },
  });

  if (previous) {
    deletePublicFile(previous.audioUrl);
  }

  const recording = await prisma.recording.upsert({
    where: { qaariId_juzNumber: { qaariId: qaari.id, juzNumber } },
    create: {
      qaariId: qaari.id,
      juzNumber,
      audioUrl,
      durationSeconds,
    },
    update: {
      audioUrl,
      durationSeconds,
    },
  });

  res.status(previous ? 200 : 201).json({ recording });
});

router.delete("/recordings/:id", async (req, res) => {
  const recording = await prisma.recording.findUnique({ where: { id: req.params.id } });
  if (!recording) throw new HttpError(404, "Dhageysiga lama helin", "NOT_FOUND");
  deletePublicFile(recording.audioUrl);
  await prisma.recording.delete({ where: { id: recording.id } });
  res.status(204).send();
});

router.get("/stats", async (_req, res) => {
  const [userCount, qaariCount, recordingCount, favoriteCount] = await Promise.all([
    prisma.user.count({ where: { role: "user" } }),
    prisma.qaari.count(),
    prisma.recording.count(),
    prisma.favorite.count(),
  ]);

  const topQaaris = await prisma.favorite.groupBy({
    by: ["qaariId"],
    _count: { qaariId: true },
    orderBy: { _count: { qaariId: "desc" } },
    take: 5,
  });

  const qaariNames = await prisma.qaari.findMany({
    where: { id: { in: topQaaris.map((t) => t.qaariId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(qaariNames.map((q) => [q.id, q.name]));

  res.json({
    stats: {
      userCount,
      qaariCount,
      recordingCount,
      favoriteCount,
      mostFavorited: topQaaris.map((t) => ({
        qaariId: t.qaariId,
        name: nameById.get(t.qaariId) ?? "—",
        favorites: t._count.qaariId,
      })),
    },
  });
});

export default router;
