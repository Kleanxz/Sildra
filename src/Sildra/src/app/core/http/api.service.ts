import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, TimeoutError, catchError, throwError, timeout } from 'rxjs';
import { ApiFailure } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apiUrl = this.createApiUrl();

  constructor(private readonly http: HttpClient) {}

  request<T>(path: string, options: { method?: string; body?: unknown } = {}): Observable<T> {
    return this.http
      .request<T>(options.method ?? 'GET', `${this.apiUrl}${path}`, {
        body: options.body,
        headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
        withCredentials: true,
      })
      .pipe(
        timeout({ first: 8_000 }),
        catchError((error) => throwError(() => this.toApiFailure(error))),
      );
  }

  private toApiFailure(error: unknown): ApiFailure {
    if (error instanceof TimeoutError) {
      return this.failure(
        'La API tardó demasiado en responder. Comprueba que el servicio y PostgreSQL estén activos.',
        0,
      );
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return this.failure(
          'No se pudo conectar con la API. Comprueba que el servicio y PostgreSQL estén activos.',
          0,
        );
      }

      const message =
        (error.error as { message?: string } | null)?.message ??
        `La solicitud falló (${error.status}).`;
      return this.failure(message, error.status);
    }

    const message = error instanceof Error && error.message ? error.message : 'La solicitud falló.';
    return this.failure(message, 0);
  }

  private failure(message: string, status: number): ApiFailure {
    const error = new Error(message) as ApiFailure;
    error.status = status;
    return error;
  }

  private createApiUrl(): string {
    // Keep the page's loopback hostname so SameSite=Lax session cookies are sent.
    const host = ['localhost', '127.0.0.1'].includes(window.location.hostname)
      ? window.location.hostname
      : '127.0.0.1';
    return `http://${host}:5080/api`;
  }
}
