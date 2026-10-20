import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { App } from '../../../../app';

@Component({
  selector: 'app-call-details-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './call-details-page.component.html',
})
export class CallDetailsPageComponent {
  @Input({ required: true }) app!: Pick<
    App,
    | 'activeTab'
    | 'cargarLlamadas'
    | 'formatearDuracion'
    | 'formatearFecha'
    | 'llamadaSeleccionada'
    | 'llamadas'
  >;
}
