import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CreatePersonRequest, Person } from '../models/person';
import { DateOnlyDisplayPipe } from '../utils/date-only-display.pipe';
import { calculateAge, isValidDateOnly } from '../utils/person-age';

type DialogMode = 'add' | 'view';
type PersonForm = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  dateOfBirth: FormControl<string>;
  address: FormControl<string>;
}>;

const nonWhitespace: ValidatorFn = (control): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim().length > 0 ? null : { required: true };

const validNonFutureDate: ValidatorFn = (control): ValidationErrors | null => {
  const value = control.value;
  if (typeof value !== 'string' || !isValidDateOnly(value)) {
    return value ? { date: true } : null;
  }

  return value <= localDateOnlyToday() ? null : { futureDate: true };
};

@Component({
  imports: [DateOnlyDisplayPipe, ReactiveFormsModule],
  selector: 'app-person-dialog',
  styleUrl: './person-dialog.scss',
  templateUrl: './person-dialog.html',
})
export class PersonDialog implements AfterViewInit, OnDestroy {
  @Input({ required: true }) mode!: DialogMode;
  @Input() person: Person | null = null;
  @Input() detailLoading = false;
  @Input() saving = false;
  @Input() errorMessage: string | null = null;
  @Output() readonly savePerson = new EventEmitter<CreatePersonRequest>();
  @Output() readonly dismiss = new EventEmitter<void>();
  @ViewChild('dialogElement', { static: true }) private readonly dialogElement!: ElementRef<HTMLDialogElement>;

  readonly currentYear = new Date().getFullYear();
  readonly today = localDateOnlyToday();
  readonly form: PersonForm = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [nonWhitespace, Validators.maxLength(80)] }),
    lastName: new FormControl('', { nonNullable: true, validators: [nonWhitespace, Validators.maxLength(80)] }),
    dateOfBirth: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, validNonFutureDate],
    }),
    address: new FormControl('', { nonNullable: true, validators: [nonWhitespace, Validators.maxLength(300)] }),
  });

  private previousFocus: HTMLElement | null = null;

  get agePreview(): number | null {
    return calculateAge(this.form.controls.dateOfBirth.value, this.currentYear);
  }

  ngAfterViewInit(): void {
    const dialog = this.dialogElement.nativeElement;
    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    dialog.querySelector<HTMLElement>('[autofocus]')?.focus();
  }

  ngOnDestroy(): void {
    const dialog = this.dialogElement.nativeElement;
    if (dialog.open) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
    }

    this.previousFocus?.focus();
  }

  hasError(field: keyof PersonForm['controls'], error: string): boolean {
    const control = this.form.controls[field];
    return control.touched && control.hasError(error);
  }

  submit(): void {
    if (this.saving) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    this.savePerson.emit({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      dateOfBirth: values.dateOfBirth,
      address: values.address.trim(),
    });
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.dismiss.emit();
  }

  onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialogElement.nativeElement) {
      this.dismiss.emit();
    }
  }

  ageOf(dateOfBirth: string): number | null {
    return calculateAge(dateOfBirth, this.currentYear);
  }
}

function localDateOnlyToday(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}
