import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import {
  MatSidenav,
  MatSidenavContainer,
  MatSidenavContent,
} from '@angular/material/sidenav';
import { MatTooltip } from '@angular/material/tooltip';
import {
  RouterLinkActive,
  RouterLinkWithHref,
  RouterOutlet,
} from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MAIN_NAV_LINKS, NAV_LINKS } from 'src/app/data/nav-links';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { HotkeyDialogComponent } from '../hotkey-dialog/hotkey-dialog.component';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    MatIcon,
    MatButton,
    MatIconButton,
    MatSidenav,
    MatSidenavContainer,
    MatSidenavContent,
    MatTooltip,
    RouterLinkActive,
    RouterLinkWithHref,
    RouterOutlet,
    IconGuardPipe,
    TranslatePipe,
  ],
})
export class NavComponent {
  public navLinks = NAV_LINKS;
  public mainNavLinks = MAIN_NAV_LINKS;

  private readonly matDialog = inject(MatDialog);

  openHotkeyDialog() {
    this.matDialog.open(HotkeyDialogComponent);
  }
}
