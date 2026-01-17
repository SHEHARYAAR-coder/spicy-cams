import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const isPublic = formData.get('isPublic') === 'true';
    const tokenCost = parseInt(formData.get('tokenCost') as string) || 10;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (type === 'image') {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Invalid image file' }, { status: 400 });
      }
      // Max 10MB for images
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image file too large (max 10MB)' }, { status: 400 });
      }
    } else if (type === 'video') {
      if (!file.type.startsWith('video/')) {
        return NextResponse.json({ error: 'Invalid video file' }, { status: 400 });
      }
      // Max 50MB for videos
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: 'Video file too large (max 50MB)' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}_${timestamp}.${fileExt}`;

    // Create directory path
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profile-media', type === 'image' ? 'images' : 'videos');
    
    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file
    const filePath = path.join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return public URL
    const url = `/uploads/profile-media/${type === 'image' ? 'images' : 'videos'}/${fileName}`;

    // Get user's profile and create ProfileMedia entry
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (profile) {
      // Get current max sort order
      const maxSortOrder = await prisma.profileMedia.findFirst({
        where: { profileId: profile.id },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });

      await prisma.profileMedia.create({
        data: {
          profileId: profile.id,
          url,
          type: type.toUpperCase() as 'IMAGE' | 'VIDEO',
          isPublic,
          tokenCost,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          sortOrder: (maxSortOrder?.sortOrder || 0) + 1,
        },
      });
    }

    return NextResponse.json({ url, isPublic, tokenCost });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

