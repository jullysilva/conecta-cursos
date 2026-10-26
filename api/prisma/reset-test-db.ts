import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

/** Empties every table of the disposable test database. Refuses to touch any other database. */
const url = process.env.DATABASE_URL ?? '';
const databaseName = new URL(url).pathname.slice(1);
if (!databaseName.endsWith('_test')) {
  console.error(`Refusing to reset "${databaseName}": only databases ending in _test are allowed.`);
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
await prisma.$executeRawUnsafe(`
  TRUNCATE "LessonProgress", "Enrollment", "LearningPathCourse", "LearningPath", "Lesson",
    "CourseModule", "Course", "Category", "Banner", "PasswordResetToken", "RefreshToken", "User"
  CASCADE`);
await prisma.$disconnect();
