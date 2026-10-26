import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';
import { adminGuard, authGuard, guestGuard } from './auth.guards';
import type { Session } from '../models/models';

const session = (role: 'ADMIN' | 'STUDENT' = 'STUDENT', token = 'token-1'): Session => ({
  accessToken: token,
  user: { id: 'u1', name: 'Ana', email: 'ana@x.com', role, avatarUrl: null },
});

describe('Auth', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => http.verify());

  function login(role: 'ADMIN' | 'STUDENT' = 'STUDENT') {
    auth.login('ana@x.com', 'secret').subscribe();
    http.expectOne('/api/auth/login').flush(session(role));
  }

  it('stores the session after login', () => {
    login('ADMIN');
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.isAdmin()).toBe(true);
    expect(auth.accessToken()).toBe('token-1');
  });

  it('restores a session from the refresh cookie and clears it on failure', async () => {
    const restored = auth.restoreSession();
    http.expectOne('/api/auth/refresh').flush(session());
    await restored;
    expect(auth.user()?.name).toBe('Ana');

    const failed = auth.restoreSession();
    http.expectOne('/api/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });
    await failed;
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('shares a single refresh request between concurrent callers', () => {
    let results = 0;
    auth.refresh().subscribe(() => results++);
    auth.refresh().subscribe(() => results++);
    http.expectOne('/api/auth/refresh').flush(session());
    expect(results).toBe(2);
  });

  it('adds the bearer token only to API requests', () => {
    login();
    const client = TestBed.inject(HttpClient);
    client.get('/api/portal/banners').subscribe();
    client.get('https://cdn.example/file.json').subscribe();
    expect(http.expectOne('/api/portal/banners').request.headers.get('Authorization')).toBe('Bearer token-1');
    expect(http.expectOne('https://cdn.example/file.json').request.headers.has('Authorization')).toBe(false);
  });

  it('refreshes and retries once on 401', () => {
    login();
    let body: unknown;
    TestBed.inject(HttpClient).get('/api/student/summary').subscribe((value) => (body = value));
    http.expectOne('/api/student/summary').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('/api/auth/refresh').flush(session('STUDENT', 'token-2'));
    const retry = http.expectOne('/api/student/summary');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer token-2');
    retry.flush({ ok: true });
    expect(body).toEqual({ ok: true });
  });

  it('redirects to login when the refresh fails', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    let failed = false;
    TestBed.inject(HttpClient).get('/api/student/summary').subscribe({ error: () => (failed = true) });
    http.expectOne('/api/student/summary').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('/api/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(failed).toBe(true);
    expect(navigate).toHaveBeenCalledWith(['/login'], expect.anything());
  });

  it('does not try to refresh when login itself fails', () => {
    let failed = false;
    auth.login('a@b.c', 'x').subscribe({ error: () => (failed = true) });
    http.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(failed).toBe(true);
  });

  it('logs out, clearing the session and going to login', () => {
    login();
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    auth.logout();
    http.expectOne('/api/auth/logout').flush(null);
    expect(auth.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  describe('guards', () => {
    const run = (guard: typeof authGuard) =>
      TestBed.runInInjectionContext(() => guard({} as never, { url: '/curso/1' } as never));

    it('authGuard redirects anonymous users to login with redirect', () => {
      expect(String(run(authGuard))).toBe('/login?redirect=%2Fcurso%2F1');
      login();
      expect(run(authGuard)).toBe(true);
    });

    it('adminGuard only lets admins through', () => {
      login('STUDENT');
      expect(String(run(adminGuard))).toBe('/home');
      login('ADMIN');
      expect(run(adminGuard)).toBe(true);
    });

    it('guestGuard sends authenticated users home', () => {
      expect(run(guestGuard)).toBe(true);
      login();
      expect(String(run(guestGuard))).toBe('/home');
    });
  });
});
