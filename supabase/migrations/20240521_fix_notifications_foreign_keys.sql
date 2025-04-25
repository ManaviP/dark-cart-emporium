-- Drop existing foreign key constraints if they exist
ALTER TABLE notifications 
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
  DROP CONSTRAINT IF EXISTS notifications_from_user_id_fkey,
  DROP CONSTRAINT IF EXISTS notifications_product_id_fkey;

-- Recreate foreign key constraints
ALTER TABLE notifications
  ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT notifications_from_user_id_fkey 
    FOREIGN KEY (from_user_id) 
    REFERENCES profiles(id) 
    ON DELETE SET NULL,
  ADD CONSTRAINT notifications_product_id_fkey 
    FOREIGN KEY (product_id) 
    REFERENCES products(id) 
    ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_from_user_id ON notifications(from_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_product_id ON notifications(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (user_id = auth.uid() OR from_user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid()); 