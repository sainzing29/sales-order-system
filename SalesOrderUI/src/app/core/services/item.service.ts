import { Injectable, inject }
from '@angular/core';

import { HttpClient, HttpParams }
from '@angular/common/http';

import { Observable }
from 'rxjs';

import { environment }
from '../../../environments/environment';

import { Item, ItemSearchResult }
from '../../models/item';

@Injectable({
  providedIn: 'root'
})
export class ItemService {

  private http = inject(HttpClient);

  private apiUrl =
    `${environment.apiUrl}/item`;

  getAll(): Observable<Item[]> {

    return this.http.get<Item[]>(
      this.apiUrl);
  }

  /**
   * `GET /api/item/by-code?search=<text>`
   * Omit or empty `search` → server returns `[]`.
   */
  searchByCode(
    search?: string | null
  ): Observable<ItemSearchResult[]> {

    let params = new HttpParams();

    const q =
      search != null
        ? String(search).trim()
        : '';

    if (q !== '')
      params = params.set('search', q);

    return this.http.get<ItemSearchResult[]>(
      `${this.apiUrl}/by-code`,
      { params });
  }

  /**
   * `GET /api/item/by-name?search=<text>`
   * Same response shape as {@link searchByCode}.
   */
  searchByName(
    search?: string | null
  ): Observable<ItemSearchResult[]> {

    let params = new HttpParams();

    const q =
      search != null
        ? String(search).trim()
        : '';

    if (q !== '')
      params = params.set('search', q);

    return this.http.get<ItemSearchResult[]>(
      `${this.apiUrl}/by-name`,
      { params });
  }
}
