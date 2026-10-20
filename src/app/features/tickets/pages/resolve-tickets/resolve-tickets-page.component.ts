import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { App } from '../../../../app';

@Component({
  selector: 'app-resolve-tickets-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './resolve-tickets-page.component.html',
})
export class ResolveTicketsPageComponent {
  @Input({ required: true }) app!: Pick<
    App,
    'activeTab' | 'resolverTicket' | 'ticketsAsignadosActivos' | 'trackTicketById'
  >;
}
