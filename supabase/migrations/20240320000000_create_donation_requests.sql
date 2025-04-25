-- Create donation_requests table
CREATE TABLE IF NOT EXISTS donation_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_name TEXT NOT NULL,
    organization_type TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    verification_status TEXT,
    organization_profile TEXT,
    
    -- Food Requirements
    food_types TEXT[] NOT NULL,
    quantity INTEGER NOT NULL,
    quantity_unit TEXT NOT NULL,
    urgency TEXT NOT NULL,
    usage_purpose TEXT NOT NULL,
    dietary_restrictions TEXT,
    
    -- Logistics Information
    delivery_preference TEXT NOT NULL,
    pickup_times TEXT NOT NULL,
    storage_capabilities TEXT NOT NULL,
    vehicle_availability BOOLEAN NOT NULL,
    handling_capacity TEXT NOT NULL,
    
    -- Location Details
    service_area TEXT NOT NULL,
    facility_address TEXT NOT NULL,
    landmark_instructions TEXT,
    operating_hours TEXT NOT NULL,
    
    -- Request Settings
    visibility TEXT NOT NULL,
    request_duration INTEGER NOT NULL,
    is_recurring BOOLEAN NOT NULL,
    recurrence_frequency TEXT,
    priority_level TEXT NOT NULL,
    
    -- Supporting Information
    description TEXT NOT NULL,
    people_served INTEGER NOT NULL,
    photos TEXT[],
    impact_stories TEXT,
    
    -- Metadata
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create RLS policies
ALTER TABLE donation_requests ENABLE ROW LEVEL SECURITY;

-- Policy for public access to create requests
CREATE POLICY "Public can create donation requests"
    ON donation_requests
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policy for public access to view requests
CREATE POLICY "Public can view donation requests"
    ON donation_requests
    FOR SELECT
    TO public
    USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_donation_requests_updated_at
    BEFORE UPDATE ON donation_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 