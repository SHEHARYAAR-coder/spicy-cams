import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

// GET /api/inbox/token - Generate JWT token for inbox authentication
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as { id: string; role?: string };
    const token = jwt.sign(
      {
        userId: session.user.id,
        role: sessionUser.role || "VIEWER",
        streamId: "inbox-global",
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating inbox token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
