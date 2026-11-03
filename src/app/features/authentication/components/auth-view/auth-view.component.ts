import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthForm, Organization } from '../../../../shared/models';

@Component({
  selector: 'app-auth-view',
  standalone: true,
  imports: [FormsModule],
  styles: [`
    :host { display: block; }
    @keyframes auth-view-enter {
      from { opacity: 0; transform: translateY(12px) scale(.99); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .auth-view-enter { animation: auth-view-enter 300ms cubic-bezier(.2,.7,.2,1) both; }
    @media (prefers-reduced-motion: reduce) {
      .auth-view-enter { animation-duration: 1ms; }
    }
  `],
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
