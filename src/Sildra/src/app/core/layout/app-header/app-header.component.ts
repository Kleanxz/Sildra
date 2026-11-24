import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  styles: [':host { display: block; }'],
  templateUrl: './app-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeaderComponent {
  @Input() activeTab = '';
  @Input() isAdmin = false;
  @Input() isAgent = false;
  @Input() profileName = '';
  @Input() modoOscuro = false;

  @Output() commandsRequested = new EventEmitter<void>();
  @Output() logoutRequested = new EventEmitter<void>();
  @Output() themeToggleRequested = new EventEmitter<void>();

  get iniciales(): string {
    return this.profileName
      .split(' ')
      .slice(0, 2)
      .map((name) => name[0])
      .join('')
      .toUpperCase();
  }

  get roleLabel(): string {
    return this.isAdmin ? 'Administrador' : this.isAgent ? 'Agente' : 'Usuario';
  }
}
