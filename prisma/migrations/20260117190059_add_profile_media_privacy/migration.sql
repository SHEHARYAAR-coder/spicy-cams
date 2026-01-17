-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "profile_media" TEXT[];

-- CreateTable
CREATE TABLE "profile_media" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "token_cost" INTEGER NOT NULL DEFAULT 10,
    "file_name" TEXT,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_unlocks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "media_id" TEXT NOT NULL,
    "tokens_paid" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profile_media_profile_id_is_public_idx" ON "profile_media"("profile_id", "is_public");

-- CreateIndex
CREATE INDEX "profile_media_profile_id_sort_order_idx" ON "profile_media"("profile_id", "sort_order");

-- CreateIndex
CREATE INDEX "media_unlocks_user_id_idx" ON "media_unlocks"("user_id");

-- CreateIndex
CREATE INDEX "media_unlocks_media_id_idx" ON "media_unlocks"("media_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_unlocks_user_id_media_id_key" ON "media_unlocks"("user_id", "media_id");

-- AddForeignKey
ALTER TABLE "profile_media" ADD CONSTRAINT "profile_media_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_unlocks" ADD CONSTRAINT "media_unlocks_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "profile_media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
