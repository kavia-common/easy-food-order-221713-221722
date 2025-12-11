export interface WorkingHoursDay {
  // e.g., "monday", "tuesday"
  day: string;
  // 24h format "09:00"
  open?: string | null;
  // 24h format "18:00"
  close?: string | null;
  // explicit closed flag to override times
  isClosed?: boolean;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  // optional geocoordinates if available
  latitude?: number;
  longitude?: number;
}

export interface RestaurantProfile {
  id: string;
  name: string;
  description?: string;
  cuisineTypes?: string[];
  phone?: string;
  email?: string;
  website?: string;
  address: Address;
  workingHours?: WorkingHoursDay[]; // 7 entries preferred
}

export type RestaurantProfileMap = Record<string, RestaurantProfile>;
