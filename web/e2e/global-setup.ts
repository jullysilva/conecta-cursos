import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

export const E2E_DATABASE_URL = 'postgresql://course:course@localhost:5433/course_platform_test';

/** Resets the isolated test database and loads the demo seed before the interface tests. */
export default function globalSetup() {
  const env = { ...process.env, DATABASE_URL: E2E_DATABASE_URL };
  const cwd = resolve(__dirname, '../../api');
  execSync('npx prisma migrate deploy', { cwd, env, stdio: 'ignore' });
  execSync('npx tsx prisma/reset-test-db.ts', { cwd, env, stdio: 'inherit' });
  execSync('npx prisma db seed', { cwd, env, stdio: 'ignore' });
}
