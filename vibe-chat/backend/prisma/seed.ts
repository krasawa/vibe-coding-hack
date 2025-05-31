import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const testUser = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      displayName: 'Test User',
      isOnline: false,
    },
  });
  console.log('Created test user:', testUser.username);

  // Create another test user
  const hashedPassword2 = await bcrypt.hash('password123', 10);
  const testUser2 = await prisma.user.upsert({
    where: { username: 'testuser2' },
    update: {},
    create: {
      username: 'testuser2',
      email: 'test2@example.com',
      password: hashedPassword2,
      displayName: 'Test User 2',
      isOnline: false,
    },
  });
  console.log('Created test user:', testUser2.username);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 