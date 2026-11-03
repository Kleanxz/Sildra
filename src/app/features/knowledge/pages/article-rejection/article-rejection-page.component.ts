import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AppShellComponent } from '../../../../core/layout/app-shell/app-shell.component';

@Component({
  selector: 'app-article-rejection-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './article-rejection-page.component.html',
})
export class ArticleRejectionPageComponent {
  @Input({ required: true }) app!: Pick<
    AppShellComponent,
    'activeTab' | 'articulosPendientes' | 'comentarioRechazo' | 'revisarArticuloKB'
  >;
}
