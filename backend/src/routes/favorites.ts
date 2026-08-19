import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { param } from "../lib/params.js";

const router = Router();

router.use(requireAuth);

const createSchema = z.object({
  qaariId: z.string().min(1),
  juzNumber: z.number().int().min(1).max(30).optional().nullable(),
});

router.get("/", async (req: AuthedRequest, res) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    include: {
      qaari: { select: { id: true, name: true, photoUrl: true, bio: true } },
      recording: {
        select: { id: true, juzNumber: true, durationSeconds: true, audioUrl: true },
      },
    },
  });

  res.json({
    favorites: favorites.map((f) => ({
      id: f.id,
      qaariId: f.qaari.id,
      qaariName: f.qaari.name,
      photoUrl: f.qaari.photoUrl,
      juzNumber: f.juzNumber,
      recordingId: f.recordingId,
      durationSeconds: f.recording?.durationSeconds ?? null,
      audioUrl: f.recording?.audioUrl ?? null,
      createdAt: f.createdAt,
    })),
  });
});

router.post("/", async (req: AuthedRequest, res) => {
  const body = createSchema.parse(req.body);

  const qaari = await prisma.qaari.findUnique({ where: { id: body.qaariId } });
  if (!qaari) {
    throw new HttpError(404, "Qaariga lama helin", "NOT_FOUND");
  }

  let recordingId: string | null = null;
  if (body.juzNumber) {
    const recording = await prisma.recording.findUnique({
      where: {
        qaariId_juzNumber: { qaariId: body.qaariId, juzNumber: body.juzNumber },
      },
    });
    if (!recording) {
      throw new HttpError(404, "Dhageysiga Juz-kan lama helin", "NOT_FOUND");
    }
    recordingId = recording.id;
  }

  const existing = await prisma.favorite.findFirst({
    where: {
      userId: req.user!.id,
      qaariId: body.qaariId,
      juzNumber: body.juzNumber ?? null,
    },
  });

  if (existing) {
    res.status(200).json({
      favorite: {
        id: existing.id,
        qaariId: existing.qaariId,
        juzNumber: existing.juzNumber,
      },
    });
    return;
  }

  const favorite = await prisma.favorite.create({
    data: {
      userId: req.user!.id,
      qaariId: body.qaariId,
      juzNumber: body.juzNumber ?? null,
      recordingId,
    },
  });

  res.status(201).json({
    favorite: {
      id: favorite.id,
      qaariId: favorite.qaariId,
      juzNumber: favorite.juzNumber,
    },
  });
});

router.delete("/:id", async (req: AuthedRequest, res) => {
  const favorite = await prisma.favorite.findUnique({ where: { id: param(req.params.id) } });
  if (!favorite || favorite.userId !== req.user!.id) {
    throw new HttpError(404, "Ma jiro wax la jecelyahay", "NOT_FOUND");
  }
  await prisma.favorite.delete({ where: { id: favorite.id } });
  res.status(204).send();
});

export default router;
