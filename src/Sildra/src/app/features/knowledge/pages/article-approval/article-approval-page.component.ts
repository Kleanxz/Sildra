import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { App } from '../../../../app';

@Component({
  selector: 'app-article-approval-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './article-approval-page.component.html',
})
export class ArticleApprovalPageComponent {
  @Input({ required: true }) app!: Pick<
    App,
    'activeTab' | 'articulosPendientes' | 'revisarArticuloKB'
  >;
}
