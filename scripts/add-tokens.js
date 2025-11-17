const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function addTokensToUser(
  userEmail,
  tokens,
  reason = "Manual token adjustment"
) {
  try {
    console.log(`🔍 Looking up user: ${userEmail}...`);

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      console.error(`❌ User not found: ${userEmail}`);
      return;
    }

    console.log(`✅ Found user: ${user.name || user.email} (${user.id})`);

    // Get current balance
    const currentWallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
      select: { balance: true },
    });

    const currentBalance = currentWallet ? Number(currentWallet.balance) : 0;
    console.log(`💰 Current balance: ${currentBalance} tokens`);

    // Update wallet
    const wallet = await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {
        balance: { increment: tokens },
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        balance: tokens,
        currency: "USD",
      },
    });

    // Get updated balance
    const updatedWallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
      select: { balance: true },
    });

    const newBalance = Number(updatedWallet.balance);
    console.log(`✅ Updated balance: ${newBalance} tokens (+${tokens})`);

    // Create ledger entry
    await prisma.ledgerEntry.create({
      data: {
        userId: user.id,
        type: "ADJUSTMENT",
        amount: tokens,
        currency: "USD",
        balanceAfter: newBalance,
        referenceType: "MANUAL_ADJUSTMENT",
        description: reason,
        metadata: {
          adjustedBy: "admin",
          adjustedAt: new Date().toISOString(),
          previousBalance: currentBalance,
        },
      },
    });

    console.log(`📝 Ledger entry created`);
    console.log(`\n✅ Successfully added ${tokens} tokens to ${user.email}`);
    console.log(`   Previous: ${currentBalance} → New: ${newBalance}`);
  } catch (error) {
    console.error("❌ Error adding tokens:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log("Usage: node scripts/add-tokens.js <email> <tokens> [reason]");
  console.log(
    'Example: node scripts/add-tokens.js user@example.com 50 "Payment reconciliation - $15 package"'
  );
  process.exit(1);
}

const [email, tokens, ...reasonParts] = args;
const reason = reasonParts.join(" ") || "Manual token adjustment";

addTokensToUser(email, parseInt(tokens), reason);
