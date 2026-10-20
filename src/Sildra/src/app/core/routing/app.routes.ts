import { Routes } from '@angular/router';
import { RouteMarkerComponent } from './route-marker/route-marker.component';

const sectionRoutes: Array<{ path: string; section: string }> = [
  { path: 'tickets', section: 'Bandeja de tickets' },
  { path: 'tickets/resueltos', section: 'Tickets resueltos' },
  { path: 'tickets/detalle', section: 'Detalle de ticket' },
  { path: 'tickets/nuevo', section: 'Crear ticket' },
  { path: 'tickets/resolver', section: 'Resolver tickets' },
  { path: 'tickets/asignar', section: 'Asignar tickets' },
  { path: 'telefonia/llamadas', section: 'Detalle de llamada' },
  { path: 'telefonia/transferencias', section: 'Transferencia cálida entrante' },
  { path: 'calidad/clasificacion', section: 'Revisión de clasificación' },
  { path: 'conocimiento', section: 'Base de conocimiento' },
  { path: 'conocimiento/nuevo', section: 'Nuevo artículo KB' },
  { path: 'conocimiento/aprobar', section: 'Aprobar artículo KB' },
  { path: 'conocimiento/rechazar', section: 'Rechazar artículo KB' },
  { path: 'operacion', section: 'Panel de operación' },
  { path: 'operacion/sla-colas', section: 'Prioridad, SLA y colas' },
  { path: 'administracion/organizaciones', section: 'Organizaciones' },
  { path: 'administracion/permisos', section: 'Permisos de usuarios' },
  { path: 'perfil', section: 'Perfil del usuario' },
];

export const sectionRoutePaths: Record<string, string> = Object.fromEntries(
  sectionRoutes.map(({ path, section }) => [section, `/${path}`]),
);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tickets' },
  {
    path: 'tickets/detalle/:ticketId',
    component: RouteMarkerComponent,
    data: { section: 'Detalle de ticket' },
  },
  ...sectionRoutes.map(({ path, section }) => ({
    path,
    component: RouteMarkerComponent,
    data: { section },
  })),
  { path: '**', redirectTo: 'tickets' },
];
