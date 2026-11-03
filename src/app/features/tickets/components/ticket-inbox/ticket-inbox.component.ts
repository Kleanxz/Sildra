import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Agent, Prioridad, Ticket } from '../../../../shared/models';
import { claseSla, porcentajeSla, textoSla } from '../../../../shared/utils/ticket-presentation';

@Component({
  selector: 'app-ticket-inbox',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './ticket-inbox.component.html',
})
export class TicketInboxComponent {
  @Input() tickets: Ticket[] = [];
  @Input() agentes: Agent[] = [];
  @Input() isAdmin = false;
  @Input() canHandle = false;
  @Input() currentUserId: string | null = null;
  @Input() busqueda = '';
  @Input() filtroEstado = '';
  @Input() filtroPrioridad = '';
  @Input() filtroAgente = '';
  @Input() filtroCola = '';
  @Input() paginaActual = 1;
  @Input() ticketsPorPagina = 6;

  @Output() busquedaChange = new EventEmitter<string>();
  @Output() filtroEstadoChange = new EventEmitter<string>();
  @Output() filtroPrioridadChange = new EventEmitter<string>();
  @Output() filtroAgenteChange = new EventEmitter<string>();
  @Output() filtroColaChange = new EventEmitter<string>();
  @Output() paginaActualChange = new EventEmitter<number>();
  @Output() filtersCleared = new EventEmitter<void>();
  @Output() createRequested = new EventEmitter<void>();
  @Output() ticketOpened = new EventEmitter<Ticket>();
  @Output() resolveRequested = new EventEmitter<Ticket>();
  @Output() assignmentRequested = new EventEmitter<Ticket>();
  @Output() csvExportRequested = new EventEmitter<Ticket[]>();

  readonly prioridades: Prioridad[] = ['P1', 'P2', 'P3'];

  esAdmin(): boolean {
    return this.isAdmin;
  }

  puedeResolver(ticket: Ticket): boolean {
    return this.canHandle && (this.isAdmin || ticket.agenteId === this.currentUserId);
  }

  ticketsFiltrados(): Ticket[] {
    const texto = this.busqueda.toLocaleLowerCase().trim();
    return this.tickets.filter((ticket) => {
      if (ticket.estado === 'Resuelto') return false;
      const coincideTexto =
        !texto ||
        [ticket.id, ticket.titulo, ticket.solicitante, ticket.email].some((value) =>
          value.toLocaleLowerCase().includes(texto),
        );
      const coincideEstado =
        !this.filtroEstado ||
        this.filtroEstado === 'Activos' ||
        ticket.estado === this.filtroEstado;
      const coincidePrioridad = !this.filtroPrioridad || ticket.prioridad === this.filtroPrioridad;
      const coincideAgente = !this.filtroAgente || ticket.agente === this.filtroAgente;
      const coincideCola = !this.filtroCola || ticket.cola === this.filtroCola;

      return coincideTexto && coincideEstado && coincidePrioridad && coincideAgente && coincideCola;
    });
  }

  ticketsPaginados(): Ticket[] {
    const inicio = (this.paginaActual - 1) * this.ticketsPorPagina;
    return this.ticketsFiltrados().slice(inicio, inicio + this.ticketsPorPagina);
  }

  totalPaginas(): number {
    return Math.max(1, Math.ceil(this.ticketsFiltrados().length / this.ticketsPorPagina));
  }

  finPagina(): number {
    return Math.min(this.paginaActual * this.ticketsPorPagina, this.ticketsFiltrados().length);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) this.paginaActualChange.emit(pagina);
  }

  actualizarBusqueda(valor: string): void {
    this.busquedaChange.emit(valor);
    this.paginaActualChange.emit(1);
  }

  actualizarEstado(valor: string): void {
    this.filtroEstadoChange.emit(valor);
    this.paginaActualChange.emit(1);
  }

  actualizarPrioridad(valor: string): void {
    this.filtroPrioridadChange.emit(valor);
    this.paginaActualChange.emit(1);
  }

  actualizarAgente(valor: string): void {
    this.filtroAgenteChange.emit(valor);
    this.paginaActualChange.emit(1);
  }

  limpiarFiltros(): void {
    this.filtersCleared.emit();
  }

  ticketsActivos(): Ticket[] {
    return this.tickets.filter((ticket) => ticket.estado !== 'Resuelto');
  }

  ticketsSinAsignar(): Ticket[] {
    if (!this.isAdmin) return [];
    return this.tickets.filter(
      (ticket) => ticket.agente === 'Sin asignar' && ticket.estado !== 'Resuelto',
    );
  }

  ticketsVencidos(): Ticket[] {
    return this.tickets.filter((ticket) => ticket.estado !== 'Resuelto' && ticket.slaRestante <= 0);
  }

  ticketsPorPrioridad(prioridad: Prioridad): Ticket[] {
    return this.tickets.filter(
      (ticket) => ticket.prioridad === prioridad && ticket.estado !== 'Resuelto',
    );
  }

  agenteVisible(ticket: Ticket): string {
    return !this.canHandle && ticket.agente === 'Sin asignar' ? 'Equipo de soporte' : ticket.agente;
  }

  claseSla(ticket: Ticket): string {
    return claseSla(ticket);
  }

  textoSla(ticket: Ticket): string {
    return textoSla(ticket);
  }

  porcentajeSla(ticket: Ticket): number {
    return porcentajeSla(ticket);
  }

  trackTicketById(_index: number, ticket: Ticket): string {
    return ticket.dbId || ticket.id;
  }
}
