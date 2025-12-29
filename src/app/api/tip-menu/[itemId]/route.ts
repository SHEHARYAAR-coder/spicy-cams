import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/tip-menu/[itemId] - Update a tip menu item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if item exists and belongs to user
    const item = await prisma.tipMenuItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.modelId !== userId) {
      return NextResponse.json(
        { error: "You can only update your own tip menu items" },
        { status: 403 }
      );
    }

    const { icon, name, tokens, category, isActive, sortOrder } = await request.json();

    const updatedItem = await prisma.tipMenuItem.update({
      where: { id: itemId },
      data: {
        ...(icon !== undefined && { icon }),
        ...(name !== undefined && { name }),
        ...(tokens !== undefined && { tokens }),
        ...(category !== undefined && { category }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error("Error updating tip menu item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/tip-menu/[itemId] - Delete a tip menu item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if item exists and belongs to user
    const item = await prisma.tipMenuItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.modelId !== userId) {
      return NextResponse.json(
        { error: "You can only delete your own tip menu items" },
        { status: 403 }
      );
    }

    await prisma.tipMenuItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tip menu item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
