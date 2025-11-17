import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

const appBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  process.env.APP_BASE_URL;
  // "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { email },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });

    const resetURL = `${appBaseUrl}/reset-password/${resetToken}`;
    console.log(`Password reset token for ${email}: ${resetURL}`);

    try {
      const response = await sendPasswordResetEmail(
        email,
        resetToken,
        appBaseUrl
      );
      if (response.success) {
        return NextResponse.json({
          message: "Password reset link has been sent to your email.",
        });
      }
    } catch (error) {
      return NextResponse.json(
          { message: "An unexpected error occurred. " + error },
          { status: 500 }
      );
    }

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
