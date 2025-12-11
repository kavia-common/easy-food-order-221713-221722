import type { FoodCategory, FoodItem } from '@/types'

export const mockCategories: FoodCategory[] = [
  { id: 'pizza', name: 'Pizza' },
  { id: 'burgers', name: 'Burgers' },
  { id: 'drinks', name: 'Drinks' },
]

export const mockItems: FoodItem[] = [
  {
    id: 'pz-margherita',
    name: 'Margherita',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1548365328-9f547fb0953c?q=80&w=600&auto=format&fit=crop',
    description: 'Classic tomato, mozzarella, and basil.',
    categoryId: 'pizza',
  },
  {
    id: 'pz-pepperoni',
    name: 'Pepperoni',
    price: 11.49,
    image: 'https://images.unsplash.com/photo-1542282811-943ef1a977c2?q=80&w=600&auto=format&fit=crop',
    description: 'Spicy pepperoni with mozzarella.',
    categoryId: 'pizza',
  },
  {
    id: 'bg-classic',
    name: 'Classic Burger',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop',
    description: 'Beef patty, lettuce, tomato, and house sauce.',
    categoryId: 'burgers',
  },
  {
    id: 'bg-cheese',
    name: 'Cheeseburger',
    price: 9.49,
    image: 'https://images.unsplash.com/photo-1550547660-9aaf2a0b9f36?q=80&w=600&auto=format&fit=crop',
    description: 'Melted cheddar cheese and pickles.',
    categoryId: 'burgers',
  },
  {
    id: 'dr-cola',
    name: 'Cola',
    price: 1.99,
    image: 'https://images.unsplash.com/photo-1581382575275-97901c2635b7?q=80&w=600&auto=format&fit=crop',
    description: 'Chilled and refreshing.',
    categoryId: 'drinks',
  },
  {
    id: 'dr-icedtea',
    name: 'Iced Tea',
    price: 2.49,
    image: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?q=80&w=600&auto=format&fit=crop',
    description: 'Brewed tea with ice and lemon.',
    categoryId: 'drinks',
  },
]
