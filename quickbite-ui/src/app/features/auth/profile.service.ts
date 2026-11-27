import { Injectable } from '@angular/core';

export interface CustomerProfile {
  fullName: string;
  phoneNumber: string;
  addressLine: string;
  city: string;
  postalCode: string;
  deliveryNotes?: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private storageKey(userId: number): string {
    return `quickbite_profile_${userId}`;
  }

  getProfile(userId: number): CustomerProfile | null {
    const raw = localStorage.getItem(this.storageKey(userId));
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as CustomerProfile;
    } catch {
      localStorage.removeItem(this.storageKey(userId));
      return null;
    }
  }

  saveProfile(
    userId: number,
    data: Omit<CustomerProfile, 'updatedAt'>
  ): CustomerProfile {
    const profile: CustomerProfile = {
      fullName: data.fullName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      addressLine: data.addressLine.trim(),
      city: data.city.trim(),
      postalCode: data.postalCode.trim(),
      deliveryNotes: data.deliveryNotes?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(this.storageKey(userId), JSON.stringify(profile));
    return profile;
  }

  isProfileComplete(userId: number): boolean {
    const profile = this.getProfile(userId);
    if (!profile) {
      return false;
    }

    return Boolean(
      profile.fullName?.trim() &&
        profile.phoneNumber?.trim() &&
        profile.addressLine?.trim() &&
        profile.city?.trim() &&
        profile.postalCode?.trim()
    );
  }
}
