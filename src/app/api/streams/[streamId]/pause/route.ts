import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { streamId } = await params;
    const body = await req.json();
    const { paused } = body;

    // Get the stream
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: { modelId: true, status: true },
    });

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    // Verify the user is the model who owns the stream
    if (stream.modelId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update stream status
    const newStatus = paused ? 'PAUSED' : 'LIVE';
    
    const updatedStream = await prisma.stream.update({
      where: { id: streamId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      status: updatedStream.status,
      paused: updatedStream.status === 'PAUSED',
    });
  } catch (error) {
    console.error('Error updating stream pause state:', error);
    return NextResponse.json(
      { error: 'Failed to update stream pause state' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const { streamId } = await params;

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: { status: true },
    });

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    return NextResponse.json({
      paused: stream.status === 'PAUSED',
      status: stream.status,
    });
  } catch (error) {
    console.error('Error getting stream pause state:', error);
    return NextResponse.json(
      { error: 'Failed to get stream pause state' },
      { status: 500 }
    );
  }
}
