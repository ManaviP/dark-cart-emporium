-- Create product_tracking table
CREATE TABLE IF NOT EXISTS product_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    seller_id UUID NOT NULL REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    quantity INTEGER,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    type TEXT NOT NULL,
    product_id UUID REFERENCES products(id),
    from_user_id UUID REFERENCES auth.users(id),
    message TEXT NOT NULL,
    details JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for product_tracking
ALTER TABLE product_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can track their own product events"
    ON product_tracking
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sellers can view tracking for their products"
    ON product_tracking
    FOR SELECT
    TO authenticated
    USING (auth.uid() = seller_id);

-- Add RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own notifications"
    ON notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own notifications"
    ON notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX idx_product_tracking_product_id ON product_tracking(product_id);
CREATE INDEX idx_product_tracking_user_id ON product_tracking(user_id);
CREATE INDEX idx_product_tracking_seller_id ON product_tracking(seller_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = false; 