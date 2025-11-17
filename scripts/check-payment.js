const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkPayments() {
  console.log("🔍 Checking recent payments...\n");

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { user: { select: { email: true, id: true } } },
  });

  console.log("Recent payments:");
  payments.forEach((p) => {
    console.log(`\n- Payment ID: ${p.id}`);
    console.log(`  User: ${p.user.email} (${p.userId})`);
    console.log(`  Status: ${p.status}`);
    console.log(`  Amount: $${p.amount}`);
    console.log(`  Credits: ${p.credits}`);
    console.log(`  Provider Ref: ${p.providerRef}`);
    console.log(`  Created: ${p.createdAt}`);
    console.log(`  Completed: ${p.completedAt}`);
  });

  console.log("\n\n🔍 Checking wallets...\n");

  const wallets = await prisma.wallet.findMany({
    include: { user: { select: { email: true, id: true } } },
  });

  console.log("Wallets:");
  wallets.forEach((w) => {
    console.log(`\n- User: ${w.user.email} (${w.userId})`);
    console.log(`  Balance: ${w.balance} ${w.currency}`);
    console.log(`  Updated: ${w.updatedAt}`);
  });

  console.log("\n\n🔍 Checking ledger entries...\n");

  const ledgerEntries = await prisma.ledgerEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { user: { select: { email: true } } },
  });

  console.log("Recent ledger entries:");
  ledgerEntries.forEach((l) => {
    console.log(`\n- ${l.type}: ${l.amount} ${l.currency}`);
    console.log(`  User: ${l.user.email}`);
    console.log(`  Balance After: ${l.balanceAfter}`);
    console.log(`  Reference: ${l.referenceType} - ${l.referenceId}`);
    console.log(`  Description: ${l.description}`);
    console.log(`  Created: ${l.createdAt}`);
  });

  await prisma.$disconnect();
}

checkPayments().catch(console.error);
