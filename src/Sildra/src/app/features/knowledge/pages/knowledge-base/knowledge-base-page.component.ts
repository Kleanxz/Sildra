import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { App } from '../../../../app';

@Component({
  selector: 'app-knowledge-base-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './knowledge-base-page.component.html',
})
export class KnowledgeBasePageComponent {
  @Input({ required: true }) app!: Pick<
    App,
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
