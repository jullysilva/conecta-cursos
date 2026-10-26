import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, firstValueFrom, map, of, shareReplay, tap } from 'rxjs';
import type { Session, User } from '../models/models';

const AUTH_URL = '/api/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly token = signal<string | null>(null);
  private readonly currentUser = signal<User | null>(null);
  private refreshInFlight: Observable<string | null> | null = null;

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  accessToken(): string | null {
    return this.token();
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<Session>(`${AUTH_URL}/login`, { email, password }).pipe(
      tap((session) => this.setSession(session)),
      map((session) => session.user),
    );
  }

  /** Exchanges the httpOnly refresh cookie for a new access token. Concurrent callers share one request. */
  refresh(): Observable<string | null> {
    this.refreshInFlight ??= this.http.post<Session>(`${AUTH_URL}/refresh`, {}).pipe(
      tap((session) => this.setSession(session)),
      map((session) => session.accessToken),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
      finalize(() => (this.refreshInFlight = null)),
      shareReplay(1),
    );
    return this.refreshInFlight;
  }

  /** Called once at startup to restore a session from the refresh cookie. */
  restoreSession(): Promise<unknown> {
    return firstValueFrom(this.refresh());
  }

  logout(): void {
    this.http.post(`${AUTH_URL}/logout`, {}).subscribe({ error: () => undefined });
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  forgotPassword(email: string): Observable<unknown> {
    return this.http.post(`${AUTH_URL}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<unknown> {
    return this.http.post(`${AUTH_URL}/reset-password`, { token, password });
  }

  clearSession(): void {
    this.token.set(null);
    this.currentUser.set(null);
  }

  private setSession(session: Session): void {
    this.token.set(session.accessToken);
    this.currentUser.set(session.user);
  }
}
