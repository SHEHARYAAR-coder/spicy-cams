# Cover Photo Feature Implementation

## Overview
Successfully implemented a cover photo feature for user profiles, allowing users to upload and manage cover photos that appear as a banner behind their profile picture.

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)
- Added `coverUrl` field to the `Profile` model
- Field stores the URL path to the uploaded cover photo
- Mapped to database column `cover_url`

### 2. API Route (`src/app/api/profile/cover/route.ts`)
**POST** - Upload cover photo:
- Validates file type (JPEG, PNG, WebP, GIF)
- Validates file size (max 10MB)
- Saves file to `public/uploads/covers/` with naming: `{userId}-{timestamp}-{random}.{ext}`
- Updates Profile model with cover URL
- Returns the new cover URL

**DELETE** - Remove cover photo:
- Sets `coverUrl` to null in the database
- Returns success response

### 3. Cover Upload Component (`src/components/ui/cover-upload.tsx`)
Reusable React component featuring:
- File selection and preview
- Upload progress indication
- Remove cover functionality
- Hover overlay with action buttons
- Error handling and validation
- Recommended dimensions display (1200x400px)

### 4. Profile Page Updates (`src/components/profile/profile-content.tsx`)
- Added `CoverUpload` component import
- Added `isEditingCover` state variable
- Created `handleCoverChange` callback function
- Redesigned profile card layout:
  - Cover photo banner at the top (h-48 md:h-64)
  - Profile picture positioned to overlap cover (-bottom-12)
  - Edit buttons appear on hover
  - Responsive design for mobile and desktop

## File Storage
- **Directory**: `public/uploads/covers/`
- **Naming Convention**: `{userId}-{timestamp}-{random}.{extension}`
- **Example**: `cmj0a3qtm0000maa00dod6dyu-1733856234567-abc123xyz.jpg`

## Features
✅ Upload cover photos (JPEG, PNG, WebP, GIF)
✅ Preview before upload
✅ Remove existing cover photos
✅ Hover to edit functionality
✅ Responsive design
✅ File validation (type and size)
✅ User-specific file storage
✅ Database persistence

## Usage
1. Navigate to your profile page
2. Hover over the cover area
3. Click "Edit Cover" button
4. Select an image file
5. The cover photo uploads automatically
6. Click "Remove" to delete the cover photo

## Technical Details
- **Max File Size**: 10MB
- **Allowed Types**: JPEG, PNG, WebP, GIF
- **Recommended Dimensions**: 1200x400px
- **Storage**: Local file system in `public/uploads/covers/`
- **Database Field**: `Profile.coverUrl` (nullable string)

## Security
- Session-based authentication required
- File type validation on server-side
- File size limits enforced
- User can only modify their own cover photo
