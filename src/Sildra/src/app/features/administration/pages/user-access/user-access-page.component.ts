import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { App } from '../../../../app';

@Component({
  selector: 'app-user-access-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './user-access-page.component.html',
})
export class UserAccessPageComponent {
  @Input({ required: true }) app!: Pick<
    App,
    'activeTab' | 'cambiarRolUsuario' | 'eliminarUsuario' | 'usuariosAdministrables'
  >;
}
