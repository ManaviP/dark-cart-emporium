-- Update order_items table to ensure it has the required columns
-- First, check if the columns exist and add them if they don't

-- Add product_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'product_name'
    ) THEN
        ALTER TABLE order_items 
        ADD COLUMN product_name TEXT NOT NULL;
    END IF;
END $$;

-- Add seller_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'seller_id'
    ) THEN
        ALTER TABLE order_items 
        ADD COLUMN seller_id TEXT NOT NULL;
    END IF;
END $$;

-- Make sure the product_id column is TEXT type
ALTER TABLE IF EXISTS order_items 
ALTER COLUMN product_id TYPE TEXT;

-- Add created_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE order_items 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE order_items 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;
    END IF;
END $$;

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'update_order_items_updated_at_trigger'
    ) THEN
        CREATE TRIGGER update_order_items_updated_at_trigger
        BEFORE UPDATE ON order_items
        FOR EACH ROW
        EXECUTE FUNCTION update_order_items_updated_at();
    END IF;
END $$;
