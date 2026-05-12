import { CommonModule }
from '@angular/common';

import {
  Component,
  DestroyRef,
  inject,
  OnInit
} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { filter } from 'rxjs/operators';

import { AuthService }
from '../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss'
})
export class AppShellComponent implements OnInit {

  readonly auth = inject(AuthService);

  private router = inject(Router);

  private destroyRef = inject(DestroyRef);

  /** Shown only for `Admin`; recomputed on each navigation so it stays in sync after login. */
  protected showUsersNav = false;

  ngOnInit(): void {

    this.syncUsersNav();

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncUsersNav());
  }

  logout(): void {

    this.auth.logout();

    void this.router.navigate(['/login']);
  }

  private syncUsersNav(): void {

    this.showUsersNav = this.auth.isAdmin();
  }
}
