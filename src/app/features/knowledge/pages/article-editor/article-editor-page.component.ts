import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AppShellComponent } from '../../../../core/layout/app-shell/app-shell.component';

@Component({
  selector: 'app-article-editor-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './article-editor-page.component.html',
})
export class ArticleEditorPageComponent {
  @Input({ required: true }) app!: Pick<
    AppShellComponent,
    'activeTab' | 'articuloNuevo' | 'cambiarPestana' | 'crearArticuloKB'
  >;
}
