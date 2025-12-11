import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const CartView = () => import('@/views/CartView.vue')
const CheckoutView = () => import('@/views/CheckoutView.vue')
const RestaurantsView = () => import('@/views/RestaurantsView.vue')
const RestaurantMenuView = () => import('@/views/RestaurantMenuView.vue')
const ItemDetailView = () => import('@/views/ItemDetailView.vue')
const FavoritesView = () => import('@/views/FavoritesView.vue')

// New Orders routes
const OrdersView = () => import('@/views/OrdersView.vue')
const OrderDetailView = () => import('@/views/OrderDetailView.vue')
const InvoiceView = () => import('@/views/InvoiceView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/restaurants', name: 'restaurants', component: RestaurantsView },
    // keeping existing alt paths for restaurant/item navigation if used elsewhere
    { path: '/restaurants/:id/menu', name: 'restaurant-menu', component: RestaurantMenuView, props: true },
    { path: '/restaurants/:id/items/:itemId', name: 'item-detail', component: ItemDetailView, props: true },

    { path: '/favorites', name: 'favorites', component: FavoritesView },

    // Orders
    { path: '/orders', name: 'orders', component: OrdersView },
    { path: '/orders/:id', name: 'order-detail', component: OrderDetailView, props: true },
    { path: '/orders/:id/invoice', name: 'order-invoice', component: InvoiceView, props: true },

    { path: '/cart', name: 'cart', component: CartView },
    { path: '/checkout', name: 'checkout', component: CheckoutView },
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
