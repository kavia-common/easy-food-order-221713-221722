import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const CartView = () => import('@/views/CartView.vue')
const CheckoutView = () => import('@/views/CheckoutView.vue')
const RestaurantsView = () => import('@/views/RestaurantsView.vue')
const RestaurantMenuView = () => import('@/views/RestaurantMenuView.vue')
const ItemDetailView = () => import('@/views/ItemDetailView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/restaurants', name: 'restaurants', component: RestaurantsView },
    { path: '/restaurants/:id/menu', name: 'restaurant-menu', component: RestaurantMenuView, props: true },
    { path: '/restaurants/:id/items/:itemId', name: 'item-detail', component: ItemDetailView, props: true },
    { path: '/cart', name: 'cart', component: CartView },
    { path: '/checkout', name: 'checkout', component: CheckoutView },
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
