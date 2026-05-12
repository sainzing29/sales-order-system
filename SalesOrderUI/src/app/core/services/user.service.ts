import { Injectable, inject }
from '@angular/core';

import { HttpClient }
from '@angular/common/http';

import {
  Observable,
  map
} from 'rxjs';

import { environment }
from '../../../environments/environment';

import { User }
from '../../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private http = inject(HttpClient);

  private apiUrl =
    `${environment.apiUrl}/user`;

  getAll(): Observable<User[]> {

    return this.http.get<unknown>(
      this.apiUrl,
      {
        headers: {
          Accept: 'application/json'
        }
      })
      .pipe(
        map(raw =>
          this.normalizeUserList(raw)));
  }

  private normalizeUserList(
    raw: unknown
  ): User[] {

    return this.extractRows(raw)

      .map(row =>
        this.normalizeUserRecord(row))

      .filter((u): u is User => u !== null);
  }

  private extractRows(
    raw: unknown
  ): unknown[] {

    if (raw == null)
      return [];

    if (Array.isArray(raw))
      return raw;

    if (typeof raw === 'string') {

      const t = raw.trim();

      if (!t)
        return [];

      try {

        return this.extractRows(JSON.parse(t) as unknown);
      } catch {

        return [];
      }
    }

    if (typeof raw === 'object') {

      const o = raw as Record<string, unknown>;

      for (const key of [

        'data',

        'items',

        'users',

        'results',

        'value'

      ]) {

        const v = o[key];

        if (Array.isArray(v))
          return v;
      }

      if ('id' in o)
        return [raw];
    }

    return [];
  }

  private normalizeUserRecord(
    item: unknown
  ): User | null {

    if (item == null || typeof item !== 'object')
      return null;

    const r = item as Record<string, unknown>;

    const id = this.num(r, 'id', 'Id');

    const username = this.str(r, 'username', 'Username');

    const roleId = this.num(r, 'roleId', 'RoleId');

    const roleName = this.str(r, 'roleName', 'RoleName');

    if (!Number.isFinite(id))
      return null;

    return {

      id,

      username,

      roleId: Number.isFinite(roleId) ? roleId : 0,

      roleName
    };
  }

  private str(
    r: Record<string, unknown>,
    camel: string,
    pascal: string
  ): string {

    const v = r[camel] ?? r[pascal];

    if (v == null)
      return '';

    return String(v);
  }

  private num(
    r: Record<string, unknown>,
    camel: string,
    pascal: string
  ): number {

    const v = r[camel] ?? r[pascal];

    const n = Number(v);

    return Number.isFinite(n) ? n : NaN;
  }
}
