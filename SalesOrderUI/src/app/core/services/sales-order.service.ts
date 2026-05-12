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

import {
  SalesOrder,
  SalesOrderCreatePayload,
  SalesOrderListRow,
  SalesOrderNextDocNo
} from '../../models/sales-order';

@Injectable({
  providedIn: 'root'
})
export class SalesOrderService {

  private http = inject(HttpClient);

  private apiUrl =
    `${environment.apiUrl}/salesorder`;

  //#region Get All

  getAll():
    Observable<SalesOrderListRow[]> {

    return this.http.get<
      SalesOrderListRow | SalesOrderListRow[]
    >(
      this.apiUrl)
      .pipe(
        map(res =>
          this.asSalesOrderRowArray(res)));
  }

  /** API may return one row as an object or many as an array. */
  private asSalesOrderRowArray(
    res:
      | SalesOrderListRow
      | SalesOrderListRow[]
      | null
      | undefined
  ): SalesOrderListRow[] {

    if (res == null)
      return [];

    if (Array.isArray(res))
      return res;

    if (typeof res === 'object' && 'id' in res)
      return [res as SalesOrderListRow];

    return [];
  }

  //#endregion

  //#region Get By Id

  getById(id: number):
    Observable<SalesOrder> {

    return this.http.get<SalesOrder>(
      `${this.apiUrl}/${id}`);
  }

  //#endregion

  //#region Next doc no

  getNextDocNo():
    Observable<SalesOrderNextDocNo> {

    return this.http.get<SalesOrderNextDocNo>(
      `${this.apiUrl}/next-doc-no`);
  }

  //#endregion

  //#region Create

  create(
    data: SalesOrderCreatePayload
  ): Observable<SalesOrder> {

    return this.http.post<SalesOrder>(
      this.apiUrl,
      data);
  }

  //#endregion

  //#region Update

  update(
    id: number,
    data: SalesOrderCreatePayload
  ): Observable<SalesOrder> {

    return this.http.put<SalesOrder>(
      `${this.apiUrl}/${id}`,
      data);
  }

  //#endregion

  //#region Delete

  delete(id: number):
    Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/${id}`);
  }

  //#endregion
}