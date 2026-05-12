import { CommonModule }
from '@angular/common';

import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { RouterLink }
from '@angular/router';

import { finalize }
from 'rxjs';

import { SalesOrderService }
from '../../core/services/sales-order.service';

import { SalesOrderListRow }
from '../../models/sales-order';

@Component({
  selector: 'app-sales-order-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './sales-order-list.component.html',
  styleUrl: './sales-order-list.component.scss'
})
export class SalesOrderListComponent
implements OnInit {

  private salesOrderService =
    inject(SalesOrderService);

  private cdr = inject(ChangeDetectorRef);

  orders: SalesOrderListRow[] = [];

  loading = true;

  loadError: string | null = null;

  ngOnInit(): void {

    this.salesOrderService.getAll()
      .pipe(
        finalize(() => {

          this.loading = false;

          this.cdr.markForCheck();
        }))
      .subscribe({

        next: (rows) => {

          this.orders = rows;

          this.loadError = null;
        },

        error: () => {

          this.loadError =
            'Could not load sales orders.';
        }
      });
  }

  displayDate(
    iso: string
  ): string {

    if (!iso)
      return '—';

    const t = iso.trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(t))
      return t.slice(0, 10);

    const d = new Date(t);

    if (Number.isNaN(d.getTime()))
      return '—';

    return d.toISOString().slice(0, 10);
  }
}
