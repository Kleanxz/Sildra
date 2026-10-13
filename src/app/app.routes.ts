
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
    path: 'llamadas/transferencia',
    loadComponent: () =>
      import('./features/calls/warm-transfer/warm-transfer')
        .then(m => m.WarmTransfer)
  },
  {
    path: 'conocimiento/articulos',
    loadComponent: () =>
      import('./features/knowledge-base/kb-list/kb-list')
        .then(m => m.KbList)
  },
  {
    path: 'conocimiento/nuevo',
    loadComponent: () =>
      import('./features/knowledge-base/kb-new-article/kb-new-article')
        .then(m => m.KbNewArticle)
  },
  {
    path: 'conocimiento/revision',
    loadComponent: () =>
      import('./features/knowledge-base/kb-review/kb-review')
        .then(m => m.KbReview)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
