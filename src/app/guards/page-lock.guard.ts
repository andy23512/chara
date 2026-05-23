import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Page } from '../models/page.models';
import { PageLockService } from '../services/page-lock.service';

export const pageLockGuard: CanActivateFn = (route, state) => {
  const pageLockService = inject(PageLockService);
  const router = inject(Router);
  const canAccess = pageLockService.canAccessPage(
    route.data?.['page'] as Page,
  )();
  return canAccess ? true : router.parseUrl('/');
};
