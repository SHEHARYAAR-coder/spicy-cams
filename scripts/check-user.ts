import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'hamzawaheed057@gmail.com' },
    select: { id: true, email: true, username: true }
  });
  console.log('User data:', JSON.stringify(user, null, 2));
  
  // If username is null, set it
  if (user && !user.username) {
    const baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;
    
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { username },
      select: { id: true, email: true, username: true }
    });
    console.log('Updated user with username:', JSON.stringify(updated, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
