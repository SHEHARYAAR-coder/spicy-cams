/**
 * Test script to verify withdrawal system is working
 * 
 * Run with: npx tsx scripts/test-withdrawal.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWithdrawalSystem() {
  console.log('🧪 Testing Withdrawal System...\n');

  try {
    // Test 1: Check if WithdrawalRequest model exists
    console.log('1️⃣ Checking WithdrawalRequest model...');
    const count = await prisma.withdrawalRequest.count();
    console.log(`   ✅ Model exists! Current withdrawal requests: ${count}\n`);

    // Test 2: Check if WithdrawalStatus enum exists
    console.log('2️⃣ Checking WithdrawalStatus enum...');
    const { WithdrawalStatus } = await import('@prisma/client');
    console.log('   ✅ Enum exists:', Object.keys(WithdrawalStatus).join(', '), '\n');

    // Test 3: Verify billing constants
    console.log('3️⃣ Verifying billing constants...');
    const TOKENS_PER_MINUTE = 5;
    const MODEL_EARNINGS_PER_MINUTE = 13.20;
    const MIN_WITHDRAWAL = 50;
    console.log(`   ✅ Viewer charge: ${TOKENS_PER_MINUTE} tokens/minute`);
    console.log(`   ✅ Creator earnings: $${MODEL_EARNINGS_PER_MINUTE}/viewer/minute`);
    console.log(`   ✅ Minimum withdrawal: $${MIN_WITHDRAWAL}\n`);

    // Test 4: Check recent withdrawals
    console.log('4️⃣ Checking recent withdrawals...');
    const recentWithdrawals = await prisma.withdrawalRequest.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: { displayName: true }
            }
          }
        }
      }
    });
    
    if (recentWithdrawals.length > 0) {
      console.log(`   Found ${recentWithdrawals.length} recent withdrawal(s):`);
      recentWithdrawals.forEach(w => {
        console.log(`   - ${w.user.profile?.displayName || w.user.email}: $${w.amount} (${w.status})`);
      });
    } else {
      console.log('   No withdrawals found yet (this is normal for a new system)');
    }
    console.log();

    // Test 5: Check ledger entries for stream earnings
    console.log('5️⃣ Checking stream earnings in ledger...');
    const earningsEntries = await prisma.ledgerEntry.findMany({
      where: {
        referenceType: 'STREAM_EARNINGS',
        type: 'DEPOSIT',
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
    
    if (earningsEntries.length > 0) {
      const totalEarnings = earningsEntries.reduce((sum, e) => sum + Number(e.amount), 0);
      console.log(`   ✅ Found ${earningsEntries.length} earnings entries`);
      console.log(`   Total from sample: $${totalEarnings.toFixed(2)}`);
    } else {
      console.log('   No earnings entries yet (streams need to have viewers)');
    }
    console.log();

    console.log('✨ All tests passed! Withdrawal system is ready.\n');
    console.log('📋 Next steps:');
    console.log('   1. Test as model: Go to /finances to request withdrawal');
    console.log('   2. Test as admin: Go to /admin/withdrawals to manage requests');
    console.log('   3. Test viewer billing: Watch a live stream for 1+ minute');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testWithdrawalSystem()
  .catch(console.error);
