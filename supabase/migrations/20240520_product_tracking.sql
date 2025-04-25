-- Create product tracking table
CREATE TABLE IF NOT EXISTS product_tracking (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('view', 'cart', 'purchase', 'donation')),
  quantity INTEGER DEFAULT 1,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS product_tracking_product_id_idx ON product_tracking(product_id);
CREATE INDEX IF NOT EXISTS product_tracking_user_id_idx ON product_tracking(user_id);
CREATE INDEX IF NOT EXISTS product_tracking_seller_id_idx ON product_tracking(seller_id);
CREATE INDEX IF NOT EXISTS product_tracking_event_type_idx ON product_tracking(event_type);
CREATE INDEX IF NOT EXISTS product_tracking_created_at_idx ON product_tracking(created_at);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  from_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  details JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

-- Create order status table
CREATE TABLE IF NOT EXISTS order_status (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT
);

-- Insert order statuses
INSERT INTO order_status (name, description) VALUES
  ('pending', 'Order has been placed but not yet processed'),
  ('processing', 'Order is being processed by the seller'),
  ('packed', 'Order has been packed and is ready for pickup'),
  ('shipped', 'Order has been picked up by logistics'),
  ('in_transit', 'Order is in transit to the customer'),
  ('delivered', 'Order has been delivered to the customer'),
  ('cancelled', 'Order has been cancelled'),
  ('returned', 'Order has been returned by the customer')
ON CONFLICT (name) DO NOTHING;

-- Add status_id to orders table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'status_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN status_id INTEGER REFERENCES order_status(id);
    
    -- Update existing orders to have a status
    UPDATE orders SET status_id = (SELECT id FROM order_status WHERE name = 'pending')
    WHERE status = 'pending';
    
    UPDATE orders SET status_id = (SELECT id FROM order_status WHERE name = 'processing')
    WHERE status = 'processing';
    
    UPDATE orders SET status_id = (SELECT id FROM order_status WHERE name = 'shipped')
    WHERE status = 'shipped';
    
    UPDATE orders SET status_id = (SELECT id FROM order_status WHERE name = 'delivered')
    WHERE status = 'delivered';
    
    UPDATE orders SET status_id = (SELECT id FROM order_status WHERE name = 'cancelled')
    WHERE status = 'cancelled';
  END IF;
END
$$;

-- Create order history table to track status changes
CREATE TABLE IF NOT EXISTS order_history (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status_id INTEGER NOT NULL REFERENCES order_status(id),
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for order history
CREATE INDEX IF NOT EXISTS order_history_order_id_idx ON order_history(order_id);
CREATE INDEX IF NOT EXISTS order_history_created_at_idx ON order_history(created_at);
