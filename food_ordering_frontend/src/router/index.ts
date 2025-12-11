import { createRouter, createWebHistory } from 'vue-router';

import HomeView from '@/views/HomeView.vue';
import AboutView from '@/views/AboutView.vue';
import RestaurantsView from '@/views/RestaurantsView.vue';
import RestaurantMenuView from '@/views/RestaurantMenuView.vue';
import RestaurantMenuViewProfileExt from '@/views/RestaurantMenuView.profile.ext.vue';
import OrdersView from '@/views/OrdersView.vue';
import OrderDetailView from '@/views/OrderDetailView.vue';
import CartView from '@/views/CartView.vue';
import CheckoutView from '@/views/CheckoutView.vue';
import FavoritesView from '@/views/FavoritesView.vue';
import SubscriptionsView from '@/views/SubscriptionsView.vue';
import ManageMenuView from '@/views/ManageMenuView.vue';
import ItemDetailView from '@/views/ItemDetailView.vue';
import InvoiceView from '@/views/InvoiceView.vue';
import ChatView from '@/views/ChatView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/about', name: 'about', component: AboutView },
    { path: '/restaurants', name: 'restaurants', component: RestaurantsView },
    { path: '/restaurant/:id', name: 'restaurant-menu', component: RestaurantMenuView, props: true },
    { path: '/restaurant-profile/:id', name: 'restaurant-menu-profile', component: RestaurantMenuViewProfileExt, props: true },
    { path: '/orders', name: 'orders', component: OrdersView },
    { path: '/orders/:id', name: 'order-detail', component: OrderDetailView, props: true },
    { path: '/cart', name: 'cart', component: CartView },
    { path: '/checkout', name: 'checkout', component: CheckoutView },
    { path: '/favorites', name: 'favorites', component: FavoritesView },
    { path: '/subscriptions', name: 'subscriptions', component: SubscriptionsView },
    { path: '/manage-menu', name: 'manage-menu', component: ManageMenuView },
    { path: '/items/:id', name: 'item-detail', component: ItemDetailView, props: true },
    { path: '/invoice/:id', name: 'invoice', component: InvoiceView, props: true },
    { path: '/chat', name: 'chat', component: ChatView },
  ],
});

export default router;
