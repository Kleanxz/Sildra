import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { App } from '../../../../app';

@Component({
  selector: 'app-user-profile-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './user-profile-page.component.html',
})
export class UserProfilePageComponent {
  @Input({ required: true }) app!: Pick<App, 'activeTab' | 'guardarPerfil' | 'perfil'>;
}
