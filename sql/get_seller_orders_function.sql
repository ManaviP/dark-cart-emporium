-- Create a function to get orders for a seller's products
CREATE OR REPLACE FUNCTION get_seller_orders(seller_id UUID)
RETURNS TABLE (
  order_id UUID,
  user_id UUID,
  status TEXT,
  total DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT o.id as order_id, o.user_id, o.status, o.total, o.created_at, o.updated_at
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN products p ON oi.product_id::text = p.id::text
  WHERE oi.seller_id = seller_id
     OR p.seller_id = seller_id
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_seller_orders(UUID) TO authenticated;
