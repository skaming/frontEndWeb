import { Routes } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { provideRouter } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: 'login',
    component: LayoutComponent
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'microorm',
        loadChildren: () =>
          import('./microorm/tables.routes').then(m => m.MicroormRoutes)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'reports'
  }
];
