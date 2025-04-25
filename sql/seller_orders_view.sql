-- Create a view to help sellers find orders for their products
CREATE OR REPLACE VIEW seller_orders AS
SELECT DISTINCT o.*
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE oi.seller_id = auth.uid();

-- Grant access to the view
GRANT SELECT ON seller_orders TO authenticated;

-- Create an index on seller_id in order_items for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON order_items(seller_id);

-- Add a policy to allow sellers to view orders containing their products
CREATE POLICY "Sellers can view orders containing their products"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT order_id FROM order_items WHERE seller_id = auth.uid()
    )
  );
