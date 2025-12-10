import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const cover = formData.get("cover") as File;

        if (!cover) {
            return NextResponse.json(
                { error: "No cover file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(cover.type)) {
            return NextResponse.json(
                {
                    error:
                        "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
                },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (cover.size > maxSize) {
            return NextResponse.json(
                { error: "File size exceeds 10MB limit" },
                { status: 400 }
            );
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "covers");
        try {
            await mkdir(uploadsDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }

        // Generate unique filename with user ID
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = cover.name.split(".").pop();
        const filename = `${session.user.id}-${timestamp}-${randomString}.${extension}`;
        const filepath = path.join(uploadsDir, filename);

        // Convert file to buffer and save
        const bytes = await cover.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Generate public URL
        const coverUrl = `/uploads/covers/${filename}`;

        // Update profile with new cover URL
        const updatedProfile = await prisma.profile.upsert({
            where: { userId: session.user.id },
            update: {
                coverUrl: coverUrl,
                updatedAt: new Date(),
            },
            create: {
                userId: session.user.id,
                coverUrl: coverUrl,
            },
        });

        return NextResponse.json({
            success: true,
            coverUrl: updatedProfile.coverUrl,
        });
    } catch (error) {
        console.error("Cover upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload cover" },
            { status: 500 }
        );
    }
}

export async function DELETE(_req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Update profile to remove cover URL
        const updatedProfile = await prisma.profile.update({
            where: { userId: session.user.id },
            data: {
                coverUrl: null,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            coverUrl: updatedProfile.coverUrl,
        });
    } catch (error) {
        console.error("Cover removal error:", error);
        return NextResponse.json(
            { error: "Failed to remove cover" },
            { status: 500 }
        );
    }
}
