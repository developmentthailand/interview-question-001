import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreatePersonRequest, Person } from '../models/person';
import { PersonDirectory } from './person-directory';

const samplePerson: Person = {
  id: 7,
  firstName: 'Mali',
  lastName: 'Sukjai',
  dateOfBirth: '1985-12-31',
  address: 'Bangkok',
};

describe('PersonDirectory', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonDirectory],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('shows the Thai directory heading and Add action', () => {
    const fixture = createDirectory([]);

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('รายชื่อบุคลากร');
    expect(buttonWithText(fixture, 'เพิ่มรายชื่อ')).toBeTruthy();
  });

  it('shows the required columns and View action', () => {
    const fixture = createDirectory([samplePerson]);
    const root = fixture.nativeElement as HTMLElement;
    const headings = Array.from(root.querySelectorAll('thead th'))
      .map((heading) => heading.textContent?.trim());

    expect(headings).toEqual(['รหัส', 'ชื่อ-นามสกุล', 'ที่อยู่', 'วันเกิด', 'อายุ', 'รายละเอียด']);
    expect(fixture.nativeElement.querySelector('[data-action="view"]')?.textContent).toContain('ดูข้อมูล');
    expect(fixture.nativeElement.querySelector('tbody tr')?.textContent).toContain('31/12/1985');
    expect(fixture.nativeElement.querySelector('tbody tr')?.textContent).toContain(String(new Date().getFullYear() - 1985));
  });

  it('shows a clear empty state when there are no people', () => {
    const fixture = createDirectory([]);

    expect(fixture.nativeElement.querySelector('[data-state="empty"]')?.textContent).toContain('ยังไม่มีข้อมูล');
  });

  it('shows an API error and can retry loading', () => {
    const fixture = createDirectoryWithoutFlushing();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/persons').flush({ title: 'Unavailable' }, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('ไม่สามารถโหลดรายชื่อ');
    buttonWithText(fixture, 'ลองโหลดอีกครั้ง')?.click();
    http.expectOne('/api/persons').flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('opens the Add dialog with all four required fields', () => {
    const fixture = createDirectory([]);
    buttonWithText(fixture, 'เพิ่มรายชื่อ')?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#firstName')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#lastName')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#dateOfBirth')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#address')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="age-preview"]')?.textContent).toContain('ระบุวันเกิด');
  });

  it('previews age using the birth year difference', () => {
    const fixture = openAddDialog(createDirectory([]));
    setField(fixture, '#dateOfBirth', '1985-12-31');

    expect(fixture.nativeElement.querySelector('[data-testid="age-preview"]')?.textContent)
      .toContain(`${new Date().getFullYear() - 1985} ปี`);
  });

  it('shows required-field feedback and disables Save for invalid input', () => {
    const fixture = openAddDialog(createDirectory([]));
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#first-name-error')?.textContent).toContain('กรุณากรอกชื่อ');
    expect(buttonWithText(fixture, 'บันทึก')?.hasAttribute('disabled')).toBe(true);
  });

  it('appends the saved record exactly once', () => {
    const fixture = openAddDialog(createDirectory([]));
    fillValidForm(fixture);
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    const request = TestBed.inject(HttpTestingController).expectOne('/api/persons');
    expect(request.request.method).toBe('POST');
    expect(request.request.body as CreatePersonRequest).toEqual({
      firstName: 'Mali',
      lastName: 'Sukjai',
      dateOfBirth: '1985-12-31',
      address: 'Bangkok',
    });
    request.flush({ ...samplePerson, id: 8 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
    expect(fixture.nativeElement.querySelector('tbody tr')?.textContent).toContain('Mali Sukjai');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('disables repeat submission while the create request is pending', () => {
    const fixture = openAddDialog(createDirectory([]));
    fillValidForm(fixture);
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    const pending = TestBed.inject(HttpTestingController).match({ method: 'POST', url: '/api/persons' });
    expect(buttonWithText(fixture, 'กำลังบันทึก')?.hasAttribute('disabled')).toBe(true);
    expect(pending).toHaveLength(1);
    pending[0].flush({ ...samplePerson, id: 8 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('keeps the Add dialog open and shows an error when saving fails', () => {
    const fixture = openAddDialog(createDirectory([]));
    fillValidForm(fixture);
    (fixture.nativeElement.querySelector('form') as HTMLFormElement)
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    TestBed.inject(HttpTestingController).expectOne('/api/persons')
      .flush({ title: 'Save failed', detail: 'Please retry.' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Please retry.');
  });

  it('cancels without sending a create request', () => {
    const fixture = openAddDialog(createDirectory([]));
    buttonWithText(fixture, 'ยกเลิก')?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    TestBed.inject(HttpTestingController).expectNone((request) => request.method === 'POST');
  });

  it('loads a read-only View dialog and closes it', () => {
    const fixture = createDirectory([samplePerson]);
    (fixture.nativeElement.querySelector('[data-action="view"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/persons/7').flush(samplePerson);
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('Mali');
    expect(dialog.textContent).toContain('31/12/1985');
    expect(dialog.querySelector('input, textarea')).toBeNull();
    buttonWithText(fixture, 'ปิด')?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('closes on Escape and returns focus to the opening control', () => {
    const fixture = createDirectory([]);
    const addButton = buttonWithText(fixture, 'เพิ่มรายชื่อ') as HTMLButtonElement;
    addButton.focus();
    addButton.click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    dialog.dispatchEvent(new Event('cancel', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(addButton);
  });
});

function createDirectory(people: Person[] = []): ComponentFixture<PersonDirectory> {
  const fixture = createDirectoryWithoutFlushing();
  TestBed.inject(HttpTestingController).expectOne('/api/persons').flush(people);
  fixture.detectChanges();
  return fixture;
}

function createDirectoryWithoutFlushing(): ComponentFixture<PersonDirectory> {
  const fixture = TestBed.createComponent(PersonDirectory);
  fixture.detectChanges();
  return fixture;
}

function openAddDialog(fixture: ComponentFixture<PersonDirectory>): ComponentFixture<PersonDirectory> {
  buttonWithText(fixture, 'เพิ่มรายชื่อ')?.click();
  fixture.detectChanges();
  return fixture;
}

function buttonWithText(fixture: ComponentFixture<PersonDirectory>, text: string): HTMLButtonElement | null {
  const root = fixture.nativeElement as HTMLElement;
  return Array.from(root.querySelectorAll('button'))
    .find((button) => button.textContent?.includes(text)) ?? null;
}

function setField(fixture: ComponentFixture<PersonDirectory>, selector: string, value: string): void {
  const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  fixture.detectChanges();
}

function fillValidForm(fixture: ComponentFixture<PersonDirectory>): void {
  setField(fixture, '#firstName', 'Mali');
  setField(fixture, '#lastName', 'Sukjai');
  setField(fixture, '#dateOfBirth', '1985-12-31');
  setField(fixture, '#address', 'Bangkok');
}
