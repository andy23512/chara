import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { isObservable, of } from 'rxjs';
import { Page } from '../models/page.models';
import { PageLockService } from '../services/page-lock.service';
import { LanguageSettingStore } from '../stores/language-setting.store';
import { pageLockGuard } from './page-lock.guard';

describe('pageLockGuard', () => {
  const HOME = { home: true } as never;
  let canAccess: boolean;
  let override: string | null;
  let open: jasmine.Spy;
  let use: jasmine.Spy;

  function run(page: Page) {
    return TestBed.runInInjectionContext(() =>
      pageLockGuard({ data: { page } } as unknown as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }
  async function resolve(result: unknown) {
    if (isObservable(result)) {
      return await new Promise((r) => (result as any).subscribe((v: unknown) => r(v)));
    }
    return result;
  }

  beforeEach(() => {
    canAccess = false;
    override = null;
    open = jasmine.createSpy('open');
    use = jasmine.createSpy('use').and.callFake(() => of('zh-TW'));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PageLockService,
          useValue: {
            canAccessPage: () => () => canAccess,
            getLockMessageOverride: () => () => override,
          },
        },
        { provide: Router, useValue: { parseUrl: () => HOME } },
        {
          provide: TranslateService,
          useValue: { use, instant: (k: string) => `T:${k}` },
        },
        { provide: MatSnackBar, useValue: { open } },
        { provide: LanguageSettingStore, useValue: { uiLanguage: () => 'zh-TW' } },
      ],
    });
  });

  it('lets the page open when it is not locked', () => {
    canAccess = true;
    expect(run(Page.Adaptation)).toBe(true);
    expect(open).not.toHaveBeenCalled();
  });

  it('sends a locked page to home and explains with its usual message', async () => {
    expect(await resolve(run(Page.Adaptation))).toBe(HOME);
    expect(use).toHaveBeenCalledWith('zh-TW');
    expect(open).toHaveBeenCalledWith('T:nav.page.adaptation.lock-message', undefined, { duration: 5000 });
  });

  it('explains with the override message when there is one', async () => {
    override = 'nav.page.adaptation.all-blocked-lock-message';
    expect(await resolve(run(Page.Adaptation))).toBe(HOME);
    expect(open).toHaveBeenCalledWith(
      'T:nav.page.adaptation.all-blocked-lock-message',
      undefined,
      { duration: 5000 },
    );
  });

  it('uses the page-specific message for other locked pages', async () => {
    await resolve(run(Page.Realization));
    expect(open.calls.mostRecent().args[0]).toBe('T:nav.page.realization.lock-message');
  });

  it('sends a locked page without any message to home silently', () => {
    expect(run(Page.Home)).toBe(HOME);
    expect(open).not.toHaveBeenCalled();
  });
});
