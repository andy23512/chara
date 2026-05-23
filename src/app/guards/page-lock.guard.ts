import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CanActivateFn, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { map, tap } from 'rxjs';
import { ALL_NAV_LINKS } from '../data/nav-links';
import { Page } from '../models/page.models';
import { PageLockService } from '../services/page-lock.service';
import { LanguageSettingStore } from '../stores/language-setting.store';

export const pageLockGuard: CanActivateFn = (route) => {
  const pageLockService = inject(PageLockService);
  const router = inject(Router);
  const translateService = inject(TranslateService);
  const matSnackBar = inject(MatSnackBar);
  const languageSettingStore = inject(LanguageSettingStore);

  const page: Page = route.data?.['page'];
  const canAccess = pageLockService.canAccessPage(page)();
  if (canAccess) {
    return true;
  }
  const navLink = ALL_NAV_LINKS.find((n) => n.page === page);
  const homeUrlTree = router.parseUrl('/');
  if (navLink?.lockMessage) {
    const message = navLink.lockMessage;
    return translateService.use(languageSettingStore.uiLanguage()).pipe(
      tap(() => {
        matSnackBar.open(translateService.instant(message), undefined, {
          duration: 5000,
        });
      }),
      map(() => homeUrlTree),
    );
  }
  return homeUrlTree;
};
