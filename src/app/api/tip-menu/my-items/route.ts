import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/tip-menu/my-items - Get current model's tip menu items
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const items = await prisma.tipMenuItem.findMany({
      where: {
        modelId: userId,
      },
      orderBy: [
        { category: "asc" },
        { sortOrder: "asc" },
        { tokens: "asc" },
      ],
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching my tip menu items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
