import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) {
    res.json({ qaaris: [], juzMatches: [] });
    return;
  }

  const asNumber = Number(q);
  const isJuz = Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= 30;

  const qaaris = await prisma.qaari.findMany({
    where: {
      name: { contains: q, mode: "insensitive" },
    },
    orderBy: { name: "asc" },
    take: 30,
    include: {
      recordings: { select: { juzNumber: true } },
    },
  });

  let juzMatches: {
    qaariId: string;
    qaariName: string;
    photoUrl: string | null;
    juzNumber: number;
    recordingId: string;
    durationSeconds: number | null;
    audioUrl: string;
  }[] = [];

  if (isJuz) {
    const recordings = await prisma.recording.findMany({
      where: { juzNumber: asNumber },
      include: { qaari: { select: { id: true, name: true, photoUrl: true } } },
      orderBy: { qaari: { name: "asc" } },
    });
    juzMatches = recordings.map((r) => ({
      qaariId: r.qaari.id,
      qaariName: r.qaari.name,
      photoUrl: r.qaari.photoUrl,
      juzNumber: r.juzNumber,
      recordingId: r.id,
      durationSeconds: r.durationSeconds,
      audioUrl: r.audioUrl,
    }));
  }

  res.json({
    qaaris: qaaris.map((item) => ({
      id: item.id,
      name: item.name,
      bio: item.bio,
      photoUrl: item.photoUrl,
      uploadedJuzCount: item.recordings.length,
    })),
    juzMatches,
  });
});

export default router;
