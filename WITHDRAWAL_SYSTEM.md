# Withdrawal System Documentation

## Overview

The withdrawal system allows creators to request payouts of their earnings. The system includes automatic billing for viewers, earnings tracking for creators, and an admin approval workflow for withdrawal requests.

## Billing System

### Viewer Charges

- **Rate**: 5 tokens per minute of viewing
- **Billing Interval**: Every 60 seconds
- **Automatic Deduction**: Tokens are automatically deducted from viewer's wallet while watching a live stream

### Creator Earnings

- **Rate**: $13.20 per minute per viewer
- **Automatic Credit**: Earnings are automatically credited to creator's wallet
- **Tracking**: All earnings are tracked in ledger entries with type `STREAM_EARNINGS`

## Withdrawal Request Flow

### For Creators

1. **View Earnings**

   - Navigate to `/finances` to see earnings dashboard
   - View available balance, total earnings, and withdrawal history

2. **Request Withdrawal**

   - Minimum withdrawal amount: **$50.00**
   - Click "Request Withdrawal" button
   - Enter desired amount (up to available balance)
   - Submit request

3. **Status Tracking**

   - **PENDING**: Request submitted, awaiting admin review
   - **APPROVED**: Admin approved, payout processed
   - **REJECTED**: Admin rejected with reason
   - **COMPLETED**: Payment successfully sent
   - **FAILED**: Payout failed (technical issue)

4. **Cancel Withdrawal**
   - Creators can cancel PENDING requests
   - Cannot cancel once approved or processed

### For Admins

1. **Access Withdrawal Management**

   - Navigate to `/admin/withdrawals`
   - View all withdrawal requests
   - See pending and processed requests

2. **Review Requests**

   - View creator details (name, email)
   - See requested amount
   - Review request date

3. **Approve Withdrawal**

   - Click "Approve" button
   - Optionally add approval note
   - System automatically:
     - Deducts amount from creator's wallet
     - Creates ledger entry
     - Updates withdrawal status
     - (Future) Processes Stripe payout

4. **Reject Withdrawal**
   - Click "Reject" button
   - **Required**: Add rejection reason
   - Creator is notified via review note

## API Endpoints

### GET /api/withdrawals

Fetch withdrawal requests

- Creators: See their own requests
- Admins: See all requests

### POST /api/withdrawals

Create a new withdrawal request

- Requires: `{ amount: number }`
- Validates: Minimum amount, sufficient balance, no pending requests
- Returns: Created withdrawal object

### GET /api/withdrawals/[withdrawalId]

Get specific withdrawal details

- Creators: Own requests only
- Admins: Any request

### PATCH /api/withdrawals/[withdrawalId]

Admin approval/rejection

- Requires: `{ action: "approve" | "reject", note?: string }`
- Admin only
- Processes payout on approval
- Creates ledger entries

### DELETE /api/withdrawals/[withdrawalId]

Cancel pending withdrawal

- Creator can cancel own PENDING requests
- Cannot cancel processed requests

## Database Schema

```prisma
model WithdrawalRequest {
  id              String           @id @default(cuid())
  userId          String
  amount          Decimal          @db.Decimal(10, 2)
  currency        String           @default("USD")
  status          WithdrawalStatus @default(PENDING)

  // Stripe payout details
  stripePayoutId  String?          @unique
  stripeAccountId String?

  // Admin review
  reviewedBy      String?
  reviewedAt      DateTime?
  reviewNote      String?

  failureReason   String?

  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  completedAt     DateTime?

  user            User             @relation("UserWithdrawals")
  reviewer        User?            @relation("AdminReviews")
}

enum WithdrawalStatus {
  PENDING
  APPROVED
  REJECTED
  COMPLETED
  FAILED
}
```

## Ledger Entries

All financial transactions are tracked in the `ledger_entries` table:

### Stream Earnings (Creator)

```json
{
  "type": "DEPOSIT",
  "referenceType": "STREAM_EARNINGS",
  "amount": 13.2,
  "metadata": {
    "streamId": "...",
    "viewerId": "...",
    "earningsAmount": "13.20"
  }
}
```

### Stream Viewing (Viewer)

```json
{
  "type": "DEBIT",
  "referenceType": "STREAM_VIEW",
  "amount": -5,
  "metadata": {
    "streamId": "...",
    "tokensCharged": "5"
  }
}
```

### Withdrawal (Creator)

```json
{
  "type": "DEBIT",
  "referenceType": "WITHDRAWAL",
  "amount": -100,
  "metadata": {
    "withdrawalId": "...",
    "payoutId": "...",
    "approvedBy": "..."
  }
}
```

## Stripe Integration

### Current Implementation

- Placeholder payout ID generated
- Withdrawal marked as APPROVED
- Funds deducted from creator wallet

### Future Implementation (Stripe Connect)

1. **Creator Onboarding**

   - Create Stripe Connect account for each creator
   - Store `stripeAccountId` on user/profile
   - Complete KYC verification

2. **Payout Processing**

   ```javascript
   const payout = await stripe.payouts.create({
     amount: Math.round(withdrawal.amount * 100), // Convert to cents
     currency: "usd",
     destination: creator.stripeAccountId,
     metadata: {
       withdrawalId: withdrawal.id,
       userId: creator.id,
     },
   });
   ```

3. **Webhook Handling**
   - Listen for `payout.paid` event
   - Update withdrawal status to COMPLETED
   - Listen for `payout.failed` event
   - Update status to FAILED with reason

## Security Considerations

1. **Authorization**

   - Creators can only view/create their own withdrawals
   - Only admins can approve/reject
   - Role-based access control on all endpoints

2. **Validation**

   - Minimum withdrawal amount enforced ($50)
   - Balance verification before processing
   - Prevent duplicate pending requests
   - Amount cannot exceed available balance

3. **Audit Trail**
   - All withdrawals logged in database
   - Ledger entries for financial tracking
   - Reviewer information stored
   - Timestamps for all status changes

## UI Components

### For Creators

- **CreatorEarnings** (`/src/components/creator/creator-earnings.tsx`)
  - Balance and earnings cards
  - Withdrawal request form
  - Withdrawal history table
  - Status indicators

### For Admins

- **WithdrawalManagement** (`/src/components/admin/withdrawal-management.tsx`)
  - Statistics cards
  - Pending requests table
  - Processed requests history
  - Approve/reject dialog

## Testing

### Test Scenarios

1. **Creator Request**

   - Create withdrawal with sufficient balance
   - Try withdrawal with insufficient balance
   - Try withdrawal below minimum
   - Try duplicate pending request

2. **Admin Approval**

   - Approve valid withdrawal
   - Reject with reason
   - Try processing already processed request

3. **Edge Cases**
   - Creator balance changes after request
   - Concurrent withdrawal requests
   - Network failures during payout

## Configuration

### Environment Variables

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Constants

```typescript
const MIN_WITHDRAWAL = 50; // Minimum withdrawal amount
const TOKENS_PER_MINUTE = 5; // Viewer charge rate
const CREATOR_EARNINGS_PER_MINUTE = 13.2; // Creator earnings rate
```

## Future Enhancements

1. **Automatic Payouts**

   - Schedule automatic payouts (weekly/monthly)
   - Configurable thresholds

2. **Tax Reporting**

   - Generate 1099 forms for creators
   - Track annual earnings

3. **Multiple Payout Methods**

   - PayPal integration
   - Bank transfer options
   - Cryptocurrency payouts

4. **Enhanced Analytics**

   - Earnings trends
   - Payout history charts
   - Revenue forecasting

5. **Notifications**
   - Email notifications for status changes
   - In-app notifications
   - Push notifications for mobile

## Support

For issues or questions about the withdrawal system:

1. Check withdrawal status in dashboard
2. Review ledger entries for transaction history
3. Contact admin for assistance with pending requests
