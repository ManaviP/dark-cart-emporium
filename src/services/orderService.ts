import { supabase, getCurrentUserId } from "@/lib/supabase";
import { clearCart } from "./cartService";
import { trackProductEvent } from "./trackingService";
import { createSellerNotification } from "./notificationService";
import { createLogisticsTracking, getLogisticsTrackingByOrderId } from "./logisticsService";

export interface OrderItem {
  id?: string | number;
  product_id: string;
  quantity: number;
  price: number;
  product_name: string;
  seller_id: string;
  image?: string | null;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'ready_for_pickup' | 'dispatched' | 'delivered' | 'cancelled';
  total: number;
  address_id: string;
  payment_method: string | null;
  payment_status: 'pending' | 'paid' | 'failed';
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

interface ProductData {
  id: string;
  name: string;
  seller_id: string;
  image: string | null;
}

interface OrderItemWithProduct {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_name: string;
  seller_id: string;
  product: ProductData[];
}

interface OrderWithItems extends Order {
  order_items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    product_name: string;
    seller_id: string;
    product: Array<{
      id: string;
      name: string;
      seller_id: string;
      image: string | null;
    }>;
  }>;
  address: {
    id: string;
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

// Create a new order
export const createOrder = async (
  addressId: string,
  items: OrderItem[]
): Promise<Order> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not authenticated");
      throw new Error('User must be authenticated to create an order');
    }

    console.log("Creating order with items:", items);
    console.log("User ID:", user.id);
    console.log("Address ID:", addressId);

    // Validate items
    if (!items || items.length === 0) {
      console.error("No items provided");
      throw new Error('No items provided for order');
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.product_id || !item.product_name || !item.price || !item.quantity) {
        console.error("Invalid item:", item);
        throw new Error(`Invalid item: ${JSON.stringify(item)}`);
      }
    }

    // Calculate total in rupees
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    console.log("Order total:", total);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        address_id: addressId,
        total,
        status: 'pending',
        payment_method: 'credit-card',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      throw orderError;
    }

    console.log("Order created:", order);

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product_name: item.product_name,
      seller_id: item.seller_id
    }));

    console.log("Inserting order items:", orderItems);

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error("Error inserting order items:", itemsError);
      throw itemsError;
    }

    // Send notifications to sellers for each product
    for (const item of items) {
      if (item.seller_id) {
        await createSellerNotification(
          item.seller_id,
          'purchase',
          item.product_id,
          user.id,
          `New order for ${item.product_name} (${item.quantity} units)`
        );
      }
    }

    // Update product quantities
    for (const item of items) {
      console.log("Updating product quantity for product:", item.product_id);

      // First get the current product quantity
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', item.product_id)
        .single();

      if (productError) {
        console.error("Error fetching product:", productError);
        throw productError;
      }

      // Calculate new quantity
      const newQuantity = Math.max(0, product.quantity - item.quantity);

      // Update the product quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({
          quantity: newQuantity,
          in_stock: newQuantity > 0
        })
        .eq('id', item.product_id);

      if (updateError) {
        console.error("Error updating product quantity:", updateError);
        throw updateError;
      }
    }

    // Clear cart
    console.log("Clearing cart for user:", user.id);
    await clearCart();

    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get orders for the current user
export const getOrders = async (): Promise<Order[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to get orders');
  }

  try {
    console.log("Fetching orders for user:", user.id);
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
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      throw ordersError;
    }

    console.log("Orders fetched:", orders);

    // Transform the data to match the Order interface
    return (orders as OrderWithItems[]).map(order => ({
      ...order,
      items: order.order_items.map(item => {
        const productData = item.product && Array.isArray(item.product) ? item.product[0] : null;
        return {
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          product_name: item.product_name || (productData?.name || 'Unknown Product'),
          seller_id: item.seller_id || (productData?.seller_id || ''),
          image: productData?.image || null
        };
      })
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

// Alias for getOrders to maintain compatibility with existing code
export const getUserOrders = getOrders;

// Get order by ID
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    console.log("Getting order by ID:", orderId);
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error("Error fetching order:", orderError);
      if (orderError.code === 'PGRST116') {
        return null; // Order not found
      }
      throw orderError;
    }

    // Verify user owns this order or is an admin
    if (order.user_id !== userId) {
      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      if (profile.role !== 'admin') {
        throw new Error('Unauthorized access to order');
      }
    }

    // Get order items with product details including image
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        product_id,
        quantity,
        price,
        product_name,
        seller_id,
        products (
          id,
          name,
          seller_id,
          image
        )
      `)
      .eq('order_id', orderId);

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
      throw itemsError;
    }

    console.log("Order items:", items);

    // Transform items
    const transformedItems = items.map(item => {
      // Use the product data if available, otherwise use the order_items data
      const productData = item.products;
      return {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        product_name: item.product_name || (productData ? productData.name : 'Unknown Product'),
        seller_id: item.seller_id || (productData ? productData.seller_id : ''),
        image: productData?.image || null
      };
    });

    return {
      ...order,
      items: transformedItems
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

// Cancel order
export const cancelOrder = async (orderId: string): Promise<void> => {
  try {
    console.log("Cancelling order:", orderId);
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error("Error fetching order:", orderError);
      throw orderError;
    }

    console.log("Order found:", order);

    // Verify user owns this order
    if (order.user_id !== userId) {
      console.error("Unauthorized access to order. User ID:", userId, "Order user ID:", order.user_id);
      throw new Error('Unauthorized access to order');
    }

    // Check if order can be cancelled (only pending or processing orders)
    if (order.status !== 'pending' && order.status !== 'processing') {
      console.error("Order cannot be cancelled. Current status:", order.status);
      throw new Error(`Order cannot be cancelled. Current status: ${order.status}`);
    }

    console.log("Updating order status to cancelled");

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error("Error updating order status:", updateError);
      throw updateError;
    }

    console.log("Order status update completed");

    // Add to order history
    try {
      const { error: historyError } = await supabase
        .from('order_history')
        .insert({
          order_id: orderId,
          status_id: 5, // Cancelled status
          notes: 'Order cancelled by user',
          created_by: userId
        });

      if (historyError) {
        console.error("Error adding to order history:", historyError);
        // Continue despite history error
      }
    } catch (historyError) {
      console.error("Error with order history:", historyError);
      // Continue despite history error
    }

    // Delete logistics tracking if it exists
    try {
      const { error: trackingError } = await supabase
        .from('logistics_tracking')
        .delete()
        .eq('order_id', orderId);

      if (trackingError) {
        console.error("Error deleting logistics tracking:", trackingError);
        // Continue despite tracking error
      }
    } catch (trackingError) {
      console.error("Error with logistics tracking:", trackingError);
      // Continue despite tracking error
    }

    console.log("Order cancellation process completed");
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
};

// Get orders for seller's products
export const getSellerOrders = async (): Promise<Order[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to get seller orders');
  }

  try {
    console.log("Fetching seller orders for user ID:", user.id);

    // First, get all products for this seller
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', user.id);

    if (productsError) {
      console.error("Error fetching seller products:", productsError);
      throw productsError;
    }

    if (!products || products.length === 0) {
      console.log("No products found for this seller");
      return [];
    }

    const productIds = products.map(p => p.id);
    console.log("Seller's product IDs:", productIds);

    // Get all orders that have items with these product IDs
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
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      throw ordersError;
    }

    console.log("Found orders:", orders?.length || 0);

    if (!orders || orders.length === 0) {
      return [];
    }

    // Filter orders to only include those with items for this seller
    const sellerOrders = orders.filter(order => {
      return order.order_items.some(item => {
        const product = item.product && Array.isArray(item.product) ? item.product[0] : null;
        return product && productIds.includes(product.id);
      });
    });

    console.log("Filtered seller orders:", sellerOrders.length);

    // Transform the data to match the Order interface
    return sellerOrders.map(order => ({
      id: order.id,
      user_id: order.user_id,
      status: order.status,
      total: order.total,
      address_id: order.address_id,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items: order.order_items
        .filter(item => {
          const product = item.product && Array.isArray(item.product) ? item.product[0] : null;
          return product && productIds.includes(product.id);
        })
        .map(item => {
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
    }));
  } catch (error) {
    console.error('Error in getSellerOrders:', error);
    throw error;
  }
};

// Update order status and create logistics tracking
export const updateOrderStatus = async (
  orderId: string,
  newStatus: 'ready_for_pickup' | 'dispatched'
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to update order status');
  }

  try {
    console.log(`Updating order ${orderId} status to ${newStatus}`);

    // Get order details including seller's address
    const { data: order, error: orderError } = await supabase
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
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error("Error fetching order:", orderError);
      throw orderError;
    }

    console.log("Order details:", order);

    // Verify the order contains seller's products
    const isSellerOrder = order.order_items.some(item => {
      const product = item.product && Array.isArray(item.product) ? item.product[0] : null;
      return product && product.seller_id === user.id;
    });

    if (!isSellerOrder) {
      console.error("Unauthorized: Order does not contain seller's products");
      throw new Error('Unauthorized: Order does not contain your products');
    }

    // Get seller's address
    let { data: sellerAddress, error: sellerAddressError } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    if (sellerAddressError) {
      console.error("Error fetching seller address:", sellerAddressError);

      if (sellerAddressError.code === 'PGRST116') {
        // No default address found, try to get any address
        const { data: anyAddress, error: anyAddressError } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (anyAddressError) {
          console.error("Error fetching any seller address:", anyAddressError);
          throw new Error('Seller must have an address to update order status');
        }

        console.log("Using non-default seller address:", anyAddress);
        sellerAddress = anyAddress;
      } else {
        throw sellerAddressError;
      }
    }

    console.log("Seller address:", sellerAddress);
    console.log("Buyer address:", order.address);

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error("Error updating order status:", updateError);
      throw updateError;
    }

    console.log("Order status updated successfully");

    // Add to order history
    try {
      const { error: historyError } = await supabase
        .from('order_history')
        .insert({
          order_id: orderId,
          status_id: newStatus === 'ready_for_pickup' ? 3 : 4, // 3 for ready_for_pickup, 4 for dispatched
          notes: `Order marked as ${newStatus.replace('_', ' ')} by seller`,
          created_by: user.id
        });

      if (historyError) {
        console.error("Error adding to order history:", historyError);
        // Continue despite history error
      }
    } catch (historyError) {
      console.error("Error with order history:", historyError);
      // Continue despite history error
    }

    // Create or update logistics tracking
    if (newStatus === 'ready_for_pickup' || newStatus === 'dispatched') {
      try {
        const existingTracking = await getLogisticsTrackingByOrderId(orderId);
        console.log("Existing tracking:", existingTracking);

        if (!existingTracking) {
          console.log("Creating new logistics tracking");
          await createLogisticsTracking(
            orderId,
            sellerAddress,
            order.address
          );
          console.log("Logistics tracking created successfully");
        } else if (newStatus === 'dispatched' && existingTracking.status === 'waiting_pickup') {
          console.log("Updating logistics tracking status to in_transit");
          await updateLogisticsTrackingStatus(
            existingTracking.id,
            'in_transit'
          );
          console.log("Logistics tracking status updated successfully");
        }
      } catch (trackingError) {
        console.error("Error with logistics tracking:", trackingError);
        // Continue despite tracking error
      }
    }

  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Add the updateLogisticsTrackingStatus function
const updateLogisticsTrackingStatus = async (
  trackingId: string,
  newStatus: 'waiting_pickup' | 'in_transit' | 'delivered'
): Promise<void> => {
  const { error } = await supabase
    .from('logistics_tracking')
    .update({ status: newStatus })
    .eq('id', trackingId);

  if (error) {
    console.error("Error updating logistics tracking status:", error);
    throw error;
  }
};
