import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Count unique models with LIVE streams
    const onlineModelsCount = await prisma.stream.count({
      where: {
        status: "LIVE",
      },
    });

    return NextResponse.json({
      count: onlineModelsCount,
    });
  } catch (error) {
    console.error("Error fetching online models count:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch online models count",
        count: 0,
      },
      { status: 500 }
    );
  }
}

