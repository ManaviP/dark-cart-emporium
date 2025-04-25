-- Create donation_requests table
CREATE TABLE IF NOT EXISTS donation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Organization Details
  organization_name TEXT NOT NULL,
  organization_type TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,

  -- Food Requirements
  food_types TEXT[] NOT NULL,
  is_vegetarian BOOLEAN DEFAULT FALSE,
  is_non_vegetarian BOOLEAN DEFAULT FALSE,
  is_perishable BOOLEAN DEFAULT FALSE,
  is_non_perishable BOOLEAN DEFAULT FALSE,
  quantity_required TEXT NOT NULL,
  urgency_level TEXT NOT NULL,
  usage_purpose TEXT NOT NULL,
  dietary_restrictions TEXT,

  -- Logistics Information
  delivery_preference TEXT NOT NULL,
  pickup_dates TEXT,
  pickup_times TEXT,
  storage_capability TEXT[],
  vehicle_available BOOLEAN DEFAULT FALSE,

  -- Location Details
  service_area TEXT NOT NULL,
  address TEXT NOT NULL,
  landmark TEXT,
  operating_hours TEXT NOT NULL,

  -- Request Settings
  visibility TEXT NOT NULL,
  duration TEXT NOT NULL,
  recurring_frequency TEXT,
  is_priority BOOLEAN DEFAULT FALSE,

  -- Supporting Information
  description TEXT NOT NULL,
  people_served TEXT NOT NULL,
  additional_info TEXT,

  -- Status and Timestamps
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Optional user reference (if authenticated)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_donation_requests_status ON donation_requests(status);
CREATE INDEX IF NOT EXISTS idx_donation_requests_created_at ON donation_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_donation_requests_urgency_level ON donation_requests(urgency_level);

-- Enable Row Level Security
ALTER TABLE donation_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Public can insert (anyone can create a request without authentication)
CREATE POLICY "Anyone can create donation requests"
  ON donation_requests FOR INSERT
  TO anon
  WITH CHECK (true);

-- Public can view approved requests (no auth required)
CREATE POLICY "Public can view approved requests"
  ON donation_requests FOR SELECT
  TO anon
  USING (status = 'approved' AND visibility = 'public');

-- Public can view all requests (no auth required)
CREATE POLICY "Public can view all requests"
  ON donation_requests FOR SELECT
  TO anon
  USING (true);

-- Authenticated users can view their own requests
CREATE POLICY "Users can view their own requests"
  ON donation_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only admins can update any request
CREATE POLICY "Admins can update any request"
  ON donation_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can update their own requests
CREATE POLICY "Users can update their own requests"
  ON donation_requests FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_donation_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_donation_requests_updated_at
BEFORE UPDATE ON donation_requests
FOR EACH ROW
EXECUTE FUNCTION update_donation_requests_updated_at();

-- Add comment to table
COMMENT ON TABLE donation_requests IS 'Stores donation requests from organizations';
