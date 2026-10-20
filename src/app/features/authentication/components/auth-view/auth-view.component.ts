import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthForm, Organization } from '../../../../shared/models';

@Component({
  selector: 'app-auth-view',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './auth-view.component.html',
})
export class AuthViewComponent {
  @Input() cargandoSesion = true;
  @Input() modoRegistro = false;
  @Input() errorAcceso = '';
  @Input() organizaciones: Organization[] = [];
  @Input() authForm: AuthForm = { nombre: '', email: '', password: '', organizacionId: '' };

  @Output() submitRequested = new EventEmitter<void>();
  @Output() modeToggleRequested = new EventEmitter<void>();
}
