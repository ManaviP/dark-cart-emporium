import { supabase } from '@/lib/supabase';
import { Address } from '@/context/auth-context';

// Get all addresses for the current user
export const getUserAddresses = async (): Promise<Address[]> => {
  try {
    console.log('Fetching user addresses');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('User not authenticated');
      throw new Error('User must be authenticated to get addresses');
    }

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('Error fetching addresses:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} addresses for user`);
    return data || [];
  } catch (error) {
    console.error('Error in getUserAddresses:', error);
    throw error;
  }
};

// Get a specific address by ID
export const getAddressById = async (addressId: string): Promise<Address | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to get address');
    }

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', addressId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Address not found
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getAddressById:', error);
    throw error;
  }
};

// Create a new address
export const createAddress = async (address: Omit<Address, 'id'>): Promise<Address> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to create address');
    }

    // If this is the default address, unset any existing default
    if (address.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert([
        {
          ...address,
          user_id: user.id
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createAddress:', error);
    throw error;
  }
};

// Update an existing address
export const updateAddress = async (
  addressId: string,
  updates: Partial<Omit<Address, 'id'>>
): Promise<Address> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to update address');
    }

    // If setting as default, unset any existing default
    if (updates.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('addresses')
      .update(updates)
      .eq('id', addressId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateAddress:', error);
    throw error;
  }
};

// Delete an address
export const deleteAddress = async (addressId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to delete address');
    }

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteAddress:', error);
    throw error;
  }
};

// Set an address as the default
export const setDefaultAddress = async (addressId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to set default address');
    }

    // First, unset any existing default
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true);

    // Then set the new default
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error in setDefaultAddress:', error);
    throw error;
  }
};
