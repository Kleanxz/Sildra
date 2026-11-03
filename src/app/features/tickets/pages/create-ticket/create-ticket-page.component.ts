import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AppShellComponent } from '../../../../core/layout/app-shell/app-shell.component';

@Component({
  selector: 'app-create-ticket-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './create-ticket-page.component.html',
})
export class CreateTicketPageComponent {
  @Input({ required: true }) app!: Pick<
    AppShellComponent,
    | 'activeTab'
    | 'categorias'
    | 'cerrarFormulario'
    | 'crearTicket'
    | 'alternarFormularioCategoria'
    | 'cerrarFormularioCategoria'
    | 'esAdmin'
    | 'guardandoCategoria'
    | 'guardarCategoria'
    | 'mostrarFormularioCategoria'
    | 'nuevaCategoria'
    | 'nuevoTicket'
    | 'organizaciones'
    | 'perfil'
    | 'prioridades'
  >;
}
