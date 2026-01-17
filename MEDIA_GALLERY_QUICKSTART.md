# Public & Private Media Gallery - Quick Start

## What's New

Models can now upload images and videos with **public or private** settings:

- **Public media**: Visible to everyone freely
- **Private media**: Blurred until viewers pay tokens to unlock

## For Models

### Uploading Media

1. Go to your **Profile** page
2. Scroll to **Media Gallery** section
3. Choose upload settings:
   - Toggle between "Upload as Public" or "Upload as Private"
   - Set token cost for private content (default: 10 tokens)
4. Click to upload images or videos
5. Files are uploaded with your chosen settings

### Managing Existing Media

- Each media item shows a badge:
  - Green "Public" or Purple "X tokens"
- Hover over media to see **Settings** button
- Click Settings to:
  - Change between Public/Private
  - Adjust token cost
  - Remove media

## For Viewers

### Viewing Media

- **Public media**: View freely
- **Private media**: Shows blurred with unlock button
- Click "Unlock for X Tokens" to purchase access
- Once unlocked, you can view anytime without paying again

### Token Cost

- Each model sets their own prices
- Typical range: 5-30 tokens
- Pay once, access forever

## Setup Instructions

### 1. Run Database Migration

```bash
cd /run/media/muhammad/Repository/spicy-cams
npx prisma generate
npx prisma migrate dev
```

### 2. Migrate Existing Media (Optional)

If you have existing media in the old format:

```bash
npx tsx scripts/migrate-media-to-new-table.ts
```

This converts all existing media to the new system (all set as public by default).

### 3. Test the Feature

1. Log in as a model
2. Upload a public image
3. Upload a private image with token cost
4. View your profile as a visitor (incognito/different browser)
5. Verify public images are visible
6. Verify private images are blurred
7. Try unlocking private content

## Files Modified

### New Files

- `src/app/api/profile/media/route.ts` - Media CRUD API
- `src/app/api/profile/media/unlock/route.ts` - Unlock API
- `src/components/profile/media-gallery-upload-v2.tsx` - Enhanced upload component
- `src/components/profile/media-gallery-display.tsx` - Display component
- `src/components/profile/blurred-media.tsx` - Blur effect component
- `scripts/migrate-media-to-new-table.ts` - Migration script
- `MEDIA_GALLERY_IMPLEMENTATION.md` - Full documentation

### Modified Files

- `prisma/schema.prisma` - Added ProfileMedia and MediaUnlock models
- `src/app/api/profile/upload-media/route.ts` - Enhanced to create ProfileMedia entries
- `src/components/profile/profile-content.tsx` - Uses new MediaGalleryUploadV2
- `src/app/m/[modelId]/page.tsx` - Uses new MediaGalleryDisplay

## Key Features

✅ Upload media as public or private  
✅ Set custom token pricing per item  
✅ Edit privacy settings anytime  
✅ Automatic blur for private content  
✅ Token-gated unlock system  
✅ Permanent access after unlock  
✅ Transaction tracking in ledger  
✅ Mobile responsive

## Troubleshooting

**Q: Private media not showing blurred?**  
A: Make sure you're logged out or using a different account than the model

**Q: Can't unlock media?**  
A: Check your token balance. Buy tokens from the pricing page if needed

**Q: Old media not showing?**  
A: Run the migration script: `npx tsx scripts/migrate-media-to-new-table.ts`

**Q: Upload not working?**  
A: Check file size (images: 10MB max, videos: 50MB max) and format

## Revenue Potential

Models earn tokens when viewers unlock their private content:

- 10 viewers × 10 tokens each = 100 tokens earned
- Set higher prices for premium content
- One-time unlock means repeat value for viewers
- Encourages exclusive content creation

## Next Steps

1. Deploy the changes
2. Run migrations
3. Test with model and viewer accounts
4. Announce feature to models
5. Monitor token transactions
6. Gather feedback for improvements
