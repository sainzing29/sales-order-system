export interface Item {
  itemId: number;
  itemCode: string;
  itemName: string;
  uom: string;
  price?: number;
}

/** Row from `GET /item/by-code` or `GET /item/by-name`. */
export interface ItemSearchResult {
  code: string;
  name: string;
  uom: string;
  price: number;
}
