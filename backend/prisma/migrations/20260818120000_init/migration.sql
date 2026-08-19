-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "streak_count" INTEGER NOT NULL DEFAULT 0,
    "last_login_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "qaaris" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "photo_url" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "qaaris_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recordings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "qaari_id" TEXT NOT NULL,
    "juz_number" INTEGER NOT NULL,
    "audio_url" TEXT NOT NULL,
    "duration_seconds" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "recordings_qaari_id_fkey" FOREIGN KEY ("qaari_id") REFERENCES "qaaris" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "qaari_id" TEXT NOT NULL,
    "juz_number" INTEGER,
    "recording_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_qaari_id_fkey" FOREIGN KEY ("qaari_id") REFERENCES "qaaris" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "recordings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE INDEX "qaaris_name_idx" ON "qaaris"("name");
CREATE UNIQUE INDEX "recordings_qaari_id_juz_number_key" ON "recordings"("qaari_id", "juz_number");
CREATE INDEX "favorites_user_id_idx" ON "favorites"("user_id");
CREATE UNIQUE INDEX "favorites_user_qaari_only" ON "favorites"("user_id", "qaari_id") WHERE "juz_number" IS NULL;
CREATE UNIQUE INDEX "favorites_user_qaari_juz" ON "favorites"("user_id", "qaari_id", "juz_number") WHERE "juz_number" IS NOT NULL;
