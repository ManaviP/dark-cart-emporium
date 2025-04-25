-- Add policies to allow sellers to view orders containing their products

-- Create an index on seller_id in order_items for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

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

-- Add a policy to allow sellers to view orders containing their products by product_id
CREATE POLICY "Sellers can view orders containing their product IDs"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT o.order_id 
      FROM order_items o
      JOIN products p ON o.product_id::text = p.id::text
      WHERE p.seller_id = auth.uid()
    )
  );

-- Add a policy to allow sellers to update orders containing their products
CREATE POLICY "Sellers can update orders containing their products"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT order_id FROM order_items WHERE seller_id = auth.uid()
    )
  );

-- Add a policy to allow sellers to update order items for their products
CREATE POLICY "Sellers can update their order items"
  ON order_items
  FOR UPDATE
  TO authenticated
  USING (
    seller_id = auth.uid() OR
    product_id IN (
      SELECT id::text FROM products WHERE seller_id = auth.uid()
    )
  );
