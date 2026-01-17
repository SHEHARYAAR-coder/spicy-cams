import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const thumbnail = formData.get("thumbnail") as File;
    const streamId = formData.get("streamId") as string;

    if (!thumbnail) {
      return NextResponse.json(
        { error: "No thumbnail file provided" },
        { status: 400 }
      );
    }

    if (!streamId) {
      return NextResponse.json(
        { error: "Stream ID is required" },
        { status: 400 }
      );
    }

    // Verify the stream belongs to this user
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: { modelId: true },
    });

    if (!stream) {
      return NextResponse.json(
        { error: "Stream not found" },
        { status: 404 }
      );
    }

    if (stream.modelId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only upload thumbnails for your own streams" },
        { status: 403 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(thumbnail.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (thumbnail.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Create uploads directory
    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "stream-thumbnails"
    );
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const extension = path.extname(thumbnail.name) || ".jpg";
    const timestamp = Date.now();
    const fileName = `${streamId}-${timestamp}${extension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file
    const buffer = Buffer.from(await thumbnail.arrayBuffer());
    await writeFile(filePath, buffer);

    // Generate URL
    const thumbnailUrl = `/uploads/stream-thumbnails/${fileName}`;

    // Update stream with thumbnail URL
    await prisma.stream.update({
      where: { id: streamId },
      data: { thumbnailUrl },
    });

    return NextResponse.json({
      success: true,
      thumbnailUrl,
    });
  } catch (error) {
    console.error("Error uploading thumbnail:", error);
    return NextResponse.json(
      { error: "Failed to upload thumbnail" },
      { status: 500 }
    );
  }
}
