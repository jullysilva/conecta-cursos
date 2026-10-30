/**
 * Creates (or promotes) an administrator without the demo seed, for production.
 *   ADMIN_NAME="Ana" ADMIN_EMAIL=ana@x.com ADMIN_PASSWORD='...' DATABASE_URL=... npm run db:create-admin
 * An existing account with that e-mail becomes ADMIN and gets the new password.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const MIN_PASSWORD_LENGTH = 12;

const name = process.env.ADMIN_NAME?.trim() || 'Administrador';
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? '';

if (!email || !email.includes('@')) {
  throw new Error('Set ADMIN_EMAIL to a valid e-mail address.');
}
if (password.length < MIN_PASSWORD_LENGTH) {
  throw new Error(`ADMIN_PASSWORD must have at least ${MIN_PASSWORD_LENGTH} characters.`);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

try {
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN', active: true, passwordHash },
    create: { name, email, role: 'ADMIN', passwordHash },
  });
  console.log(`Administrator ready: ${email}`);
} finally {
  await prisma.$disconnect();
}
