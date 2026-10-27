import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['test/global-setup.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://course:course@localhost:5433/course_platform_test',
    },
    fileParallelism: false,
    coverage: { include: ['src/**/*.ts'], exclude: ['src/generated/**', 'src/main.ts'] },
  },
});
