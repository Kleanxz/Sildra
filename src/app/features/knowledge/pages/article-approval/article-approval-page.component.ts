import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AppShellComponent } from '../../../../core/layout/app-shell/app-shell.component';

@Component({
  selector: 'app-article-approval-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './article-approval-page.component.html',
})
export class ArticleApprovalPageComponent {
  @Input({ required: true }) app!: Pick<
    AppShellComponent,
    'activeTab' | 'articulosPendientes' | 'revisarArticuloKB' | 'revisandoArticuloKB'
  >;
}
