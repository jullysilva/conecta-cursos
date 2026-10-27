import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3100),
  databaseUrl: required('DATABASE_URL'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  refreshTtlDays: Number(process.env.REFRESH_TTL_DAYS ?? 7),
  webUrl: process.env.WEB_URL ?? 'http://localhost:4300',
  smtpHost: process.env.SMTP_HOST ?? 'localhost',
  smtpPort: Number(process.env.SMTP_PORT ?? 1025),
  mailFrom: process.env.MAIL_FROM ?? 'no-reply@conecta-cursos.local',
  /** Login attempts per minute per client; raised only for automated test runs. */
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT ?? 10),
  isTest: process.env.NODE_ENV === 'test',
};
