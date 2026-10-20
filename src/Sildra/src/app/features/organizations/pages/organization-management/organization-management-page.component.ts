import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { App } from '../../../../app';

@Component({
  selector: 'app-organization-management-page',
  standalone: true,
  imports: [FormsModule],
  styles: [':host { display: block; }'],
  templateUrl: './organization-management-page.component.html',
})
export class OrganizationManagementPageComponent {
  @Input({ required: true }) app!: Pick<
    App,
    'activeTab' | 'guardarOrganizacion' | 'nuevaOrganizacion' | 'organizaciones'
  >;
}
