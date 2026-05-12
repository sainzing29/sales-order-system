import { HttpErrorResponse }
from '@angular/common/http';

import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule }
from '@angular/common';

import { finalize }
from 'rxjs';

import { UserService }
from '../../core/services/user.service';

import { User }
from '../../models/user';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent
implements OnInit {

  private userService =
    inject(UserService);

  private cdr = inject(ChangeDetectorRef);

  users: User[] = [];

  loading = true;

  loadError: string | null = null;

  ngOnInit(): void {

    this.userService
      .getAll()
      .pipe(
        finalize(() => {

          this.loading = false;

          this.cdr.markForCheck();
        }))
      .subscribe({

        next: (rows) => {

          this.users = rows;

          this.loadError = null;
        },

        error: (err: unknown) => {

          this.users = [];

          if (err instanceof HttpErrorResponse) {

            this.loadError =
              err.status === 0
                ? 'Could not reach the server (network or CORS).'
                : `Could not load users (HTTP ${err.status}).`;
          } else {

            this.loadError =
              'Could not load users.';
          }
        }
      });
  }
}
