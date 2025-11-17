const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function addDummyCredits() {
  try {
    console.log("🏦 Adding dummy credits to all users...");

    // Get all users
    const users = await prisma.user.findMany({
      include: {
        wallet: true,
        profile: true,
      },
    });

    console.log(`📊 Found ${users.length} users`);

    for (const user of users) {
      const displayName = user.profile?.displayName || user.email;

      if (!user.wallet) {
        // Create wallet if it doesn't exist
        await prisma.wallet.create({
          data: {
            userId: user.id,
            balance: 1000.0, // $1000 dummy credits
            currency: "USD",
          },
        });
        console.log(`✅ Created wallet for ${displayName} with $1000`);
      } else {
        // Update existing wallet
        await prisma.wallet.update({
          where: {
            userId: user.id,
          },
          data: {
            balance: 1000.0, // $1000 dummy credits
          },
        });
        console.log(`💰 Updated wallet for ${displayName} to $1000`);
      }

      // Also create a ledger entry for tracking
      await prisma.ledgerEntry.create({
        data: {
          userId: user.id,
          type: "ADJUSTMENT",
          amount: 1000.0,
          balanceAfter: 1000.0, // Required field
          description: "Dummy credits for testing private messages",
          metadata: {
            reason: "testing",
            addedBy: "script",
          },
        },
      });
    }

    console.log("🎉 Successfully added dummy credits to all users!");
    console.log("💬 Users can now send private messages");
  } catch (error) {
    console.error("❌ Error adding dummy credits:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addDummyCredits();
