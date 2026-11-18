import { provideTranslateService } from '@ngx-translate/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotkeyDialogComponent } from './hotkey-dialog.component';

describe('HotkeyDialogComponent', () => {
  let component: HotkeyDialogComponent;
  let fixture: ComponentFixture<HotkeyDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotkeyDialogComponent],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(HotkeyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
