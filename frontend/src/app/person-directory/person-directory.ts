import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { PersonDialog } from '../person-dialog/person-dialog';
import { DateOnlyDisplayPipe } from '../utils/date-only-display.pipe';
import { calculateAge } from '../utils/person-age';
import { CreatePersonRequest, Person } from '../models/person';
import { PersonApiService } from '../services/person-api.service';

@Component({
  imports: [DateOnlyDisplayPipe, PersonDialog],
  selector: 'app-person-directory',
  styleUrl: './person-directory.scss',
  templateUrl: './person-directory.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonDirectory implements OnInit {
  private readonly personApi = inject(PersonApiService);
  private readonly destroyRef = inject(DestroyRef);
  private detailSubscription?: Subscription;
  readonly people = signal<Person[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly dialogOpen = signal(false);
  readonly dialogMode = signal<'add' | 'view'>('add');
  readonly selectedPerson = signal<Person | null>(null);
  readonly detailLoading = signal(false);
  readonly saving = signal(false);
  readonly dialogError = signal<string | null>(null);
  readonly currentYear = new Date().getFullYear();

  ngOnInit(): void {
    this.loadPeople();
  }

  loadPeople(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.personApi.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (people) => {
        this.people.set(people);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('ไม่สามารถโหลดรายชื่อได้ กรุณาลองอีกครั้ง');
        this.loading.set(false);
      },
    });
  }

  openAdd(): void {
    this.detailSubscription?.unsubscribe();
    this.dialogMode.set('add');
    this.selectedPerson.set(null);
    this.dialogError.set(null);
    this.detailLoading.set(false);
    this.dialogOpen.set(true);
  }

  openView(person: Person): void {
    this.detailSubscription?.unsubscribe();
    this.dialogMode.set('view');
    this.selectedPerson.set(null);
    this.dialogError.set(null);
    this.detailLoading.set(true);
    this.dialogOpen.set(true);
    this.detailSubscription = this.personApi.getById(person.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (selectedPerson) => {
          this.selectedPerson.set(selectedPerson);
          this.detailLoading.set(false);
        },
        error: (error: unknown) => {
          this.detailLoading.set(false);
          this.dialogError.set(readApiError(error, 'ไม่สามารถโหลดรายละเอียดได้ กรุณาลองอีกครั้ง'));
        },
      });
  }

  savePerson(request: CreatePersonRequest): void {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.dialogError.set(null);
    this.personApi.create(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (createdPerson) => {
          this.people.update((people) => [...people, createdPerson]);
          this.closeDialog();
        },
        error: (error: unknown) => {
          this.dialogError.set(readApiError(error, 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง'));
        },
      });
  }

  dismissDialog(): void {
    if (this.saving()) {
      return;
    }

    this.closeDialog();
  }

  ageOf(dateOfBirth: string): number | null {
    return calculateAge(dateOfBirth, this.currentYear);
  }

  private closeDialog(): void {
    this.detailSubscription?.unsubscribe();
    this.detailSubscription = undefined;
    this.dialogOpen.set(false);
    this.selectedPerson.set(null);
    this.detailLoading.set(false);
    this.dialogError.set(null);
  }
}

function readApiError(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse && error.error && typeof error.error === 'object') {
    const body = error.error as Record<string, unknown>;
    if (typeof body['detail'] === 'string' && body['detail'].trim()) {
      return body['detail'];
    }

    if (typeof body['title'] === 'string' && body['title'].trim()) {
      return body['title'];
    }
  }

  return fallback;
}
