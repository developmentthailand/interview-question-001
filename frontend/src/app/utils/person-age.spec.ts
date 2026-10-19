import { calculateAge, formatDateOfBirth } from './person-age';

describe('person date helpers', () => {
  it('calculates age using the exam year-difference rule', () => {
    expect(calculateAge('1985-12-31', 2026)).toBe(41);
  });

  it('formats date-only strings without time-zone conversion', () => {
    expect(formatDateOfBirth('1985-12-31')).toBe('31/12/1985');
  });

  it('returns no age for an invalid date-only value', () => {
    expect(calculateAge('not-a-date', 2026)).toBeNull();
  });
});
