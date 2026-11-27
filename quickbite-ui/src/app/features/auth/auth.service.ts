import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  userId: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse extends AuthUser {
  token: string;
  expiresAt: string;
}

const TOKEN_KEY = 'quickbite_auth_token';
const USER_KEY = 'quickbite_auth_user';
const EXPIRES_KEY = 'quickbite_auth_expires_at';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly userSignal = signal<AuthUser | null>(this.readStoredUser());

  readonly currentUser = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null && this.getToken() !== null);
  readonly userRole = computed(() => this.userSignal()?.role ?? null);
  readonly isAdmin = computed(() => this.hasRole(['Admin']));

  register(payload: RegisterRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/register`, payload)
      .pipe(tap((res) => this.saveSession(res)));
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, payload)
      .pipe(tap((res) => this.saveSession(res)));
  }

  logout(redirectToLogin = true): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    this.userSignal.set(null);

    if (redirectToLogin) {
      this.router.navigate(['/login']);
    }
  }

  getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return null;
    }

    const expiresAt = localStorage.getItem(EXPIRES_KEY);
    if (expiresAt && Date.parse(expiresAt) <= Date.now()) {
      this.logout(false);
      return null;
    }

    return token;
  }

  hasRole(roles: readonly string[]): boolean {
    const role = this.userSignal()?.role;
    if (!role || this.getToken() === null) {
      return false;
    }

    return roles.some((r) => r.toLowerCase() === role.toLowerCase());
  }

  private saveSession(res: LoginResponse): void {
    const user: AuthUser = {
      userId: res.userId,
      name: res.name,
      email: res.email,
      role: res.role,
    };

    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(EXPIRES_KEY, res.expiresAt);
    this.userSignal.set(user);
  }

  private readStoredUser(): AuthUser | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);
    const expiresAt = localStorage.getItem(EXPIRES_KEY);

    if (!token || !rawUser) {
      return null;
    }

    if (expiresAt && Date.parse(expiresAt) <= Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(EXPIRES_KEY);
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(EXPIRES_KEY);
      return null;
    }
  }
}
