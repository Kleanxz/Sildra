import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AppShellComponent } from '../../../../core/layout/app-shell/app-shell.component';

@Component({
  selector: 'app-call-details-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './call-details-page.component.html',
})
export class CallDetailsPageComponent {
  @Input({ required: true }) app!: Pick<
    AppShellComponent,
    | 'activeTab'
    | 'cargarLlamadas'
    | 'formatearDuracion'
    | 'formatearFecha'
    | 'llamadaSeleccionada'
    | 'llamadas'
  >;
}
