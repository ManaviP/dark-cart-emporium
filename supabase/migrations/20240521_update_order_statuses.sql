-- Create order_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_status (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Insert initial order statuses
INSERT INTO order_status (name, description) VALUES
  ('pending', 'Order is pending payment'),
  ('processing', 'Order is being processed'),
  ('ready_for_pickup', 'Order is ready for pickup by logistics'),
  ('dispatched', 'Order has been dispatched by logistics'),
  ('delivered', 'Order has been delivered'),
  ('cancelled', 'Order has been cancelled')
ON CONFLICT (name) DO NOTHING;

-- Update existing orders with new statuses
UPDATE orders 
SET status = 'ready_for_pickup'
WHERE status = 'shipped';

-- Create logistics tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS logistics_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  start_location JSONB NOT NULL,
  end_location JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting_pickup',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for logistics tracking
CREATE INDEX IF NOT EXISTS idx_logistics_tracking_order_id ON logistics_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_logistics_tracking_status ON logistics_tracking(status);

-- Enable Row Level Security
ALTER TABLE logistics_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for logistics tracking
CREATE POLICY "Users can view their own logistics tracking"
  ON logistics_tracking
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    order_id IN (
      SELECT id FROM orders 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create logistics tracking"
  ON logistics_tracking
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid() OR
    order_id IN (
      SELECT o.id 
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE p.seller_id = auth.uid()
    )
  ); 