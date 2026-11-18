import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MatTooltip } from '@angular/material/tooltip';
import { Page } from 'src/app/models/page.models';
import { PageLockService } from 'src/app/services/page-lock.service';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { NavComponent } from './nav.component';

describe('NavComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [
        NoopAnimationsModule,
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatSidenavModule,
        MatToolbarModule,
        NavComponent,
      ],
      providers: [provideRouter([]), provideTranslateService()],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });

  describe('lock tooltips', () => {
    const tooltipOf = (ariaLabelKey: string): string => {
      const el = fixture.debugElement
        .queryAll(By.directive(MatTooltip))
        .find((d) => d.nativeElement.getAttribute('aria-label') === ariaLabelKey)!;
      return el.injector.get(MatTooltip).message;
    };
    const ADAPT = 'nav.page.adapt.aria-label';
    let enabled: ReturnType<typeof signal<boolean>>;
    let override: ReturnType<typeof signal<string | null>>;

    beforeEach(() => {
      enabled = signal(false);
      override = signal<string | null>(null);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [NavComponent],
        providers: [
          provideRouter([]),
          provideTranslateService(),
          {
            provide: PageLockService,
            useValue: {
              canAccessPage: () => enabled,
              getLockMessageOverride: (page: Page) =>
                page === Page.Adaptation ? override : signal(null),
            },
          },
        ],
      });
      fixture = TestBed.createComponent(NavComponent);
      fixture.detectChanges();
    });

    it('shows the usual lock message for a locked page', () => {
      expect(tooltipOf(ADAPT)).toBe('nav.page.adaptation.lock-message');
    });

    it('shows the override message when the page is locked and there is one', () => {
      override.set('nav.page.adaptation.all-blocked-lock-message');
      fixture.detectChanges();
      expect(tooltipOf(ADAPT)).toBe('nav.page.adaptation.all-blocked-lock-message');
    });

    it('shows the normal tooltip once the page is open, ignoring the override', () => {
      override.set('nav.page.adaptation.all-blocked-lock-message');
      enabled.set(true);
      fixture.detectChanges();
      expect(tooltipOf(ADAPT)).toBe('nav.page.adaptation.tooltip');
    });
  });
});
