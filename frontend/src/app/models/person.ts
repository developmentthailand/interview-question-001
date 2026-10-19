export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
}

export interface CreatePersonRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
}
