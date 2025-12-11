import type { FoodCategory, FoodItem, Restaurant } from '@/types'
import type { RestaurantProfile, WorkingHoursDay } from '@/types/restaurantProfile'

/**
 * Per-restaurant categories to include starters, biryani, desserts etc.
 */
const restaurantCategories: Record<string, FoodCategory[]> = {
  r1: [
    { id: 'starters', name: 'Starters' },
    { id: 'biryani', name: 'Biryani' },
    { id: 'curries', name: 'Curries' },
    { id: 'breads', name: 'Breads' },
    { id: 'desserts', name: 'Desserts' },
    { id: 'drinks', name: 'Drinks' },
  ],
  r2: [
    { id: 'appetizers', name: 'Appetizers' },
    { id: 'noodles', name: 'Noodles' },
    { id: 'rice', name: 'Rice' },
    { id: 'wok', name: 'Wok Specials' },
    { id: 'desserts', name: 'Desserts' },
    { id: 'drinks', name: 'Drinks' },
  ],
  r3: [
    { id: 'starters', name: 'Starters' },
    { id: 'pizza', name: 'Pizza' },
    { id: 'pasta', name: 'Pasta' },
    { id: 'mains', name: 'Mains' },
    { id: 'desserts', name: 'Desserts' },
    { id: 'drinks', name: 'Drinks' },
  ],
  r4: [
    { id: 'starters', name: 'Starters' },
    { id: 'sushi', name: 'Sushi' },
    { id: 'ramen', name: 'Ramen' },
    { id: 'donburi', name: 'Donburi' },
    { id: 'desserts', name: 'Desserts' },
    { id: 'drinks', name: 'Drinks' },
  ],
  r5: [
    { id: 'starters', name: 'Starters' },
    { id: 'tacos', name: 'Tacos' },
    { id: 'burritos', name: 'Burritos' },
    { id: 'mains', name: 'Mains' },
    { id: 'desserts', name: 'Desserts' },
    { id: 'drinks', name: 'Drinks' },
  ],
  r6: [
    { id: 'starters', name: 'Starters' },
    { id: 'meze', name: 'Meze' },
    { id: 'grill', name: 'Grill' },
    { id: 'mains', name: 'Mains' },
    { id: 'desserts', name: 'Desserts' },
    { id: 'drinks', name: 'Drinks' },
  ],
}

/**
 * Global default categories for home page menu browsing.
 */
export const mockCategories: FoodCategory[] = [
  { id: 'pizza', name: 'Pizza' },
  { id: 'burgers', name: 'Burgers' },
  { id: 'drinks', name: 'Drinks' },
]

/**
 * Default items for home page quick browse.
 */
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

/**
 * Mock restaurants dataset for the Restaurants browse page.
 */
export const mockRestaurants: Restaurant[] = [
  {
    id: 'r1',
    name: 'Bombay Spice',
    cuisines: ['Indian'],
    rating: 4.6,
    priceLevel: 2,
    distanceKm: 1.2,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
    etaMin: 30,
    isOpen: true,
  },
  {
    id: 'r2',
    name: 'Dragon Wok',
    cuisines: ['Chinese', 'Asian'],
    rating: 4.4,
    priceLevel: 1,
    distanceKm: 2.4,
    image: 'https://images.unsplash.com/photo-1526312426976-593cba07da20?q=80&w=800&auto=format&fit=crop',
    etaMin: 25,
    isOpen: true,
  },
  {
    id: 'r3',
    name: 'Trattoria Bella',
    cuisines: ['Italian', 'Pizza'],
    rating: 4.8,
    priceLevel: 3,
    distanceKm: 3.8,
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop',
    etaMin: 40,
    isOpen: true,
  },
  {
    id: 'r4',
    name: 'Sushi Coast',
    cuisines: ['Japanese'],
    rating: 4.7,
    priceLevel: 3,
    distanceKm: 5.2,
    image: 'https://images.unsplash.com/photo-1540162012009-69d6a3d733de?q=80&w=800&auto=format&fit=crop',
    etaMin: 45,
    isOpen: false,
  },
  {
    id: 'r5',
    name: 'Taco Mar',
    cuisines: ['Mexican'],
    rating: 4.2,
    priceLevel: 1,
    distanceKm: 0.9,
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=800&auto=format&fit=crop',
    etaMin: 20,
    isOpen: true,
  },
  {
    id: 'r6',
    name: 'Mediterraneo',
    cuisines: ['Mediterranean', 'Greek'],
    rating: 4.5,
    priceLevel: 2,
    distanceKm: 4.3,
    image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=800&auto=format&fit=crop',
    etaMin: 35,
    isOpen: true,
  },
]

// Working hours template
const defaultWeek: WorkingHoursDay[] = [
  { day: 'monday', open: '10:00', close: '21:00' },
  { day: 'tuesday', open: '10:00', close: '21:00' },
  { day: 'wednesday', open: '10:00', close: '21:00' },
  { day: 'thursday', open: '10:00', close: '22:00' },
  { day: 'friday', open: '10:00', close: '22:00' },
  { day: 'saturday', open: '11:00', close: '22:00' },
  { day: 'sunday', open: '11:00', close: '18:00' },
]

// Mock profiles mapped by id
export const mockRestaurantProfiles: Record<string, RestaurantProfile> = {
  r1: {
    id: 'r1',
    name: 'Bombay Spice',
    description: 'Spirited Indian cuisine with classics and modern twists.',
    cuisineTypes: ['Indian'],
    phone: '+1 (555) 100-0001',
    email: 'hi@bombayspice.example.com',
    website: 'https://bombayspice.example.com',
    address: { line1: '101 Curry Ln', city: 'Flavortown', state: 'CA', postalCode: '94000', country: 'USA' },
    workingHours: defaultWeek,
  },
  r2: {
    id: 'r2',
    name: 'Dragon Wok',
    description: 'Wok-fired flavors and bold recipes from across China.',
    cuisineTypes: ['Chinese', 'Asian'],
    phone: '+1 (555) 100-0002',
    email: 'contact@dragonwok.example.com',
    website: 'https://dragonwok.example.com',
    address: { line1: '22 Bamboo St', city: 'Lotus City', state: 'WA', postalCode: '98101', country: 'USA' },
    workingHours: defaultWeek,
  },
  r3: {
    id: 'r3',
    name: 'Trattoria Bella',
    description: 'Hearty Italian fare, pizza and pasta made daily.',
    cuisineTypes: ['Italian', 'Pizza'],
    phone: '+1 (555) 100-0003',
    email: 'hello@trattoriabella.example.com',
    website: 'https://trattoriabella.example.com',
    address: { line1: '5 Roma Ave', city: 'Old Port', state: 'NY', postalCode: '10001', country: 'USA' },
    workingHours: defaultWeek,
  },
  r4: {
    id: 'r4',
    name: 'Sushi Coast',
    description: 'Traditional sushi with seasonal fish and Japanese staples.',
    cuisineTypes: ['Japanese'],
    phone: '+1 (555) 100-0004',
    email: 'info@sushicoast.example.com',
    website: 'https://sushicoast.example.com',
    address: { line1: '88 Sakura St', city: 'Azure Bay', state: 'WA', postalCode: '98001', country: 'USA' },
    workingHours: [
      { day: 'monday', isClosed: true },
      { day: 'tuesday', open: '11:00', close: '21:00' },
      { day: 'wednesday', open: '11:00', close: '21:00' },
      { day: 'thursday', open: '11:00', close: '22:00' },
      { day: 'friday', open: '11:00', close: '22:00' },
      { day: 'saturday', open: '12:00', close: '22:00' },
      { day: 'sunday', open: '12:00', close: '20:00' },
    ],
  },
  r5: {
    id: 'r5',
    name: 'Taco Mar',
    description: 'Casual coastal taqueria serving beloved Mexican dishes.',
    cuisineTypes: ['Mexican'],
    phone: '+1 (555) 100-0005',
    email: 'team@tacomar.example.com',
    website: 'https://tacomar.example.com',
    address: { line1: '7 Playa Rd', city: 'Sol City', state: 'CA', postalCode: '94102', country: 'USA' },
    workingHours: defaultWeek,
  },
  r6: {
    id: 'r6',
    name: 'Mediterraneo',
    description: 'Greek and Mediterranean classics with fresh ingredients.',
    cuisineTypes: ['Mediterranean', 'Greek'],
    phone: '+1 (555) 100-0006',
    email: 'hello@mediterraneo.example.com',
    website: 'https://mediterraneo.example.com',
    address: { line1: '33 Olive Grove', city: 'Athena', state: 'IL', postalCode: '60601', country: 'USA' },
    workingHours: defaultWeek,
  },
}

// Helpers to read mock profile data
export function getMockProfileById(id: string): RestaurantProfile | undefined {
  return mockRestaurantProfiles[id]
}

/**
 * Per-restaurant item lists with categories and rating fields for detail view.
 */
const restaurantItems: Record<string, FoodItem[]> = {
  r1: [
    { id: 'r1-starter-samosa', name: 'Samosa', price: 4.5, image: 'https://images.unsplash.com/photo-1625944529208-4a82bf75b78a?q=80&w=800&auto=format&fit=crop', description: 'Crispy pastry filled with spiced potatoes and peas.', categoryId: 'starters' },
    { id: 'r1-biryani-chicken', name: 'Chicken Biryani', price: 12.99, image: 'https://images.unsplash.com/photo-1645112411345-7c3ad17a6828?q=80&w=800&auto=format&fit=crop', description: 'Aromatic basmati rice with succulent chicken and spices.', categoryId: 'biryani' },
    { id: 'r1-curry-butter', name: 'Butter Chicken', price: 13.49, image: 'https://images.unsplash.com/photo-1625944529175-d00e4bcea90d?q=80&w=800&auto=format&fit=crop', description: 'Creamy tomato gravy with tender chicken.', categoryId: 'curries' },
    { id: 'r1-bread-naan', name: 'Garlic Naan', price: 3.99, image: 'https://images.unsplash.com/photo-1604909052622-cfb77c6d5298?q=80&w=800&auto=format&fit=crop', description: 'Soft flatbread brushed with garlic butter.', categoryId: 'breads' },
    { id: 'r1-dessert-gulab', name: 'Gulab Jamun', price: 5.25, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc3bb?q=80&w=800&auto=format&fit=crop', description: 'Milk-solid dumplings soaked in rose-scented syrup.', categoryId: 'desserts' },
    { id: 'r1-drink-lassi', name: 'Mango Lassi', price: 3.75, image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=800&auto=format&fit=crop', description: 'Refreshing yogurt-based mango drink.', categoryId: 'drinks' },
  ],
  r2: [
    { id: 'r2-app-spring', name: 'Spring Rolls', price: 5.0, image: 'https://images.unsplash.com/photo-1599022883976-861bf39e9fb3?q=80&w=800&auto=format&fit=crop', description: 'Crispy rolls with veggies and sweet chili dip.', categoryId: 'appetizers' },
    { id: 'r2-noodles-chow', name: 'Chicken Chow Mein', price: 10.99, image: 'https://images.unsplash.com/photo-1526312426976-593cba07da20?q=80&w=800&auto=format&fit=crop', description: 'Stir-fried noodles with chicken and vegetables.', categoryId: 'noodles' },
    { id: 'r2-rice-fried', name: 'Egg Fried Rice', price: 8.99, image: 'https://images.unsplash.com/photo-1612872087720-bb876e2fc4de?q=80&w=800&auto=format&fit=crop', description: 'Classic fried rice with egg and scallions.', categoryId: 'rice' },
    { id: 'r2-wok-kungpao', name: 'Kung Pao Chicken', price: 11.49, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop', description: 'Spicy and tangy wok-tossed chicken with peanuts.', categoryId: 'wok' },
    { id: 'r2-dessert-fortune', name: 'Fortune Cookies', price: 3.0, image: 'https://images.unsplash.com/photo-1508739826987-b79cd8b7da12?q=80&w=800&auto=format&fit=crop', description: 'Crunchy cookies with fortunes inside.', categoryId: 'desserts' },
    { id: 'r2-drink-jasmine', name: 'Jasmine Tea', price: 2.5, image: 'https://images.unsplash.com/photo-1505576633757-0ac1084af824?q=80&w=800&auto=format&fit=crop', description: 'Fragrant and calming jasmine tea.', categoryId: 'drinks' },
  ],
  r3: [
    { id: 'r3-starter-bruschetta', name: 'Bruschetta', price: 6.0, image: 'https://images.unsplash.com/photo-1581447109200-54e96c1a2a8c?q=80&w=800&auto=format&fit=crop', description: 'Toasted bread with tomato and basil.', categoryId: 'starters' },
    { id: 'r3-pizza-margherita', name: 'Pizza Margherita', price: 10.99, image: 'https://images.unsplash.com/photo-1548365328-9f547fb0953c?q=80&w=800&auto=format&fit=crop', description: 'Classic pizza with mozzarella and basil.', categoryId: 'pizza' },
    { id: 'r3-pasta-carbonara', name: 'Spaghetti Carbonara', price: 12.49, image: 'https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=800&auto=format&fit=crop', description: 'Egg, pancetta, pecorino romano sauce.', categoryId: 'pasta' },
    { id: 'r3-mains-parmigiana', name: 'Chicken Parmigiana', price: 13.99, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop', description: 'Breaded chicken with marinara and cheese.', categoryId: 'mains' },
    { id: 'r3-dessert-tiramisu', name: 'Tiramisu', price: 6.5, image: 'https://images.unsplash.com/photo-1506354666786-959d6d497f1a?q=80&w=800&auto=format&fit=crop', description: 'Coffee-flavored dessert with mascarpone.', categoryId: 'desserts' },
    { id: 'r3-drink-italiansoda', name: 'Italian Soda', price: 3.0, image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=800&auto=format&fit=crop', description: 'Sparkling soft drink with syrup.', categoryId: 'drinks' },
  ],
  r4: [
    { id: 'r4-starter-gyoza', name: 'Gyoza', price: 6.5, image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=800&auto=format&fit=crop', description: 'Pan-fried dumplings with dipping sauce.', categoryId: 'starters' },
    { id: 'r4-sushi-salmon', name: 'Salmon Nigiri', price: 8.99, image: 'https://images.unsplash.com/photo-1562158070-2c5f44d81f53?q=80&w=800&auto=format&fit=crop', description: 'Slices of salmon over seasoned rice.', categoryId: 'sushi' },
    { id: 'r4-ramen-tonkotsu', name: 'Tonkotsu Ramen', price: 12.99, image: 'https://images.unsplash.com/photo-1604908554063-cb8e905d1ae3?q=80&w=800&auto=format&fit=crop', description: 'Rich pork broth ramen with chashu.', categoryId: 'ramen' },
    { id: 'r4-donburi-gyudon', name: 'Gyudon', price: 11.5, image: 'https://images.unsplash.com/photo-1617098402993-0d5cde9e4b3c?q=80&w=800&auto=format&fit=crop', description: 'Beef bowl with onions over rice.', categoryId: 'donburi' },
    { id: 'r4-dessert-mochi', name: 'Mochi', price: 5.0, image: 'https://images.unsplash.com/photo-1617098645544-5e51b9c257a7?q=80&w=800&auto=format&fit=crop', description: 'Sweet rice cake dessert.', categoryId: 'desserts' },
    { id: 'r4-drink-green-tea', name: 'Green Tea', price: 2.5, image: 'https://images.unsplash.com/photo-1505576633757-0ac1084af824?q=80&w=800&auto=format&fit=crop', description: 'Hot or iced green tea.', categoryId: 'drinks' },
  ],
  r5: [
    { id: 'r5-starter-chips', name: 'Tortilla Chips', price: 4.0, image: 'https://images.unsplash.com/photo-1544211412-2a7aa68bdc67?q=80&w=800&auto=format&fit=crop', description: 'Crispy chips with salsa.', categoryId: 'starters' },
    { id: 'r5-tacos-alpastor', name: 'Al Pastor Tacos', price: 9.5, image: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?q=80&w=800&auto=format&fit=crop', description: 'Marinated pork with pineapple and cilantro.', categoryId: 'tacos' },
    { id: 'r5-burrito-steak', name: 'Steak Burrito', price: 10.99, image: 'https://images.unsplash.com/photo-1601050690116-c5f8b3f4f1a3?q=80&w=800&auto=format&fit=crop', description: 'Flour tortilla stuffed with steak and rice.', categoryId: 'burritos' },
    { id: 'r5-mains-enchiladas', name: 'Chicken Enchiladas', price: 11.5, image: 'https://images.unsplash.com/photo-1604909052622-cfb77c6d5298?q=80&w=800&auto=format&fit=crop', description: 'Rolled tortillas with chicken and chili sauce.', categoryId: 'mains' },
    { id: 'r5-dessert-churros', name: 'Churros', price: 5.0, image: 'https://images.unsplash.com/photo-1578926375605-eaf7559b1451?q=80&w=800&auto=format&fit=crop', description: 'Fried-dough pastry with cinnamon sugar.', categoryId: 'desserts' },
    { id: 'r5-drink-horchata', name: 'Horchata', price: 3.0, image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=800&auto=format&fit=crop', description: 'Sweet rice milk beverage.', categoryId: 'drinks' },
  ],
  r6: [
    { id: 'r6-starter-hummus', name: 'Hummus', price: 5.5, image: 'https://images.unsplash.com/photo-1625944529208-4a82bf75b78a?q=80&w=800&auto=format&fit=crop', description: 'Chickpea dip with olive oil and pita.', categoryId: 'meze' },
    { id: 'r6-meze-dolma', name: 'Dolma', price: 6.0, image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?q=80&w=800&auto=format&fit=crop', description: 'Stuffed grape leaves.', categoryId: 'meze' },
    { id: 'r6-grill-souvlaki', name: 'Chicken Souvlaki', price: 12.0, image: 'https://images.unsplash.com/photo-1604908554063-cb8e905d1ae3?q=80&w=800&auto=format&fit=crop', description: 'Grilled skewers with tzatziki.', categoryId: 'grill' },
    { id: 'r6-mains-moussaka', name: 'Moussaka', price: 12.99, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop', description: 'Layered eggplant casserole.', categoryId: 'mains' },
    { id: 'r6-dessert-baklava', name: 'Baklava', price: 5.5, image: 'https://images.unsplash.com/photo-1612872087720-bb876e2fc4de?q=80&w=800&auto=format&fit=crop', description: 'Sweet pastry with nuts and honey.', categoryId: 'desserts' },
    { id: 'r6-drink-ayran', name: 'Ayran', price: 2.8, image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=800&auto=format&fit=crop', description: 'Cold yogurt beverage.', categoryId: 'drinks' },
  ],
}

/**
 * Helpers for API layer to query mock data with filters.
 */
export function getMockCategoriesForRestaurant(restaurantId?: string): FoodCategory[] {
  if (restaurantId && restaurantCategories[restaurantId]) {
    return restaurantCategories[restaurantId]
  }
  return mockCategories
}

export function getMockItems(opts: { categoryId?: string; search?: string; restaurantId?: string }): FoodItem[] {
  const { categoryId, search, restaurantId } = opts
  let list: FoodItem[] = []

  if (restaurantId && restaurantItems[restaurantId]) {
    list = restaurantItems[restaurantId]
  } else {
    list = mockItems
  }

  if (categoryId) list = list.filter((i) => i.categoryId === categoryId)
  if (search) {
    const q = search.toLowerCase()
    list = list.filter((i) => i.name.toLowerCase().includes(q) || (i.description ?? '').toLowerCase().includes(q))
  }
  return list
}

export function getMockItemById(itemId: string, restaurantId?: string): FoodItem | null {
  const pool = restaurantId && restaurantItems[restaurantId] ? restaurantItems[restaurantId] : [...mockItems, ...Object.values(restaurantItems).flat()]
  return pool.find((i) => i.id === itemId) ?? null
}
