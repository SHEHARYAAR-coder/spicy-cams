import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/tip-menu?modelId=xxx - Get tip menu items for a model
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const modelId = searchParams.get("modelId");

    if (!modelId) {
      return NextResponse.json(
        { error: "modelId is required" },
        { status: 400 }
      );
    }

    const items = await prisma.tipMenuItem.findMany({
      where: {
        modelId,
        isActive: true,
      },
      orderBy: [
        { category: "asc" },
        { sortOrder: "asc" },
        { tokens: "asc" },
      ],
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching tip menu items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/tip-menu - Create a new tip menu item
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user is a model
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== "MODEL") {
      return NextResponse.json(
        { error: "Only models can create tip menu items" },
        { status: 403 }
      );
    }

    const { icon, name, tokens, category = "tip" } = await request.json();

    // Validation
    if (!icon || !name || !tokens || tokens < 1) {
      return NextResponse.json(
        { error: "Invalid tip menu item data" },
        { status: 400 }
      );
    }

    // Get the max sort order for this model and category
    const maxSortOrder = await prisma.tipMenuItem.findFirst({
      where: {
        modelId: userId,
        category,
      },
      orderBy: {
        sortOrder: "desc",
      },
      select: {
        sortOrder: true,
      },
    });

    const item = await prisma.tipMenuItem.create({
      data: {
        modelId: userId,
        icon,
        name,
        tokens,
        category,
        sortOrder: (maxSortOrder?.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Error creating tip menu item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
