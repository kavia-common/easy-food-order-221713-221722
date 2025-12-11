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

/**
 * Minimal info stored for a favorited restaurant (normalized by id).
 */
export type FavoriteRestaurant = {
  id: string
  name: string
  image?: string
  cuisines?: string[]
  rating?: number
}

/**
 * Menu item model.
 */
export type NutritionFacts = {
  calories: number
  protein: number // grams
  carbs: number // grams
  fat: number // grams
  fiber?: number // grams
  sugar?: number // grams
  sodium?: number // mg
  allergens?: string[]
  tags?: string[] // e.g., ['keto','veg','gluten_free']
}

export type FoodItem = {
  id: string
  name: string
  price: number
  image: string
  description?: string
  categoryId: string
  nutrition?: NutritionFacts
}

export type HealthFilter = 'low_calorie' | 'keto' | 'high_protein' | 'low_carb'

/**
 * Minimal info stored for a favorited item (normalized by id).
 */
export type FavoriteItem = {
  id: string
  name: string
  image?: string
  price?: number
  restaurantId?: string
}

export type CartLine = {
  id: string
  name: string
  price: number
  image?: string
  qty: number
}

/**
 * Enriched totals snapshot from cart for display and checkout.
 */
export type CartTotals = {
  subtotal: number
  discount: number
  tax: number
  total: number
}

export type FulfillmentType = 'delivery' | 'pickup'

export type Address = {
  name: string
  phone: string
  street: string
  city: string
  state: string
  zip: string
  notes?: string
}

export type PaymentMethod = 'cod' | 'card' | 'upi'

export type CardDetails = {
  cardholder: string
  cardNumber: string
  expMonth: string
  expYear: string
  cvv: string
}

export type UpiWalletDetails = {
  handle: string // e.g., user@upi or wallet id
}

export type OrderItemLine = { id: string; qty: number }

export type OrderPayload = {
  fulfillment: FulfillmentType
  address?: Address // required when fulfillment=delivery
  pickup?: {
    name: string
    phone: string
  } // required when fulfillment=pickup
  items: OrderItemLine[]
  payment: {
    method: PaymentMethod
    card?: CardDetails
    upi?: UpiWalletDetails
  }
  notes?: string
  // snapshot totals to help backend verify amounts (optional)
  totals?: CartTotals
}

export type OrderResponse = {
  id: string
  status: 'success' | 'failed'
  etaMin?: number
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

 // Re-export order-related domain models
export * from './orders'
export * from './reviews'
export * from './subscriptions'
export * from './voice'
