import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { App } from '../../../../app';

@Component({
  selector: 'app-incoming-handoffs-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './incoming-handoffs-page.component.html',
})
export class IncomingHandoffsPageComponent {
  @Input({ required: true }) app!: Pick<
    App,
    | 'activeTab'
    | 'actualizarTransferencia'
    | 'formatearFecha'
    | 'solicitarTransferencia'
    | 'ticketsTransferibles'
    | 'trackTicketById'
    | 'transferenciaNueva'
    | 'transferencias'
  >;
}
