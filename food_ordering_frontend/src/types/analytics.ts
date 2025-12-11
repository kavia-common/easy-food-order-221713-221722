export type DateRange = 7 | 30

export type DailySalesPoint = {
  /** ISO date string (YYYY-MM-DD) */
  date: string
  /** Total sales amount for the day in the smallest currency unit (e.g., cents) */
  totalCents: number
  /** Count of orders for the day */
  orders: number
}

export type PeakHourPoint = {
  /** Day of week 0-6 where 0 = Sunday */
  dow: number
  /** Hour of day 0-23 */
  hour: number
  /** Number of orders at this hour */
  count: number
}

export type TopItem = {
  id: string
  name: string
  /** total times ordered in the selected range */
  count: number
  /** total revenue in cents for the item in the selected range */
  revenueCents: number
}

export type AnalyticsSummary = {
  range: DateRange
  dailySales: DailySalesPoint[]
  peakHours: PeakHourPoint[]
  topItems: TopItem[]
}
