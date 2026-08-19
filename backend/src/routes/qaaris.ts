import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";
import { optionalAuth, type AuthedRequest } from "../middleware/auth.js";
import { param } from "../lib/params.js";

const router = Router();

function serializeQaari(
  qaari: {
    id: string;
    name: string;
    bio: string;
    photoUrl: string | null;
    recordings: { juzNumber: number; id: string; durationSeconds: number | null; audioUrl: string }[];
    _count?: { favorites: number };
  },
  favoriteQaariIds?: Set<string>,
) {
  const byJuz = new Map(qaari.recordings.map((r) => [r.juzNumber, r]));
  const juz = Array.from({ length: 30 }, (_, i) => {
    const n = i + 1;
    const rec = byJuz.get(n);
    return rec
      ? {
          juzNumber: n,
          recordingId: rec.id,
          durationSeconds: rec.durationSeconds,
          audioUrl: rec.audioUrl,
          available: true,
        }
      : { juzNumber: n, recordingId: null, durationSeconds: null, audioUrl: null, available: false };
  });

  return {
    id: qaari.id,
    name: qaari.name,
    bio: qaari.bio,
    photoUrl: qaari.photoUrl,
    uploadedJuzCount: qaari.recordings.length,
    isFavorite: favoriteQaariIds ? favoriteQaariIds.has(qaari.id) : false,
    juz,
  };
}

router.get("/", optionalAuth, async (req: AuthedRequest, res) => {
  const qaaris = await prisma.qaari.findMany({
    orderBy: { name: "asc" },
    include: {
      recordings: { select: { id: true, juzNumber: true, durationSeconds: true, audioUrl: true } },
    },
  });

  let favoriteIds = new Set<string>();
  if (req.user) {
    const favs = await prisma.favorite.findMany({
      where: { userId: req.user.id, juzNumber: null },
      select: { qaariId: true },
    });
    favoriteIds = new Set(favs.map((f) => f.qaariId));
  }

  res.json({
    qaaris: qaaris.map((q) => ({
      id: q.id,
      name: q.name,
      bio: q.bio,
      photoUrl: q.photoUrl,
      uploadedJuzCount: q.recordings.length,
      isFavorite: favoriteIds.has(q.id),
    })),
  });
});

router.get("/:id", optionalAuth, async (req: AuthedRequest, res) => {
  const qaari = await prisma.qaari.findUnique({
    where: { id: param(req.params.id) },
    include: {
      recordings: { select: { id: true, juzNumber: true, durationSeconds: true, audioUrl: true } },
    },
  });

  if (!qaari) {
    throw new HttpError(404, "Reciter not found", "NOT_FOUND");
  }

  let favoriteIds = new Set<string>();
  if (req.user) {
    const favs = await prisma.favorite.findMany({
      where: { userId: req.user.id, qaariId: qaari.id, juzNumber: null },
      select: { qaariId: true },
    });
    favoriteIds = new Set(favs.map((f) => f.qaariId));
  }

  res.json({ qaari: serializeQaari(qaari, favoriteIds) });
});

router.get("/:id/juz/:number", async (req, res) => {
  const number = Number(param(req.params.number));
  if (!Number.isInteger(number) || number < 1 || number > 30) {
    throw new HttpError(400, "Juz number must be between 1 and 30", "INVALID_JUZ");
  }

  const recording = await prisma.recording.findUnique({
    where: {
      qaariId_juzNumber: {
        qaariId: param(req.params.id),
        juzNumber: number,
      },
    },
    include: {
      qaari: { select: { id: true, name: true, photoUrl: true } },
    },
  });

  if (!recording) {
    throw new HttpError(404, "This Juz recording was not found", "NOT_FOUND");
  }

  res.json({
    recording: {
      id: recording.id,
      qaariId: recording.qaari.id,
      qaariName: recording.qaari.name,
      qaariPhotoUrl: recording.qaari.photoUrl,
      juzNumber: recording.juzNumber,
      audioUrl: recording.audioUrl,
      durationSeconds: recording.durationSeconds,
    },
  });
});

export default router;
