import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AppShellComponent } from '../../../../core/layout/app-shell/app-shell.component';

@Component({
  selector: 'app-knowledge-base-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './knowledge-base-page.component.html',
})
export class KnowledgeBasePageComponent {
  @Input({ required: true }) app!: Pick<
    AppShellComponent,
    | 'activeTab'
    | 'articulosKBFiltrados'
    | 'buscarKB'
    | 'cambiarPestana'
    | 'esAdmin'
    | 'estadoArticulo'
    | 'formatearFecha'
    | 'puedeAtender'
  >;
}
