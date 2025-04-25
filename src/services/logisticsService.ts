import { supabase } from "@/lib/supabase";

export interface LogisticsTracking {
  id: string;
  order_id: string;
  start_location: {
    id: string;
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  end_location: {
    id: string;
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  status: 'waiting_pickup' | 'in_transit' | 'delivered';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const createLogisticsTracking = async (
  orderId: string,
  startLocation: LogisticsTracking['start_location'],
  endLocation: LogisticsTracking['end_location']
): Promise<LogisticsTracking> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to create logistics tracking');
  }

  const { data, error } = await supabase
    .from('logistics_tracking')
    .insert({
      order_id: orderId,
      start_location: startLocation,
      end_location: endLocation,
      status: 'waiting_pickup',
      created_by: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating logistics tracking:', error);
    throw error;
  }

  return data;
};

export const updateLogisticsTrackingStatus = async (
  trackingId: string,
  newStatus: LogisticsTracking['status']
): Promise<LogisticsTracking> => {
  const { data, error } = await supabase
    .from('logistics_tracking')
    .update({ status: newStatus })
    .eq('id', trackingId)
    .select()
    .single();

  if (error) {
    console.error('Error updating logistics tracking status:', error);
    throw error;
  }

  return data;
};

export const getLogisticsTrackingByOrderId = async (
  orderId: string
): Promise<LogisticsTracking | null> => {
  const { data, error } = await supabase
    .from('logistics_tracking')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No tracking found
    }
    console.error('Error fetching logistics tracking:', error);
    throw error;
  }

  return data;
}; 