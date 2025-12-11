<template>
  <div class="manage-menu">
    <header class="mm-header">
      <h1 class="mm-title">Manage Menu</h1>
      <div class="mm-actions">
        <input
          v-model="query"
          type="search"
          class="mm-input"
          placeholder="Search items..."
          aria-label="Search menu items"
        />
        <button class="btn primary" @click="openCreate">Add Item</button>
      </div>
    </header>

    <section v-if="loading" class="mm-skeleton">
      <div v-for="n in 6" :key="n" class="row-skel" />
    </section>

    <section v-else>
      <div v-if="error" class="alert error" role="alert">{{ error }}</div>

      <div v-if="filteredItems.length === 0" class="empty">
        No items found.
      </div>

      <div v-else class="grid">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="card"
        >
          <div class="card-img-wrap">
            <img :src="item.image" :alt="item.name" />
            <span
              class="badge"
              :class="item.availability === 'in_stock' ? 'success' : 'warn'"
            >
              {{ item.availability === 'in_stock' ? 'In Stock' : 'Out of Stock' }}
            </span>
          </div>
          <div class="card-body">
            <div class="card-title-row">
              <h3 class="card-title">{{ item.name }}</h3>
              <span class="price">{{ currency(item.price) }}</span>
            </div>
            <p class="desc">{{ item.description }}</p>
            <div class="meta">
              <span class="cat">{{ item.category }}</span>
            </div>
            <div class="actions">
              <label class="switch" :aria-label="`Toggle availability for ${item.name}`">
                <input
                  type="checkbox"
                  :checked="item.availability !== 'out_of_stock'"
                  @change="onToggleAvailability(item)"
                />
                <span class="slider"></span>
              </label>

              <button class="btn" @click="openEdit(item)">Edit</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <dialog ref="dialogEl" class="modal" @close="onDialogClose">
      <form @submit.prevent="onSubmit">
        <h2 class="modal-title">{{ editId ? 'Edit Item' : 'Add Item' }}</h2>

        <div class="form-row">
          <label for="name">Name</label>
          <input id="name" v-model.trim="form.name" required maxlength="100" />
        </div>

        <div class="form-row">
          <label for="desc">Description</label>
          <textarea id="desc" v-model.trim="form.description" required maxlength="500"></textarea>
        </div>

        <div class="form-row">
          <label for="price">Price</label>
          <input id="price" v-model.number="form.price" type="number" min="0" step="0.01" required />
        </div>

        <div class="form-row">
          <label for="cat">Category</label>
          <input id="cat" v-model.trim="form.category" required maxlength="50" />
        </div>

        <div class="form-row">
          <label for="img">Image URL</label>
          <input id="img" v-model.trim="form.image" type="url" required />
        </div>

        <div class="form-row inline">
          <label for="avail">Availability</label>
          <select id="avail" v-model="form.availability">
            <option value="in_stock">In Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        <div v-if="submitError" class="alert error" role="alert">{{ submitError }}</div>

        <div class="modal-actions">
          <button type="button" class="btn" @click="closeDialog">Cancel</button>
          <button type="submit" class="btn primary" :disabled="submitting">
            {{ submitting ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAdminMenuStore } from '../stores/adminMenu'
import type { Item, AdminMenuItemEdit, AvailabilityStatus } from '../types/restaurant'

const route = useRoute()
const restaurantId = computed(() => String(route.params.id))

const store = useAdminMenuStore()
const loading = computed(() => store.isLoading(restaurantId.value))
const error = computed(() => store.getError(restaurantId.value))
const items = computed<Item[]>(() => store.getItems(restaurantId.value))

const query = ref('')
const filteredItems = computed(() => {
  const q = query.value.toLowerCase().trim()
  if (!q) return items.value
  return items.value.filter(i =>
    [i.name, i.description ?? '', i.category].some(f => f?.toLowerCase().includes(q))
  )
})

onMounted(() => {
  store.fetch(restaurantId.value)
})

const dialogEl = ref<HTMLDialogElement | null>(null)
const editId = ref<string | null>(null)
const submitting = ref(false)
const submitError = ref<string | null>(null)

const emptyForm: AdminMenuItemEdit = {
  name: '',
  description: '',
  price: 0,
  image: '',
  category: '',
  availability: 'in_stock',
}
const form = ref<AdminMenuItemEdit>({ ...emptyForm })

function openCreate() {
  editId.value = null
  form.value = { ...emptyForm }
  submitError.value = null
  dialogEl.value?.showModal()
}

function openEdit(item: Item) {
  editId.value = item.id
  form.value = {
    name: item.name,
    description: item.description ?? '',
    price: item.price,
    image: item.image,
    category: item.category,
    availability: item.availability ?? 'in_stock',
  }
  submitError.value = null
  dialogEl.value?.showModal()
}

function closeDialog() {
  dialogEl.value?.close()
}

function onDialogClose() {
  submitting.value = false
  submitError.value = null
}

function validate(): string | null {
  if (!form.value.name || !form.value.description || !form.value.category || !form.value.image) {
    return 'All fields are required.'
  }
  if (form.value.price < 0) return 'Price must be non-negative.'
  try {
    const u = new URL(form.value.image)
    if (!u.protocol.startsWith('http')) throw new Error('invalid')
  } catch {
    return 'Image URL must be valid (http/https).'
  }
  return null
}

async function onSubmit() {
  const err = validate()
  if (err) {
    submitError.value = err
    return
  }
  submitting.value = true
  submitError.value = null
  try {
    if (editId.value) {
      await store.editItem(restaurantId.value, editId.value, form.value)
    } else {
      await store.addItem(restaurantId.value, form.value)
    }
    closeDialog()
  } catch (errSubmit) {
    submitError.value = (errSubmit as Error)?.message || 'Failed to save item.'
  } finally {
    submitting.value = false
  }
}

function currency(n: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n ?? 0)
}

async function onToggleAvailability(item: Item) {
  const next: AvailabilityStatus = item.availability === 'out_of_stock' ? 'in_stock' : 'out_of_stock'
  try {
    await store.toggleAvailability(restaurantId.value, item.id, next)
  } catch {
    alert('Failed to update availability')
  }
}
</script>

<style scoped>
.manage-menu {
  padding: 1rem;
}
.mm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.mm-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}
.mm-actions {
  display: flex;
  gap: 0.5rem;
}
.mm-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  min-width: 240px;
  background: #fff;
}
.btn {
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  border: 1px solid #c7d2fe;
  background: linear-gradient(to bottom right, rgba(59,130,246,0.08), #fff);
  color: #1f2937;
  transition: all 0.2s ease;
}
.btn.primary {
  background: #2563EB;
  color: white;
  border-color: #2563EB;
}
.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.15);
}
.alert {
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.alert.error {
  background: #FEF2F2;
  color: #991B1B;
  border: 1px solid #FECACA;
}

.mm-skeleton .row-skel {
  height: 84px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  border-radius: 12px;
  margin: 0.5rem 0;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(17, 24, 39, 0.06);
  display: flex;
  flex-direction: column;
}
.card-img-wrap {
  position: relative;
  height: 140px;
  background: #f3f4f6;
  overflow: hidden;
}
.card-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  color: #111827;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
}
.badge.success {
  background: #ecfeff;
  color: #065f46;
  border-color: #a7f3d0;
}
.badge.warn {
  background: #fff7ed;
  color: #9a3412;
  border-color: #fed7aa;
}
.card-body {
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.card-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.card-title {
  font-weight: 700;
  font-size: 1.05rem;
}
.price {
  color: #2563EB;
  font-weight: 700;
}
.desc {
  color: #4b5563;
  min-height: 40px;
}
.meta .cat {
  font-size: 0.8rem;
  color: #6b7280;
}
.actions {
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}
.switch input {
  display: none;
}
.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #e5e7eb;
  transition: 0.2s;
  border-radius: 9999px;
}
.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  top: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.switch input:checked + .slider {
  background-color: #2563EB;
}
.switch input:checked + .slider:before {
  transform: translateX(22px);
}

/* Modal */
.modal {
  border: none;
  border-radius: 12px;
  width: min(560px, 96vw);
  padding: 0;
  overflow: hidden;
}
.modal::backdrop {
  background: rgba(17, 24, 39, 0.4);
}
.modal form {
  padding: 1rem;
  background: #ffffff;
}
.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}
.form-row {
  display: grid;
  gap: 0.4rem;
  margin: 0.6rem 0;
}
.form-row.inline {
  grid-template-columns: 1fr 1fr;
  align-items: center;
}
.form-row input,
.form-row textarea,
.form-row select {
  padding: 0.55rem 0.7rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.empty {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
}
</style>
