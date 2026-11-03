import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AppShellComponent } from '../../../../core/layout/app-shell/app-shell.component';

@Component({
  selector: 'app-classification-review-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './classification-review-page.component.html',
})
export class ClassificationReviewPageComponent {
  @Input({ required: true }) app!: Pick<
    AppShellComponent,
    | 'activeTab'
    | 'categoriaEdicion'
    | 'categorias'
    | 'guardarClasificacion'
    | 'tickets'
    | 'trackTicketById'
  >;
}
