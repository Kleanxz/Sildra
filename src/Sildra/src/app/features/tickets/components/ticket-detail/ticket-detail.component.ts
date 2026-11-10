import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Estado, Prioridad, Ticket, TicketChatMessage } from '../../../../shared/models';
import { CopilotPanelComponent } from '../../../copilot/components/copilot-panel/copilot-panel.component';
import { TicketChatComponent } from '../ticket-chat/ticket-chat.component';
import {
  claseSla,
  formatearFecha,
  porcentajeSla,
  textoSla,
} from '../../../../shared/utils/ticket-presentation';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TicketChatComponent, CopilotPanelComponent],
  styles: [':host { display: block; } .chat-copilot-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.25rem; } @media (min-width: 1280px) { .chat-copilot-layout.copilot-open { grid-template-columns: minmax(0, 1fr) 360px; } }'],
  templateUrl: './ticket-detail.component.html',
})
export class TicketDetailComponent {
  @Input() ticketSeleccionado: Ticket | null = null;
  @Input() isAdmin = false;
  @Input() canHandle = false;
  @Input() estados: Estado[] = [];
  @Input() prioridades: Prioridad[] = [];
  @Input() colas: string[] = [];
  @Input() mensajesChat: TicketChatMessage[] = [];
  @Input() usuarioId: string | undefined;
  @Input() cargandoChat = false;
  @Input() enviandoChat = false;
  @Input() errorChat = '';
  @Input() nuevoMensajeChat = '';

  copilotOpen = false;
  copilotLoaded = false;

  @Output() nuevoMensajeChatChange = new EventEmitter<string>();
  @Output() backRequested = new EventEmitter<void>();
  @Output() saveRequested = new EventEmitter<void>();
  @Output() resolveRequested = new EventEmitter<Ticket>();
  @Output() reopenRequested = new EventEmitter<Ticket>();
  @Output() assignmentRequested = new EventEmitter<Ticket>();
  @Output() chatRefreshRequested = new EventEmitter<void>();
  @Output() chatSendRequested = new EventEmitter<void>();

  toggleCopilot(): void {
    this.copilotOpen = !this.copilotOpen;
    if (this.copilotOpen) this.copilotLoaded = true;
  }

  formatearFecha(fecha: string): string { return formatearFecha(fecha); }
  agenteVisible(ticket: Ticket): string {
    return !this.canHandle && ticket.agente === 'Sin asignar' ? 'Equipo de soporte' : ticket.agente;
  }
  textoSla(ticket: Ticket): string { return textoSla(ticket); }
  porcentajeSla(ticket: Ticket): number { return porcentajeSla(ticket); }
  claseSla(ticket: Ticket): string { return claseSla(ticket); }
}
