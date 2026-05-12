import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';

import { CommonModule }
from '@angular/common';

import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { ActivatedRoute, Router }
from '@angular/router';

import { Subscription }
from 'rxjs';

import { VendorService }
from '../../core/services/vendor.service';

import { ItemService }
from '../../core/services/item.service';

import { SalesOrderService }
from '../../core/services/sales-order.service';

import { Item, ItemSearchResult }
from '../../models/item';

import { Vendor }
from '../../models/vendor';

import {
  SalesOrder,
  SalesOrderCreatePayload,
  SalesOrderItem
} from '../../models/sales-order';

type ItemPickField = 'code' | 'name';

interface ItemPickState {

  rowIndex: number;

  field: ItemPickField;

  results: ItemSearchResult[];

  open: boolean;
}

@Component({
  selector: 'app-sales-order',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl:
    './sales-order.component.html',
  styleUrl: './sales-order.component.scss'
})
export class SalesOrderComponent
implements OnInit, OnDestroy {

  @ViewChild('vendorPicker', { read: ElementRef })
  vendorPicker?: ElementRef<HTMLElement>;

  private fb = inject(FormBuilder);

  private vendorService =
    inject(VendorService);

  private itemService =
    inject(ItemService);

  private salesOrderService =
    inject(SalesOrderService);

  private route = inject(ActivatedRoute);

  private router = inject(Router);

  private cdr = inject(ChangeDetectorRef);

  private paramSub?: Subscription;

  private itemSearchTimers =
    new Map<string, ReturnType<typeof setTimeout>>();

  vendors: Vendor[] = [];

  itemsMaster: Item[] = [];

  editingOrderId: number | null = null;

  saving = false;

  vendorListOpen = false;

  filteredVendors: Vendor[] = [];

  itemPickState: ItemPickState | null = null;

  /** `position: fixed` box for the item suggestion list (not clipped by the table scroll area). */
  itemDropdownStyle: Record<string, string> = {};

  form = this.fb.group({

    docNo: [''],

    docDate: ['', Validators.required],

    vendorId: [null as number | string | null, Validators.required],

    vendorSearch: [''],

    items: this.fb.array([])
  });

  get items(): FormArray {

    return this.form.controls['items'] as FormArray;
  }

  get orderSubtotal(): number {

    let sum = 0;

    for (let i = 0; i < this.items.length; i++) {

      if (!this.isLineComplete(this.items.at(i) as FormGroup))
        continue;

      sum += this.lineTotal(i);
    }

    return Math.round(sum * 100) / 100;
  }

  get canSave(): boolean {

    if (this.form.get('docDate')?.invalid)
      return false;

    if (this.form.get('vendorId')?.invalid)
      return false;

    const rows =
      this.items.controls as FormGroup[];

    if (!rows.some(g => this.isLineComplete(g)))
      return false;

    return !rows.some(g => this.isLinePartial(g));
  }

  get selectedVendor(): Vendor | undefined {

    const id = this.form.get('vendorId')?.value;

    if (id === null || id === undefined || id === '')
      return undefined;

    const n = Number(id);

    return this.vendors.find(v => v.id === n);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {

    const el = ev.target as HTMLElement;

    if (!this.vendorPicker?.nativeElement.contains(el))
      this.vendorListOpen = false;

    if (!el.closest('.so-item-typeahead') &&

        !el.closest('.so-item-list-portal'))
      this.closeItemPick();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {

    if (this.itemPickState?.results?.length)
      this.syncItemDropdownLayout();
  }

  @HostListener('window:resize')
  onWindowResize(): void {

    if (this.itemPickState?.results?.length)
      this.syncItemDropdownLayout();
  }

  onItemTableScroll(): void {

    if (this.itemPickState?.results?.length)
      this.syncItemDropdownLayout();
  }

  lineTotal(index: number): number {

    const g = this.items.at(index) as FormGroup | null;

    if (!g || !this.isLineComplete(g))
      return 0;

    const q = Number(g.get('quantity')?.value);

    const p = Number(g.get('price')?.value);

    if (!Number.isFinite(q) || !Number.isFinite(p))
      return 0;

    return Math.round(q * p * 100) / 100;
  }

  isLineEmpty(g: FormGroup): boolean {

    const c =
      String(g.get('itemCode')?.value ?? '')
        .trim();

    const n =
      String(g.get('itemName')?.value ?? '')
        .trim();

    return c.length === 0 && n.length === 0;
  }

  isLineComplete(g: FormGroup): boolean {

    const c =
      String(g.get('itemCode')?.value ?? '')
        .trim();

    const n =
      String(g.get('itemName')?.value ?? '')
        .trim();

    const u =
      String(g.get('uom')?.value ?? '')
        .trim();

    const q = Number(g.get('quantity')?.value);

    return c.length > 0 &&

      n.length > 0 &&

      u.length > 0 &&

      Number.isFinite(q) &&

      q > 0;
  }

  isLinePartial(g: FormGroup): boolean {

    if (this.isLineEmpty(g))
      return false;

    return !this.isLineComplete(g);
  }

  closeItemPick(): void {

    this.itemPickState = null;

    this.itemDropdownStyle = { display: 'none' };
  }

  pickItemFromPortal(hit: ItemSearchResult): void {

    const s = this.itemPickState;

    if (!s)
      return;

    this.pickItemSearchResult(
      s.rowIndex,
      hit);
  }

  private syncItemDropdownLayout(): void {

    if (!this.itemPickState?.results?.length) {

      this.itemDropdownStyle = { display: 'none' };

      return;
    }

    const id =
      `so-item-field-${this.itemPickState.rowIndex}-${this.itemPickState.field}`;

    const anchor = document.getElementById(id);

    if (!anchor) {

      this.itemDropdownStyle = { display: 'none' };

      return;
    }

    const r = anchor.getBoundingClientRect();

    const gap = 2;

    const maxH =
      Math.min(
        220,

        Math.max(
          80,

          window.innerHeight - r.bottom - gap - 8));

    this.itemDropdownStyle = {

      display: 'block',

      position: 'fixed',

      top: `${r.bottom + gap}px`,

      left: `${r.left}px`,

      width: `${Math.max(r.width, 120)}px`,

      maxHeight: `${maxH}px`,

      zIndex: '1060'
    };

    this.cdr.markForCheck();
  }

  private afterItemPickOpened(): void {

    setTimeout(() => {

      this.syncItemDropdownLayout();

      requestAnimationFrame(() =>
        this.syncItemDropdownLayout());

      this.cdr.markForCheck();
    }, 0);
  }

  onItemCodeFocus(rowIndex: number): void {

    this.runItemSearch(
      rowIndex,
      'code');
  }

  onItemCodeInput(rowIndex: number): void {

    this.scheduleItemSearch(
      rowIndex,
      'code');
  }

  onItemNameFocus(rowIndex: number): void {

    this.runItemSearch(
      rowIndex,
      'name');
  }

  onItemNameInput(rowIndex: number): void {

    this.scheduleItemSearch(
      rowIndex,
      'name');
  }

  private scheduleItemSearch(
    rowIndex: number,
    field: ItemPickField
  ): void {

    const key = `${rowIndex}-${field}`;

    const prev = this.itemSearchTimers.get(key);

    if (prev)
      clearTimeout(prev);

    const handle = window.setTimeout(() => {

      this.itemSearchTimers.delete(key);

      this.runItemSearch(
        rowIndex,
        field);
    }, 300);

    this.itemSearchTimers.set(
      key,
      handle);
  }

  private runItemSearch(
    rowIndex: number,
    field: ItemPickField
  ): void {

    const group = this.items.at(rowIndex) as FormGroup | undefined;

    if (!group)
      return;

    const term =
      field === 'code'
        ? String(group.get('itemCode')?.value ?? '').trim()
        : String(group.get('itemName')?.value ?? '').trim();

    const req$ =
      field === 'code'
        ? this.itemService.searchByCode(
            term || undefined)
        : this.itemService.searchByName(
            term || undefined);

    req$.subscribe(results => {

      const current = this.items.at(rowIndex) as FormGroup | undefined;

      if (!current || current !== group)
        return;

      if (!results.length) {

        this.closeItemPick();

        return;
      }

      this.itemPickState = {

        rowIndex,

        field,

        results,

        open: true
      };

      this.afterItemPickOpened();
    });
  }

  pickItemSearchResult(
    rowIndex: number,
    hit: ItemSearchResult
  ): void {

    const g = this.items.at(rowIndex) as FormGroup | undefined;

    if (!g)
      return;

    g.patchValue({

      itemCode: hit.code,

      itemName: hit.name,

      uom: hit.uom,

      price: hit.price,

      quantity: 1
    });

    this.closeItemPick();
  }

  onVendorSearchFocus(): void {

    this.refreshVendorFilter();

    this.vendorListOpen = true;
  }

  onVendorSearchInput(): void {

    const term =
      (this.form.get('vendorSearch')?.value ?? '')
        .toString();

    const sel = this.selectedVendor;

    if (sel && term.trim() !== sel.vendorName.trim())
      this.form.patchValue(
        { vendorId: null },
        { emitEvent: false });

    this.refreshVendorFilter();

    this.vendorListOpen = true;
  }

  refreshVendorFilter(): void {

    const q =
      (this.form.get('vendorSearch')?.value ?? '')
        .toString()
        .toLowerCase()
        .trim();

    if (!q) {

      this.filteredVendors =
        this.vendors.slice(0, 80);

      return;
    }

    this.filteredVendors =
      this.vendors.filter(v =>

        v.vendorName
          .toLowerCase()
          .includes(q) ||

        v.vendorCode
          .toLowerCase()
          .includes(q));
  }

  pickVendor(v: Vendor): void {

    this.form.patchValue({

      vendorId: v.id,

      vendorSearch: v.vendorName
    });

    this.vendorListOpen = false;
  }

  syncVendorSearchFromSelection(): void {

    const name =
      this.selectedVendor?.vendorName ?? '';

    this.form.get('vendorSearch')
      ?.setValue(
        name,
        { emitEvent: false });
  }

  ngOnInit(): void {

    this.loadVendors();

    this.loadItems();

    this.paramSub =
      this.route.paramMap.subscribe(params => {

        const idStr = params.get('id');

        if (idStr) {

          this.loadOrder(Number(idStr));
        } else {

          this.editingOrderId = null;

          this.resetFormForNew();
        }
      });
  }

  ngOnDestroy(): void {

    this.paramSub?.unsubscribe();

    for (const t of this.itemSearchTimers.values())
      clearTimeout(t);

    this.itemSearchTimers.clear();
  }

  loadVendors(): void {

    this.vendorService.getAll()
      .subscribe(res => {

        this.vendors = res;

        this.refreshVendorFilter();

        this.syncVendorSearchFromSelection();
      });
  }

  loadItems(): void {

    this.itemService.getAll()
      .subscribe(res => {
        this.itemsMaster = res;
      });
  }

  loadOrder(id: number): void {

    this.salesOrderService.getById(id)
      .subscribe({

        next: (order) => {
          this.applyOrder(order);
        },

        error: () => {

          alert('Could not load sales order');

          void this.router.navigate(['/sales-order']);
        }
      });
  }

  applyOrder(order: SalesOrder): void {

    this.editingOrderId = order.id;

    this.form.patchValue({

      docNo: order.docNo,

      docDate: this.toInputDate(order.docDate),

      vendorId: order.vendorId
    });

    this.syncVendorSearchFromSelection();

    this.items.clear();

    order.items.forEach(line =>
      this.items.push(
        this.createItemRowFromApiLine(line)));

    if (this.items.length === 0)
      this.addItemRow();
  }

  private createItemRowFromApiLine(
    line: SalesOrderItem
  ): FormGroup {

    let itemCode = line.itemCode ?? '';

    let itemName = line.itemName ?? '';

    let uom = line.uom ?? '';

    let price =
      line.price != null && Number.isFinite(line.price)
        ? line.price
        : 0;

    if (line.itemId != null && (!itemCode || !itemName)) {

      const m = this.getItemById(line.itemId);

      itemCode = itemCode || m?.itemCode || '';

      itemName = itemName || m?.itemName || '';

      uom = uom || m?.uom || '';

      if (!price && m?.price != null)
        price = m.price;
    }

    return this.fb.group({

      itemCode: [itemCode],

      itemName: [itemName],

      uom: [uom],

      price: [price, [Validators.min(0)]],

      quantity: [
        line.quantity,
        [Validators.min(1)]]
    });
  }

  resetFormForNew(): void {

    this.form.reset({

      docNo: '',

      docDate: this.todayIsoDate(),

      vendorId: null,

      vendorSearch: ''
    });

    this.items.clear();

    this.addItemRow();

    this.loadNextDocNoForNew();
  }

  /** Fills readonly doc no (and doc date) from API for a new order only. */
  private loadNextDocNoForNew(): void {

    if (this.editingOrderId != null)
      return;

    this.salesOrderService.getNextDocNo()
      .subscribe({

        next: (res) => {

          if (this.editingOrderId != null)
            return;

          const docDate =
            this.toInputDate(res.docDate) ||

            this.todayIsoDate();

          this.form.patchValue({

            docNo: res.docNo ?? '',

            docDate
          });
        },

        error: () => {

          /* keep reset defaults if endpoint fails */
        }
      });
  }

  toInputDate(value: string): string {

    if (!value)
      return '';

    const t = value.trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(t))
      return t.slice(0, 10);

    if (/^\d{4}-\d{2}-\d{2}$/.test(t))
      return t;

    const d = new Date(t);

    if (Number.isNaN(d.getTime()))
      return '';

    return d.toISOString().slice(0, 10);
  }

  /** Local calendar date as `yyyy-MM-dd` for `<input type="date">`. */
  private todayIsoDate(): string {

    const d = new Date();

    const y = d.getFullYear();

    const m = String(d.getMonth() + 1).padStart(2, '0');

    const day = String(d.getDate()).padStart(2, '0');

    return `${y}-${m}-${day}`;
  }

  createItemRow(): FormGroup {

    return this.fb.group({

      itemCode: [''],

      itemName: [''],

      uom: [''],

      price: [0, [Validators.min(0)]],

      quantity: [1, [Validators.min(1)]]
    });
  }

  addItemRow(): void {

    this.items.push(
      this.createItemRow());
  }

  removeItemRow(index: number): void {

    for (const k of this.itemSearchTimers.keys())
      clearTimeout(this.itemSearchTimers.get(k)!);

    this.itemSearchTimers.clear();

    this.closeItemPick();

    this.items.removeAt(index);

    if (this.items.length === 0)
      this.addItemRow();
  }

  getItemById(itemId: unknown): Item | undefined {

    if (itemId === null || itemId === undefined || itemId === '')
      return undefined;

    const id = Number(itemId);

    return this.itemsMaster.find(i => i.itemId === id);
  }

  buildPayload(): SalesOrderCreatePayload {

    const raw = this.form.getRawValue();

    const groups =
      this.items.controls as FormGroup[];

    const items =
      groups
        .filter(g => this.isLineComplete(g))
        .map(g => {

          const row = g.getRawValue();

          return {

            itemCode: String(row.itemCode ?? '').trim(),

            itemName: String(row.itemName ?? '').trim(),

            uom: String(row.uom ?? '').trim(),

            price: Number(row.price ?? 0),

            quantity: Number(row.quantity ?? 0)
          };
        });

    return {

      docNo: String(raw.docNo ?? '').trim(),

      docDate: String(raw.docDate ?? '').trim(),

      vendorId: Number(raw.vendorId),

      items
    };
  }

  save(): void {

    if (!this.canSave || this.saving)
      return;

    this.saving = true;

    const payload = this.buildPayload();

    const req =
      this.editingOrderId != null
        ? this.salesOrderService.update(
            this.editingOrderId,
            payload)
        : this.salesOrderService.create(payload);

    req.subscribe({

      next: () => {

        this.saving = false;

        alert(
          this.editingOrderId != null
            ? 'Updated'
            : 'Saved');

        void this.router.navigate(['/sales-order/list']);
      },

      error: () => {

        this.saving = false;

        alert(
          this.editingOrderId != null
            ? 'Update failed'
            : 'Save failed');
      }
    });
  }
}
