import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { KeyboardLayoutSettingStore } from 'src/app/stores/keyboard-layout-setting.store';
import { OsKeyboardLayoutSettingPanelContentComponent } from './os-keyboard-layout-setting-panel-content.component';

describe('OsKeyboardLayoutSettingPanelContentComponent', () => {
  let fixture: ComponentFixture<OsKeyboardLayoutSettingPanelContentComponent>;
  let component: OsKeyboardLayoutSettingPanelContentComponent;
  let store: InstanceType<typeof KeyboardLayoutSettingStore>;

  const link = () =>
    fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
  const resetButton = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    )[1] as HTMLButtonElement;
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  const clickEvent = () => {
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation').and.callThrough();
    return event;
  };

  beforeEach(async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [OsKeyboardLayoutSettingPanelContentComponent],
      providers: [provideTranslateService()],
    }).compileComponents();
    store = TestBed.inject(KeyboardLayoutSettingStore);
    fixture = TestBed.createComponent(
      OsKeyboardLayoutSettingPanelContentComponent,
    );
    component = fixture.componentInstance;
    await settle();
  });

  describe('layout list', () => {
    it('has every layout when nothing is searched', () => {
      expect(component.filteredKeyboardLayouts().length).toBe(
        store.entities().length,
      );
      expect(store.entities().length).toBeGreaterThan(10);
    });

    it('keeps the layouts whose name has the search text, ignoring case', () => {
      const name = store.entities()[3].name;
      component.keyboardLayoutSearchQuery.set(name.toUpperCase());
      const found = component.filteredKeyboardLayouts();
      expect(found.some((k) => k.name === name)).toBe(true);
      expect(
        found.every((k) => k.name.toLowerCase().includes(name.toLowerCase())),
      ).toBe(true);
    });

    it('matches part of a name', () => {
      const name = store.entities()[3].name;
      component.keyboardLayoutSearchQuery.set(name.slice(1, 5).toLowerCase());
      expect(
        component.filteredKeyboardLayouts().some((k) => k.name === name),
      ).toBe(true);
    });

    it('is empty when no name matches', () => {
      component.keyboardLayoutSearchQuery.set('zzzz-no-such-layout');
      expect(component.filteredKeyboardLayouts()).toEqual([]);
    });

    it('is everything again when the search is cleared', () => {
      component.keyboardLayoutSearchQuery.set('zzzz-no-such-layout');
      component.keyboardLayoutSearchQuery.set('');
      expect(component.filteredKeyboardLayouts().length).toBe(
        store.entities().length,
      );
    });
  });

  describe('selection', () => {
    it('starts with the US layout', () => {
      expect(component.selectedKeyboardLayoutId()).toBe('us');
      expect(component.keyboardLayout().id).toBe('us');
    });

    it('writes the chosen layout to the store', () => {
      const other = store.entities().find((k) => k.id !== 'us')!;
      component.setSelectedKeyboardLayoutId(other.id);
      expect(store.selectedId()).toBe(other.id);
      expect(component.keyboardLayout().id).toBe(other.id);
    });
  });

  describe('reference link', () => {
    it('points to the reference page of the selected layout, in a new tab', () => {
      expect(link().getAttribute('href')).toBe(
        component.keyboardLayout().reference,
      );
      expect(link().target).toBe('_blank');
      expect(link().rel).toContain('noopener');
    });

    it('follows the selected layout', async () => {
      const other = store
        .entities()
        .find((k) => k.reference !== store.selectedEntity().reference)!;
      component.setSelectedKeyboardLayoutId(other.id);
      await settle();
      expect(link().getAttribute('href')).toBe(other.reference);
    });

    it('does not let the click reach the select below it', () => {
      const event = clickEvent();
      component.onOpenReferenceButtonClick(event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('reset button', () => {
    it('is disabled while the US layout is selected', () => {
      expect(resetButton().disabled).toBe(true);
    });

    it('is enabled for any other layout', async () => {
      component.setSelectedKeyboardLayoutId(
        store.entities().find((k) => k.id !== 'us')!.id,
      );
      await settle();
      expect(resetButton().disabled).toBe(false);
    });

    it('brings back the US layout', async () => {
      component.setSelectedKeyboardLayoutId(
        store.entities().find((k) => k.id !== 'us')!.id,
      );
      await settle();
      resetButton().click();
      await settle();
      expect(store.selectedId()).toBe('us');
      expect(resetButton().disabled).toBe(true);
    });

    it('does not let the click reach the select below it', () => {
      const event = clickEvent();
      component.onResetButtonClick(event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });
});
