// Migration script to convert existing profileImages and profileVideos arrays to ProfileMedia table
// Run this once after deploying the new schema

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateMediaToNewTable() {
  console.log('Starting media migration...');

  try {
    // Get all profiles with media
    const profiles = await prisma.profile.findMany({
      where: {
        OR: [
          { profileImages: { isEmpty: false } },
          { profileVideos: { isEmpty: false } }
        ]
      },
      select: {
        id: true,
        userId: true,
        profileImages: true,
        profileVideos: true,
      }
    });

    console.log(`Found ${profiles.length} profiles with media to migrate`);

    let totalMigrated = 0;

    for (const profile of profiles) {
      console.log(`Migrating media for profile ${profile.id}...`);

      // Check if already migrated
      const existingMedia = await prisma.profileMedia.findFirst({
        where: { profileId: profile.id }
      });

      if (existingMedia) {
        console.log(`  Profile ${profile.id} already has media in new table, skipping...`);
        continue;
      }

      let sortOrder = 0;

      // Migrate images
      for (const imageUrl of profile.profileImages) {
        await prisma.profileMedia.create({
          data: {
            profileId: profile.id,
            url: imageUrl,
            type: 'IMAGE',
            isPublic: true, // Default to public for existing media
            tokenCost: 10,
            sortOrder: sortOrder++,
          }
        });
        totalMigrated++;
      }

      // Migrate videos
      for (const videoUrl of profile.profileVideos) {
        await prisma.profileMedia.create({
          data: {
            profileId: profile.id,
            url: videoUrl,
            type: 'VIDEO',
            isPublic: true, // Default to public for existing media
            tokenCost: 10,
            sortOrder: sortOrder++,
          }
        });
        totalMigrated++;
      }

      console.log(`  Migrated ${profile.profileImages.length} images and ${profile.profileVideos.length} videos`);
    }

    console.log(`\nMigration complete! Migrated ${totalMigrated} media items from ${profiles.length} profiles.`);
    console.log('\nNote: Old profileImages and profileVideos arrays are kept for backward compatibility.');
    console.log('Models can now manage their media privacy settings from their profile page.');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateMediaToNewTable()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
