
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {

  const { data } = await request.json();
  const user = JSON.parse(data);

  const email = user.email

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email is already verified" }, { status: 400 });
    }

    // Generate a new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpires,
      },
    });

    // Send the verification email
    await sendVerificationEmail(user.email, verificationToken);

    return NextResponse.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Error resending verification email:", error);
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    )
  }
}
