-- Create stream_likes table
CREATE TABLE IF NOT EXISTS "stream_likes" (
    "id" TEXT NOT NULL,
    "stream_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stream_likes_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "stream_likes_stream_id_user_id_key" ON "stream_likes"("stream_id", "user_id");

-- Create indexes
CREATE INDEX IF NOT EXISTS "stream_likes_stream_id_idx" ON "stream_likes"("stream_id");
CREATE INDEX IF NOT EXISTS "stream_likes_user_id_idx" ON "stream_likes"("user_id");

-- Add foreign keys
ALTER TABLE "stream_likes" ADD CONSTRAINT "stream_likes_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stream_likes" ADD CONSTRAINT "stream_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
