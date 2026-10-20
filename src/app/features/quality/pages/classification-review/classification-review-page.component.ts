import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { App } from '../../../../app';

@Component({
  selector: 'app-classification-review-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './classification-review-page.component.html',
})
export class ClassificationReviewPageComponent {
  @Input({ required: true }) app!: Pick<
    App,
    | 'activeTab'
    | 'categoriaEdicion'
    | 'categorias'
    | 'guardarClasificacion'
    | 'tickets'
    | 'trackTicketById'
  >;
}
