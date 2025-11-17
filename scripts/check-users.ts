import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        passwordHash: true,
        status: true,
        role: true,
        emailVerified: true,
      },
    });

    console.log("Total users found:", users.length);
    console.log("\nUser details:");
    users.forEach((user) => {
      console.log({
        id: user.id,
        email: user.email,
        hasPassword: !!user.passwordHash,
        passwordHashLength: user.passwordHash?.length || 0,
        status: user.status,
        role: user.role,
        emailVerified: user.emailVerified,
      });
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
