import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { App } from '../../../../app';

@Component({
  selector: 'app-assign-tickets-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './assign-tickets-page.component.html',
})
export class AssignTicketsPageComponent {
  @Input({ required: true }) app!: Pick<
    App,
    | 'abrirAsignacion'
    | 'activeTab'
    | 'agentes'
    | 'cantidadPorAgente'
    | 'porcentajeAgente'
    | 'ticketsActivos'
    | 'ticketsSinAsignar'
    | 'trackTicketById'
  >;
}
