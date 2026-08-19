import "dotenv/config";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(__dirname, "../uploads");

function ensureDirs() {
  for (const dir of ["audio", "photos"]) {
    fs.mkdirSync(path.join(uploadsRoot, dir), { recursive: true });
  }
}

function publicUrl(relative: string) {
  const base = (process.env.PUBLIC_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
  return `${base}/media/${relative}`;
}

function writeAvatar(filename: string, initials: string, color: string) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${color}"/>
  <circle cx="200" cy="200" r="160" fill="rgba(255,255,255,0.08)"/>
  <text x="200" y="228" text-anchor="middle" font-family="Georgia, serif" font-size="120" font-weight="700" fill="#ffffff">${initials}</text>
</svg>`;
  const full = path.join(uploadsRoot, "photos", filename);
  fs.writeFileSync(full, svg);
  return publicUrl(`photos/${filename}`);
}

function writeSilentWav(filename: string, seconds = 3) {
  const sampleRate = 8000;
  const numSamples = seconds * sampleRate;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  const full = path.join(uploadsRoot, "audio", filename);
  fs.writeFileSync(full, buffer);
  return { url: publicUrl(`audio/${filename}`), durationSeconds: seconds };
}

const qaarisSeed = [
  {
    name: "Sheekh Maxamed Xasan Ciise",
    bio: "Qaari caan ka ah Hargeysa. Wuxuu ku caanbaxay qiraad deggan oo cad, waxaana Wasaaradda Warfaafintu u aqoonsatay inuu yahay mid ka mid ah qaariyada rasmiga ah ee Somaliland.",
    initials: "MX",
    color: "#0B7A3E",
    juz: 30,
  },
  {
    name: "Sheekh Cabdiraxmaan Jaamac",
    bio: "Wuxuu ka soo jeedaa Burco. Qiraadkiisu wuxuu caan ku yahay tartiib iyo dhawaaq nadiif ah, waxaana si weyn looga dhageystaa gobollada Togdheer iyo Maroodi Jeex.",
    initials: "CJ",
    color: "#065028",
    juz: 18,
  },
  {
    name: "Sheekh Cali Axmed Nuur",
    bio: "Qaari ka tirsan Boorama. Wuxuu ku takhasusay qiraadka warshaan ee dadweynaha loogu talagalay, iyadoo la dhowrayao habka rasmiga ah ee Wasaaradda.",
    initials: "CN",
    color: "#1F6B4A",
    juz: 7,
  },
  {
    name: "Sheekh Cismaan Cabdi Xirsi",
    bio: "Wuxuu ku nool yahay Berbera. Qiraad cusub oo hadda lagu darayo maktabadda Qaari; qayb ka mid ah 30-ka Juz ayaa weli la soo gelinayaa.",
    initials: "CX",
    color: "#0E4D31",
    juz: 3,
  },
];

const listenerNames = [
  "Aamina Xasan",
  "Maxamuud Cali",
  "Khadra Jaamac",
  "Axmed Cabdi",
  "Sahra Maxamed",
  "Ismaaciil Nuux",
  "Hodan Cumar",
  "Yuusuf Ibraahim",
  "Fadumo Cali",
  "Cabdirisaaq Xirsi",
  "Nasteexo Cali",
  "Hamza Cabdillaahi",
];

async function main() {
  ensureDirs();
  const email = process.env.ADMIN_EMAIL ?? "admin@moin.govsomaliland.org";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMeNow!";
  const name = process.env.ADMIN_NAME ?? "Wasaarada Warfaafinta";
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { name, role: "admin", passwordHash },
    create: { name, email, passwordHash, role: "admin" },
  });

  console.log(`Admin ready: ${email}`);

  const qaariRecords = [];
  for (const item of qaarisSeed) {
    const existing = await prisma.qaari.findFirst({ where: { name: item.name } });
    const photoUrl = writeAvatar(
      `${item.initials.toLowerCase()}-avatar.svg`,
      item.initials,
      item.color,
    );

    const qaari = existing
      ? await prisma.qaari.update({
          where: { id: existing.id },
          data: { bio: item.bio, photoUrl },
        })
      : await prisma.qaari.create({
          data: {
            name: item.name,
            bio: item.bio,
            photoUrl,
            createdById: admin.id,
          },
        });

    for (let juz = 1; juz <= item.juz; juz += 1) {
      const file = writeSilentWav(`${qaari.id}-juz-${juz}.wav`, 4 + (juz % 5));
      await prisma.recording.upsert({
        where: { qaariId_juzNumber: { qaariId: qaari.id, juzNumber: juz } },
        create: {
          qaariId: qaari.id,
          juzNumber: juz,
          audioUrl: file.url,
          durationSeconds: file.durationSeconds,
        },
        update: {
          audioUrl: file.url,
          durationSeconds: file.durationSeconds,
        },
      });
    }
    qaariRecords.push(qaari);
  }

  const userPassword = await bcrypt.hash("Qaari123!", 12);
  const users = [];
  for (let i = 0; i < listenerNames.length; i += 1) {
    const listenerEmail = `isticmaale${i + 1}@qaari.somaliland`;
    const user = await prisma.user.upsert({
      where: { email: listenerEmail },
      update: { name: listenerNames[i] },
      create: {
        name: listenerNames[i],
        email: listenerEmail,
        passwordHash: userPassword,
        role: "user",
        streakCount: (i % 14) + 1,
      },
    });
    users.push(user);
  }

  for (const user of users) {
    const pick = qaariRecords[users.indexOf(user) % qaariRecords.length];
    const already = await prisma.favorite.findFirst({
      where: { userId: user.id, qaariId: pick.id, juzNumber: null },
    });
    if (!already) {
      await prisma.favorite.create({
        data: { userId: user.id, qaariId: pick.id },
      });
    }
    if (users.indexOf(user) % 3 === 0) {
      const rec = await prisma.recording.findFirst({
        where: { qaariId: pick.id, juzNumber: 1 },
      });
      if (rec) {
        const juzFav = await prisma.favorite.findFirst({
          where: { userId: user.id, qaariId: pick.id, juzNumber: 1 },
        });
        if (!juzFav) {
          await prisma.favorite.create({
            data: {
              userId: user.id,
              qaariId: pick.id,
              juzNumber: 1,
              recordingId: rec.id,
            },
          });
        }
      }
    }
  }

  console.log(`Seeded ${qaariRecords.length} qaaris, ${users.length} listeners.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
