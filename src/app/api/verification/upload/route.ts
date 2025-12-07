import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// POST: Upload verification documents (ID front, ID back, face photo)
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const idFront = formData.get("idFront") as File;
    const idBack = formData.get("idBack") as File;
    const facePhoto = formData.get("facePhoto") as File;

    // Validate all files are provided
    if (!idFront || !idBack || !facePhoto) {
      return NextResponse.json(
        { error: "All verification documents are required (idFront, idBack, facePhoto)" },
        { status: 400 }
      );
    }

    // Validate file types
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const files = [
      { file: idFront, name: "ID Front" },
      { file: idBack, name: "ID Back" },
      { file: facePhoto, name: "Face Photo" }
    ];

    for (const { file, name } of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error: `Invalid file type for ${name}. Only JPEG, PNG, and WebP are allowed.`,
          },
          { status: 400 }
        );
      }
    }

    // Validate file sizes (10MB max for verification documents)
    const maxSize = 10 * 1024 * 1024; // 10MB
    for (const { file, name } of files) {
      if (file.size > maxSize) {
        return NextResponse.json(
          {
            error: `File size too large for ${name}. Maximum size is 10MB.`,
          },
          { status: 400 }
        );
      }
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "verification");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const userId = session.user.id;

    // Upload ID Front
    const idFrontExt = path.extname(idFront.name);
    const idFrontFileName = `${userId}-id-front-${timestamp}${idFrontExt}`;
    const idFrontPath = path.join(uploadsDir, idFrontFileName);
    const idFrontBuffer = Buffer.from(await idFront.arrayBuffer());
    await writeFile(idFrontPath, idFrontBuffer);
    const idFrontUrl = `/uploads/verification/${idFrontFileName}`;

    // Upload ID Back
    const idBackExt = path.extname(idBack.name);
    const idBackFileName = `${userId}-id-back-${timestamp}${idBackExt}`;
    const idBackPath = path.join(uploadsDir, idBackFileName);
    const idBackBuffer = Buffer.from(await idBack.arrayBuffer());
    await writeFile(idBackPath, idBackBuffer);
    const idBackUrl = `/uploads/verification/${idBackFileName}`;

    // Upload Face Photo
    const facePhotoExt = path.extname(facePhoto.name);
    const facePhotoFileName = `${userId}-face-${timestamp}${facePhotoExt}`;
    const facePhotoPath = path.join(uploadsDir, facePhotoFileName);
    const facePhotoBuffer = Buffer.from(await facePhoto.arrayBuffer());
    await writeFile(facePhotoPath, facePhotoBuffer);
    const facePhotoUrl = `/uploads/verification/${facePhotoFileName}`;

    return NextResponse.json({
      success: true,
      idFrontUrl,
      idBackUrl,
      facePhotoUrl,
    });
  } catch (error) {
    console.error("Verification documents upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload verification documents",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
