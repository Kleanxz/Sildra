import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AppShellComponent } from '../../../../core/layout/app-shell/app-shell.component';

@Component({
  selector: 'app-sla-queues-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './sla-queues-page.component.html',
})
export class SlaQueuesPageComponent {
  @Input({ required: true }) app!: Pick<
    AppShellComponent,
    | 'activeTab'
    | 'claseSla'
    | 'colas'
    | 'filtroPrioridad'
    | 'porcentajeSla'
    | 'prioridades'
    | 'textoSla'
    | 'ticketsActivos'
    | 'ticketsPorCola'
    | 'ticketsPorPrioridad'
    | 'ticketsSlaFiltrados'
    | 'ticketsVencidos'
    | 'trackTicketById'
    | 'verDetalleDesdeSeccion'
  >;
}
