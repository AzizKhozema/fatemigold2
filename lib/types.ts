export type GoldKarat = '24K' | '22K' | '18K' | '21K' | '14K'

export type OrderStatus =
  | 'pending'
  | 'designing'
  | 'in_production'
  | 'quality_check'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'

export type LabourStatus = 'assigned' | 'in_progress' | 'completed' | 'on_hold'

export type WorkflowStage =
  | 'design'
  | 'casting'
  | 'filing'
  | 'setting'
  | 'polishing'
  | 'quality_check'
  | 'packaging'

export interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  city: string | null
  total_orders: number
  total_spent: number
  created_at: string
}

export interface Product {
  id: string
  name: string
  category: string
  karat: GoldKarat
  weight_grams: number
  making_charges: number
  description: string | null
  image_url: string | null
  created_at: string
}

export interface InventoryItem {
  id: string
  material: string
  karat: GoldKarat | null
  quantity_grams: number
  min_threshold_grams: number
  cost_per_gram: number
  supplier: string | null
  last_updated: string
}

export interface Order {
  items: any
  id: string
  order_number: string
  customer_id: string
  customer?: Customer
  status: OrderStatus
  order_items: OrderItem[]
  total_weight_grams: number
  gold_rate_at_order: number
  making_charges: number
  total_amount: number
  advance_paid: number
  balance_due: number
  payment_status: PaymentStatus
  notes: string | null
  expected_delivery: string | null
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_name: string
  karat: GoldKarat
  weight_grams: number
  quantity: number
  making_charges: number
  amount: number
}

export interface Invoice {
  id: string
  invoice_number: string
  order_id: string
  order?: Order
  customer_id: string
  customer?: Customer
  subtotal: number
  tax: number
  discount: number
  total: number
  payment_status: PaymentStatus
  paid_amount: number
  due_date: string | null
  issued_at: string
}

export interface Employee {
  id: string
  name: string
  role: string
  phone: string
  email: string | null
  salary: number
  joining_date: string
  is_active: boolean
  skills: string[]
}

export interface LabourTask {
  id: string
  order_id: string
  order?: Order
  employee_id: string
  employee?: Employee
  stage: WorkflowStage
  status: LabourStatus
  description: string
  estimated_hours: number
  actual_hours: number | null
  labour_cost: number
  assigned_at: string
  completed_at: string | null
}

export interface Design {
  id: string
  title: string
  customer_id: string | null
  customer?: Customer
  order_id: string | null
  category: string
  karat: GoldKarat | null
  canvas_data: string | null
  image_url: string | null
  ai_prompt: string | null
  is_ai_generated: boolean
  created_at: string
}

export interface GoldRate {
  karat: GoldKarat
  rate_per_gram: number
  change_percent: number
}

export interface DashboardStats {
  monthly_revenue: number
  active_orders: number
  total_customers: number
  gold_stock_grams: number
  revenue_change: number
  orders_change: number
}