export type WorkingHoursDay = {
  day: string
  open?: string | null
  close?: string | null
  isClosed?: boolean
}

export type RestaurantAddress = {
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode?: string
  country?: string
  latitude?: number
  longitude?: number
}

export type RestaurantProfile = {
  id: string
  name: string
  description?: string
  cuisineTypes?: string[]
  phone?: string
  email?: string
  website?: string
  address: RestaurantAddress
  workingHours?: WorkingHoursDay[]
}
