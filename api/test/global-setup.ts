import { execSync } from 'node:child_process';

export default function setup() {
  execSync('npx prisma migrate deploy', {
    stdio: 'ignore',
    env: {
      ...process.env,
      DATABASE_URL: 'postgresql://course:course@localhost:5433/course_platform_test',
    },
  });
}
