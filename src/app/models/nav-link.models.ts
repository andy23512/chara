import { RouterLinkActive } from '@angular/router';
import { Icon } from '../types/icon.types';
import { Page } from './page.models';

export interface NavLink {
  page: Page;
  title: string;
  routerLink: string;
  routerLinkActiveOptions: RouterLinkActive['routerLinkActiveOptions'];
  ariaLabel: string;
  tooltipMessage: string;
  lockMessage?: string;
  icon: Icon;
}
