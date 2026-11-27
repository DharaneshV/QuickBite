import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService, LoginResponse } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  const sampleResponse: LoginResponse = {
    token: 'jwt-token-123',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    userId: 7,
    name: 'Test User',
    email: 'test@example.com',
    role: 'Customer',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('stores token and user state on login', () => {
    service.login({ email: 'test@example.com', password: 'Password1!' }).subscribe((res) => {
      expect(res.token).toBe('jwt-token-123');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(sampleResponse);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.getToken()).toBe('jwt-token-123');
    expect(service.userRole()).toBe('Customer');
    expect(service.hasRole(['Customer'])).toBe(true);
    expect(service.hasRole(['Admin'])).toBe(false);
  });

  it('registers customer and updates session state', () => {
    service
      .register({ name: 'Test User', email: 'test@example.com', password: 'Password1!' })
      .subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    req.flush(sampleResponse);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.email).toBe('test@example.com');
  });

  it('clears storage and navigates to /login on logout', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    service.login({ email: 'test@example.com', password: 'Password1!' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(sampleResponse);

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
