const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGallery() {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: 'cmjz1d5mz0002ma5gj5cg50sg' }, // Alexa's ID from earlier
      select: {
        displayName: true,
        profileImages: true,
        profileVideos: true
      }
    });
    
    console.log('Alexa profile gallery:');
    console.log(JSON.stringify(profile, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGallery();
