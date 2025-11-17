import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// POST: Upload avatar image
export async function POST(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const formData = await req.formData();
    const avatar = formData.get('avatar') as File;
    
    if (!avatar) {
      return NextResponse.json({ error: 'No avatar file provided' }, { status: 400 });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(avatar.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' 
      }, { status: 400 });
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (avatar.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    // Generate unique filename
    const extension = path.extname(avatar.name);
    const timestamp = Date.now();
    const fileName = `${session.user.id}-${timestamp}${extension}`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Save file
    const buffer = Buffer.from(await avatar.arrayBuffer());
    await writeFile(filePath, buffer);
    
    // Generate URL for the avatar
    const avatarUrl = `/uploads/avatars/${fileName}`;
    
    // Update user profile with new avatar URL
    const updatedProfile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: { 
        avatarUrl: avatarUrl,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        avatarUrl: avatarUrl
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      avatarUrl: avatarUrl,
      profile: updatedProfile
    });
    
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload avatar' 
    }, { status: 500 });
  }
}

// DELETE: Remove avatar
export async function DELETE(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Update profile to remove avatar URL
    const updatedProfile = await prisma.profile.update({
      where: { userId: session.user.id },
      data: { 
        avatarUrl: null,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile
    });
    
  } catch (error) {
    console.error('Avatar removal error:', error);
    return NextResponse.json({ 
      error: 'Failed to remove avatar' 
    }, { status: 500 });
  }
}