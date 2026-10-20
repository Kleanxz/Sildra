import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ticket } from '../../../../shared/models';
import { formatearFecha } from '../../../../shared/utils/ticket-presentation';

@Component({
  selector: 'app-resolved-tickets',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './resolved-tickets.component.html',
})
export class ResolvedTicketsComponent {
  @Input() tickets: Ticket[] = [];
  @Input() busqueda = '';

  @Output() busquedaChange = new EventEmitter<string>();
  @Output() ticketOpened = new EventEmitter<Ticket>();

  ticketsFiltrados(): Ticket[] {
    const query = this.busqueda.trim().toLocaleLowerCase();
    return this.tickets.filter(
      (ticket) =>
        !query ||
        [
          ticket.id,
          ticket.titulo,
          ticket.descripcion,
          ticket.categoria,
          ticket.solicitante,
          ticket.resolutionNotes,
        ].some((value) => value.toLocaleLowerCase().includes(query)),
    );
  }

  trackTicketById(_index: number, ticket: Ticket): string {
    return ticket.dbId || ticket.id;
  }

  formatearFecha(fecha: string): string {
    return formatearFecha(fecha);
  }
}
