import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username: rawUsername } = await params;
    const username = decodeURIComponent(rawUsername).toLowerCase();

    // Find user by username (case-insensitive)
    const user = await prisma.user.findUnique({
      where: { username },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the active (LIVE or PAUSED) stream for this user
    const stream = await prisma.stream.findFirst({
      where: {
        modelId: user.id,
        status: { in: ['LIVE', 'PAUSED'] }
      },
      include: {
        model: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!stream) {
      return NextResponse.json(
        { error: 'No active stream found for this user' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      stream: {
        id: stream.id,
        title: stream.title,
        description: stream.description,
        category: stream.category,
        tags: stream.tags,
        status: stream.status,
        createdAt: stream.createdAt,
        model: {
          id: stream.model.id,
          name: stream.model.profile?.displayName || stream.model.email,
          image: stream.model.profile?.avatarUrl,
          username: stream.model.username
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stream by username:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stream' },
      { status: 500 }
    );
  }
}
