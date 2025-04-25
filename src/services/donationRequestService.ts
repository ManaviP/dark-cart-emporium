import { supabase } from "@/lib/supabase";
import { createClient } from '@supabase/supabase-js';

// Create a public Supabase client (no auth required)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const publicSupabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DonationRequest {
  id: string;
  organization_name: string;
  organization_type: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;

  food_types: string[];
  is_vegetarian: boolean;
  is_non_vegetarian: boolean;
  is_perishable: boolean;
  is_non_perishable: boolean;
  quantity_required: string;
  urgency_level: string;
  usage_purpose: string;
  dietary_restrictions?: string;

  delivery_preference: string;
  pickup_dates?: string;
  pickup_times?: string;
  storage_capability?: string[];
  vehicle_available: boolean;

  service_area: string;
  address: string;
  landmark?: string;
  operating_hours: string;

  visibility: string;
  duration: string;
  recurring_frequency?: string;
  is_priority: boolean;

  description: string;
  people_served: string;
  additional_info?: string;

  status: 'pending' | 'approved' | 'fulfilled' | 'rejected';
  created_at: string;
  updated_at: string;
  user_id?: string;
}

// Get all donation requests
export const getAllDonationRequests = async (): Promise<DonationRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('donation_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching donation requests:', error);
    throw error;
  }
};

// Get donation requests by status
export const getDonationRequestsByStatus = async (status: string): Promise<DonationRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('donation_requests')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error(`Error fetching ${status} donation requests:`, error);
    throw error;
  }
};

// Get donation requests by urgency
export const getDonationRequestsByUrgency = async (urgencyLevel: string): Promise<DonationRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('donation_requests')
      .select('*')
      .eq('urgency_level', urgencyLevel)
      .eq('status', 'approved') // Only show approved requests
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error(`Error fetching ${urgencyLevel} donation requests:`, error);
    throw error;
  }
};

// Get donation request by ID
export const getDonationRequestById = async (id: string): Promise<DonationRequest | null> => {
  try {
    const { data, error } = await supabase
      .from('donation_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching donation request:', error);
    throw error;
  }
};

// Update donation request status
export const updateDonationRequestStatus = async (id: string, status: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('donation_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating donation request status:', error);
    throw error;
  }
};

// Accept a donation request (for sellers)
export const acceptDonationRequest = async (
  requestId: string,
  sellerId: string,
  donationDetails: {
    products: Array<{
      productId: number;
      quantity: number;
    }>;
    notes?: string;
  }
): Promise<void> => {
  try {
    // Start a transaction
    const { error: transactionError } = await supabase.rpc('begin_transaction');
    if (transactionError) throw transactionError;

    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('donation_requests')
        .update({
          status: 'fulfilled',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create donation fulfillment record
      const { error: fulfillmentError } = await supabase
        .from('donation_fulfillments')
        .insert([{
          request_id: requestId,
          seller_id: sellerId,
          products: donationDetails.products,
          notes: donationDetails.notes || '',
          status: 'processing',
          created_at: new Date().toISOString()
        }]);

      if (fulfillmentError) throw fulfillmentError;

      // Update product quantities
      for (const product of donationDetails.products) {
        // Get current product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', product.productId)
          .eq('seller_id', sellerId)
          .single();

        if (productError) throw productError;

        if (!productData) {
          throw new Error(`Product with ID ${product.productId} not found`);
        }

        // Check if enough quantity is available
        if (productData.quantity < product.quantity) {
          throw new Error(`Not enough quantity available for product ${product.productId}`);
        }

        // Update product quantity
        const newQuantity = productData.quantity - product.quantity;
        const { error: updateProductError } = await supabase
          .from('products')
          .update({
            quantity: newQuantity,
            in_stock: newQuantity > 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.productId)
          .eq('seller_id', sellerId);

        if (updateProductError) throw updateProductError;
      }

      // Commit transaction
      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) throw commitError;

    } catch (error) {
      // Rollback transaction on error
      await supabase.rpc('rollback_transaction');
      throw error;
    }
  } catch (error) {
    console.error('Error accepting donation request:', error);
    throw error;
  }
};

// Submit a new donation request (no auth required)
export const submitDonationRequest = async (requestData: Omit<DonationRequest, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<void> => {
  try {
    const { error } = await publicSupabase
      .from('donation_requests')
      .insert([{
        ...requestData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('Error submitting donation request:', error);
    throw error;
  }
};
