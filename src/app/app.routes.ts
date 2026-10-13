import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    children: []
  },
  {
    path: 'llamadas/detalle',
    loadComponent: () =>
      import('./features/calls/call-detail/call-detail')
        .then(m => m.CallDetail)
  },
  {
    path: '**',
    redirectTo: ''
  }
];