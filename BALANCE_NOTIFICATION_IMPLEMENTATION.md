# SpicyCams Balance Notification System

## Overview

This implementation adds automatic balance checking and notifications for viewers when they login to the platform. The system shows appropriate notifications based on the user's token balance.

## Components Created

### 1. LowBalanceNotification (`/src/components/notifications/low-balance-notification.tsx`)

- Shows a modal when viewer balance is below 100 tokens
- Different messages for new users (0 tokens) vs existing users with low balance
- Includes balance display, usage information, and call-to-action buttons
- Styled with appropriate warning colors and icons

### 2. TokenPurchaseModal (`/src/components/notifications/token-purchase-modal.tsx`)

- Full-featured token purchase modal integrated with existing Stripe checkout
- Shows all three pricing plans (Basic, Plus, Pro) from the existing pricing structure
- Handles Stripe session creation and redirects to checkout
- Special welcome message for new users
- Responsive design with loading states

### 3. Balance Hook (`/src/hooks/use-balance.ts`)

- Custom React hook for balance management
- Automatic balance fetching for authenticated viewers
- Handles loading states, error states, and balance caching
- Includes `useBalanceNotifications` hook for notification state management
- Prevents duplicate notifications within the same session

### 4. BalanceNotificationProvider (`/src/components/notifications/balance-notification-provider.tsx`)

- Global provider component that orchestrates the notification system
- Automatically shows notifications based on balance conditions
- Manages the flow between low balance alerts and token purchase modal
- Integrated into the main app layout

## Features

### Automatic Triggers

- **New User (0 tokens)**: Shows welcome message with token purchase options
- **Low Balance (<100 tokens)**: Shows warning about potential interruptions
- **Login Detection**: Automatically checks balance after viewer login

### Notification Logic

- Only shows for users with "VIEWER" role
- Prevents duplicate notifications during the same session
- 1-second delay after balance check to ensure smooth UI
- Respects user dismissal choices

### Integration Points

- **Stripe Payment**: Uses existing `/api/stripe/create-checkout-session` endpoint
- **Balance API**: Uses existing `/api/wallet/balance` endpoint
- **Session Management**: Integrates with NextAuth session handling
- **UI Components**: Uses existing UI component library

### Thresholds

- **Low Balance Warning**: 100 tokens (configurable)
- **New User Detection**: 0 tokens
- **Token Costs Referenced**:
  - Live streams: 5 tokens/minute
  - Private messages: 1-3 tokens
  - Tips: Custom amounts

## Usage

The system is automatically active once deployed. No additional configuration needed:

1. User logs in as VIEWER
2. System checks balance via API
3. Shows appropriate notification based on balance
4. User can purchase tokens or dismiss notification
5. Notifications won't repeat during the same session

## Files Modified

### New Files

- `/src/components/notifications/low-balance-notification.tsx`
- `/src/components/notifications/token-purchase-modal.tsx`
- `/src/components/notifications/balance-notification-provider.tsx`
- `/src/hooks/use-balance.ts`

### Modified Files

- `/src/app/layout.tsx` - Added BalanceNotificationProvider

## Technical Notes

- Uses React hooks for state management
- Integrates with existing auth system
- Responsive design for mobile/desktop
- Error handling for API failures
- TypeScript for type safety
- Follows existing code patterns and styling
