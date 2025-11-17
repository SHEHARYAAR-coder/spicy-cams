import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: Fetch user profile
export async function GET(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  return NextResponse.json(user);
}

// POST: Fetch user profile by user ID
export async function POST(req: NextRequest) {
  // Check authentication
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Find user by ID with all related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wallet: true,
        _count: {
          select: {
            streams: true,
            follows: true,
            followers: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update user profile
export async function PUT(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await req.json();
    const { displayName, bio, category, language, isCreator, targetRole } = body;

    if (targetRole && targetRole !== 'CREATOR') {
      return NextResponse.json({ error: 'Unsupported role change' }, { status: 400 });
    }

    const profileUpdateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (typeof displayName !== 'undefined') profileUpdateData.displayName = displayName;
    if (typeof bio !== 'undefined') profileUpdateData.bio = bio;
    if (typeof category !== 'undefined') profileUpdateData.category = category;
    if (typeof language !== 'undefined') profileUpdateData.language = language;
    if (typeof isCreator === 'boolean') profileUpdateData.isCreator = isCreator;
    if (targetRole === 'CREATOR') profileUpdateData.isCreator = true;

    const profileCreateData = {
      userId: session.user.id,
      displayName:
        typeof displayName === 'string' && displayName.length > 0
          ? displayName
          : session.user.name || session.user.email || 'Creator',
      bio: typeof bio === 'string' && bio.length > 0 ? bio : null,
      category: typeof category === 'string' && category.length > 0 ? category : null,
      language: typeof language === 'string' && language.length > 0 ? language : null,
      isCreator:
        targetRole === 'CREATOR'
          ? true
          : typeof isCreator === 'boolean'
          ? isCreator
          : false,
    };

    await prisma.$transaction(async (tx) => {
      await tx.profile.upsert({
        where: { userId: session.user.id },
        update: profileUpdateData,
        create: profileCreateData,
      });

      if (targetRole === 'CREATOR') {
        const currentRole = await tx.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        });

        if (currentRole?.role !== 'CREATOR') {
          await tx.user.update({
            where: { id: session.user.id },
            data: { role: 'CREATOR' },
          });
        }
      }
    });
    
    // Return updated user data with profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        wallet: true,
        _count: {
          select: {
            streams: true,
            follows: true,
            followers: true,
          }
        }
      }
    });
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
