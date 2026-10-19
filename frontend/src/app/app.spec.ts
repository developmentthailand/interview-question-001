import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('loads people from the API', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const request = TestBed.inject(HttpTestingController).expectOne({
      method: 'GET',
      url: '/api/persons',
    });
    request.flush([]);
  });
});
