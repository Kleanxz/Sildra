import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AppShellComponent } from '../../../../core/layout/app-shell/app-shell.component';

@Component({
  selector: 'app-organization-management-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './organization-management-page.component.html',
})
export class OrganizationManagementPageComponent {
  @Input({ required: true }) app!: Pick<
    AppShellComponent,
    'activeTab' | 'guardarOrganizacion' | 'nuevaOrganizacion' | 'organizaciones'
  >;
}
