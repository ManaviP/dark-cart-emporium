-- Create donation_fulfillments table
CREATE TABLE IF NOT EXISTS donation_fulfillments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES donation_requests(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Products donated (stored as JSONB array)
  products JSONB NOT NULL, -- Array of {productId, quantity}
  
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'processing', -- processing, delivered, cancelled
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_donation_fulfillments_request_id ON donation_fulfillments(request_id);
CREATE INDEX IF NOT EXISTS idx_donation_fulfillments_seller_id ON donation_fulfillments(seller_id);
CREATE INDEX IF NOT EXISTS idx_donation_fulfillments_status ON donation_fulfillments(status);

-- Enable Row Level Security
ALTER TABLE donation_fulfillments ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Sellers can insert their own fulfillments
CREATE POLICY "Sellers can create donation fulfillments"
  ON donation_fulfillments FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'seller'
    )
  );

-- Sellers can view their own fulfillments
CREATE POLICY "Sellers can view their own fulfillments"
  ON donation_fulfillments FOR SELECT
  TO authenticated
  USING (
    seller_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can view all fulfillments
CREATE POLICY "Admins can view all fulfillments"
  ON donation_fulfillments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Sellers can update their own fulfillments
CREATE POLICY "Sellers can update their own fulfillments"
  ON donation_fulfillments FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_donation_fulfillments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_donation_fulfillments_updated_at
BEFORE UPDATE ON donation_fulfillments
FOR EACH ROW
EXECUTE FUNCTION update_donation_fulfillments_updated_at();

-- Add comment to table
COMMENT ON TABLE donation_fulfillments IS 'Stores donation fulfillments by sellers';
