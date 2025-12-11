import { defineStore } from 'pinia'
import type { Item, AdminMenuItemEdit, AvailabilityStatus } from '../types/restaurant'
import { listMenuItems, createMenuItem, updateMenuItem, updateAvailability } from '../services/api'

/**
 * Store for managing restaurant menu items in admin views.
 * Includes caching by restaurantId, optimistic updates, and rollback on failures.
 */
export const useAdminMenuStore = defineStore('adminMenu', {
  state: () => ({
    itemsByRestaurant: {} as Record<string, Item[]>,
    loadingByRestaurant: {} as Record<string, boolean>,
    errorByRestaurant: {} as Record<string, string | null>,
  }),
  getters: {
    // PUBLIC_INTERFACE
    getItems:
      (state) =>
      (restaurantId: string): Item[] =>
        state.itemsByRestaurant[restaurantId] || [],
    isLoading:
      (state) =>
      (restaurantId: string): boolean =>
        !!state.loadingByRestaurant[restaurantId],
    getError:
      (state) =>
      (restaurantId: string): string | null =>
        state.errorByRestaurant[restaurantId] || null,
  },
  actions: {
    // PUBLIC_INTERFACE
    async fetch(restaurantId: string) {
      this.loadingByRestaurant[restaurantId] = true
      this.errorByRestaurant[restaurantId] = null
      try {
        const items = await listMenuItems(restaurantId)
        this.itemsByRestaurant[restaurantId] = items
      } catch (e) {
        let msg = 'Failed to load menu'
        if (e instanceof Error) msg = e.message
        this.errorByRestaurant[restaurantId] = msg
      } finally {
        this.loadingByRestaurant[restaurantId] = false
      }
    },
    // PUBLIC_INTERFACE
    async addItem(restaurantId: string, payload: AdminMenuItemEdit) {
      const prev = this.itemsByRestaurant[restaurantId] || []
      const tempId = `temp-${Date.now()}`
      const optimistic: Item = { id: tempId, ...payload }
      this.itemsByRestaurant[restaurantId] = [...prev, optimistic]
      try {
        const created = await createMenuItem(restaurantId, payload)
        this.itemsByRestaurant[restaurantId] = (this.itemsByRestaurant[restaurantId] || []).map((i) =>
          i.id === tempId ? created : i,
        )
      } catch (e) {
        this.itemsByRestaurant[restaurantId] = prev
        throw e
      }
    },
    // PUBLIC_INTERFACE
    async editItem(restaurantId: string, itemId: string, payload: Partial<AdminMenuItemEdit>) {
      const prev = this.itemsByRestaurant[restaurantId] || []
      const idx = prev.findIndex((i) => i.id === itemId)
      if (idx === -1) throw new Error('Item not found')
      const before = prev[idx]
      const optimistic: Item = { ...before, ...payload }
      const next = [...prev]
      next[idx] = optimistic
      this.itemsByRestaurant[restaurantId] = next
      try {
        const updated = await updateMenuItem(restaurantId, itemId, payload)
        const afterList = [...this.itemsByRestaurant[restaurantId]]
        const afterIdx = afterList.findIndex((i) => i.id === itemId)
        if (afterIdx !== -1) afterList[afterIdx] = updated
        this.itemsByRestaurant[restaurantId] = afterList
      } catch (e) {
        const rollback = [...prev]
        rollback[idx] = before
        this.itemsByRestaurant[restaurantId] = rollback
        throw e
      }
    },
    // PUBLIC_INTERFACE
    async toggleAvailability(restaurantId: string, itemId: string, status: AvailabilityStatus) {
      const prev = this.itemsByRestaurant[restaurantId] || []
      const idx = prev.findIndex((i) => i.id === itemId)
      if (idx === -1) throw new Error('Item not found')
      const before = prev[idx]
      const optimistic: Item = { ...before, availability: status }
      const next = [...prev]
      next[idx] = optimistic
      this.itemsByRestaurant[restaurantId] = next
      try {
        const updated = await updateAvailability(restaurantId, itemId, status)
        const after = [...this.itemsByRestaurant[restaurantId]]
        const afterIdx = after.findIndex((i) => i.id === itemId)
        if (afterIdx !== -1) after[afterIdx] = updated
        this.itemsByRestaurant[restaurantId] = after
      } catch (e) {
        const rollback = [...prev]
        rollback[idx] = before
        this.itemsByRestaurant[restaurantId] = rollback
        throw e
      }
    },
  },
})
