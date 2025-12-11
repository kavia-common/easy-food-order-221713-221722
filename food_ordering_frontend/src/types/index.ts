export type FoodCategory = {
  id: string
  name: string
}

/**
 * Restaurant model for browsing nearby restaurants.
 */
export type Restaurant = {
  id: string
  name: string
  cuisines: string[]
  rating: number           // 0-5
  priceLevel: 1 | 2 | 3 | 4
  distanceKm: number
  image?: string
  etaMin?: number
  isOpen: boolean
}

export type FoodItem = {
  id: string
  name: string
  price: number
  image: string
  description?: string
  categoryId: string
}

export type CartLine = {
  id: string
  name: string
  price: number
  image?: string
  qty: number
}

export type OrderPayload = {
  customer: {
    name: string
    email?: string
    phone?: string
    address: string
  }
  items: Array<{ id: string; qty: number }>
  paymentMethod: 'card' | 'cod'
  notes?: string
}

export type OrderResponse = {
  id: string
  status: 'success' | 'failed'
}

/**
 * Query options for fetching restaurants.
 */
export type RestaurantQuery = {
  cuisine?: string
  sortBy?: 'rating' | 'price' | 'distance'
  sortDir?: 'asc' | 'desc'
  // free-form, can be extended for geo or address
  location?: string
}
