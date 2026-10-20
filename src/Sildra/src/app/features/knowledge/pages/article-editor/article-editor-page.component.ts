import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { App } from '../../../../app';

@Component({
  selector: 'app-article-editor-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './article-editor-page.component.html',
})
export class ArticleEditorPageComponent {
  @Input({ required: true }) app!: Pick<
    App,
    'activeTab' | 'articuloNuevo' | 'cambiarPestana' | 'crearArticuloKB'
  >;
}
