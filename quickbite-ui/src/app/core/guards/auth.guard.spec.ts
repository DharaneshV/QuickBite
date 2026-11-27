import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../features/auth/auth.service';
import { authGuard, roleGuard } from './auth.guard';
import { authInterceptor } from '../interceptors/auth.interceptor';

describe('authGuard, roleGuard, and authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('redirects unauthenticated users to /login with returnUrl', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({ data: {} } as never, { url: '/checkout' } as never)
    );

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fcheckout');
  });

  it('enforces roleGuard for Admin routes', () => {
    localStorage.setItem('quickbite_auth_token', 'token-abc');
    localStorage.setItem(
      'quickbite_auth_user',
      JSON.stringify({ userId: 1, name: 'Cust', email: 'c@test.com', role: 'Customer' })
    );
    localStorage.setItem(
      'quickbite_auth_expires_at',
      new Date(Date.now() + 60_000).toISOString()
    );

    // Re-create AuthService so signal loads from localStorage
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    router = TestBed.inject(Router);

    const guard = roleGuard('Admin');
    const result = TestBed.runInInjectionContext(() =>
      guard({ data: {} } as never, { url: '/admin' } as never)
    );

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });

  it('attaches Bearer token to API requests and logs out on 401', () => {
    const logoutSpy = vi.spyOn(authService, 'logout').mockImplementation(() => undefined);
    vi.spyOn(authService, 'getToken').mockReturnValue('bearer-xyz');

    http.get(`${environment.apiUrl}/orders/my`).subscribe({
      error: () => undefined,
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/orders/my`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer bearer-xyz');

    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    expect(logoutSpy).toHaveBeenCalled();
  });
});
