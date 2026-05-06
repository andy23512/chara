import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
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
import { HotkeysService } from '@ngneat/hotkeys';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { filter, map, shareReplay, take } from 'rxjs/operators';
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
export class NavComponent implements OnInit {
  public navLinks = NAV_LINKS;
  public mainNavLinks = MAIN_NAV_LINKS;
  public toggleSideMenuShortcut = 'meta.b';

  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly matDialog = inject(MatDialog);

  @ViewChild('drawer') public drawer!: MatSidenav;

  readonly hotkeysService = inject(HotkeysService);

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay(1),
    );

  ngOnInit(): void {
    this.hotkeysService
      .addShortcut({ keys: this.toggleSideMenuShortcut })
      .subscribe(() => this.drawer.toggle());
  }

  ngOnDestroy(): void {
    this.hotkeysService.removeShortcuts([this.toggleSideMenuShortcut]);
  }

  onNavLinkClick() {
    this.isHandset$
      .pipe(
        take(1),
        filter((isHandSet) => isHandSet),
      )
      .subscribe(() => {
        this.drawer.close();
      });
  }

  openHotkeyDialog() {
    this.matDialog.open(HotkeyDialogComponent);
  }
}
