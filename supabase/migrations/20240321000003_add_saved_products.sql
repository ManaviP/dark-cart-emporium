-- Create saved_products table
CREATE TABLE IF NOT EXISTS public.saved_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.saved_products ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS saved_products_user_id_idx ON public.saved_products(user_id);
CREATE INDEX IF NOT EXISTS saved_products_product_id_idx ON public.saved_products(product_id);

-- RLS Policies for saved_products
-- Allow users to view their own saved products
CREATE POLICY "Users can view their own saved products"
    ON public.saved_products
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to save products
CREATE POLICY "Users can save products"
    ON public.saved_products
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to remove saved products
CREATE POLICY "Users can remove saved products"
    ON public.saved_products
    FOR DELETE
    USING (auth.uid() = user_id); 