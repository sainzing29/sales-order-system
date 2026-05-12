import { Injectable, inject } from '@angular/core';

import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';

import {
  Observable,
  of,
  throwError
} from 'rxjs';

import { switchMap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

import { Login } from '../../models/login';

import { LoginResponse } from '../../models/login-response';

/** Login JSON may be camelCase or PascalCase; role may be omitted when only JWT carries it. */
type LoginHttpBody =
  LoginResponse |
  {
    message?: string;
    Message?: string;
    token?: string;
    Token?: string;
    role?: string;
    Role?: string;
    username?: string;
    Username?: string;
  };

const MS_ROLE_CLAIM =
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private apiUrl =
    `${environment.apiUrl}/auth`;

  login(data: Login):
    Observable<LoginResponse> {

    return this.http.post<LoginHttpBody>(
      `${this.apiUrl}/login`,
      data
    ).pipe(
      switchMap(body => {

        const token = this.readLoginToken(body);

        if (!token) {

          const o = body as Record<string, unknown>;

          const rawMsg = o['message'] ?? o['Message'];

          const msg =
            typeof rawMsg === 'string' && rawMsg.trim()
              ? rawMsg.trim()
              : 'Invalid username or password';

          return throwError(
            () =>
              new HttpErrorResponse({

                error: { message: msg },

                status: 401,

                statusText: 'Unauthorized',

                url: `${this.apiUrl}/login`
              })
          );
        }

        const roles = this.resolveRolesFromLogin(body, token);

        const role = roles[0] ?? '';

        localStorage.setItem(
          'token',
          token);

        localStorage.setItem(
          'role',
          role);

        const o = body as Record<string, unknown>;

        const username =
          typeof o['username'] === 'string'
            ? o['username']
            : typeof o['Username'] === 'string'
              ? o['Username']
              : '';

        return of({
          token,
          username,
          role
        } satisfies LoginResponse);
      })
    );
  }

  logout(): void {
    localStorage.clear();
  }

  getToken(): string {
    return localStorage.getItem('token') || '';
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Roles for the current session. When the JWT payload parses, roles come
   * **only** from the token (never mixed with stale `localStorage`), so an
   * old `Admin` value cannot override a `User` token.
   */
  getRoles(): string[] {

    const token = this.getToken();

    if (!token)
      return this.rolesFromLocalStorageOnly();

    const payload = this.decodeJwtPayload(token);

    if (payload)
      return this.readRolesFromJwtPayload(payload);

    return this.rolesFromLocalStorageOnly();
  }

  getRole(): string {
    return this.getRoles()[0] ?? '';
  }

  isAdmin(): boolean {
    return this.getRoles().some(r => r === 'Admin');
  }

  private readLoginToken(body: LoginHttpBody): string | null {

    if (!body || typeof body !== 'object')
      return null;

    const o = body as Record<string, unknown>;

    const t = o['token'] ?? o['Token'];

    return typeof t === 'string' && t.length > 0
      ? t
      : null;
  }

  private resolveRolesFromLogin(
    body: LoginHttpBody,
    token: string
  ): string[] {

    const fromJwt = this.readRolesFromJwt(token);

    if (fromJwt.length)
      return fromJwt;

    return this.readRolesFromLoginJson(body);
  }

  private readRolesFromLoginJson(body: LoginHttpBody): string[] {

    const o = body as Record<string, unknown>;

    const r = o['role'] ?? o['Role'];

    if (typeof r === 'string' && r.trim())
      return [r.trim()];

    if (Array.isArray(r))
      return r
        .filter((x): x is string => typeof x === 'string')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    return [];
  }

  private readRolesFromJwt(token: string): string[] {

    const payload = this.decodeJwtPayload(token);

    if (!payload)
      return [];

    return this.readRolesFromJwtPayload(payload);
  }

  private readRolesFromJwtPayload(
    payload: Record<string, unknown>
  ): string[] {

    const direct = this.coerceRolesFromRaw(
      payload['role'] ??
      payload['Role'] ??
      payload[MS_ROLE_CLAIM]);

    if (direct.length)
      return direct;

    for (const key of Object.keys(payload)) {

      if (
        key === MS_ROLE_CLAIM ||
        key.endsWith('/identity/claims/role') ||
        key.endsWith('/claims/role')
      ) {

        const found = this.coerceRolesFromRaw(payload[key]);

        if (found.length)
          return found;
      }
    }

    return [];
  }

  private coerceRolesFromRaw(raw: unknown): string[] {

    if (typeof raw === 'string' && raw.trim())
      return [raw.trim()];

    if (Array.isArray(raw))
      return raw
        .filter((x): x is string => typeof x === 'string')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    return [];
  }

  private rolesFromLocalStorageOnly(): string[] {

    const stored = (localStorage.getItem('role') || '').trim();

    return stored ? [stored] : [];
  }

  private decodeJwtPayload(
    token: string
  ): Record<string, unknown> | null {

    try {

      const parts = token.split('.');

      if (parts.length < 2)
        return null;

      const base64 = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const padded = base64.padEnd(
        base64.length + (4 - (base64.length % 4)) % 4,
        '=');

      const json = atob(padded);

      return JSON.parse(json) as Record<string, unknown>;
    } catch {

      return null;
    }
  }
}
