import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ProfileService } from '../profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly user = this.authService.currentUser;
  readonly isOnboarding = signal(false);
  readonly savedMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    phoneNumber: [
      '',
      [Validators.required, Validators.pattern(/^[+]?[\d\s\-()]{8,16}$/)],
    ],
    addressLine: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    postalCode: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    deliveryNotes: ['', [Validators.maxLength(250)]],
  });

  ngOnInit(): void {
    const currentUser = this.user();
    if (!currentUser) {
      return;
    }

    const existing = this.profileService.getProfile(currentUser.userId);
    this.isOnboarding.set(!this.profileService.isProfileComplete(currentUser.userId));

    this.form.patchValue({
      fullName: existing?.fullName ?? currentUser.name,
      phoneNumber: existing?.phoneNumber ?? '',
      addressLine: existing?.addressLine ?? '',
      city: existing?.city ?? '',
      postalCode: existing?.postalCode ?? '',
      deliveryNotes: existing?.deliveryNotes ?? '',
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const currentUser = this.user();
    if (!currentUser) {
      return;
    }

    const wasOnboarding = this.isOnboarding();
    this.profileService.saveProfile(currentUser.userId, this.form.getRawValue());
    this.isOnboarding.set(false);
    this.savedMessage.set('Profile details saved successfully.');

    if (wasOnboarding) {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      const target =
        returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')
          ? returnUrl
          : '/products';
      void this.router.navigateByUrl(target);
    }
  }
}
