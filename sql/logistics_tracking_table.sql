-- Create logistics tracking table
CREATE TABLE IF NOT EXISTS logistics_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  start_location JSONB NOT NULL, -- Seller's address
  end_location JSONB NOT NULL, -- Buyer's address
  status TEXT NOT NULL DEFAULT 'waiting_pickup' CHECK (status IN ('waiting_pickup', 'in_transit', 'delivered')),
  created_by TEXT REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_logistics_tracking_order_id ON logistics_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_logistics_tracking_status ON logistics_tracking(status);
CREATE INDEX IF NOT EXISTS idx_logistics_tracking_created_at ON logistics_tracking(created_at);

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

CREATE POLICY "Sellers can view logistics tracking for their orders"
  ON logistics_tracking
  FOR SELECT
  USING (
    order_id IN (
      SELECT o.id 
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id::text = p.id::text
      WHERE p.seller_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can create logistics tracking"
  ON logistics_tracking
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    order_id IN (
      SELECT o.id 
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id::text = p.id::text
      WHERE p.seller_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can update logistics tracking"
  ON logistics_tracking
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    order_id IN (
      SELECT o.id 
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id::text = p.id::text
      WHERE p.seller_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_logistics_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_logistics_tracking_updated_at
BEFORE UPDATE ON logistics_tracking
FOR EACH ROW
EXECUTE FUNCTION update_logistics_tracking_updated_at();

-- Add comment to table
COMMENT ON TABLE logistics_tracking IS 'Stores logistics tracking information for orders';
