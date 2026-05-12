import { Routes } from '@angular/router';

import { AppShellComponent }
from './layout/app-shell.component';

import { LoginComponent }
from './pages/login/login.component';

import { UsersComponent }
from './pages/users/users.component';

import { SalesOrderComponent }
from './pages/sales-order/sales-order.component';

import { SalesOrderListComponent }
from './pages/sales-order-list/sales-order-list.component';

import { adminGuard }
from './core/guards/admin.guard';

import { authGuard }
from './core/guards/authguard';

export const routes: Routes = [

  //#region Login

  {
    path: 'login',

    component: LoginComponent
  },

  //#endregion

  //#region Authenticated shell

  {
    path: '',

    component: AppShellComponent,

    canActivate: [authGuard],

    children: [

      {
        path: '',

        pathMatch: 'full',

        redirectTo: 'sales-order/list'
      },

      {
        path: 'sales-order/list',

        component: SalesOrderListComponent
      },

      {
        path: 'sales-order/:id',

        component: SalesOrderComponent
      },

      {
        path: 'sales-order',

        component: SalesOrderComponent
      },

      {
        path: 'users',

        component: UsersComponent,

        canActivate: [adminGuard]
      }
    ]
  },

  //#endregion

  //#region Wildcard

  {
    path: '**',

    redirectTo: 'login'
  }

  //#endregion
];
