import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TicketChatMessage } from '../../../../shared/models';
import { formatearFecha } from '../../../../shared/utils/ticket-presentation';

@Component({
  selector: 'app-ticket-chat',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './ticket-chat.component.html',
})
export class TicketChatComponent {
  @Input() mensajes: TicketChatMessage[] = [];
  @Input() userId: string | undefined;
  @Input() cargando = false;
  @Input() enviando = false;
  @Input() error = '';
  @Input() nuevoMensaje = '';

  @Output() nuevoMensajeChange = new EventEmitter<string>();
  @Output() refreshRequested = new EventEmitter<void>();
  @Output() sendRequested = new EventEmitter<void>();

  mensajeChatEsMio(message: TicketChatMessage): boolean {
    return message.authorId === this.userId;
  }

  formatearFecha(fecha: string): string {
    return formatearFecha(fecha);
  }
}
