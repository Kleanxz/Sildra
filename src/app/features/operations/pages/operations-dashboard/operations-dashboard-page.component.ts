import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AppShellComponent } from '../../../../core/layout/app-shell/app-shell.component';

@Component({
  selector: 'app-operations-dashboard-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './operations-dashboard-page.component.html',
})
export class OperationsDashboardPageComponent {
  @Input({ required: true }) app!: Pick<
    AppShellComponent,
    | 'activeTab'
    | 'cambiarPestana'
    | 'estados'
    | 'porcentajeEstado'
    | 'textoSla'
    | 'tickets'
    | 'ticketsActivos'
    | 'ticketsDeAtencion'
    | 'ticketsPorEstado'
    | 'ticketsPorPrioridad'
    | 'ticketsResueltos'
    | 'ticketsVencidos'
    | 'trackTicketById'
    | 'verDetalleDesdeSeccion'
  >;
}
