import { Pipe, PipeTransform } from '@angular/core';
import { formatDateOfBirth } from './person-age';

@Pipe({ name: 'dateOnlyDisplay', standalone: true, pure: true })
export class DateOnlyDisplayPipe implements PipeTransform {
  transform(value: string): string {
    return formatDateOfBirth(value);
  }
}
