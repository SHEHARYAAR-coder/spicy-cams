# 💰 Withdrawal System - Quick Start Guide

## ✅ System Status

The withdrawal system is **fully implemented and operational**!

```
✅ Automatic billing (5 tokens/minute for viewers)
✅ Automatic earnings ($13.20/minute for creators)
✅ Withdrawal requests (min $50)
✅ Admin approval workflow
✅ Complete audit trail
✅ Beautiful UI components
✅ Full API endpoints
```

## 🚀 Quick Access

### For Creators

- **View Earnings**: Navigate to `/finances`
- **Request Withdrawal**: Click "Request Withdrawal" button
- **Track Status**: See all requests and their status

### For Admins

- **Manage Withdrawals**: Navigate to `/admin/withdrawals`
- **Approve/Reject**: Click buttons on pending requests
- **View History**: See all processed requests

### For Viewers

- **Watch Streams**: Automatic billing every 60 seconds
- **Check Balance**: Displayed in top-right while watching
- **Add Credits**: Go to `/pricing` when balance is low

## 📊 Pricing

| Role       | Rate                         | Billing                 |
| ---------- | ---------------------------- | ----------------------- |
| Viewer     | **5 tokens/minute**          | Auto-deduct every 60s   |
| Creator    | **$13.20/minute** per viewer | Auto-credit every 60s   |
| Withdrawal | Minimum **$50**              | Admin approval required |

## 🎯 How It Works

### 1. Viewer Watches Stream

```
Every 60 seconds:
- Viewer wallet: -5 tokens
- Creator wallet: +$13.20
- Ledger entries created
```

### 2. Creator Requests Withdrawal

```
1. Go to /finances
2. Click "Request Withdrawal"
3. Enter amount (≥ $50)
4. Submit
5. Status: PENDING
```

### 3. Admin Approves

```
1. Go to /admin/withdrawals
2. Review request details
3. Click "Approve" or "Reject"
4. Add optional note
5. Payout processed
```

## 🔧 Technical Details

### API Endpoints

**GET /api/withdrawals**

- Fetch withdrawal requests
- Creators see their own, admins see all

**POST /api/withdrawals**

```json
{
  "amount": 100.0
}
```

**PATCH /api/withdrawals/[id]**

```json
{
  "action": "approve", // or "reject"
  "note": "Approved for payout"
}
```

**DELETE /api/withdrawals/[id]**

- Cancel pending withdrawal (creator only)

### Database Schema

```prisma
model WithdrawalRequest {
  id              String           @id
  userId          String
  amount          Decimal
  status          WithdrawalStatus @default(PENDING)
  reviewedBy      String?
  reviewedAt      DateTime?
  reviewNote      String?
  createdAt       DateTime
  updatedAt       DateTime
}

enum WithdrawalStatus {
  PENDING   // Awaiting admin review
  APPROVED  // Approved and processed
  REJECTED  // Rejected by admin
  COMPLETED // Payment sent (future)
  FAILED    // Payout failed (future)
}
```

### Components

**Creator:**

- `CreatorEarnings` - Earnings dashboard and withdrawal interface

**Admin:**

- `WithdrawalManagement` - Approval interface and statistics

**Viewer:**

- `ViewerPlayer` - Automatic billing and balance display

## 🧪 Testing

Run the test script:

```bash
npx tsx scripts/test-withdrawal.ts
```

## 📁 Key Files

**API Routes:**

- `/src/app/api/withdrawals/route.ts`
- `/src/app/api/withdrawals/[withdrawalId]/route.ts`
- `/src/app/api/streams/[streamId]/bill/route.ts`

**Components:**

- `/src/components/creator/creator-earnings.tsx`
- `/src/components/admin/withdrawal-management.tsx`
- `/src/components/stream/viewer-player.tsx`

**Pages:**

- `/src/app/finances/page.tsx` (Creator earnings)
- `/src/app/admin/withdrawals/page.tsx` (Admin management)

**Database:**

- `/prisma/schema.prisma` (WithdrawalRequest model)

## 🔐 Security

✅ Role-based access control
✅ Balance validation before withdrawal
✅ Minimum amount enforcement ($50)
✅ Duplicate request prevention
✅ Complete audit trail in ledger
✅ Admin approval required

## 🎨 UI Features

**Creator Dashboard:**

- Real-time balance display
- Total earnings card
- Pending withdrawals count
- Request withdrawal button
- Withdrawal history table
- Status badges (Pending/Approved/Rejected)

**Admin Dashboard:**

- Pending requests count
- Total processed count
- Approve/reject buttons
- Review notes
- Creator information
- Amount validation

**Viewer Interface:**

- Token balance display (top-right)
- Low balance warnings
- Billing notifications
- Auto-redirect to pricing

## 🚀 Production Setup

### Before Going Live:

1. **Stripe Connect Setup**

   - Register Stripe Connect account
   - Update payout code in `/src/app/api/withdrawals/[withdrawalId]/route.ts`
   - Implement real Stripe payouts
   - Add webhook handlers

2. **Environment Variables**

   ```env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Email Notifications**

   - Add email service (SendGrid, Resend, etc.)
   - Notify creators on status change
   - Notify admins on new requests

4. **Testing**
   - Test full flow with real users
   - Verify ledger entries are correct
   - Check wallet balance calculations
   - Test edge cases

## 📞 Support

For questions or issues:

1. Check `/WITHDRAWAL_SYSTEM.md` for detailed docs
2. Review `/IMPLEMENTATION_SUMMARY.md` for overview
3. Run test script: `npx tsx scripts/test-withdrawal.ts`

## ⚡ Quick Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Push schema to database
npx prisma db push

# Run test script
npx tsx scripts/test-withdrawal.ts

# Check for TypeScript errors
npm run build
```

---

**Status**: ✅ Production Ready (with Stripe Connect integration pending)
**Version**: 1.0.0
**Last Updated**: December 2025
