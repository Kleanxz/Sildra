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
    @keyframes auth-view-exit {
      from { opacity: 1; filter: blur(0); transform: translateY(0) scale(1); }
      to { opacity: 0; filter: blur(4px); transform: translateY(-14px) scale(.975); }
    }
    @keyframes auth-submit-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes auth-transition-wash {
      0% { opacity: 0; }
      12%, 78% { opacity: 1; }
      100% { opacity: 0; }
    }
    @keyframes auth-logo-grow-shrink {
      0% { opacity: 0; transform: scale(.72) rotate(-8deg); }
      12% { opacity: 1; transform: scale(1) rotate(0); }
      42% { opacity: 1; transform: scale(3.25) rotate(5deg); }
      62% { opacity: 1; transform: scale(3.25) rotate(-4deg); }
      84% { opacity: 1; transform: scale(.78) rotate(2deg); }
      100% { opacity: .4; transform: scale(.42) rotate(0); }
    }
    @keyframes auth-transition-caption {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .auth-view-enter { animation: auth-view-enter 300ms cubic-bezier(.2,.7,.2,1) both; }
    .auth-view-exit { animation: auth-view-exit 320ms cubic-bezier(.4,0,.8,.3) both; pointer-events: none; }
    .auth-submit-content { display: inline-flex; align-items: center; justify-content: center; gap: .55rem; }
    .auth-submit-spinner {
      width: .95rem;
      height: .95rem;
      border: 2px solid rgb(15 23 42 / .2);
      border-top-color: #0f172a;
      border-radius: 50%;
      animation: auth-submit-spin 700ms linear infinite;
    }
    .auth-transition {
      position: fixed;
      z-index: 100;
      inset: 0;
      display: grid;
      place-items: center;
      overflow: hidden;
      background: rgb(248 250 252 / .96);
      backdrop-filter: blur(8px);
      animation: auth-transition-wash 1860ms ease both;
    }
    .auth-transition__brand-lockup { display: flex; flex-direction: column; align-items: center; }
    .auth-transition__brand {
      display: grid;
      width: 4.5rem;
      height: 4.5rem;
      place-items: center;
      border: 1px solid rgb(255 255 255 / .8);
      border-radius: 1.35rem;
      color: #0f172a;
      background: linear-gradient(145deg, #fde68a, #fbbf24 58%, #f59e0b);
      box-shadow: 0 18px 42px rgb(245 158 11 / .28), inset 0 1px 3px rgb(255 255 255 / .8);
      font-size: 2.3rem;
      font-weight: 900;
      transform-origin: center;
      animation: auth-logo-grow-shrink 1860ms cubic-bezier(.2,.7,.2,1) both;
    }
    .auth-transition__caption {
      margin-top: 1.4rem;
      color: #64748b;
      font-size: .9rem;
      font-weight: 600;
      animation: auth-transition-caption 250ms ease-out 1540ms both;
    }
    @media (prefers-reduced-motion: reduce) {
      .auth-view-enter, .auth-view-exit { animation-duration: 1ms; }
      .auth-submit-spinner { animation-duration: 1ms; animation-iteration-count: 1; }
      .auth-transition, .auth-transition__brand, .auth-transition__caption { animation-duration: 1ms; animation-delay: 0ms; }
    }
  `],
  templateUrl: './auth-view.component.html',
})
export class AuthViewComponent {
  @Input() cargandoSesion = true;
  @Input() modoRegistro = false;
  @Input() autenticando = false;
  @Input() animandoSalida = false;
  @Input() modoOscuro = false;
  @Input() errorAcceso = '';
  @Input() organizaciones: Organization[] = [];
  @Input() authForm: AuthForm = { nombre: '', email: '', password: '', organizacionId: '' };

  @Output() submitRequested = new EventEmitter<void>();
  @Output() modeToggleRequested = new EventEmitter<void>();
  @Output() themeToggleRequested = new EventEmitter<void>();
}
