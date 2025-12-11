export type AvailabilityStatus = 'in_stock' | 'out_of_stock'

/**
/**
 * Backward-compatible working hours and profile-related types used elsewhere in the app.
 */
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

/**
 * Public customer-facing Item model extended with availability.
 */
export interface Item {
  id: string
  name: string
  description?: string
  price: number
  image: string
  category: string
  rating?: number
  availability?: AvailabilityStatus
}

/**
 * ADMIN payload for creating/updating menu items.
 */
export interface AdminMenuItemEdit {
  name: string
  description: string
  price: number
  image: string
  category: string
  availability: AvailabilityStatus
}
