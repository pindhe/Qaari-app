import { createApp } from "./app.js";
import { config } from "./config.js";
import { ensureUploadDirs } from "./lib/storage.js";
import { prisma } from "./lib/prisma.js";

ensureUploadDirs();

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`Qaari API listening on ${config.publicBaseUrl}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
