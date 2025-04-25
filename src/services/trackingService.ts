import { supabase, getCurrentUserId } from "@/lib/supabase";

export type TrackingEventType = 'view' | 'cart' | 'purchase' | 'donation';

export interface TrackingEvent {
  id?: number;
  product_id: number;
  user_id?: string | null;
  seller_id: string;
  event_type: TrackingEventType;
  quantity?: number;
  details?: any;
  created_at?: string;
}

// Track a product event (view, cart, purchase, donation)
export const trackProductEvent = async (
  productId: number,
  sellerId: string,
  eventType: TrackingEventType,
  details: any = {}
): Promise<void> => {
  try {
    const userId = await getCurrentUserId();
    
    const event: TrackingEvent = {
      product_id: productId,
      user_id: userId,
      seller_id: sellerId,
      event_type: eventType,
      quantity: details.quantity || 1,
      details,
      created_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('product_tracking')
      .insert([event]);
      
    if (error) {
      console.error('Error tracking product event:', error);
    }
  } catch (error) {
    console.error('Error in trackProductEvent:', error);
  }
};

// Get tracking events for a seller
export const getSellerTrackingEvents = async (): Promise<TrackingEvent[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('product_tracking')
      .select(`
        *,
        products:product_id (
          id,
          name,
          price,
          image,
          category
        )
      `)
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching seller tracking events:', error);
    return [];
  }
};

// Get tracking events for a buyer
export const getBuyerTrackingEvents = async (): Promise<TrackingEvent[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('product_tracking')
      .select(`
        *,
        products:product_id (
          id,
          name,
          price,
          image,
          category
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching buyer tracking events:', error);
    return [];
  }
};

// Get tracking events for a specific product
export const getProductTrackingEvents = async (productId: number): Promise<TrackingEvent[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    // First check if the user is the seller of this product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', productId)
      .single();
      
    if (productError) throw productError;
    
    // Only allow the seller to see tracking events for their products
    if (product.seller_id !== userId) {
      throw new Error('Unauthorized: You can only view tracking for your own products');
    }
    
    const { data, error } = await supabase
      .from('product_tracking')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching product tracking events:', error);
    return [];
  }
};

// Get tracking summary for a seller's products
export const getSellerTrackingSummary = async (): Promise<any> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    // Get all products for this seller
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('seller_id', userId);
      
    if (productsError) throw productsError;
    
    // Get tracking events for all products
    const productIds = products.map(p => p.id);
    
    if (productIds.length === 0) {
      return {
        products: [],
        summary: {
          views: 0,
          carts: 0,
          purchases: 0,
          donations: 0
        }
      };
    }
    
    const { data: events, error: eventsError } = await supabase
      .from('product_tracking')
      .select('product_id, event_type, count(*)')
      .in('product_id', productIds)
      .group('product_id, event_type');
      
    if (eventsError) throw eventsError;
    
    // Process the data
    const productSummary = products.map(product => {
      const productEvents = events.filter(e => e.product_id === product.id);
      
      return {
        id: product.id,
        name: product.name,
        views: productEvents.find(e => e.event_type === 'view')?.count || 0,
        carts: productEvents.find(e => e.event_type === 'cart')?.count || 0,
        purchases: productEvents.find(e => e.event_type === 'purchase')?.count || 0,
        donations: productEvents.find(e => e.event_type === 'donation')?.count || 0
      };
    });
    
    // Calculate overall summary
    const summary = {
      views: productSummary.reduce((sum, p) => sum + Number(p.views), 0),
      carts: productSummary.reduce((sum, p) => sum + Number(p.carts), 0),
      purchases: productSummary.reduce((sum, p) => sum + Number(p.purchases), 0),
      donations: productSummary.reduce((sum, p) => sum + Number(p.donations), 0)
    };
    
    return {
      products: productSummary,
      summary
    };
  } catch (error) {
    console.error('Error fetching seller tracking summary:', error);
    return {
      products: [],
      summary: {
        views: 0,
        carts: 0,
        purchases: 0,
        donations: 0
      }
    };
  }
};

// Create a notification for a seller when their product is purchased
export const createSellerNotification = async (
  sellerId: string,
  productId: number,
  eventType: TrackingEventType,
  buyerId: string | null,
  details: any = {}
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: sellerId,
        type: eventType,
        product_id: productId,
        from_user_id: buyerId,
        message: getNotificationMessage(eventType, details),
        details,
        is_read: false,
        created_at: new Date().toISOString()
      }]);
      
    if (error) {
      console.error('Error creating seller notification:', error);
    }
  } catch (error) {
    console.error('Error in createSellerNotification:', error);
  }
};

// Helper function to generate notification messages
const getNotificationMessage = (eventType: TrackingEventType, details: any): string => {
  const productName = details.productName || 'your product';
  const quantity = details.quantity || 1;
  
  switch (eventType) {
    case 'view':
      return `Someone viewed ${productName}`;
    case 'cart':
      return `Someone added ${quantity} ${quantity > 1 ? 'units of' : 'unit of'} ${productName} to their cart`;
    case 'purchase':
      return `New order! Someone purchased ${quantity} ${quantity > 1 ? 'units of' : 'unit of'} ${productName}`;
    case 'donation':
      return `Someone donated ${quantity} ${quantity > 1 ? 'units of' : 'unit of'} ${productName}`;
    default:
      return `Activity on ${productName}`;
  }
};

// Get notifications for the current user
export const getUserNotifications = async (limit: number = 20): Promise<any[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        products:product_id (
          id,
          name,
          image
        ),
        from_user:from_user_id (
          id,
          name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return [];
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error marking notification as read:', error);
    }
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
      
    if (error) {
      console.error('Error marking all notifications as read:', error);
    }
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
  }
};
