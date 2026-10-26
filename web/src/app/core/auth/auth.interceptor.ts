import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const SKIP_REFRESH = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout'];

function withToken(request: HttpRequest<unknown>, token: string | null) {
  return token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
}

/** Adds the bearer token and transparently refreshes it once on 401. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!request.url.startsWith('/api')) return next(request);

  return next(withToken(request, auth.accessToken())).pipe(
    catchError((error: unknown) => {
      const canRefresh =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !SKIP_REFRESH.some((url) => request.url.startsWith(url));
      if (!canRefresh) return throwError(() => error);

      return auth.refresh().pipe(
        switchMap((token) => {
          if (!token) {
            void router.navigate(['/login'], { queryParams: { redirect: router.url } });
            return throwError(() => error);
          }
          return next(withToken(request, token));
        }),
      );
    }),
  );
};
