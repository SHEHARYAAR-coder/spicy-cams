import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function testLogin(email: string, password: string) {
  try {
    console.log(`\nTesting login for: ${email}`);
    console.log(`Password provided: ${password}`);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    console.log("\nUser found:", !!user);
    if (user) {
      console.log("User details:", {
        id: user.id,
        email: user.email,
        hasPasswordHash: !!user.passwordHash,
        passwordHashLength: user.passwordHash?.length || 0,
        status: user.status,
        role: user.role,
        emailVerified: user.emailVerified,
      });

      if (user.passwordHash) {
        const isValid = await bcrypt.compare(password, user.passwordHash);
        console.log("Password valid:", isValid);
      } else {
        console.log("No password hash found for this user");
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Test with the email you're trying to login with
const email = process.argv[2] || "hamzawaheed057@gmail.com";
const password = process.argv[3] || "test123";

testLogin(email, password);
