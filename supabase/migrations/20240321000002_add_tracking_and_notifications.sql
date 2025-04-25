-- Create product_tracking table
CREATE TABLE IF NOT EXISTS public.product_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    quantity INTEGER,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    details JSONB,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.product_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS product_tracking_product_id_idx ON public.product_tracking(product_id);
CREATE INDEX IF NOT EXISTS product_tracking_user_id_idx ON public.product_tracking(user_id);
CREATE INDEX IF NOT EXISTS product_tracking_seller_id_idx ON public.product_tracking(seller_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_product_id_idx ON public.notifications(product_id);

-- RLS Policies for product_tracking
-- Allow users to view their own tracking events
CREATE POLICY "Users can view their own tracking events"
    ON public.product_tracking
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to create tracking events
CREATE POLICY "Users can create tracking events"
    ON public.product_tracking
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow sellers to view tracking events for their products
CREATE POLICY "Sellers can view tracking events for their products"
    ON public.product_tracking
    FOR SELECT
    USING (auth.uid() = seller_id);

-- RLS Policies for notifications
-- Allow users to view their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to create notifications
CREATE POLICY "Users can create notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (auth.uid() = from_user_id);

-- Allow users to update their own notifications
CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
    ON public.notifications
    FOR DELETE
    USING (auth.uid() = user_id); 