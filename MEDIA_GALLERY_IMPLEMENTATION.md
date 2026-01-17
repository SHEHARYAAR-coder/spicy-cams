# Public & Private Media Gallery Implementation

## Overview

This implementation adds a public/private media gallery system for models, allowing them to:

- Upload images and videos
- Set each media item as public or private
- Set custom token costs for private content
- Viewers can unlock private content using tokens
- Track which users have unlocked which private media

## Features

### For Models

1. **Upload with Privacy Control**: Choose whether each upload is public or private
2. **Flexible Pricing**: Set custom token costs for each private media item (default: 10 tokens)
3. **Batch Upload Settings**: Set default privacy and pricing before uploading multiple files
4. **Edit Anytime**: Change privacy settings and pricing for existing media
5. **Visual Indicators**: Clear badges showing public/private status and token costs

### For Viewers

1. **Public Content**: View all public content freely on model profiles and all-models page
2. **Private Content**: Automatically blurred with unlock option
3. **Token-Gated Access**: Pay tokens once to unlock private content permanently
4. **Visual Feedback**: Clear UI showing private content status and unlock cost
5. **Access Tracking**: Once unlocked, content remains accessible

## Database Schema

### New Tables

#### ProfileMedia

```prisma
model ProfileMedia {
  id        String    @id @default(cuid())
  profileId String
  type      MediaType (IMAGE | VIDEO)
  url       String
  isPublic  Boolean   @default(true)
  tokenCost Int       @default(10)
  fileName  String?
  fileSize  Int?
  mimeType  String?
  sortOrder Int       @default(0)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  profile        Profile
  unlockedByUsers MediaUnlock[]
}
```

#### MediaUnlock

```prisma
model MediaUnlock {
  id         String  @id @default(cuid())
  userId     String
  mediaId    String
  tokensPaid Decimal
  createdAt  DateTime @default(now())

  media ProfileMedia

  @@unique([userId, mediaId])
}
```

## API Endpoints

### Media Management

#### GET `/api/profile/media`

Fetch profile media with filtering based on ownership and unlock status

- Query params: `profileId` or `userId`
- Returns: Array of media items with unlock status

#### POST `/api/profile/media`

Create new profile media entry

- Body: `{ url, type, isPublic, tokenCost, fileName, fileSize, mimeType }`
- Returns: Created media object

#### PATCH `/api/profile/media`

Update media privacy settings

- Body: `{ mediaId, isPublic?, tokenCost?, sortOrder? }`
- Returns: Updated media object

#### DELETE `/api/profile/media`

Remove media

- Query params: `mediaId`
- Returns: Success status

### Media Upload

#### POST `/api/profile/upload-media`

Upload media files (enhanced)

- FormData: `file`, `type`, `isPublic`, `tokenCost`
- Saves file to disk and creates ProfileMedia entry
- Returns: `{ url, isPublic, tokenCost }`

### Media Unlocking

#### POST `/api/profile/media/unlock`

Unlock private media with tokens

- Body: `{ mediaId }`
- Processes token payment
- Creates unlock record and ledger entries
- Returns: Success status and new balance

#### GET `/api/profile/media/unlock`

Check unlock status

- Query params: `mediaId`
- Returns: `{ unlocked: boolean, unlockedAt?: Date }`

## Components

### MediaGalleryUploadV2

Enhanced upload component for model profile pages

- Location: `src/components/profile/media-gallery-upload-v2.tsx`
- Features:
  - Upload settings panel (public/private, token cost)
  - Visual indicators for privacy status
  - Edit dialog for changing settings
  - Remove media functionality

### MediaGalleryDisplay

Display component for viewing media on model profiles

- Location: `src/components/profile/media-gallery-display.tsx`
- Features:
  - Shows public and unlocked private media
  - Blurs locked private media
  - Displays private content count
  - Handles image preview clicks

### BlurredMedia

Reusable component for displaying locked private content

- Location: `src/components/profile/blurred-media.tsx`
- Features:
  - Blur effect overlay
  - Unlock button with token cost
  - Handles unlock transaction
  - Auto-updates on successful unlock

## Usage

### For Model Owners (Profile Page)

The media gallery section now includes:

1. Upload settings panel to choose privacy and token cost
2. Separate upload areas for images and videos
3. Gallery view with privacy badges
4. Settings button on each item to edit privacy/pricing
5. Remove button to delete media

### For Viewers (Model Profile Page)

When viewing a model's profile:

1. Public media displays normally
2. Private media shows blurred with unlock option
3. Click "Unlock for X Tokens" to purchase access
4. After unlocking, media becomes fully visible
5. Unlocked media remains accessible permanently

## Migration

### Migrating Existing Media

Run the migration script to convert existing media:

```bash
npx tsx scripts/migrate-media-to-new-table.ts
```

This script:

- Finds all profiles with existing `profileImages` or `profileVideos`
- Creates ProfileMedia entries for each URL
- Sets all existing media as public by default
- Preserves old arrays for backward compatibility

### Manual Migration Steps

1. Deploy new schema and run Prisma migration
2. Deploy updated code
3. Run migration script
4. Verify media appears correctly on profiles
5. Models can then adjust privacy settings as needed

## Token Economy

### Pricing Recommendations

- Images: 5-15 tokens
- Videos: 10-30 tokens
- Premium content: 20-50 tokens

### Payment Flow

1. Viewer clicks unlock button
2. System checks viewer's token balance
3. Deducts tokens from viewer's wallet
4. Credits tokens to model's wallet
5. Creates unlock record
6. Updates ledger for both parties
7. Media becomes visible to viewer

## Security Considerations

1. **Authorization**: Only media owners can modify privacy settings
2. **Validation**: Token costs must be positive integers
3. **Transaction Safety**: Unlock uses Prisma transactions for atomicity
4. **Access Control**: Media unlock status checked on every request
5. **File Validation**: Upload endpoints validate file types and sizes

## UI/UX Features

### Visual Indicators

- 🟢 Green badge: Public content
- 🟣 Purple badge: Private content (shows token cost)
- 👁️ Eye icon: Visibility status
- 🔒 Lock icon: Private/locked content
- ✨ Sparkles: Premium content hover effect

### User Feedback

- Upload progress indicators
- Success/error messages
- Loading states
- Hover effects
- Smooth transitions

## Testing Checklist

- [ ] Upload public media (image & video)
- [ ] Upload private media with custom token cost
- [ ] Change media from public to private
- [ ] Change media from private to public
- [ ] Update token cost for private media
- [ ] Remove media
- [ ] View public media as visitor
- [ ] View blurred private media as visitor
- [ ] Unlock private media with sufficient tokens
- [ ] Attempt unlock with insufficient tokens
- [ ] Verify unlocked media remains accessible
- [ ] Check token balances update correctly
- [ ] Verify ledger entries created
- [ ] Test on mobile devices
- [ ] Test with multiple media items

## Future Enhancements

1. **Bulk Operations**: Select multiple items to change privacy
2. **Media Analytics**: Track views and unlock statistics
3. **Tiered Pricing**: Different prices for different viewer tiers
4. **Time-Limited Access**: Temporary unlocks that expire
5. **Bundles**: Package multiple items at discounted rate
6. **Preview Clips**: Show short preview of private videos
7. **Watermarking**: Add watermarks to unlocked content
8. **Download Control**: Prevent downloading of private content

## Support

For issues or questions:

1. Check error messages in browser console
2. Review API response errors
3. Verify database migrations completed
4. Check Prisma schema is up to date
5. Ensure old and new components aren't conflicting
