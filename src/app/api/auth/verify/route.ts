import { NextRequest, NextResponse } from "next/server"
import { PrismaClient, UserStatus } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const email = searchParams.get("email")

    if (!token || !email) {
      return NextResponse.json(
        { error: "Invalid verification link" },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email already verified" },
        { status: 200 }
      )
    }

    // TODO: Verify token against stored token
    // For now, we'll accept any token for demonstration
    // In production, you should store verification tokens in the database
    // and verify them here

    // Update user to mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        status: UserStatus.ACTIVE,
      },
    })

    // Redirect to login page with success message
    return NextResponse.redirect(
      new URL("/login?verified=true", request.url)
    )
  } catch (error) {
    console.error("Email verification error:", error)
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}