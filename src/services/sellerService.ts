import { supabase } from "@/lib/supabase";
import { Order } from "./orderService";

// Get orders for seller's products directly from the database
export const getSellerOrdersDirect = async (): Promise<Order[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to get seller orders');
    }

    console.log("Getting seller orders directly for user ID:", user.id);

    // Get all products for this seller
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', user.id);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      throw productsError;
    }

    if (!products || products.length === 0) {
      console.log("No products found for seller");
      return [];
    }

    const productIds = products.map(p => p.id.toString());
    console.log("Seller product IDs:", productIds);

    // Get all order items that contain these products
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('order_id')
      .in('product_id', productIds);

    if (orderItemsError) {
      console.error("Error fetching order items:", orderItemsError);
      throw orderItemsError;
    }

    // Also get order items where seller_id matches
    const { data: sellerOrderItems, error: sellerOrderItemsError } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('seller_id', user.id);

    if (sellerOrderItemsError) {
      console.error("Error fetching seller order items:", sellerOrderItemsError);
      throw sellerOrderItemsError;
    }

    // Combine both sets of order IDs
    const allOrderItems = [
      ...(orderItems || []),
      ...(sellerOrderItems || [])
    ];

    if (allOrderItems.length === 0) {
      console.log("No order items found for seller");
      return [];
    }

    // Get unique order IDs
    const orderIds = [...new Set(allOrderItems.map(item => item.order_id))];
    console.log("Order IDs:", orderIds);

    // Get full order details
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (
            id,
            name,
            seller_id,
            image
          )
        ),
        address:addresses (
          *
        )
      `)
      .in('id', orderIds)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      throw ordersError;
    }

    if (!orders || orders.length === 0) {
      console.log("No orders found");
      return [];
    }

    console.log("Found orders:", orders.length);

    // Process orders to include only items for this seller
    return orders.map(order => {
      // Filter order items to only include those for this seller
      const sellerItems = order.order_items.filter(item => {
        // Check if product_id is in the seller's products
        if (productIds.includes(item.product_id.toString())) {
          return true;
        }
        
        // Check if seller_id matches
        if (item.seller_id === user.id) {
          return true;
        }
        
        // Check product relationship
        const product = item.product && Array.isArray(item.product) ? item.product[0] : null;
        if (product && product.seller_id === user.id) {
          return true;
        }
        
        return false;
      });
      
      return {
        ...order,
        items: sellerItems.map(item => {
          const product = item.product && Array.isArray(item.product) ? item.product[0] : null;
          return {
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            product_name: item.product_name || (product?.name || 'Unknown Product'),
            seller_id: item.seller_id || (product?.seller_id || user.id),
            image: product?.image || null
          };
        })
      };
    }).filter(order => order.items.length > 0);
  } catch (error) {
    console.error("Error in getSellerOrdersDirect:", error);
    throw error;
  }
};
