import { supabase } from "@/lib/supabase";

export const createSellerNotification = async (
  sellerId: string,
  type: string,
  productId: string,
  fromUserId: string,
  message: string
) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: sellerId,
        type,
        product_id: productId,
        from_user_id: fromUserId,
        message,
        details: {
          type,
          productId,
          fromUserId
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating seller notification:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Error in createSellerNotification:', err);
    throw err;
  }
}; 