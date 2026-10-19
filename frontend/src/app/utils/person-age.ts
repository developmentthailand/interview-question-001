const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function calculateAge(dateOfBirth: string, currentYear = new Date().getFullYear()): number | null {
  const parts = parseDateOnly(dateOfBirth);
  return parts ? currentYear - parts.year : null;
}

export function formatDateOfBirth(dateOfBirth: string): string {
  const parts = parseDateOnly(dateOfBirth);
  return parts ? `${String(parts.day).padStart(2, '0')}/${String(parts.month).padStart(2, '0')}/${parts.year}` : '—';
}

export function isValidDateOnly(value: string): boolean {
  return parseDateOnly(value) !== null;
}

function parseDateOnly(value: string): { year: number; month: number; day: number } | null {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) {
    return null;
  }

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysByMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > daysByMonth[month - 1]) {
    return null;
  }

  return { year, month, day };
}
