import { HttpErrorResponse } from '@angular/common/http';

/** Extracts a user-facing message from an API error. */
export function errorMessage(error: unknown, fallback = 'Não foi possível concluir a ação. Tente novamente.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Sem conexão com o servidor. Verifique sua internet.';
    if (error.status === 429) return 'Muitas tentativas. Aguarde um minuto e tente de novo.';
    const message = error.error?.message;
    if (Array.isArray(message)) return message[0];
    if (typeof message === 'string') return message;
  }
  return fallback;
}
