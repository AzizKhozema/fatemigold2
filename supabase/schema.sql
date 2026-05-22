-- =============================================
-- FATEMI GOLD — SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CUSTOMERS
-- =============================================
CREATE TABLE customers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT,
  address       TEXT,
  city          TEXT,
  total_orders  INTEGER DEFAULT 0,
  total_spent   NUMERIC(12, 2) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EMPLOYEES
-- =============================================
CREATE TABLE employees (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  role          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT,
  salary        NUMERIC(10, 2) NOT NULL DEFAULT 0,
  joining_date  DATE NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  skills        TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INVENTORY
-- =============================================
CREATE TABLE inventory (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material              TEXT NOT NULL,
  karat                 TEXT CHECK (karat IN ('24K','22K','21K','18K','14K')),
  quantity_grams        NUMERIC(10, 3) NOT NULL DEFAULT 0,
  min_threshold_grams   NUMERIC(10, 3) NOT NULL DEFAULT 100,
  cost_per_gram         NUMERIC(10, 2) NOT NULL DEFAULT 0,
  supplier              TEXT,
  last_updated          TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDERS
-- =============================================
CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number        TEXT UNIQUE NOT NULL,
  customer_id         UUID REFERENCES customers(id) ON DELETE SET NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','designing','in_production','quality_check','ready','delivered','cancelled')),
  total_weight_grams  NUMERIC(10, 3) DEFAULT 0,
  gold_rate_at_order  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  making_charges      NUMERIC(12, 2) DEFAULT 0,
  total_amount        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  advance_paid        NUMERIC(12, 2) DEFAULT 0,
  balance_due         NUMERIC(12, 2) GENERATED ALWAYS AS (total_amount - advance_paid) STORED,
  payment_status      TEXT NOT NULL DEFAULT 'unpaid'
                      CHECK (payment_status IN ('unpaid','partial','paid','refunded')),
  notes               TEXT,
  expected_delivery   DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDER ITEMS
-- =============================================
CREATE TABLE order_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_name  TEXT NOT NULL,
  karat         TEXT CHECK (karat IN ('24K','22K','21K','18K','14K')),
  weight_grams  NUMERIC(10, 3) NOT NULL DEFAULT 0,
  quantity      INTEGER NOT NULL DEFAULT 1,
  making_charges NUMERIC(12, 2) DEFAULT 0,
  amount        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INVOICES
-- =============================================
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number  TEXT UNIQUE NOT NULL,
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  subtotal        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax             NUMERIC(12, 2) DEFAULT 0,
  discount        NUMERIC(12, 2) DEFAULT 0,
  total           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_status  TEXT NOT NULL DEFAULT 'unpaid'
                  CHECK (payment_status IN ('unpaid','partial','paid','refunded')),
  paid_amount     NUMERIC(12, 2) DEFAULT 0,
  due_date        DATE,
  issued_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LABOUR TASKS
-- =============================================
CREATE TABLE labour_tasks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id         UUID REFERENCES orders(id) ON DELETE CASCADE,
  employee_id      UUID REFERENCES employees(id) ON DELETE SET NULL,
  stage            TEXT NOT NULL
                   CHECK (stage IN ('design','casting','filing','setting','polishing','quality_check','packaging')),
  status           TEXT NOT NULL DEFAULT 'assigned'
                   CHECK (status IN ('assigned','in_progress','completed','on_hold')),
  description      TEXT NOT NULL,
  estimated_hours  NUMERIC(6, 2) DEFAULT 0,
  actual_hours     NUMERIC(6, 2),
  labour_cost      NUMERIC(10, 2) DEFAULT 0,
  assigned_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

-- =============================================
-- DESIGNS
-- =============================================
CREATE TABLE designs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  customer_id      UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_id         UUID REFERENCES orders(id) ON DELETE SET NULL,
  category         TEXT NOT NULL DEFAULT 'Other',
  karat            TEXT CHECK (karat IN ('24K','22K','21K','18K','14K')),
  canvas_data      TEXT,
  image_url        TEXT,
  ai_prompt        TEXT,
  is_ai_generated  BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GOLD RATES LOG
-- =============================================
CREATE TABLE gold_rates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  karat         TEXT NOT NULL CHECK (karat IN ('24K','22K','21K','18K','14K')),
  rate_per_gram NUMERIC(10, 2) NOT NULL,
  recorded_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_orders_customer     ON orders(customer_id);
CREATE INDEX idx_orders_status       ON orders(status);
CREATE INDEX idx_order_items_order   ON order_items(order_id);
CREATE INDEX idx_invoices_customer   ON invoices(customer_id);
CREATE INDEX idx_invoices_order      ON invoices(order_id);
CREATE INDEX idx_labour_order        ON labour_tasks(order_id);
CREATE INDEX idx_labour_employee     ON labour_tasks(employee_id);
CREATE INDEX idx_designs_customer    ON designs(customer_id);
CREATE INDEX idx_inventory_karat     ON inventory(karat);

-- =============================================
-- AUTO UPDATE order payment_status
-- =============================================
CREATE OR REPLACE FUNCTION update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.advance_paid >= NEW.total_amount THEN
    NEW.payment_status = 'paid';
  ELSIF NEW.advance_paid > 0 THEN
    NEW.payment_status = 'partial';
  ELSE
    NEW.payment_status = 'unpaid';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_status
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_payment_status();

-- =============================================
-- AUTO UPDATE customer totals on new order
-- =============================================
CREATE OR REPLACE FUNCTION update_customer_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE customers
    SET total_orders = total_orders + 1,
        total_spent  = total_spent + NEW.total_amount
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customer_totals
AFTER INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION update_customer_totals();

-- =============================================
-- AUTO GENERATE order_number and invoice_number
-- =============================================
CREATE SEQUENCE order_seq START 1;
CREATE SEQUENCE invoice_seq START 1;

CREATE OR REPLACE FUNCTION gen_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number = 'ORD-' || LPAD(nextval('order_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_number
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION gen_order_number();

CREATE OR REPLACE FUNCTION gen_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number = 'INV-' || LPAD(nextval('invoice_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW EXECUTE FUNCTION gen_invoice_number();

-- =============================================
-- SEED DATA — Gold Rates
-- =============================================
INSERT INTO gold_rates (karat, rate_per_gram) VALUES
  ('24K', 32450),
  ('22K', 29745),
  ('21K', 28390),
  ('18K', 24340),
  ('14K', 18920);

-- =============================================
-- ROW LEVEL SECURITY (optional, enable later)
-- =============================================
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;