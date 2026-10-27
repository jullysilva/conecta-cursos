import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { RolesGuard } from './roles.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

function context(request: object): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function reflectorReturning(value: unknown): Reflector {
  return { getAllAndOverride: () => value } as unknown as Reflector;
}

describe('RolesGuard', () => {
  it('allows routes without role metadata', () => {
    expect(new RolesGuard(reflectorReturning(undefined)).canActivate(context({}))).toBe(true);
  });

  it('checks the user role against the required roles', () => {
    const guard = new RolesGuard(reflectorReturning(['ADMIN']));
    expect(guard.canActivate(context({ user: { role: 'ADMIN' } }))).toBe(true);
    expect(guard.canActivate(context({ user: { role: 'STUDENT' } }))).toBe(false);
    expect(guard.canActivate(context({}))).toBe(false);
  });
});

describe('JwtAuthGuard', () => {
  const jwt = new JwtService({ secret: 'test-secret' });

  it('skips public routes', async () => {
    const guard = new JwtAuthGuard(reflectorReturning(true), jwt);
    await expect(guard.canActivate(context({ headers: {} }))).resolves.toBe(true);
  });

  it('attaches the decoded user for a valid bearer token', async () => {
    const guard = new JwtAuthGuard(reflectorReturning(false), jwt);
    const token = await jwt.signAsync({ sub: 'u1', email: 'a@b.c', role: 'STUDENT' });
    const request: { headers: object; user?: { sub: string } } = {
      headers: { authorization: `Bearer ${token}` },
    };
    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(request.user?.sub).toBe('u1');
  });

  it.each([{}, { authorization: 'Basic abc' }, { authorization: 'Bearer broken' }])(
    'rejects %o',
    async (headers) => {
      const guard = new JwtAuthGuard(reflectorReturning(false), jwt);
      await expect(guard.canActivate(context({ headers }))).rejects.toBeInstanceOf(UnauthorizedException);
    },
  );
});
