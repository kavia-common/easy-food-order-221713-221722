export type FoodCategory = {
  id: string
  name: string
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
