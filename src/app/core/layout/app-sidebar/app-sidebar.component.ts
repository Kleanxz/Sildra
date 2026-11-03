import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NavigationSection } from '../../../shared/models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  styles: [':host { display: block; }'],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent {
  @Input() sections: NavigationSection[] = [];
  @Input() activeTab = '';
  @Input() isAdmin = false;
  @Input() ticketsSinAsignarCount = 0;
  @Input() profileName = '';
  @Input() profileRole = '';

  @Output() tabSelected = new EventEmitter<string>();

  get iniciales(): string {
    return this.profileName
      .split(' ')
      .slice(0, 2)
      .map((name) => name[0])
      .join('')
      .toUpperCase();
  }
}
