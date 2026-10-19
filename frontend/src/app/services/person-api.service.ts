import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreatePersonRequest, Person } from '../models/person';

@Injectable({ providedIn: 'root' })
export class PersonApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/persons';

  list(): Observable<Person[]> {
    return this.http.get<Person[]>(this.endpoint);
  }

  getById(id: number): Observable<Person> {
    return this.http.get<Person>(`${this.endpoint}/${id}`);
  }

  create(request: CreatePersonRequest): Observable<Person> {
    return this.http.post<Person>(this.endpoint, request);
  }
}
