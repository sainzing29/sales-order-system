import { HttpErrorResponse }
from '@angular/common/http';

import {
  ChangeDetectorRef,
  Component,
  inject
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { Router } from '@angular/router';

import { finalize } from 'rxjs';

import { AuthService }
from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {

  private fb = inject(FormBuilder);

  private authService =
    inject(AuthService);

  private router = inject(Router);

  private cdr = inject(ChangeDetectorRef);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  loading = false;

  errorMessage: string | null = null;

  login(): void {

    if (this.form.invalid)
      return;

    this.errorMessage = null;

    this.loading = true;

    this.authService
      .login(this.form.value as any)
      .pipe(
        finalize(() => {

          this.loading = false;

          this.cdr.markForCheck();
        }))
      .subscribe({

        next: () => {
          this.router.navigate(['/sales-order/list']);
        },

        error: (err: unknown) => {

          this.errorMessage =
            this.readLoginErrorMessage(err);

          this.cdr.detectChanges();
        }
      });
  }

  private readLoginErrorMessage(
    err: unknown
  ): string {

    if (!(err instanceof HttpErrorResponse))
      return 'Login failed. Please try again.';

    let body: unknown = err.error;

    if (typeof body === 'string') {

      const t = body.trim();

      if (t.startsWith('{')) {

        try {

          body = JSON.parse(t) as Record<string, unknown>;
        } catch {

          /* keep string body */
        }
      }
    }

    if (body && typeof body === 'object') {

      const o = body as Record<string, unknown>;

      const m =
        o['message'] ?? o['Message'];

      if (typeof m === 'string' && m.trim())
        return m.trim();
    }

    if (typeof body === 'string' && body.trim())
      return body.trim();

    if (err.status === 0)
      return 'Unable to reach the server. Check your connection.';

    return `Login failed (${err.status}).`;
  }
}