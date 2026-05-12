export interface SalesOrder {
  id: number;
  docNo: string;
  docDate: string;
  vendorId: number;
  items: SalesOrderItem[];
}

export interface SalesOrderItem {
  itemId?: number;
  itemCode?: string;
  itemName?: string;
  uom?: string;
  price?: number;
  quantity: number;
}

/** Line item as returned on list/detail payloads from the API. */
export interface SalesOrderListLine {

  itemId?: number;

  itemCode?: string;

  itemName?: string;

  uom?: string;

  price?: number;

  quantity: number;

  lineTotal?: number;
}

/** Row from `GET /api/salesorder` (list). */
export interface SalesOrderListRow {

  id: number;

  docNo: string;

  docDate: string;

  vendorId: number;

  vendorCode?: string;

  vendorName?: string;

  totalAmount?: number;

  items: SalesOrderListLine[];
}

/** Body for `POST /api/salesorder` and `PUT /api/salesorder/:id`. */
export interface SalesOrderCreatePayload {

  docNo: string;

  docDate: string;

  vendorId: number;

  items: SalesOrderCreateItem[];
}

export interface SalesOrderCreateItem {

  itemCode: string;

  itemName: string;

  uom: string;

  price: number;

  quantity: number;
}

/** Response from `GET /api/salesorder/next-doc-no`. */
export interface SalesOrderNextDocNo {

  docNo: string;

  docDate: string;
}
