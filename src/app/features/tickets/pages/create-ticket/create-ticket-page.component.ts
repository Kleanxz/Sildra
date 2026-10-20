import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { App } from '../../../../app';

@Component({
  selector: 'app-create-ticket-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './create-ticket-page.component.html',
})
export class CreateTicketPageComponent {
  @Input({ required: true }) app!: Pick<
    App,
    | 'activeTab'
    | 'categorias'
    | 'cerrarFormulario'
    | 'crearTicket'
    | 'nuevoTicket'
    | 'organizaciones'
    | 'perfil'
    | 'prioridades'
  >;
}
