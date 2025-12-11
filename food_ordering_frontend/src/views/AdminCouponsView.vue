<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { listCoupons, createCoupon, updateCoupon, toggleCoupon, normalizeCoupon } from '@/services/couponsAdmin'
import type { Coupon, CouponCreateInput } from '@/types/coupons'

const all = ref<Coupon[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const q = ref('')
const onlyActive = ref(false)
const page = ref(1)
const pageSize = ref(10)
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))

const debounced = ref<any>(null)
watch([q, onlyActive], () => {
  if (debounced.value) clearTimeout(debounced.value)
  debounced.value = setTimeout(() => {
    page.value = 1
  }, 200)
})

const filtered = computed(() => {
  const search = q.value.trim().toLowerCase()
  let r = all.value.slice()
  if (search) {
    r = r.filter(
      (c) =>
        c.code.toLowerCase().includes(search) ||
        (c.description || '').toLowerCase().includes(search) ||
        (c.note || '').toLowerCase().includes(search),
    )
  }
  if (onlyActive.value) {
    r = r.filter((c) => c.active)
  }
  return r
})
const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const list = await listCoupons()
    all.value = list
  } catch (e: any) {
    error.value = e?.message || 'Failed to load coupons'
  } finally {
    loading.value = false
  }
}
onMounted(load)

// Create/Edit dialog state
type Mode = 'create' | 'edit'
const showDialog = ref(false)
const dialogMode = ref<Mode>('create')
const editingId = ref<string | null>(null)
const form = reactive<CouponCreateInput>({
  id: '' as any, // ignored by create
  code: '',
  type: 'percent',
  value: 10,
  minSubtotal: 0,
  expiresAt: '',
  usageLimit: undefined,
  usedCount: 0,
  perRestaurantLimit: undefined,
  active: true,
  restaurantIds: undefined,
  description: '',
  note: '',
})

function resetForm() {
  form.code = ''
  form.type = 'percent'
  form.value = 10
  form.minSubtotal = 0
  form.expiresAt = ''
  form.usageLimit = undefined
  form.usedCount = 0
  form.perRestaurantLimit = undefined
  form.active = true
  form.restaurantIds = undefined
  form.description = ''
  form.note = ''
}

function openCreate() {
  dialogMode.value = 'create'
  editingId.value = null
  resetForm()
  showDialog.value = true
}

function openEdit(c: Coupon) {
  dialogMode.value = 'edit'
  editingId.value = c.id
  Object.assign(form, c)
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
}

const formError = ref<string | null>(null)
function validateLocal(): string | null {
  const code = String(form.code || '').trim()
  if (!code) return 'Code is required.'
  if (!/^[A-Z0-9_-]+$/i.test(code)) return 'Code can only contain letters, numbers, underscores, and dashes.'
  const val = Number(form.value)
  if (!Number.isFinite(val) || val < 0) return 'Value must be a valid non-negative number.'
  if (form.type === 'percent' && (val < 0 || val > 100)) return 'Percent value must be between 0 and 100.'
  if (form.minSubtotal !== undefined && Number(form.minSubtotal) < 0) return 'Minimum subtotal cannot be negative.'
  if (form.usageLimit !== undefined && Number(form.usageLimit) < 0) return 'Usage limit cannot be negative.'
  if (form.perRestaurantLimit !== undefined && Number(form.perRestaurantLimit) < 0) return 'Per-restaurant limit cannot be negative.'
  if (form.expiresAt) {
    const t = new Date(form.expiresAt).getTime()
    if (!Number.isFinite(t)) return 'Expiry date must be a valid ISO date/time.'
  }
  return null
}

async function submit() {
  formError.value = validateLocal()
  if (formError.value) return
  try {
    if (dialogMode.value === 'create') {
      const created = await createCoupon({
        ...form,
        code: form.code.trim().toUpperCase(),
      })
      all.value = [...all.value, normalizeCoupon(created)]
    } else if (editingId.value) {
      const updated = await updateCoupon(editingId.value, {
        active: form.active,
        value: Number(form.value),
        minSubtotal: form.minSubtotal !== undefined ? Number(form.minSubtotal) : undefined,
        expiresAt: form.expiresAt || undefined,
        usageLimit: form.usageLimit !== undefined ? Number(form.usageLimit) : undefined,
        perRestaurantLimit:
          form.perRestaurantLimit !== undefined ? Number(form.perRestaurantLimit) : undefined,
        restaurantIds: form.restaurantIds && form.restaurantIds.length ? form.restaurantIds : undefined,
        description: form.description,
        note: form.note,
        // allow code/type edits? comment out to keep immutable
        code: form.code.trim().toUpperCase(),
        type: form.type,
      })
      all.value = all.value.map((c) => (c.id === updated.id ? normalizeCoupon(updated) : c))
    }
    closeDialog()
  } catch (e: any) {
    formError.value = e?.message || 'Failed to save coupon.'
  }
}

async function onToggle(c: Coupon) {
  try {
    const updated = await toggleCoupon(c.id, !c.active)
    all.value = all.value.map((x) => (x.id === c.id ? updated : x))
  } catch (e: any) {
    alert(e?.message || 'Failed to toggle coupon')
  }
}

// Simple confirm dialog for destructive actions (not implementing delete in this step)
</script>

<template>
  <section class="wrap">
    <header class="head">
      <div class="title">
        <h1>Coupons</h1>
        <p class="sub">Create and manage offer codes. Restaurant-specific coupons and usage limits supported.</p>
      </div>
      <div class="actions">
        <button class="btn primary" @click="openCreate">New Coupon</button>
      </div>
    </header>

    <div class="toolbar">
      <label class="field">
        <span>Search</span>
        <input
          v-model="q"
          type="search"
          placeholder="Search code or description"
          aria-label="Search coupons"
        />
      </label>
      <label class="toggle">
        <input v-model="onlyActive" type="checkbox" />
        <span>Show only active</span>
      </label>
    </div>

    <div v-if="error" class="alert error" role="alert">{{ error }}</div>
    <div v-if="loading" class="loader">Loading...</div>

    <div class="table" role="table" aria-label="Coupons list" v-if="!loading">
      <div class="row head" role="row">
        <div class="cell" role="columnheader">Code</div>
        <div class="cell" role="columnheader">Type</div>
        <div class="cell" role="columnheader">Value</div>
        <div class="cell" role="columnheader">Min Subtotal</div>
        <div class="cell" role="columnheader">Expiry</div>
        <div class="cell" role="columnheader">Usage</div>
        <div class="cell" role="columnheader">Active</div>
        <div class="cell" role="columnheader">Restaurants</div>
        <div class="cell" role="columnheader">Actions</div>
      </div>
      <div class="row" role="row" v-for="c in paged" :key="c.id">
        <div class="cell mono" role="cell">{{ c.code }}</div>
        <div class="cell" role="cell">{{ c.type }}</div>
        <div class="cell" role="cell">
          <span v-if="c.type==='percent'">{{ c.value }}%</span>
          <span v-else>\${{ c.value.toFixed(2) }}</span>
        </div>
        <div class="cell" role="cell">\${{ (c.minSubtotal ?? 0).toFixed(2) }}</div>
        <div class="cell" role="cell">{{ c.expiresAt ? new Date(c.expiresAt).toLocaleString() : '—' }}</div>
        <div class="cell" role="cell">
          <span>{{ c.usedCount ?? 0 }}</span>
          <span v-if="c.usageLimit">/ {{ c.usageLimit }}</span>
        </div>
        <div class="cell" role="cell">
          <button class="switch" :class="{on:c.active}" @click="onToggle(c)" :aria-pressed="c.active">
            <span class="dot"></span>
          </button>
        </div>
        <div class="cell" role="cell">
          <span v-if="!c.restaurantIds || !c.restaurantIds.length">Global</span>
          <span v-else class="mono">{{ c.restaurantIds.join(', ') }}</span>
        </div>
        <div class="cell actions" role="cell">
          <button class="btn" @click="openEdit(c)">Edit</button>
        </div>
      </div>
    </div>

    <div class="pager">
      <button class="btn" :disabled="page<=1" @click="page=page-1">Prev</button>
      <span>Page {{ page }} of {{ totalPages }}</span>
      <button class="btn" :disabled="page>=totalPages" @click="page=page+1">Next</button>
    </div>

    <!-- Dialog -->
    <div v-if="showDialog" class="dialog" role="dialog" aria-modal="true" aria-label="Coupon editor">
      <div class="sheet">
        <header class="sheet-head">
          <h2>{{ dialogMode === 'create' ? 'Create Coupon' : 'Edit Coupon' }}</h2>
          <button class="icon" @click="closeDialog" aria-label="Close">✕</button>
        </header>

        <form class="form" @submit.prevent="submit">
          <div class="grid">
            <label class="field">
              <span>Code</span>
              <input v-model="form.code" placeholder="WELCOME10" required />
              <small>Use letters, numbers, dashes or underscores. Shown to customers.</small>
            </label>

            <label class="field">
              <span>Type</span>
              <select v-model="form.type" aria-label="Coupon type">
                <option value="percent">Percent</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </label>

            <label class="field">
              <span>Value</span>
              <input type="number" step="0.01" v-model.number="form.value" required />
              <small v-if="form.type==='percent'">Enter 0–100</small>
              <small v-else>Currency amount off</small>
            </label>

            <label class="field">
              <span>Min Subtotal</span>
              <input type="number" step="0.01" v-model.number="form.minSubtotal" />
            </label>

            <label class="field">
              <span>Expiry</span>
              <input type="datetime-local" v-model="form.expiresAt" />
            </label>

            <label class="field">
              <span>Usage Limit</span>
              <input type="number" step="1" v-model.number="form.usageLimit" />
            </label>

            <label class="field">
              <span>Per-Restaurant Limit</span>
              <input type="number" step="1" v-model.number="form.perRestaurantLimit" />
            </label>

            <label class="field">
              <span>Active</span>
              <input type="checkbox" v-model="form.active" />
            </label>

            <label class="field wide">
              <span>Restaurant IDs (comma-separated)</span>
              <input
                :value="(form.restaurantIds||[]).join(',')"
                @input="(e:any)=>{ const v=String(e.target.value||'').trim(); form.restaurantIds = v? v.split(',').map((s:string)=>s.trim()).filter(Boolean) : undefined }"
                placeholder="Leave empty for global"
              />
              <small>When set, coupon is valid only when the cart items are from these restaurants.</small>
            </label>

            <label class="field wide">
              <span>Description</span>
              <textarea v-model="form.description" rows="2" />
            </label>

            <label class="field wide">
              <span>Note</span>
              <textarea v-model="form.note" rows="2" />
            </label>
          </div>

          <div v-if="formError" class="alert error" role="alert">{{ formError }}</div>

          <div class="footer">
            <button type="button" class="btn" @click="closeDialog">Cancel</button>
            <button type="submit" class="btn primary">{{ dialogMode === 'create' ? 'Create' : 'Save' }}</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.title h1 { margin: 0; }
.title .sub { color: #6B7280; margin: 4px 0 0; }

.toolbar {
  display: flex;
  gap: 12px;
  align-items: end;
  margin-bottom: 12px;
}
.field { display: grid; gap: 6px; }
.field > span { font-size: .9rem; color: #374151; }
.field small { color: #6B7280; }
.field input, .field select, .field textarea {
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  padding: 8px 10px;
  outline: none;
  background: #fff;
}
.field input:focus, .field select:focus, .field textarea:focus {
  border-color: #2563EB;
  box-shadow: 0 0 0 4px rgba(37,99,235,0.12);
}
.field.wide { grid-column: 1/-1; }
.toggle { display: flex; align-items: center; gap: 6px; color: #374151; }

.table {
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  overflow: hidden;
}
.row { display: grid; grid-template-columns: 1.1fr .7fr .7fr .9fr 1.1fr .9fr .7fr 1.2fr .9fr; border-bottom: 1px solid #F3F4F6; }
.row.head { background: linear-gradient(90deg, rgba(37,99,235,.06), rgba(243,244,246,.2)); font-weight: 700; color: #1F2937; }
.cell { padding: 10px 12px; }
.cell.actions { display: flex; gap: 8px; align-items: center; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }

.switch {
  --h: 26px;
  --w: 46px;
  width: var(--w); height: var(--h);
  border-radius: 999px;
  border: 1px solid #E5E7EB;
  background: #F3F4F6;
  position: relative;
  cursor: pointer;
}
.switch.on { background: #2563EB22; border-color: #2563EB66; }
.switch .dot {
  position: absolute; top: 50%; transform: translateY(-50%);
  left: 2px; width: 22px; height: 22px; border-radius: 50%;
  background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.12);
  transition: left .18s ease;
}
.switch.on .dot { left: 22px; background: #2563EB; }

.actions .btn, .btn {
  background: #F3F4F6; border: 1px solid #E5E7EB; border-radius: 10px; padding: 6px 10px; cursor: pointer;
}
.btn.primary { background: #2563EB; color: #fff; border-color: #1D4ED8; }
.btn:disabled { opacity: .6; cursor: not-allowed; }

.pager {
  display: flex; align-items: center; gap: 10px; justify-content: center; padding: 10px;
}

.dialog {
  position: fixed; inset: 0; display: grid; place-items: center;
  background: rgba(17,24,39,.45);
}
.sheet {
  width: min(880px, 96vw);
  background: #fff; border-radius: 16px; border: 1px solid #E5E7EB;
  box-shadow: 0 20px 40px rgba(0,0,0,.18);
}
.sheet-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-bottom: 1px solid #F3F4F6; }
.sheet-head h2 { margin: 0; }
.sheet-head .icon { border: none; background: transparent; font-size: 18px; cursor: pointer; }

.form { padding: 12px 14px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; }

.alert.error {
  background: #FEF2F2;
  border: 1px solid #FECACA;
  color: #991B1B;
  padding: 8px 10px;
  border-radius: 10px;
}
.loader { padding: 10px; color: #6B7280; }
</style>
